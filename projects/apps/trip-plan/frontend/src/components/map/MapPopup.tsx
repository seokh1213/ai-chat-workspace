import { createRoot, type Root } from "react-dom/client";

import type { ItineraryItem, Place } from "../../types";
import {
  categoryLabel,
  itineraryMemoText,
  localizedPlaceName,
  normalizePlaceKey,
  placeDetailText,
  placeSummary
} from "../../lib/tripDisplay";
import type { ItineraryMapUsage } from "../../lib/mapUsage";
import { MarkdownContent } from "../common/MarkdownContent";

export interface MapPopupActions {
  onShowItemDetails: (itemId: string) => void;
  onShowPlaceDetails: (placeId: string) => void;
}

export type MapPopupElement = HTMLElement & {
  destroy: () => void;
};

type MapPopupRow = {
  title: string;
  meta: string;
  detail: string;
  hideHeader?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
};

interface MapPopupMarkdownProps {
  content: string;
}

function MapPopupMarkdown({ content }: MapPopupMarkdownProps) {
  return <MarkdownContent content={content} className="map-popup-markdown" />;
}

export function createPlacePopupElement(place: Place, usages: ItineraryMapUsage[], actions: MapPopupActions): MapPopupElement {
  const rows: MapPopupRow[] = [
    {
      title: localizedPlaceName(place),
      meta: placeSummary(place) || "조사 장소",
      detail: placeDetailText(place) || placeSummary(place) || "설명 없음",
      hideHeader: true,
      action: {
        label: "상세보기",
        onClick: () => actions.onShowPlaceDetails(place.id)
      }
    },
    ...usages.map((usage) => usageToPopupRow(usage, actions))
  ];
  return richMapPopupElement(`📍 ${localizedPlaceName(place)}`, rows);
}

export function createPlanPopupElement(
  item: ItineraryItem,
  usages: ItineraryMapUsage[],
  actions: MapPopupActions
): MapPopupElement {
  const rows = usages.length
    ? usages.map((usage) => usageToPopupRow(usage, actions))
    : [usageToPopupRow({ item, day: null, sequence: null, selected: true }, actions)];
  const sameTitle = rows.every((row) => normalizePlaceKey(row.title) === normalizePlaceKey(item.title));
  return richMapPopupElement(`📅 ${sameTitle ? item.title : `${rows.length}개 일정`}`, rows);
}

function usageToPopupRow(usage: ItineraryMapUsage, actions: MapPopupActions): MapPopupRow {
  const item = usage.item;
  const dayLabel = usage.day ? `Day ${usage.day.dayNumber}` : "일정";
  return {
    title: item.title,
    meta: [dayLabel, item.timeText, categoryLabel(item.category)].filter(Boolean).join(" · "),
    detail: itineraryMemoText(item) || item.category || "설명 없음",
    action: {
      label: "상세보기",
      onClick: () => actions.onShowItemDetails(item.id)
    }
  };
}

function richMapPopupElement(title: string, rows: MapPopupRow[]): MapPopupElement {
  const element = document.createElement("div") as unknown as MapPopupElement;
  const roots: Root[] = [];
  const cleanups: Array<() => void> = [];
  let destroyed = false;

  element.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cleanups.forEach((cleanup) => cleanup());
    roots.forEach((root) => root.unmount());
  };
  element.className = "map-popup rich";

  const heading = document.createElement("div");
  heading.className = "map-popup-title";
  heading.textContent = title;
  element.appendChild(heading);

  const list = document.createElement("div");
  list.className = "map-popup-list";
  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "map-popup-row";

    const body = document.createElement("div");
    const rowTitle = document.createElement("strong");
    rowTitle.textContent = row.title;
    const meta = document.createElement("span");
    meta.textContent = row.meta;
    const detail = document.createElement("div");
    detail.className = "map-popup-detail";
    const markdownRoot = createRoot(detail);
    roots.push(markdownRoot);
    markdownRoot.render(<MapPopupMarkdown content={row.detail || "설명 없음"} />);
    if (row.hideHeader) {
      body.append(detail);
    } else {
      body.append(rowTitle, meta, detail);
    }
    if (row.action) {
      const actionButton = document.createElement("button");
      const onClick = row.action.onClick;
      actionButton.className = "map-popup-action";
      actionButton.type = "button";
      actionButton.textContent = row.action.label;
      actionButton.addEventListener("click", onClick);
      cleanups.push(() => actionButton.removeEventListener("click", onClick));
      body.appendChild(actionButton);
    }
    rowElement.append(body);
    list.appendChild(rowElement);
  });
  element.appendChild(list);
  return element;
}
