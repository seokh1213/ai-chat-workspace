const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

const root = __dirname;
const dataDir = path.join(root, ".data");
const dbPath = process.env.TRIP_PLANNER_DB || path.join(dataDir, "trip-planner.sqlite");
const schemaPath = path.join(root, "db", "schema.sql");
const planId = "okinawa-2026";

function ensureDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });
  execSql(fs.readFileSync(schemaPath, "utf8"));
  const seeded = queryJson("SELECT value FROM app_meta WHERE key = 'seeded_from_static' LIMIT 1;")[0];
  if (!seeded) seedFromStaticFiles();
}

function getState() {
  ensureDatabase();
  const planRow = queryJson(`SELECT id, title FROM trip_plans WHERE id = ${sql(planId)} LIMIT 1;`)[0];
  const dayRows = queryJson(
    `
      SELECT id, day_number, date_text, weekday
      FROM trip_days
      WHERE plan_id = ${sql(planId)}
      ORDER BY sort_order, day_number;
    `,
  );
  const itemRows = queryJson(
    `
      SELECT
        i.id,
        d.day_number AS day,
        i.place_id AS placeId,
        i.type,
        i.title,
        i.category,
        i.time_text AS time,
        i.memo,
        i.lat,
        i.lng,
        i.sort_order AS seq,
        i.locked
      FROM plan_items i
      JOIN trip_days d ON d.id = i.day_id
      WHERE d.plan_id = ${sql(planId)}
      ORDER BY d.sort_order, i.sort_order, i.created_at;
    `,
  );
  const places = queryJson(
    `
      SELECT
        id,
        name,
        category,
        rating,
        reviews,
        note,
        lat,
        lng,
        coord_source AS coordSource,
        image,
        status
      FROM places
      ORDER BY id;
    `,
  );

  const itemsByDay = new Map();
  itemRows.forEach((item) => {
    if (!itemsByDay.has(item.day)) itemsByDay.set(item.day, []);
    itemsByDay.get(item.day).push({
      id: item.id,
      type: item.type,
      time: item.time,
      memo: item.memo || "",
      title: item.title,
      category: item.category || "",
      placeId: item.placeId || null,
      lat: item.lat,
      lng: item.lng,
      seq: item.seq,
      locked: Boolean(item.locked),
    });
  });

  return {
    plan: {
      id: planRow?.id || planId,
      title: planRow?.title || "오키나와 여행",
      days: dayRows.map((day) => ({
        id: day.id,
        day: day.day_number,
        date: day.date_text,
        weekday: day.weekday,
        items: itemsByDay.get(day.day_number) || [],
      })),
    },
    places,
  };
}

function getCheckpoints(limit = 20) {
  ensureDatabase();
  return queryJson(
    `
      SELECT id, label, reason, source, created_at AS createdAt
      FROM checkpoints
      WHERE plan_id = ${sql(planId)}
      ORDER BY created_at DESC
      LIMIT ${Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 20};
    `,
  );
}

function applyOperations(operations, meta = {}) {
  ensureDatabase();
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error("operations must be a non-empty array");
  }
  if (operations.length > 80) {
    throw new Error("too many operations");
  }

  const state = getState();
  const beforePlan = structuredClone(state.plan);
  const afterPlan = structuredClone(state.plan);
  const placesById = new Map(state.places.map((place) => [place.id, place]));

  operations.forEach((operation) => applyOperation(afterPlan, placesById, operation));
  normalizePlan(afterPlan);
  validatePlan(afterPlan);
  writePlan(afterPlan);

  const latest = getState();
  const checkpoint = createCheckpoint({
    label: meta.label || "AI/Edit change",
    reason: meta.reason || "",
    source: meta.source || "api",
    beforePlan,
    afterPlan: latest.plan,
    operations,
  });

  return {
    plan: latest.plan,
    places: latest.places,
    checkpoint,
  };
}

function rollbackCheckpoint(checkpointId) {
  ensureDatabase();
  const row = queryJson(
    `
      SELECT id, before_plan_json AS beforePlanJson
      FROM checkpoints
      WHERE plan_id = ${sql(planId)} AND id = ${sql(checkpointId)}
      LIMIT 1;
    `,
  )[0];
  if (!row) throw new Error("checkpoint not found");
  const current = getState().plan;
  const beforePlan = JSON.parse(row.beforePlanJson);
  writePlan(beforePlan);
  const latest = getState();
  const checkpoint = createCheckpoint({
    label: "Rollback",
    reason: `Rollback to ${checkpointId}`,
    source: "rollback",
    beforePlan: current,
    afterPlan: latest.plan,
    operations: [{ op: "rollback", checkpointId }],
  });
  return {
    plan: latest.plan,
    places: latest.places,
    checkpoint,
  };
}

