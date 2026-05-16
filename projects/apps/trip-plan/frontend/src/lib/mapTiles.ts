import L from "leaflet";

export type MapTileMode = "english" | "local";

const mapTileModeStorageKey = "trip-planner-map-tile-mode-v2";

export function readMapTileMode(): MapTileMode {
  const stored = window.localStorage.getItem(mapTileModeStorageKey);
  return stored === "local" || stored === "english" ? stored : "local";
}

export function writeMapTileMode(mode: MapTileMode): void {
  window.localStorage.setItem(mapTileModeStorageKey, mode);
}

export function createMapTileLayer(mode: MapTileMode): L.TileLayer {
  if (mode === "local") {
    return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    });
  }

  return L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  });
}
