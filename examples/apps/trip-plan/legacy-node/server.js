const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const db = require("./db");

const root = __dirname;
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const aiProvider = (process.env.AI_PROVIDER || "").toLowerCase();
const openAiModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const openAiReasoningEffort = process.env.OPENAI_REASONING_EFFORT || "medium";
const codexModel = process.env.CODEX_MODEL || process.env.OPENAI_MODEL || "gpt-5.4-mini";
const codexReasoningEffort = process.env.CODEX_REASONING_EFFORT || openAiReasoningEffort;
const codexSessionFile = process.env.CODEX_SESSION_FILE || path.join(root, ".codex-session.json");
const codexTimeoutMs = Number(process.env.CODEX_TIMEOUT_MS || 120_000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);

    if (req.method === "GET" && url.pathname === "/api/state") {
      sendJson(res, 200, db.getState());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/checkpoints") {
      sendJson(res, 200, { checkpoints: db.getCheckpoints() });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/operations") {
      const body = await readJson(req);
      const result = db.applyOperations(body.operations, {
        label: body.label,
        reason: body.reason,
        source: body.source || "ui",
      });
      sendJson(res, 200, result);
      return;
    }

    const rollbackMatch = url.pathname.match(/^\/api\/checkpoints\/([^/]+)\/rollback$/);
    if (req.method === "POST" && rollbackMatch) {
      sendJson(res, 200, db.rollbackCheckpoint(decodeURIComponent(rollbackMatch[1])));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/chat") {
      const body = await readJson(req);
      const reply = await chat(body);
      sendJson(res, 200, reply);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end("Method Not Allowed");
      return;
    }

    const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    if (safePath.split(path.sep).some((segment) => segment.startsWith("."))) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const filePath = path.join(root, safePath === "/" ? "index.html" : safePath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    const stat = await fs.promises.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(finalPath).pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    sendJson(res, 500, { error: "Internal Server Error", detail: error.message });
  }
});

db.ensureDatabase();
server.listen(port, host, () => {
  console.log(`Trip planner running at http://${host}:${port}`);
  if (aiProvider === "codex") {
    console.log(`AI_PROVIDER=codex; chat uses Codex CLI with ${codexModel}, effort=${codexReasoningEffort}.`);
  } else if (!process.env.OPENAI_API_KEY) {
    console.log("OPENAI_API_KEY is not set; chat uses local fallback responses.");
  }
});

async function chat(payload) {
  if (aiProvider === "codex") {
    try {
      return await chatWithCodex(payload);
    } catch (error) {
      return {
        mode: "local",
        reply: `Codex CLI 응답을 받지 못했습니다. 로컬 모드로 보면, ${localReply(payload.message, payload.places || [])}`,
        error: error.message,
      };
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      mode: "local",
      reply: localReply(payload.message, payload.places || []),
    };
  }

  const input = [
    {
      role: "system",
      content: [{ type: "input_text", text: aiSystemPrompt() }],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify(
            {
              message: payload.message,
              currentDay: payload.currentDay,
              plan: payload.plan,
              places: payload.places,
            },
            null,
            2,
          ),
        },
      ],
    },
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: openAiModel, reasoning: { effort: openAiReasoningEffort }, input }),
  });

  if (!response.ok) {
    return {
      mode: "local",
      reply: `OpenAI 응답을 받지 못했습니다. 로컬 모드로 보면, ${localReply(payload.message, payload.places || [])}`,
    };
  }

  const data = await response.json();
  return finalizeAiResponse({
    mode: "online",
    provider: "openai",
    model: openAiModel,
    payload,
    text: extractText(data) || localReply(payload.message, payload.places || []),
  });
}

async function chatWithCodex(payload) {
  const outputPath = path.join(os.tmpdir(), `okinawa-codex-${process.pid}-${Date.now()}.txt`);
  const prompt = buildCodexPrompt(payload);
  const session = await readCodexSession();
  const result = await runCodexExec(buildCodexArgs(session.sessionId, outputPath), prompt, outputPath);

  if (!session.fromEnv && result.sessionId) {
    await writeCodexSession(result.sessionId);
  }

  return finalizeAiResponse({
    mode: "codex",
    provider: "codex",
    model: codexModel,
    payload,
    text: result.text || localReply(payload.message, payload.places || []),
  });
}

function buildCodexArgs(sessionId, outputPath) {
  const common = ["--skip-git-repo-check", "--output-last-message", outputPath, "--json"];
  if (codexReasoningEffort) {
    common.unshift("--config", `model_reasoning_effort="${codexReasoningEffort}"`);
  }
  if (codexModel) {
    common.unshift("--model", codexModel);
  }

  if (sessionId) {
    return ["exec", "resume", ...common, sessionId];
  }
  if (process.env.CODEX_RESUME_LAST === "1") {
    return ["exec", "resume", ...common, "--last"];
  }
  return ["exec", ...common, "--sandbox", "read-only"];
}

function buildCodexPrompt(payload) {
  return [
    aiSystemPrompt(),
    "",
    "Current app state JSON:",
    JSON.stringify(
      {
        message: payload.message,
        currentDay: payload.currentDay,
        plan: payload.plan,
        places: payload.places,
      },
      null,
      2,
    ),
  ].join("\n");
}

