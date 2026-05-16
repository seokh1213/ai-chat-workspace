import { ChevronDown, ChevronRight, ChevronUp, Edit3, MapPinned, Navigation, Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import {
  hasCoordinates,
  hasVisuallyLongPlaceLine,
  localizedPlaceName,
  placeDetailCountLabel,
  placeDetailText,
  previewPlaceDetail
} from "../../lib/tripDisplay";
import type { Place, UpsertPlaceRequest } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { PlaceForm } from "./PlaceForm";

interface PlacesSectionProps {
  collapsed: boolean;
  visiblePlaces: Place[];
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  isAddingPlace: boolean;
  expandedPlaces: Set<string>;
  detailHighlight: { type: "item" | "place"; id: string } | null;
  onToggle: () => void;
  onStartAddPlace: () => void;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitPlace: (event: FormEvent) => void;
  onCancelPlace: () => void;
  onFocusPlaceOnMap: (place: Place) => void;
  onUsePlace: (place: Place) => void;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (place: Place) => void;
  onToggleExpandedPlace: (placeId: string) => void;
}

export function PlacesSection(props: PlacesSectionProps) {
  return (
    <section className={props.collapsed ? "sidebar-section places-section collapsed" : "sidebar-section places-section"}>
      <button
        className="section-toggle"
        type="button"
        aria-expanded={!props.collapsed}
        onClick={props.onToggle}
      >
        <span className="section-title">
          <MapPinned size={16} />
          <span>조사 장소</span>
          <em>{props.visiblePlaces.length}곳</em>
        </span>
        <ChevronRight size={16} />
      </button>
      {!props.collapsed ? (
        <div className="section-body">
          {props.visiblePlaces.length === 0 ? (
            <div className="empty-state compact">
              <strong>후보 장소가 없습니다</strong>
              <span>장소를 추가하면 일정 노드로 바로 가져올 수 있습니다.</span>
            </div>
          ) : null}
          {!props.editingPlaceId && !props.isAddingPlace ? (
            <button className="section-add-button" type="button" onClick={props.onStartAddPlace}>
              <Plus size={15} />
              장소 추가
            </button>
          ) : null}
          {props.isAddingPlace ? (
            <PlaceForm
              form={props.placeForm}
              mode="create"
              onChange={props.onPlaceFormChange}
              onSubmit={props.onSubmitPlace}
              onCancel={props.onCancelPlace}
            />
          ) : null}
          {props.visiblePlaces.map((place) => {
            const localName = localizedPlaceName(place);
            const detailText = placeDetailText(place);
            const expanded = props.expandedPlaces.has(place.id) || props.editingPlaceId === place.id;
            const previewText = previewPlaceDetail(detailText);
            const expandable = previewText !== detailText || hasVisuallyLongPlaceLine(detailText);
            return (
              <article
                className={[
                  "place-card",
                  expanded ? "expanded" : "",
                  props.detailHighlight?.type === "place" && props.detailHighlight.id === place.id ? "detail-highlight" : "",
                  props.editingPlaceId === place.id ? "editing" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-detail-place-id={place.id}
                key={place.id}
              >
                {props.editingPlaceId === place.id ? (
                  <PlaceForm
                    form={props.placeForm}
                    mode="edit"
                    onChange={props.onPlaceFormChange}
                    onSubmit={props.onSubmitPlace}
                    onCancel={props.onCancelPlace}
                  />
                ) : (
                  <>
                    <div className="node-sequence place-marker" aria-hidden="true">
                      <MapPinned size={14} />
                    </div>
                    <div className="node-content">
                      <div className="place-card-main">
                        <strong>{localName}</strong>
                        {localName !== place.name ? <em>{place.name}</em> : null}
                        <div className={expanded ? "place-detail expanded" : "place-detail"}>
                          <MarkdownContent
                            content={expandable && !expanded ? previewText : detailText || "설명 없음"}
                            className="node-markdown"
                          />
                        </div>
                        {expandable ? (
                          <button
                            className="memo-toggle place-toggle"
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => props.onToggleExpandedPlace(place.id)}
                          >
                            <span>{expanded ? "접기" : "전체 보기"}</span>
                            <em>{expanded ? "요약" : placeDetailCountLabel(detailText)}</em>
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        ) : null}
                      </div>
                      <div className="place-actions">
                        <button type="button" disabled={!hasCoordinates(place)} onClick={() => props.onFocusPlaceOnMap(place)}>
                          <Navigation size={14} />
                          {hasCoordinates(place) ? "지도" : "좌표 없음"}
                        </button>
                        <button type="button" onClick={() => props.onUsePlace(place)}>
                          <Plus size={14} />
                          일정
                        </button>
                        <button type="button" onClick={() => props.onEditPlace(place)}>
                          <Edit3 size={14} />
                          수정
                        </button>
                        <button className="danger-action" type="button" onClick={() => props.onDeletePlace(place)}>
                          <Trash2 size={14} />
                          삭제
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
