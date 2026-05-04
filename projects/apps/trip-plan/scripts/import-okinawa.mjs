#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.resolve(rootDir, "..");
const schedulePath = path.join(sourceDir, "오키나와 여행 일정.md");
const researchPlacesPath = path.join(sourceDir, "오키나와 조사 장소.md");
const dbPath = path.join(rootDir, ".data/trip-planner-backend.sqlite");
const seedPath = path.join(rootDir, "docs", "seed", "020_okinawa_trip_import.sql");
const shouldApply = !process.argv.includes("--no-apply");

const tripId = "trip_okinawa_20260505";
const fallbackWorkspaceId = "workspace_personal_travel";
const now = new Date().toISOString();

for (const requiredPath of [schedulePath, researchPlacesPath]) {
  if (!existsSync(requiredPath)) {
    throw new Error(`source file not found: ${requiredPath}`);
  }
}

if (shouldApply && !existsSync(dbPath)) {
  throw new Error(`database file not found: ${dbPath}`);
}

const scheduleMarkdown = readFileSync(schedulePath, "utf8");
const researchPlacesMarkdown = readFileSync(researchPlacesPath, "utf8");
const parsedSchedule = parseScheduleMarkdown(scheduleMarkdown);
const parsedResearchPlaces = parseResearchPlacesMarkdown(researchPlacesMarkdown);
const workspaceId = shouldApply ? readWorkspaceId() : fallbackWorkspaceId;

const placeStore = createPlaceStore();
const days = parsedSchedule.days.map((day) => ({
  ...day,
  id: `day_okinawa_20260505_${day.dayNumber}`
}));
const itineraryItems = [];

for (const day of days) {
  let sortOrder = 10;
  for (const item of day.items) {
    const place = item.lat != null && item.lng != null
      ? placeStore.add({
        name: item.title,
        category: item.category,
        note: item.memo,
        source: "triple-schedule-md",
        lat: item.lat,
        lng: item.lng,
        aliases: [item.title],
        raw: {
          sourceFile: path.basename(schedulePath),
          dayNumber: day.dayNumber,
          scheduleTitle: item.title
        }
      })
      : null;

    itineraryItems.push({
      id: stableId("item_okinawa", `${day.dayNumber}:${sortOrder}:${item.title}`),
      tripDayId: day.id,
      placeId: place?.id ?? null,
      type: item.type,
      title: item.title,
      category: item.category,
      timeText: item.timeText,
      durationMinutes: null,
      memo: item.memo,
      lat: item.lat,
      lng: item.lng,
      sortOrder,
      locked: 0,
      raw: item.raw
    });
    sortOrder += 10;
  }
}

for (const row of parsedResearchPlaces) {
  placeStore.add({
    name: row.name,
    category: row.category,
    rating: row.rating,
    reviews: row.reviews,
    note: row.note,
    source: "google-maps-md",
    lat: row.lat,
    lng: row.lng,
    aliases: row.alias ? [row.alias] : [],
    raw: {
      sourceFile: path.basename(researchPlacesPath),
      originalIndex: row.index,
      categoryRaw: row.categoryRaw,
      coordinateSource: row.coordinateSource
    }
  });
}

const places = placeStore.values();
const sql = buildSql({ workspaceId, days, places, itineraryItems });

mkdirSync(path.dirname(seedPath), { recursive: true });
writeFileSync(seedPath, sql, "utf8");

if (shouldApply) {
  const result = spawnSync("sqlite3", [dbPath], {
    input: sql,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20
  });

  if (result.status !== 0) {
    throw new Error(`sqlite import failed: ${result.stderr || result.stdout}`);
  }
}

const mappableItemCount = itineraryItems.filter((item) => item.lat != null && item.lng != null).length;
console.log(`seed: ${path.relative(rootDir, seedPath)}`);
console.log(`trip: ${tripId}`);
console.log(`days: ${days.length}`);
console.log(`itinerary_items: ${itineraryItems.length}`);
console.log(`mappable_items: ${mappableItemCount}`);
console.log(`places: ${places.length}`);
console.log(`applied: ${shouldApply ? "yes" : "no"}`);

function parseScheduleMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const days = [];
  let currentDay = null;
  let currentBlock = null;

  const flushBlock = () => {
    if (!currentDay || !currentBlock) return;
    const item = parseScheduleBlock(currentBlock.heading, currentBlock.lines);
    if (item) currentDay.items.push(item);
    currentBlock = null;
  };

  for (const line of lines) {
    const dayMatch = line.match(/^## Day (\d+) - (\d{4})\.(\d{2})\.(\d{2}) \(([^)]+)\)/);
    if (dayMatch) {
      flushBlock();
      currentDay = {
        dayNumber: Number(dayMatch[1]),
        dateText: `${dayMatch[2]}-${dayMatch[3]}-${dayMatch[4]}`,
        weekday: dayMatch[5],
        title: `Day ${dayMatch[1]}`,
        items: []
      };
      days.push(currentDay);
      continue;
    }

    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch && currentDay) {
      flushBlock();
      currentBlock = { heading: headingMatch[1].trim(), lines: [] };
      continue;
    }

    if (currentBlock) currentBlock.lines.push(line);
  }

  flushBlock();
  return { days };
}

