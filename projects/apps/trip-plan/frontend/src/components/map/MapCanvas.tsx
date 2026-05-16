import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createMapTileLayer, readMapTileMode, type MapTileMode, writeMapTileMode } from "../../lib/mapTiles";
import {
  destinationCenter,
  focusMapPoint,
  readInitialMapView,
  writeMapView
} from "../../lib/mapView";
import { itineraryUsagesAtCoordinate, itineraryUsagesForPlace } from "../../lib/mapUsage";
import {
  dedupePlaces,
  formatDateRange,
  hasCoordinates
} from "../../lib/tripDisplay";
import type { ItineraryItem, TripDay, TripState } from "../../types";
import {
  createPlacePopupElement,
  createPlanPopupElement,
  type MapPopupActions
} from "./MapPopup";

export interface MapCanvasProps {
  tripState: TripState;
  selectedDay?: TripDay;
  dayItems: ItineraryItem[];
  focusedItemId: string | null;
  focusedPlaceId: string | null;
  centerFocusedPlace: boolean;
  onFocusPlace: (placeId: string) => void;
  onShowItemDetails: (itemId: string) => void;
  onShowPlaceDetails: (placeId: string) => void;
  layoutKey: string;
}

export function MapCanvas({
  tripState,
  selectedDay,
  dayItems,
  focusedItemId,
  focusedPlaceId,
  centerFocusedPlace,
  onFocusPlace,
  onShowItemDetails,
  onShowPlaceDetails,
  layoutKey
}: MapCanvasProps) {
  const trip = tripState.trip;
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const skipNextAutoFitRef = useRef(false);
  const hasPersistedMapViewRef = useRef(false);
  const openPopupItemIdRef = useRef<string | null>(null);
  const openPopupPlaceIdRef = useRef<string | null>(null);
  const rebuildingLayersRef = useRef(false);
  const [tileMode, setTileMode] = useState<MapTileMode>(() => readMapTileMode());
  const [showCoordinateNote, setShowCoordinateNote] = useState(true);

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return;
    const restoredView = readInitialMapView(trip.id);
    skipNextAutoFitRef.current = Boolean(restoredView);
    hasPersistedMapViewRef.current = Boolean(restoredView);

    const map = L.map(elementRef.current, {
      attributionControl: true,
      zoomControl: false
    }).setView(restoredView?.center ?? destinationCenter(trip), restoredView?.zoom ?? 11);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    const initialTileLayer = createMapTileLayer(tileMode).addTo(map);
    initialTileLayer.bringToBack();
    tileLayerRef.current = initialTileLayer;
    writeMapTileMode(tileMode);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const persistMapView = () => {
      hasPersistedMapViewRef.current = true;
      writeMapView(map, trip.id);
    };
    map.on("moveend zoomend", persistMapView);

    return () => {
      map.off("moveend zoomend", persistMapView);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileLayerRef.current = null;
    };
  }, [trip.destinationLat, trip.destinationLng, trip.destinationName, trip.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current?.remove();
    const tileLayer = createMapTileLayer(tileMode).addTo(map);
    tileLayer.bringToBack();
    tileLayerRef.current = tileLayer;
    writeMapTileMode(tileMode);
  }, [tileMode]);

  useEffect(() => {
    const element = elementRef.current;
    const map = mapRef.current;
    if (!element || !map) return;

    const invalidate = () => map.invalidateSize({ animate: false });
    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(invalidate);
    });

    resizeObserver.observe(element);
    if (element.parentElement) {
      resizeObserver.observe(element.parentElement);
    }

    window.addEventListener("resize", invalidate);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    window.requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    window.setTimeout(() => map.invalidateSize({ animate: false }), 180);
  }, [layoutKey]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    rebuildingLayersRef.current = true;
    layer.clearLayers();

    const dayPoints: L.LatLngExpression[] = [];
    const allPoints: L.LatLngExpression[] = [];
    const selectedDayId = selectedDay?.id ?? "";
    const itemCoordinates = new Set(
      dayItems
        .filter(hasCoordinates)
        .map((item) => `${item.lat?.toFixed(6)},${item.lng?.toFixed(6)}`)
    );
    const popupActions: MapPopupActions = {
      onShowItemDetails: (itemId) => {
        onShowItemDetails(itemId);
      },
      onShowPlaceDetails: (placeId) => {
        onShowPlaceDetails(placeId);
      }
    };

    dedupePlaces(tripState.places).filter(hasCoordinates).forEach((place) => {
      const coordinateKey = `${place.lat?.toFixed(6)},${place.lng?.toFixed(6)}`;
      const isFocusedPlace = place.id === focusedPlaceId;
      const shouldKeepOpenPlace = place.id === openPopupPlaceIdRef.current;
      if (itemCoordinates.has(coordinateKey) && !isFocusedPlace && !shouldKeepOpenPlace) return;

      const point: L.LatLngExpression = [place.lat, place.lng];
      allPoints.push(point);
      const marker = L.circleMarker(point, {
        radius: isFocusedPlace ? 9 : 7,
        color: "#ffffff",
        weight: isFocusedPlace ? 3 : 2,
        fillColor: isFocusedPlace ? "#8b5cf6" : "#6b7280",
        fillOpacity: isFocusedPlace ? 0.95 : 0.78
      }).addTo(layer);
      const popupElement = createPlacePopupElement(place, itineraryUsagesForPlace(place, tripState, selectedDayId), {
        onShowItemDetails: popupActions.onShowItemDetails,
        onShowPlaceDetails: popupActions.onShowPlaceDetails
      });
      marker.bindPopup(popupElement);
      marker.once("remove", () => popupElement.destroy());
      marker.on("click", () => {
        openPopupItemIdRef.current = null;
        openPopupPlaceIdRef.current = place.id;
        onFocusPlace(place.id);
      });
      marker.on("popupclose", () => {
        if (!rebuildingLayersRef.current && openPopupPlaceIdRef.current === place.id) {
          openPopupPlaceIdRef.current = null;
        }
      });
      if (isFocusedPlace) {
        openPopupPlaceIdRef.current = place.id;
        marker.openPopup();
        if (centerFocusedPlace) {
          focusMapPoint(map, point, Math.max(map.getZoom(), 14));
        }
      } else if (shouldKeepOpenPlace) {
        marker.openPopup();
      }
    });

    dayItems.filter(hasCoordinates).forEach((item, index) => {
      const point: L.LatLngExpression = [item.lat, item.lng];
      dayPoints.push(point);
      allPoints.push(point);

      const marker = L.marker(point, {
        icon: L.divIcon({
          className: item.id === focusedItemId ? "route-marker-icon focused" : "route-marker-icon",
          html: `<span>${index + 1}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        }),
        zIndexOffset: item.id === focusedItemId ? 1000 : index
      }).addTo(layer);
      const popupElement = createPlanPopupElement(item, itineraryUsagesAtCoordinate(tripState, item.lat, item.lng, selectedDayId), {
        onShowItemDetails: popupActions.onShowItemDetails,
        onShowPlaceDetails: popupActions.onShowPlaceDetails
      });
      marker.bindPopup(popupElement);
      marker.once("remove", () => popupElement.destroy());
      if (item.id === focusedItemId) {
        openPopupItemIdRef.current = item.id;
        openPopupPlaceIdRef.current = null;
        marker.openPopup();
        focusMapPoint(map, point, Math.max(map.getZoom(), 14));
      } else if (item.id === openPopupItemIdRef.current) {
        marker.openPopup();
      }
    });

    if (dayPoints.length > 1) {
      L.polyline(dayPoints, {
        color: "#1fc1b6",
        weight: 4,
        opacity: 0.82,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(layer);
    }

    if (!focusedItemId) {
      if (skipNextAutoFitRef.current || hasPersistedMapViewRef.current) {
        skipNextAutoFitRef.current = false;
      } else if (dayPoints.length > 0) {
        map.fitBounds(L.latLngBounds(dayPoints), { padding: [48, 48], maxZoom: 14 });
      } else if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [48, 48], maxZoom: 13 });
      } else {
        map.setView(destinationCenter(tripState.trip), 11);
      }
    }

    window.setTimeout(() => map.invalidateSize(), 0);
    rebuildingLayersRef.current = false;
  }, [centerFocusedPlace, dayItems, focusedItemId, focusedPlaceId, selectedDay?.id, tripState]);

  return (
    <div className="map-canvas">
      <div ref={elementRef} className="leaflet-map" />
      <div className="map-top-card">
        <div>
          <strong>{tripState.trip.title}</strong>
          <span>{[tripState.trip.destinationName, formatDateRange(tripState.trip)].filter(Boolean).join(" · ")}</span>
        </div>
      </div>
      <div className="map-legend">
        <span>
          <i className="legend-line" />
          선택 날짜 동선
        </span>
        <span>
          <i className="legend-dot plan" />
          일정
        </span>
        <span>
          <i className="legend-dot place" />
          조사 장소
        </span>
      </div>
      {showCoordinateNote && dayItems.filter(hasCoordinates).length === 0 ? (
        <div className="map-empty-note">
          <Clock3 size={15} />
          <span>좌표가 있는 일정은 선택한 날짜 순서대로 지도에 표시됩니다.</span>
          <button type="button" aria-label="좌표 안내 닫기" onClick={() => setShowCoordinateNote(false)}>
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
