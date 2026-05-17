import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  type MapPopupElement,
  type MapPopupActions
} from "./MapPopup";

type PlaceMarkerEntry = {
  marker: L.CircleMarker;
  point: L.LatLngExpression;
  coordinateKey: string;
};

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

function coordinateKey(lat: number | null | undefined, lng: number | null | undefined) {
  return `${lat?.toFixed(6)},${lng?.toFixed(6)}`;
}

function bindLazyPopup(marker: L.Layer, createElement: () => MapPopupElement) {
  let popupElement: MapPopupElement | null = null;
  marker.bindPopup(() => {
    popupElement?.destroy();
    popupElement = createElement();
    return popupElement;
  });
  marker.on("popupclose", () => {
    popupElement?.destroy();
    popupElement = null;
  });
  marker.on("remove", () => {
    popupElement?.destroy();
    popupElement = null;
  });
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
  const placeLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const placeMarkersRef = useRef<Map<string, PlaceMarkerEntry>>(new Map());
  const skipNextAutoFitRef = useRef(false);
  const hasPersistedMapViewRef = useRef(false);
  const suppressPersistUntilRef = useRef(0);
  const openPopupItemIdRef = useRef<string | null>(null);
  const openPopupPlaceIdRef = useRef<string | null>(null);
  const rebuildingLayersRef = useRef(false);
  const latestTripStateRef = useRef(tripState);
  const latestDayItemsRef = useRef(dayItems);
  const latestSelectedDayIdRef = useRef(selectedDay?.id ?? "");
  const latestOnFocusPlaceRef = useRef(onFocusPlace);
  const popupActionsRef = useRef<MapPopupActions>({
    onShowItemDetails,
    onShowPlaceDetails
  });
  const [tileMode, setTileMode] = useState<MapTileMode>(() => readMapTileMode());

  useEffect(() => {
    latestTripStateRef.current = tripState;
    latestDayItemsRef.current = dayItems;
    latestSelectedDayIdRef.current = selectedDay?.id ?? "";
    latestOnFocusPlaceRef.current = onFocusPlace;
    popupActionsRef.current = {
      onShowItemDetails,
      onShowPlaceDetails
    };
  }, [dayItems, onFocusPlace, onShowItemDetails, onShowPlaceDetails, selectedDay?.id, tripState]);

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

    placeLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const persistMapView = () => {
      if (Date.now() < suppressPersistUntilRef.current) return;
      hasPersistedMapViewRef.current = true;
      writeMapView(map, trip.id);
    };
    map.on("moveend zoomend", persistMapView);

    return () => {
      map.off("moveend zoomend", persistMapView);
      map.remove();
      mapRef.current = null;
      placeLayerRef.current = null;
      routeLayerRef.current = null;
      tileLayerRef.current = null;
      placeMarkersRef.current.clear();
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
    const layer = placeLayerRef.current;
    if (!map || !layer) return;

    rebuildingLayersRef.current = true;
    layer.clearLayers();
    placeMarkersRef.current.clear();

    dedupePlaces(tripState.places).filter(hasCoordinates).forEach((place) => {
      const point: L.LatLngExpression = [place.lat, place.lng];
      const marker = L.circleMarker(point, {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#6b7280",
        fillOpacity: 0.78
      });
      bindLazyPopup(marker, () =>
        createPlacePopupElement(
          place,
          itineraryUsagesForPlace(place, latestTripStateRef.current, latestSelectedDayIdRef.current),
          popupActionsRef.current
        )
      );
      marker.on("click", () => {
        openPopupItemIdRef.current = null;
        openPopupPlaceIdRef.current = place.id;
        latestOnFocusPlaceRef.current(place.id);
      });
      marker.on("popupclose", () => {
        if (!rebuildingLayersRef.current && openPopupPlaceIdRef.current === place.id) {
          openPopupPlaceIdRef.current = null;
        }
      });
      placeMarkersRef.current.set(place.id, {
        marker,
        point,
        coordinateKey: coordinateKey(place.lat, place.lng)
      });
    });

    const itemCoordinates = new Set(
      latestDayItemsRef.current.filter(hasCoordinates).map((item) => coordinateKey(item.lat, item.lng))
    );
    placeMarkersRef.current.forEach(({ marker, coordinateKey: placeCoordinateKey }, placeId) => {
      const shouldKeepOpenPlace = placeId === openPopupPlaceIdRef.current;
      const shouldShow = !itemCoordinates.has(placeCoordinateKey) || placeId === focusedPlaceId || shouldKeepOpenPlace;
      if (shouldShow) {
        marker.addTo(layer);
      }
      if (shouldShow && (placeId === focusedPlaceId || shouldKeepOpenPlace)) {
        marker.openPopup();
      }
    });

    rebuildingLayersRef.current = false;
  }, [tripState.places]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    placeMarkersRef.current.forEach(({ marker, point }, placeId) => {
      const isFocusedPlace = placeId === focusedPlaceId;
      marker.setRadius(isFocusedPlace ? 9 : 7);
      marker.setStyle({
        weight: isFocusedPlace ? 3 : 2,
        fillColor: isFocusedPlace ? "#8b5cf6" : "#6b7280",
        fillOpacity: isFocusedPlace ? 0.95 : 0.78
      });
      if (isFocusedPlace) {
        openPopupPlaceIdRef.current = placeId;
        marker.openPopup();
        if (centerFocusedPlace) {
          focusMapPoint(map, point, Math.max(map.getZoom(), 14));
        }
      }
    });
  }, [centerFocusedPlace, focusedPlaceId]);

  useEffect(() => {
    const layer = placeLayerRef.current;
    if (!layer) return;

    const itemCoordinates = new Set(dayItems.filter(hasCoordinates).map((item) => coordinateKey(item.lat, item.lng)));
    placeMarkersRef.current.forEach(({ marker, coordinateKey: placeCoordinateKey }, placeId) => {
      const shouldKeepOpenPlace = placeId === openPopupPlaceIdRef.current;
      const shouldShow = !itemCoordinates.has(placeCoordinateKey) || placeId === focusedPlaceId || shouldKeepOpenPlace;
      const isShown = layer.hasLayer(marker);

      if (shouldShow && !isShown) {
        marker.addTo(layer);
      } else if (!shouldShow && isShown) {
        layer.removeLayer(marker);
      }

      if (shouldShow && (placeId === focusedPlaceId || shouldKeepOpenPlace)) {
        marker.openPopup();
      }
    });
  }, [dayItems, focusedPlaceId]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer) return;

    rebuildingLayersRef.current = true;
    layer.clearLayers();

    const dayPoints: L.LatLngExpression[] = [];
    const allPoints = dedupePlaces(tripState.places)
      .filter(hasCoordinates)
      .map((place) => [place.lat, place.lng] as L.LatLngExpression);

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
      bindLazyPopup(marker, () =>
        createPlanPopupElement(
          item,
          itineraryUsagesAtCoordinate(
            latestTripStateRef.current,
            item.lat,
            item.lng,
            latestSelectedDayIdRef.current
          ),
          popupActionsRef.current
        )
      );
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
        suppressPersistUntilRef.current = Date.now() + 500;
        map.fitBounds(L.latLngBounds(dayPoints), { padding: [48, 48], maxZoom: 14, animate: false });
      } else if (allPoints.length > 0) {
        suppressPersistUntilRef.current = Date.now() + 500;
        map.fitBounds(L.latLngBounds(allPoints), { padding: [48, 48], maxZoom: 13, animate: false });
      } else {
        suppressPersistUntilRef.current = Date.now() + 500;
        map.setView(destinationCenter(tripState.trip), 11, { animate: false });
      }
    }

    rebuildingLayersRef.current = false;
  }, [dayItems, focusedItemId, tripState.places, tripState.trip]);

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
    </div>
  );
}
