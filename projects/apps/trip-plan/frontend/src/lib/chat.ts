import type { AiEditRunSummary, ChatMessage, ChatSession, Trip } from "../types";
import { formatElapsedSeconds, formatFileSize } from "./format";

export function findPreviousUserMessage(messages: ChatMessage[], messageId: string): ChatMessage | null {
  const messageIndex = messages.findIndex((message) => message.id === messageId);
  for (let index = messageIndex - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index];
    }
  }
  return null;
}

export function messageDurationMs(
  message: ChatMessage,
  editRuns: AiEditRunSummary[],
  previousUserMessage: ChatMessage | null
): number | null {
  const metadataDuration = messageMetadataDurationMs(message);
  if (metadataDuration != null) return metadataDuration;

  const matchingRun = editRuns.find((run) => run.assistantMessageId === message.id);
  if (matchingRun?.durationMs != null) return matchingRun.durationMs;

  if (!previousUserMessage) return null;
  const startedAt = new Date(previousUserMessage.createdAt).getTime();
  const endedAt = new Date(message.createdAt).getTime();
  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt < startedAt) return null;
  return endedAt - startedAt;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function parseSseData<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

export function parseEventTimeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function sortChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = parseEventTimeMs(left.createdAt) ?? 0;
    const rightTime = parseEventTimeMs(right.createdAt) ?? 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return left.id.localeCompare(right.id);
  });
}

export function makeLocalAssistantMessage(
  chatSessionId: string,
  content: string,
  status: string,
  startedAt: number
): ChatMessage {
  return {
    id: `local_assistant_${Date.now()}`,
    chatSessionId,
    role: "assistant",
    content,
    status,
    metadataJson: JSON.stringify({ durationMs: performance.now() - startedAt }),
    createdAt: new Date().toISOString(),
    attachments: []
  };
}

export function isTerminalChatRunStatus(status: string): boolean {
  return status === "applied" || status === "completed" || status === "failed" || status === "cancelled";
}

export function normalizePastedImageFile(file: File, index: number): File {
  const extension = imageExtension(file.type);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "");
  const name = file.name && file.name !== "image.png" ? file.name : `pasted-image-${stamp}-${index + 1}.${extension}`;
  return new File([file], name, { type: file.type || "image/png", lastModified: Date.now() });
}

export function buildChatSessionMarkdown(props: {
  trip: Trip;
  session: ChatSession;
  messages: ChatMessage[];
  runs: AiEditRunSummary[];
}): string {
  const lines = [
    `# ${markdownLine(props.session.title)}`,
    "",
    `- 여행: ${markdownLine(props.trip.title)}`,
    props.trip.destinationName ? `- 목적지: ${markdownLine(props.trip.destinationName)}` : null,
    `- 대화 ID: ${props.session.id}`,
    `- 내보낸 시각: ${new Date().toISOString()}`,
    ""
  ].filter((line): line is string => line !== null);

  if (props.messages.length === 0) {
    lines.push("## 대화", "", "아직 메시지가 없습니다.", "");
  } else {
    lines.push("## 대화", "");
    props.messages.forEach((message, index) => {
      lines.push(buildChatMessageMarkdown(message, index + 1), "");
    });
  }

  const meaningfulRuns = props.runs.filter((run) => run.operationCount > 0 || run.status !== "no_ops");
  if (meaningfulRuns.length > 0) {
    lines.push("## 변경 내역", "");
    meaningfulRuns.forEach((run) => {
      const duration = run.durationMs == null ? "" : ` · ${formatElapsedSeconds(Math.round(run.durationMs / 1000))}`;
      lines.push(`- ${run.status} · 작업 ${run.operationCount}개${duration}`);
      run.operationPreview.slice(0, 3).forEach((preview) => {
        lines.push(`  - ${preview}`);
      });
    });
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function buildChatMessageContentMarkdown(message: ChatMessage): string {
  const attachmentLines = message.attachments.map((attachment) =>
    `- ${attachment.fileName} (${attachment.kind}, ${formatFileSize(attachment.byteSize)})`
  );
  return `${message.content.trim() || "(빈 메시지)"}${attachmentLines.length ? `\n\n첨부:\n${attachmentLines.join("\n")}` : ""}\n`;
}

function buildChatMessageMarkdown(message: ChatMessage, index: number): string {
  const lines = [
    `### ${index}. ${chatRoleLabel(message.role)}`,
    "",
    message.content.trim() || "(빈 메시지)"
  ];
  if (message.attachments.length) {
    lines.push("", "첨부:");
    message.attachments.forEach((attachment) => {
      lines.push(`- ${attachment.fileName} (${attachment.kind}, ${formatFileSize(attachment.byteSize)})`);
    });
  }
  return lines.join("\n");
}

function messageMetadataDurationMs(message: ChatMessage): number | null {
  try {
    const metadata = JSON.parse(message.metadataJson) as { durationMs?: unknown };
    return typeof metadata.durationMs === "number" ? metadata.durationMs : null;
  } catch {
    return null;
  }
}

function markdownLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function chatRoleLabel(role: ChatMessage["role"]): string {
  switch (role) {
    case "user":
      return "사용자";
    case "assistant":
      return "AI";
    case "system":
      return "시스템";
    case "tool":
      return "도구";
  }
}

function imageExtension(contentType: string): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "png";
}
