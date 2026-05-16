import type { ItineraryItem, Place, TripDay, TripState } from "../types";

import { hasCoordinates, normalizePlaceKey } from "./tripDisplay";

export type ItineraryMapUsage = {
  item: ItineraryItem;
  day: TripDay | null;
  sequence: number | null;
  selected: boolean;
};

export function itineraryUsagesForPlace(place: Place, tripState: TripState, selectedDayId: string): ItineraryMapUsage[] {
  return itineraryUsages(tripState, selectedDayId).filter((usage) => {
    if (!usage.selected) return false;
    if (usage.item.placeId && usage.item.placeId === place.id) return true;
    if (hasCoordinates(place) && hasCoordinates(usage.item) && sameMapCoordinate(place, usage.item)) return true;
    return normalizePlaceKey(usage.item.title) === normalizePlaceKey(place.name);
  });
}

export function itineraryUsagesAtCoordinate(
  tripState: TripState,
  lat: number,
  lng: number,
  selectedDayId: string
): ItineraryMapUsage[] {
  return itineraryUsages(tripState, selectedDayId).filter((usage) => {
    if (!usage.selected) return false;
    if (!hasCoordinates(usage.item)) return false;
    return sameMapCoordinate({ lat, lng }, usage.item);
  });
}

function itineraryUsages(tripState: TripState, selectedDayId: string): ItineraryMapUsage[] {
  const dayById = new Map(tripState.days.map((day) => [day.id, day]));
  const mappableItemsByDay = new Map<string, ItineraryItem[]>();
  tripState.days.forEach((day) => {
    mappableItemsByDay.set(
      day.id,
      tripState.itineraryItems
        .filter((item) => item.tripDayId === day.id)
        .filter(hasCoordinates)
        .sort((left, right) => left.sortOrder - right.sortOrder)
    );
  });

  return tripState.itineraryItems
    .filter(hasCoordinates)
    .map((item) => {
      const dayItems = mappableItemsByDay.get(item.tripDayId) ?? [];
      const sequenceIndex = dayItems.findIndex((candidate) => candidate.id === item.id);
      return {
        item,
        day: dayById.get(item.tripDayId) ?? null,
        sequence: sequenceIndex >= 0 ? sequenceIndex + 1 : null,
        selected: item.tripDayId === selectedDayId
      };
    })
    .sort(sortItineraryUsage);
}

function sortItineraryUsage(left: ItineraryMapUsage, right: ItineraryMapUsage): number {
  if (left.selected !== right.selected) return left.selected ? -1 : 1;
  const leftDay = left.day?.dayNumber ?? 999;
  const rightDay = right.day?.dayNumber ?? 999;
  if (leftDay !== rightDay) return leftDay - rightDay;
  return left.item.sortOrder - right.item.sortOrder;
}

function sameMapCoordinate(
  left: { lat: number | null | undefined; lng: number | null | undefined },
  right: { lat: number | null | undefined; lng: number | null | undefined }
): boolean {
  if (!hasCoordinates(left) || !hasCoordinates(right)) return false;
  return Math.abs(left.lat - right.lat) < 0.00005 && Math.abs(left.lng - right.lng) < 0.00005;
}
