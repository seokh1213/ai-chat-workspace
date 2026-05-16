import type { ItineraryItem, Place, Trip, TripDay } from "../types";

import { parseIsoDate } from "./date";

const itineraryMemoCollapsedLineCount = 3;
const itineraryMemoCharsPerLine = 22;

const categoryLabels: Record<string, string> = {
  sight: "관광",
  restaurant: "식당",
  cafe: "카페",
  hotel: "숙소",
  transport: "교통",
  shopping: "쇼핑",
  activity: "액티비티",
  other: "기타"
};

const placeNameKo: Record<string, string> = {
  citygodtempleofshanghai: "상하이 성황묘",
  nanjingroad: "난징동루",
  orientalpearltower: "동방명주",
  peoplessquareshanghai: "인민광장",
  shanghaitower: "상하이 타워",
  shanghaiworldfinancialcenter: "상하이 월드 파이낸셜 센터",
  thebund: "와이탄",
  wukangroad: "우캉루",
  xintiandi: "신천지",
  yugarden: "예원"
};

export function formatDateRange(trip: Trip): string {
  if (trip.startDate && trip.endDate) return `${trip.startDate} - ${trip.endDate}`;
  if (trip.startDate) return trip.startDate;
  return "";
}

export function mobileDayLabel(day: TripDay): string {
  if (!day.dateText) return day.weekday || "날짜 미정";
  const date = parseIsoDate(day.dateText);
  const monthDay = Number.isNaN(date.getTime())
    ? day.dateText.slice(5) || day.dateText
    : new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(date);
  return [monthDay, day.weekday].filter(Boolean).join(" ");
}

export function itineraryMemoText(item: ItineraryItem): string {
  return [item.category, item.memo].filter(Boolean).join(item.memo ? "\n" : " · ") || "메모 없음";
}

export function previewItineraryMemo(memoText: string): string {
  const lines = memoText.split("\n");
  if (lines.length > 3) return `${lines.slice(0, 3).join("\n")}...`;
  return memoText.length > 150 ? `${memoText.slice(0, 150)}...` : memoText;
}

export function hasVisuallyLongItineraryLine(memoText: string): boolean {
  return estimatedItineraryMemoLineCount(memoText) > itineraryMemoCollapsedLineCount;
}

export function itineraryMemoCountLabel(memoText: string): string {
  const lines = memoText.split("\n");
  const estimatedLines = estimatedItineraryMemoLineCount(memoText);
  if (estimatedLines > lines.length) return `약 ${estimatedLines}줄`;
  return lines.length > 1 ? `${lines.length}줄` : `${memoText.length}자`;
}

export function hasCoordinates<T extends { lat: number | null | undefined; lng: number | null | undefined }>(
  value: T
): value is T & { lat: number; lng: number } {
  return typeof value.lat === "number" && Number.isFinite(value.lat) && typeof value.lng === "number" && Number.isFinite(value.lng);
}

export function localizedPlaceName(place: Place): string {
  if (containsHangul(place.name)) return place.name;
  return placeNameKo[normalizePlaceKey(place.name)] ?? place.name;
}

export function placeSummary(place: Place): string {
  const parts = [categoryLabel(place.category), place.note, place.address].filter(Boolean);
  return parts.join(" · ");
}

export function placeDetailText(place: Place): string {
  return [
    categoryLabel(place.category),
    place.note,
    place.address ? `주소: ${place.address}` : null,
    place.sourceUrl ? `참고: ${place.sourceUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

export function previewPlaceDetail(detailText: string): string {
  const lines = detailText.split("\n");
  if (lines.length > 3) return `${lines.slice(0, 3).join("\n")}...`;
  return detailText.length > 140 ? `${detailText.slice(0, 140)}...` : detailText;
}

export function hasVisuallyLongPlaceLine(detailText: string): boolean {
  return estimatedTextLineCount(detailText, 24) > 3;
}

export function placeDetailCountLabel(detailText: string): string {
  const lines = detailText.split("\n");
  const estimatedLines = estimatedTextLineCount(detailText, 24);
  if (estimatedLines > lines.length) return `약 ${estimatedLines}줄`;
  return lines.length > 1 ? `${lines.length}줄` : `${detailText.length}자`;
}

export function categoryLabel(category: string | null): string | null {
  if (!category) return null;
  return categoryLabels[category] ?? category;
}

export function dedupePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const key = placeDedupeKey(place);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizePlaceKey(value: string): string {
  return value.toLowerCase().replace(/[\s·・,._()[\]{}'"`-]+/g, "");
}

function estimatedItineraryMemoLineCount(memoText: string): number {
  const lines = memoText.split("\n");
  if (lines.length === 0) return 1;
  return lines.reduce((sum, line) => {
    const compactLength = line.trim().length;
    if (compactLength === 0) return sum + 1;
    return sum + Math.ceil(compactLength / itineraryMemoCharsPerLine);
  }, 0);
}

function estimatedTextLineCount(text: string, charsPerLine: number): number {
  const lines = text.split("\n");
  if (lines.length === 0) return 1;
  return lines.reduce((sum, line) => {
    const compactLength = line.trim().length;
    if (compactLength === 0) return sum + 1;
    return sum + Math.ceil(compactLength / charsPerLine);
  }, 0);
}

function containsHangul(value: string): boolean {
  return /[가-힣]/.test(value);
}

function placeDedupeKey(place: Place): string {
  if (hasCoordinates(place)) {
    return `coord:${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
  }
  return `name:${normalizePlaceKey(place.name)}`;
}
