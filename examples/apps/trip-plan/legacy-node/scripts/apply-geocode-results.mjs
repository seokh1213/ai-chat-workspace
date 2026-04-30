import fs from "node:fs/promises";

const placesPath = new URL("../data/places.js", import.meta.url);
const resultsPath = new URL("../../geocode-results.json", import.meta.url);
const markdownPath = new URL("../../오키나와 조사 장소.md", import.meta.url);

const placesText = await fs.readFile(placesPath, "utf8");
const places = JSON.parse(placesText.match(/= (\[[\s\S]*\]);/)[1]);
const results = JSON.parse(await fs.readFile(resultsPath, "utf8"));

for (const place of places) {
  const result = results[place.id];
  if (!place.lat && result?.lat && result?.lng) {
    place.lat = result.lat;
    place.lng = result.lng;
    place.coordSource =
      result.osmType === "gsi"
        ? `검색 보강: 국토지리원 주소 검색 (${result.query})`
        : `검색 보강: OpenStreetMap/Nominatim (${result.query})`;
  }
  if (place.lat && place.lng) {
    place.status = "ready";
  }
}

await fs.writeFile(placesPath, `window.OKINAWA_PLACES = ${JSON.stringify(places, null, 2)};\n`);
await fs.writeFile(markdownPath, buildMarkdown(places));

function buildMarkdown(items) {
  const rows = items.map((place, index) =>
    [
      index + 1,
      cell(place.name),
      cell(place.category),
      cell(place.rating),
      cell(place.reviews),
      cell(place.note),
      formatCoord(place.lat),
      formatCoord(place.lng),
      cell(place.coordSource),
    ].join(" | "),
  );

  return [
    "# 오키나와 조사 장소",
    "",
    "- 출처: Google 지도 저장 목록 HTML",
    `- 추출 장소 수: ${items.length}개`,
    "- 좌표: 트리플 일정 매칭 + OpenStreetMap/Nominatim + 국토지리원 주소 검색으로 보강",
    "",
    "| # | 장소 | 분류/가격 | 평점 | 리뷰 | 메모 | 위도 | 경도 | 좌표 출처 |",
    "|---:|---|---|---:|---:|---|---:|---:|---|",
    ...rows.map((row) => `| ${row} |`),
    "",
  ].join("\n");
}

function formatCoord(value) {
  return typeof value === "number" ? value.toFixed(8) : "";
}

function cell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n+/g, " / ");
}