function parseScheduleBlock(heading, lines) {
  const numberedMatch = heading.match(/^(?:(\d{2}:\d{2})\s+)?(\d+)\.\s+(.+)$/);
  const details = parseDetails(lines);

  if (numberedMatch) {
    const title = numberedMatch[3].trim();
    return {
      type: itemType(title, details.category),
      title,
      category: normalizeCategory(details.category, title),
      timeText: numberedMatch[1] ?? null,
      memo: joinMemo(details),
      lat: details.lat,
      lng: details.lng,
      raw: {
        source: "triple-schedule-md",
        heading,
        originalCategory: details.category,
        region: details.region,
        description: details.description
      }
    };
  }

  if (heading.startsWith("항공편:")) {
    return {
      type: "transport",
      title: heading,
      category: "항공편",
      timeText: extractFirstTime(heading),
      memo: cleanup(lines.join("\n")),
      lat: null,
      lng: null,
      raw: { source: "triple-schedule-md", heading }
    };
  }

  const memo = joinMemo(details) || cleanup(lines.join("\n"));
  if (!memo && heading === "메모") return null;

  return {
    type: "custom",
    title: heading === "메모" ? summarizeMemoTitle(memo) : heading,
    category: "메모",
    timeText: null,
    memo,
    lat: details.lat,
    lng: details.lng,
    raw: { source: "triple-schedule-md", heading }
  };
}

function parseDetails(lines) {
  const text = lines.join("\n");
  const category = matchLine(text, "분류");
  const region = matchLine(text, "지역");
  const description = matchLine(text, "설명");
  const linkLine = matchLine(text, "링크");
  const coordinateMatch = text.match(/[?&]query=([-0-9.]+),([-0-9.]+)/);
  const memo = extractMemo(lines);

  return {
    category,
    region,
    description,
    linkLine,
    memo,
    lat: coordinateMatch ? Number(coordinateMatch[1]) : null,
    lng: coordinateMatch ? Number(coordinateMatch[2]) : null
  };
}