function recordAiEditRun({ provider, model, userMessage, aiMessage, operations, status, error, checkpointId }) {
  ensureDatabase();
  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  execSql(
    `
      INSERT INTO ai_edit_runs (
        id, plan_id, provider, model, user_message, ai_message, operations_json, status, error, checkpoint_id
      ) VALUES (
        ${sql(id)},
        ${sql(planId)},
        ${sql(provider)},
        ${sql(model)},
        ${sql(userMessage)},
        ${sql(aiMessage)},
        ${sql(JSON.stringify(operations || []))},
        ${sql(status || "proposed")},
        ${sql(error)},
        ${sql(checkpointId)}
      );
    `,
  );
  return id;
}

function seedFromStaticFiles() {
  const plan = loadJsGlobal(path.join(root, "data", "plan.js"), "OKINAWA_PLAN");
  const places = loadJsGlobal(path.join(root, "data", "places.js"), "OKINAWA_PLACES");

  const statements = [
    "BEGIN;",
    `INSERT OR REPLACE INTO trip_plans (id, title, updated_at) VALUES (${sql(planId)}, ${sql(plan.title || "오키나와 여행")}, CURRENT_TIMESTAMP);`,
  ];

  places.forEach((place) => {
    statements.push(
      `
        INSERT OR REPLACE INTO places (
          id, name, category, rating, reviews, note, lat, lng, coord_source, image, status, raw_json, updated_at
        ) VALUES (
          ${sql(place.id)},
          ${sql(place.name)},
          ${sql(place.category)},
          ${sql(place.rating)},
          ${sql(place.reviews)},
          ${sql(place.note)},
          ${sqlNumber(place.lat)},
          ${sqlNumber(place.lng)},
          ${sql(place.coordSource)},
          ${sql(place.image)},
          ${sql(place.status || "ready")},
          ${sql(JSON.stringify(place))},
          CURRENT_TIMESTAMP
        );
      `,
    );
  });

  plan.days.forEach((day, dayIndex) => {
    const dayId = day.id || `day-${day.day}`;
    statements.push(
      `
        INSERT OR REPLACE INTO trip_days (
          id, plan_id, day_number, date_text, weekday, sort_order, updated_at
        ) VALUES (
          ${sql(dayId)},
          ${sql(planId)},
          ${sqlNumber(day.day)},
          ${sql(day.date)},
          ${sql(day.weekday)},
          ${dayIndex + 1},
          CURRENT_TIMESTAMP
        );
      `,
    );
    (day.items || []).forEach((item, itemIndex) => {
      statements.push(insertItemSql(dayId, normalizeItem(item, places, itemIndex)));
    });
  });

  statements.push(
    `INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES ('seeded_from_static', ${sql(new Date().toISOString())}, CURRENT_TIMESTAMP);`,
    "COMMIT;",
  );
  execSql(statements.join("\n"));
}

function applyOperation(plan, placesById, operation) {
  if (!operation || typeof operation !== "object") throw new Error("operation must be an object");
  switch (operation.op) {
    case "add_item":
      return addItem(plan, placesById, operation);
    case "update_item":
      return updateItem(plan, operation);
    case "move_item":
      return moveItem(plan, operation);
    case "delete_item":
      return deleteItem(plan, operation);
    case "reorder_day":
      return reorderDay(plan, operation);
    case "replace_day_plan":
      return replaceDayPlan(plan, placesById, operation);
    default:
      throw new Error(`unsupported operation: ${operation.op}`);
  }
}

