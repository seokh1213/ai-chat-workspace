import L from "leaflet";

import type { Trip } from "../types";

import { isMobileUserAgent } from "./device";

export type MapView = {
  center: L.LatLngExpression;
  zoom: number;
};

const mapViewStoragePrefix = "trip-planner-map-view";

export function readInitialMapView(tripId: string): MapView | null {
  return readMapViewFromHash(tripId) ?? readMapViewFromStorage(tripId);
}

export function focusMapPoint(map: L.Map, point: L.LatLngExpression, zoom: number): void {
  map.setView(point, zoom, { animate: true });

  window.setTimeout(() => {
    map.setView(point, zoom, { animate: false });
    const size = map.getSize();
    const topOverlay = isMobileUserAgent() ? 136 : 0;
    const bottomOverlay = isMobileUserAgent() ? 104 : 0;
    const centerPoint = map.latLngToContainerPoint(L.latLng(point));
    const targetX = Math.round(size.x / 2);
    const targetY = Math.round((topOverlay + (size.y - bottomOverlay)) / 2);
    const correctionX = centerPoint.x - targetX;
    const correctionY = centerPoint.y - targetY;
    if (Math.abs(correctionX) > 8 || Math.abs(correctionY) > 8) {
      map.panBy([correctionX, correctionY], { animate: true });
    }
  }, 280);
}

export function destinationCenter(trip: Trip): L.LatLngExpression {
  if (typeof trip.destinationLat === "number" && typeof trip.destinationLng === "number") {
    return [trip.destinationLat, trip.destinationLng];
  }

  const destination = trip.destinationName?.toLowerCase() ?? "";
  if (destination.includes("오키나와") || destination.includes("okinawa")) return [26.2124, 127.6792];
  if (destination.includes("상하이") || destination.includes("상해") || destination.includes("shanghai")) return [31.2304, 121.4737];
  if (destination.includes("도쿄") || destination.includes("tokyo")) return [35.6812, 139.7671];
  if (destination.includes("서울") || destination.includes("seoul")) return [37.5665, 126.978];
  return [35, 135];
}

export function writeMapView(map: L.Map, tripId: string): void {
  writeMapViewToStorage(map, tripId);
  writeMapViewToHash(map, tripId);
}

function readMapViewFromHash(tripId: string): MapView | null {
  const match = window.location.hash.match(/^#map=([^,]+),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  if (decodeURIComponent(match[1]) !== tripId) return null;

  const lat = Number(match[2]);
  const lng = Number(match[3]);
  const zoom = Number(match[4]);
  if (![lat, lng, zoom].every(Number.isFinite)) return null;
  return {
    center: [lat, lng],
    zoom: Math.min(Math.max(Math.round(zoom), 2), 19)
  };
}

function readMapViewFromStorage(tripId: string): MapView | null {
  try {
    const raw = window.localStorage.getItem(mapViewStorageKey(tripId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown; zoom?: unknown };
    const lat = Number(parsed.lat);
    const lng = Number(parsed.lng);
    const zoom = Number(parsed.zoom);
    if (![lat, lng, zoom].every(Number.isFinite)) return null;
    return {
      center: [lat, lng],
      zoom: Math.min(Math.max(Math.round(zoom), 2), 19)
    };
  } catch {
    return null;
  }
}

function writeMapViewToStorage(map: L.Map, tripId: string): void {
  const center = map.getCenter();
  try {
    window.localStorage.setItem(
      mapViewStorageKey(tripId),
      JSON.stringify({
        lat: Number(center.lat.toFixed(5)),
        lng: Number(center.lng.toFixed(5)),
        zoom: map.getZoom()
      })
    );
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}

function writeMapViewToHash(map: L.Map, tripId: string): void {
  const center = map.getCenter();
  const hash = `#map=${encodeURIComponent(tripId)},${center.lat.toFixed(5)},${center.lng.toFixed(5)},${map.getZoom()}`;
  const nextUrl = `${window.location.pathname}${window.location.search}${hash}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

function mapViewStorageKey(tripId: string): string {
  return `${mapViewStoragePrefix}:${tripId}`;
}