function aiSystemPrompt() {
  return [
    "You are a Korean-speaking Okinawa travel planning assistant embedded in a local trip planner.",
    "Use only the provided itinerary and place list as ground truth.",
    "Do not invent coordinates, bookings, opening hours, rules, or reservations.",
    "If coordinates are missing, say route accuracy is limited.",
    "You cannot edit files or the database directly.",
    "Return JSON only. Do not wrap it in markdown.",
    "Response shape:",
    '{"message":"Korean user-facing reply","operations":[]}',
    "Use operations only when the user explicitly asks to modify the itinerary.",
    "Supported operations: add_item, update_item, move_item, delete_item, reorder_day, replace_day_plan.",
    "For add_item, prefer an existing placeId from places when possible. If no place exists, include title/category/memo/lat/lng only when present in the provided data.",
    "For update_item, patch only these fields: type, title, category, time, memo, placeId, lat, lng, locked.",
    "For move_item, use itemId, toDay, and toIndex.",
    "For delete_item, use itemId.",
    "For reorder_day, use day and itemIds.",
    "For replace_day_plan, use day and items.",
    "Be concise and concrete in message.",
  ].join("\n");
}

function finalizeAiResponse({ mode, provider, model, payload, text }) {
  const parsed = parseAiEditResponse(text);
  const message = parsed?.message || text;
  const operations = Array.isArray(parsed?.operations) ? parsed.operations : [];
  let applied = null;
  let status = operations.length ? "proposed" : "message";
  let error = "";

  if (operations.length) {
    try {
      applied = db.applyOperations(operations, {
        label: "AI edit",
        reason: payload.message || "AI edit",
        source: provider,
      });
      status = "applied";
    } catch (operationError) {
      error = operationError.message;
      status = "failed";
    }
  }

  db.recordAiEditRun({
    provider,
    model,
    userMessage: payload.message || "",
    aiMessage: message,
    operations,
    status,
    error,
    checkpointId: applied?.checkpoint?.id || null,
  });

  return {
    mode,
    reply: error ? `${message}\n\n수정 적용 실패: ${error}` : message,
    operations,
    plan: applied?.plan,
    places: applied?.places,
    checkpoint: applied?.checkpoint,
  };
}

function parseAiEditResponse(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  const candidates = [
    trimmed,
    trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""),
    extractJsonObject(trimmed),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object" && "message" in parsed) return parsed;
    } catch {
      continue;
    }
  }
  return null;
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return "";
  return text.slice(start, end + 1);
}

function runCodexExec(args, prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("codex", args, {
      cwd: root,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      rejectOnce(new Error(`Codex CLI timed out after ${codexTimeoutMs}ms`));
    }, codexTimeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendBounded(stderr, chunk);
    });
    child.on("error", rejectOnce);
    child.on("close", async (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      const text = await readTextFile(outputPath);
      await removeFile(outputPath);
      if (code !== 0) {
        reject(new Error(trimForLog(stderr || stdout || `Codex CLI exited with ${code}`)));
        return;
      }
      resolve({
        text: text.trim(),
        sessionId: extractCodexSessionId(stdout),
      });
    });

    child.stdin.end(prompt);

    function rejectOnce(error) {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      removeFile(outputPath).finally(() => reject(error));
    }
  });
}

function appendBounded(current, chunk) {
  const next = current + chunk.toString("utf8");
  return next.length > 1_000_000 ? next.slice(-1_000_000) : next;
}

async function readCodexSession() {
  if (process.env.CODEX_SESSION_ID) {
    return { sessionId: process.env.CODEX_SESSION_ID, fromEnv: true };
  }
  try {
    const parsed = JSON.parse(await fs.promises.readFile(codexSessionFile, "utf8"));
    return { sessionId: parsed.sessionId || "", fromEnv: false };
  } catch {
    return { sessionId: "", fromEnv: false };
  }
}

async function writeCodexSession(sessionId) {
  const payload = {
    sessionId,
    updatedAt: new Date().toISOString(),
  };
  await fs.promises.writeFile(codexSessionFile, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
}

function extractCodexSessionId(stdout) {
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = findSessionId(JSON.parse(line));
      if (value) return value;
    } catch {
      continue;
    }
  }
  return "";
}

function findSessionId(value) {
  if (!value || typeof value !== "object") return "";
  const keys = ["session_id", "sessionId", "thread_id", "threadId", "conversation_id", "conversationId"];
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
  }
  for (const nested of Object.values(value)) {
    const found = findSessionId(nested);
    if (found) return found;
  }
  return "";
}

async function readTextFile(filePath) {
  try {
    return await fs.promises.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function removeFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Temporary output cleanup is best-effort.
  }
}

function trimForLog(value) {
  const text = String(value || "").trim();
  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
}

function localReply(message = "", places = []) {
  const missing = places.filter((place) => !place.lat || !place.lng).length;
  if (/좌표|핀|지도/.test(message)) {
    if (missing === 0) {
      return `조사 장소 ${places.length}개 모두 좌표가 채워져 있습니다. 이제 지도 기준으로 동선을 비교할 수 있습니다.`;
    }
    return `좌표 미확인 조사 장소가 ${missing}개 있습니다. 해당 항목은 거리 계산에서 제외됩니다.`;
  }
  if (/비|우천|장마|날씨/.test(message)) {
    return "우천이면 실내형 장소를 우선하세요. 츄라우미 수족관, 쇼핑몰, 돈키호테, 국제거리 쪽을 후보로 두면 좋습니다.";
  }
  return "현재 서버는 로컬 응답 모드입니다. 장소 추가/삭제는 화면에서 즉시 반영됩니다.";
}

function extractText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}