function addItem(plan, placesById, operation) {
  const day = findDay(plan, operation.day ?? operation.toDay);
  const place = operation.item?.placeId ? placesById.get(operation.item.placeId) : null;
  const item = normalizeItem(
    {
      ...(place
        ? {
            title: place.name,
            category: place.category,
            memo: place.note,
            lat: place.lat,
            lng: place.lng,
            placeId: place.id,
          }
        : {}),
      ...(operation.item || {}),
      id: operation.item?.id || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    Array.from(placesById.values()),
    day.items.length,
  );
  insertAt(day.items, item, insertionIndex(day.items, operation));
}

function updateItem(plan, operation) {
  const item = findItem(plan, operation.itemId);
  if (item.locked) throw new Error(`item is locked: ${operation.itemId}`);
  const patch = operation.patch || {};
  const allowed = ["type", "title", "category", "time", "memo", "placeId", "lat", "lng", "locked"];
  allowed.forEach((key) => {
    if (!(key in patch)) return;
    item[key] = patch[key];
  });
  normalizeItemInPlace(item);
}

function moveItem(plan, operation) {
  const located = findItemWithDay(plan, operation.itemId);
  if (located.item.locked) throw new Error(`item is locked: ${operation.itemId}`);
  located.day.items.splice(located.index, 1);
  const targetDay = findDay(plan, operation.toDay ?? located.day.day);
  insertAt(targetDay.items, located.item, insertionIndex(targetDay.items, operation));
}

function deleteItem(plan, operation) {
  const located = findItemWithDay(plan, operation.itemId);
  if (located.item.locked) throw new Error(`item is locked: ${operation.itemId}`);
  located.day.items.splice(located.index, 1);
}

function reorderDay(plan, operation) {
  const day = findDay(plan, operation.day);
  if (!Array.isArray(operation.itemIds)) throw new Error("itemIds must be an array");
  const byId = new Map(day.items.map((item) => [item.id, item]));
  const ordered = operation.itemIds.map((id) => byId.get(id)).filter(Boolean);
  const remaining = day.items.filter((item) => !operation.itemIds.includes(item.id));
  day.items = [...ordered, ...remaining];
}

function replaceDayPlan(plan, placesById, operation) {
  const day = findDay(plan, operation.day);
  if (!Array.isArray(operation.items)) throw new Error("items must be an array");
  day.items = operation.items.map((item, index) => {
    const place = item.placeId ? placesById.get(item.placeId) : null;
    return normalizeItem(
      {
        ...(place
          ? {
              title: place.name,
              category: place.category,
              memo: place.note,
              lat: place.lat,
              lng: place.lng,
              placeId: place.id,
            }
          : {}),
        ...item,
        id: item.id || `manual-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      },
      Array.from(placesById.values()),
      index,
    );
  });
}

function writePlan(plan) {
  const statements = [
    "BEGIN;",
    `INSERT OR REPLACE INTO trip_plans (id, title, updated_at) VALUES (${sql(planId)}, ${sql(plan.title || "오키나와 여행")}, CURRENT_TIMESTAMP);`,
    `DELETE FROM trip_days WHERE plan_id = ${sql(planId)};`,
  ];

  plan.days.forEach((day, dayIndex) => {
    const dayId = day.id || `day-${day.day}`;
    statements.push(
      `
        INSERT INTO trip_days (
          id, plan_id, day_number, date_text, weekday, sort_order, updated_at
        ) VALUES (
          ${sql(dayId)},
          ${sql(planId)},
          ${sqlNumber(day.day)},
          ${sql(day.date)},
          ${sql(day.weekday)},
          ${dayIndex + 1},
          CURRENT_TIMESTAMP
        );
      `,
    );
    day.items.forEach((item, itemIndex) => {
      statements.push(insertItemSql(dayId, normalizeItem(item, [], itemIndex)));
    });
  });

  statements.push("COMMIT;");
  execSql(statements.join("\n"));
}

function createCheckpoint({ label, reason, source, beforePlan, afterPlan, operations }) {
  const id = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  execSql(
    `
      INSERT INTO checkpoints (
        id, plan_id, label, reason, source, before_plan_json, after_plan_json, operations_json
      ) VALUES (
        ${sql(id)},
        ${sql(planId)},
        ${sql(label)},
        ${sql(reason)},
        ${sql(source)},
        ${sql(JSON.stringify(beforePlan))},
        ${sql(JSON.stringify(afterPlan))},
        ${sql(JSON.stringify(operations || []))}
      );
    `,
  );
  return queryJson(
    `
      SELECT id, label, reason, source, created_at AS createdAt
      FROM checkpoints
      WHERE id = ${sql(id)}
      LIMIT 1;
    `,
  )[0];
}

function insertItemSql(dayId, item) {
  return `
    INSERT INTO plan_items (
      id, day_id, place_id, type, title, category, time_text, memo, lat, lng, sort_order, locked, raw_json, updated_at
    ) VALUES (
      ${sql(item.id)},
      ${sql(dayId)},
      ${sql(item.placeId)},
      ${sql(item.type || "poi")},
      ${sql(item.title)},
      ${sql(item.category)},
      ${sql(item.time)},
      ${sql(item.memo)},
      ${sqlNumber(item.lat)},
      ${sqlNumber(item.lng)},
      ${sqlNumber(item.seq)},
      ${item.locked ? 1 : 0},
      ${sql(JSON.stringify(item))},
      CURRENT_TIMESTAMP
    );
  `;
}

function normalizePlan(plan) {
  if (!Array.isArray(plan.days)) throw new Error("plan.days must be an array");
  const ids = new Set();
  plan.days.forEach((day, dayIndex) => {
    day.id = day.id || `day-${day.day || dayIndex + 1}`;
    day.day = Number(day.day || dayIndex + 1);
    day.date = day.date || "";
    day.weekday = day.weekday || "";
    if (!Array.isArray(day.items)) day.items = [];
    day.items.forEach((item, itemIndex) => {
      normalizeItemInPlace(item, itemIndex);
      if (ids.has(item.id)) throw new Error(`duplicate item id: ${item.id}`);
      ids.add(item.id);
    });
  });
}

function validatePlan(plan) {
  const itemCount = plan.days.reduce((sum, day) => sum + day.items.length, 0);
  if (itemCount > 300) throw new Error("plan has too many items");
  plan.days.forEach((day) => {
    day.items.forEach((item) => validateCoordinates(item));
  });
}

function normalizeItem(item, places, index) {
  const next = {
    id: String(item.id || `manual-${Date.now()}-${index}`),
    type: item.type || "poi",
    title: item.title || "새 일정",
    category: item.category || "",
    time: item.time || "",
    memo: item.memo || "",
    placeId: item.placeId || findPlaceId(item, places),
    lat: normalizeNumber(item.lat),
    lng: normalizeNumber(item.lng),
    seq: Number(item.seq || index + 1),
    locked: Boolean(item.locked),
  };
  validateCoordinates(next);
  return next;
}

function normalizeItemInPlace(item, index) {
  item.id = String(item.id || `manual-${Date.now()}-${index}`);
  item.type = item.type || "poi";
  item.title = item.title || "새 일정";
  item.category = item.category || "";
  item.time = item.time || "";
  item.memo = item.memo || "";
  item.placeId = item.placeId || null;
  item.lat = normalizeNumber(item.lat);
  item.lng = normalizeNumber(item.lng);
  item.seq = Number.isInteger(index) ? index + 1 : Number(item.seq || 1);
  item.locked = Boolean(item.locked);
  validateCoordinates(item);
}

function validateCoordinates(item) {
  if (item.lat == null && item.lng == null) return;
  if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) {
    throw new Error(`invalid coordinates for ${item.id}`);
  }
  if (item.lat < 20 || item.lat > 30 || item.lng < 120 || item.lng > 135) {
    throw new Error(`coordinates out of Okinawa bounds for ${item.id}`);
  }
}

function findPlaceId(item, places) {
  if (!Array.isArray(places)) return null;
  const normalizedTitle = normalizeText(item.title);
  const match = places.find((place) => normalizeText(place.name) === normalizedTitle);
  return match?.id || null;
}

function findDay(plan, dayNumber) {
  const day = plan.days.find((entry) => Number(entry.day) === Number(dayNumber));
  if (!day) throw new Error(`day not found: ${dayNumber}`);
  return day;
}

function findItem(plan, itemId) {
  return findItemWithDay(plan, itemId).item;
}

function findItemWithDay(plan, itemId) {
  for (const day of plan.days) {
    const index = day.items.findIndex((item) => item.id === itemId);
    if (index >= 0) return { day, item: day.items[index], index };
  }
  throw new Error(`item not found: ${itemId}`);
}

function insertionIndex(items, operation) {
  if (Number.isInteger(operation.toIndex)) return clamp(operation.toIndex, 0, items.length);
  if (Number.isInteger(operation.index)) return clamp(operation.index, 0, items.length);
  const anchor = operation.afterItemId;
  if (anchor) {
    const index = items.findIndex((item) => item.id === anchor);
    if (index >= 0) return index + 1;
  }
  return items.length;
}

function insertAt(items, item, index) {
  items.splice(clamp(index, 0, items.length), 0, item);
}

function loadJsGlobal(filePath, globalName) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(filePath, "utf8"), sandbox, { filename: filePath });
  return sandbox.window[globalName];
}

function execSql(sqlText) {
  const result = spawnSync("sqlite3", [dbPath], {
    input: `PRAGMA foreign_keys = ON;\n${sqlText}`,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "sqlite3 failed").trim());
  }
}

function queryJson(sqlText) {
  const result = spawnSync("sqlite3", ["-json", dbPath, sqlText], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "sqlite3 query failed").trim());
  }
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : [];
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  const number = normalizeNumber(value);
  return number === null ? "NULL" : String(number);
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣ぁ-んァ-ン一-龥]+/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

module.exports = {
  dbPath,
  ensureDatabase,
  getState,
  getCheckpoints,
  applyOperations,
  rollbackCheckpoint,
  recordAiEditRun,
};