function matchLine(text, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^- ${escapedLabel}:\\s*(.*)$`, "m"));
  return match ? cleanup(match[1]) : null;
}

function extractMemo(lines) {
  const memoLines = [];
  let inMemo = false;

  for (const line of lines) {
    const structuredMatch = line.match(/^- (분류|지역|설명|링크):/);
    if (structuredMatch && !line.startsWith("- 메모:")) {
      if (inMemo) break;
      continue;
    }

    if (line.startsWith("- 메모:")) {
      inMemo = true;
      memoLines.push(line.replace(/^- 메모:\s*/, ""));
      continue;
    }

    if (inMemo) memoLines.push(line);
  }

  return cleanup(memoLines.join("\n"));
}

function joinMemo(details) {
  return cleanup([
    details.description,
    details.region ? `지역: ${details.region}` : null,
    details.memo
  ].filter(Boolean).join("\n\n"));
}

function summarizeMemoTitle(memo) {
  const firstLine = memo.split("\n").map((line) => line.trim()).find(Boolean);
  if (!firstLine) return "메모";
  const plain = firstLine.replace(/^[#*\-•\s]+/, "");
  return plain.length > 22 ? `${plain.slice(0, 22)}...` : plain;
}

function parseResearchPlacesMarkdown(markdown) {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => splitMarkdownRow(line))
    .filter((cells) => cells.length >= 9)
    .map((cells) => {
      const [index, name, categoryRaw, rating, reviews, note, lat, lng, coordinateSource] = cells;
      return {
        index: Number(index),
        name: cleanup(name),
        categoryRaw: cleanup(categoryRaw),
        category: normalizeCategory(categoryRaw, name),
        rating: cleanup(rating),
        reviews: cleanup(reviews),
        note: cleanup(note),
        lat: Number(lat),
        lng: Number(lng),
        coordinateSource: cleanup(coordinateSource),
        alias: extractMatchedAlias(coordinateSource)
      };
    })
    .filter((row) => row.name && Number.isFinite(row.lat) && Number.isFinite(row.lng));
}

function splitMarkdownRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cleanup(cell));
}

function extractMatchedAlias(source) {
  const match = source?.match(/트리플 일정 매칭:\s*(.+)$/);
  return match ? cleanup(match[1]) : null;
}

function createPlaceStore() {
  const places = [];

  return {
    add(candidate) {
      const existing = places.find((place) => isSamePlace(place, candidate));
      if (existing) {
        mergePlace(existing, candidate);
        return existing;
      }

      const place = {
        id: stableId("place_okinawa", `${candidate.name}:${candidate.lat ?? ""}:${candidate.lng ?? ""}`),
        name: candidate.name,
        category: candidate.category ?? null,
        rating: candidate.rating ?? null,
        reviews: candidate.reviews ?? null,
        note: candidate.note ?? null,
        address: null,
        source: candidate.source ?? null,
        sourceUrl: null,
        imageUrl: null,
        lat: candidate.lat ?? null,
        lng: candidate.lng ?? null,
        status: "ready",
        aliases: Array.from(new Set([candidate.name, ...(candidate.aliases ?? [])].filter(Boolean))),
        raw: { sources: [candidate.raw].filter(Boolean) }
      };
      places.push(place);
      return place;
    },
    values() {
      return places;
    }
  };
}

function isSamePlace(a, b) {
  const normalizedA = normalizePlaceName(a.name);
  const normalizedB = normalizePlaceName(b.name);
  if (normalizedA && normalizedA === normalizedB) return true;

  const aliasesA = [a.name, ...(a.aliases ?? [])].map(normalizePlaceName).filter(Boolean);
  const aliasesB = [b.name, ...(b.aliases ?? [])].map(normalizePlaceName).filter(Boolean);
  if (aliasesA.some((alias) => aliasesB.includes(alias))) return true;

  if (!sameCoordinate(a, b)) return false;
  if (hasTokenOverlap([a.name, ...(a.aliases ?? [])].join(" "), [b.name, ...(b.aliases ?? [])].join(" "))) return true;
  if (isScheduleMatched(b) || isScheduleMatched(a)) return true;

  const aGroup = categoryGroup(a.category);
  const bGroup = categoryGroup(b.category);
  return aGroup !== "food" && bGroup !== "food" && aGroup === bGroup;
}

function mergePlace(target, source) {
  target.name = preferDisplayName(target.name, source.name);
  target.category ||= source.category ?? null;
  target.rating ||= source.rating ?? null;
  target.reviews ||= source.reviews ?? null;
  target.note = mergeText(target.note, source.note);
  target.source = mergeText(target.source, source.source, " + ");
  target.lat ??= source.lat ?? null;
  target.lng ??= source.lng ?? null;
  target.aliases = Array.from(new Set([...(target.aliases ?? []), source.name, ...(source.aliases ?? [])].filter(Boolean)));
  target.raw.sources.push(source.raw);
}

function sameCoordinate(a, b) {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return false;
  return Math.abs(a.lat - b.lat) < 0.00004 && Math.abs(a.lng - b.lng) < 0.00004;
}

function isScheduleMatched(place) {
  const sources = place.raw?.sources ?? [place.raw];
  return sources.some((source) => JSON.stringify(source ?? {}).includes("트리플 일정 매칭"));
}

function hasTokenOverlap(a, b) {
  const aTokens = tokenizePlaceName(a);
  const bTokens = tokenizePlaceName(b);
  return aTokens.some((token) => bTokens.includes(token));
}

function tokenizePlaceName(value) {
  return normalizePlaceName(value)
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .filter((token) => !["오키나와", "okinawa", "naha", "나하", "점", "카페"].includes(token));
}

function normalizePlaceName(value) {
  return cleanup(value)
    .toLowerCase()
    .replace(/[【】()[\]（）・,./#\-_'’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function preferDisplayName(current, next) {
  if (!current) return next;
  if (!next) return current;
  const currentHasHangul = /[가-힣]/.test(current);
  const nextHasHangul = /[가-힣]/.test(next);
  if (nextHasHangul && !currentHasHangul) return next;
  return current;
}

function mergeText(left, right, separator = "\n\n") {
  if (!left) return right ?? null;
  if (!right) return left;
  if (left.includes(right)) return left;
  if (right.includes(left)) return right;
  return `${left}${separator}${right}`;
}

function normalizeCategory(category, title = "") {
  const value = `${category ?? ""} ${title ?? ""}`.toLowerCase();
  if (/호텔|리조트|hotel|beb5|nest/.test(value)) return "호텔";
  if (/공항|항공|렌트|카|페리|여객|대교/.test(value)) return "교통";
  if (/카페|커피|디저트|팬케이크|차야|coffee|cafe/.test(value)) return "카페";
  if (/음식|식당|요리|소바|스시|초밥|스테이크|야키니쿠|햄버거|아침식사|해산물|국수|이자카야|일식|네팔|뷔페|레스토랑/.test(value)) return "음식";
  if (/쇼핑|마트|할인|잡화|돈키|몰|market|products/.test(value)) return "쇼핑";
  if (/해변|공원|명승|관광|전망|수족관|테마|체험|다이빙|스노|섬|성|거리|타워/.test(value)) return "관광";
  return cleanup(category) || "기타";
}

function categoryGroup(category) {
  if (["음식", "카페"].includes(category)) return "food";
  if (category === "호텔") return "hotel";
  if (category === "교통") return "transport";
  if (category === "쇼핑") return "shopping";
  if (category === "관광") return "sight";
  return "other";
}

function itemType(title, category) {
  const group = categoryGroup(normalizeCategory(category, title));
  if (group === "transport") return "transport";
  if (group === "food") return "meal";
  return "poi";
}

function extractFirstTime(value) {
  return value.match(/\b\d{2}:\d{2}\b/)?.[0] ?? null;
}

function cleanup(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/\u200b/g, "")
    .trim();
}

function stableId(prefix, value) {
  const hash = createHash("sha1").update(value).digest("hex").slice(0, 16);
  return `${prefix}_${hash}`;
}

function readWorkspaceId() {
  const query = "SELECT id FROM workspaces WHERE name='개인 여행' ORDER BY created_at LIMIT 1;";
  const result = spawnSync("sqlite3", [dbPath, query], { encoding: "utf8" });
  if (result.status !== 0) return fallbackWorkspaceId;
  return result.stdout.trim() || fallbackWorkspaceId;
}

function buildSql({ workspaceId, days, places, itineraryItems }) {
  const statements = [
    "PRAGMA foreign_keys = ON;",
    "BEGIN;",
    `INSERT INTO workspaces (id, name, created_at, updated_at)
SELECT ${q(fallbackWorkspaceId)}, ${q("개인 여행")}, ${q(now)}, ${q(now)}
WHERE NOT EXISTS (SELECT 1 FROM workspaces WHERE id = ${q(workspaceId)});`,
    `DELETE FROM trips WHERE id = ${q(tripId)};`,
    `INSERT INTO trips (id, workspace_id, title, destination_name, start_date, end_date, timezone, created_at, updated_at, destination_lat, destination_lng)
VALUES (${q(tripId)}, ${q(workspaceId)}, ${q("오키나와 3박 4일 여행")}, ${q("오키나와")}, ${q("2026-05-05")}, ${q("2026-05-08")}, ${q("Asia/Seoul")}, ${q(now)}, ${q(now)}, 26.3344, 127.8056);`
  ];

  for (const day of days) {
    statements.push(`INSERT INTO trip_days (id, trip_id, day_number, date_text, weekday, title, sort_order, created_at, updated_at)
VALUES (${q(day.id)}, ${q(tripId)}, ${day.dayNumber}, ${q(day.dateText)}, ${q(day.weekday)}, ${q(day.title)}, ${day.dayNumber * 10}, ${q(now)}, ${q(now)});`);
  }

  for (const place of places) {
    statements.push(`INSERT INTO places (id, trip_id, name, category, rating, reviews, note, address, source, source_url, image_url, lat, lng, status, raw_json, created_at, updated_at)
VALUES (${q(place.id)}, ${q(tripId)}, ${q(place.name)}, ${q(place.category)}, ${q(place.rating)}, ${q(place.reviews)}, ${q(place.note)}, ${q(place.address)}, ${q(place.source)}, ${q(place.sourceUrl)}, ${q(place.imageUrl)}, ${n(place.lat)}, ${n(place.lng)}, ${q(place.status)}, ${q(JSON.stringify({ ...place.raw, aliases: place.aliases }))}, ${q(now)}, ${q(now)});`);
  }

  for (const item of itineraryItems) {
    statements.push(`INSERT INTO itinerary_items (id, trip_day_id, place_id, type, title, category, time_text, duration_minutes, memo, lat, lng, sort_order, locked, raw_json, created_at, updated_at)
VALUES (${q(item.id)}, ${q(item.tripDayId)}, ${q(item.placeId)}, ${q(item.type)}, ${q(item.title)}, ${q(item.category)}, ${q(item.timeText)}, ${n(item.durationMinutes)}, ${q(item.memo)}, ${n(item.lat)}, ${n(item.lng)}, ${item.sortOrder}, ${item.locked}, ${q(JSON.stringify(item.raw))}, ${q(now)}, ${q(now)});`);
  }

  statements.push("COMMIT;");
  return `${statements.join("\n\n")}\n`;
}

function q(value) {
  if (value == null || value === "") return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function n(value) {
  return value == null || Number.isNaN(value) ? "NULL" : String(value);
}
