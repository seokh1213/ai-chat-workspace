import { ChevronDown, ChevronRight, ChevronUp, Edit3, MapPinned, Navigation, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import {
  hasCoordinates,
  hasVisuallyLongPlaceLine,
  localizedPlaceName,
  placeDetailCountLabel,
  placeDetailText,
  previewPlaceDetail
} from "../../lib/tripDisplay";
import type { Place } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { MobilePlaceForm } from "./MobilePlaceForm";
import type { PlacesSectionProps } from "./PlacesSection";

export function MobilePlacesSection(props: PlacesSectionProps) {
  const onFocusPlaceOnMap = useStableEvent(props.onFocusPlaceOnMap);
  const onUsePlace = useStableEvent(props.onUsePlace);
  const onEditPlace = useStableEvent(props.onEditPlace);
  const onDeletePlace = useStableEvent(props.onDeletePlace);
  const onToggleExpandedPlace = useStableEvent(props.onToggleExpandedPlace);

  return (
    <section className="border-b border-[var(--line)] bg-[var(--surface)]">
      <button
        className="flex min-h-12 w-full items-center justify-between border-0 bg-[var(--surface)] px-3 text-left text-sm font-extrabold text-[var(--text)]"
        type="button"
        aria-expanded={!props.collapsed}
        onClick={props.onToggle}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <MapPinned className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" />
          <span>조사 장소</span>
          <em className="rounded-full border border-[var(--line)] px-2 py-1 text-[11px] not-italic text-[var(--secondary)]">
            {props.visiblePlaces.length}곳
          </em>
        </span>
        <ChevronRight className={props.collapsed ? "h-4 w-4 text-[var(--teal)]" : "h-4 w-4 rotate-90 text-[var(--teal)]"} aria-hidden="true" />
      </button>
      {props.collapsed ? null : (
        <div className="grid gap-3 px-3 pb-4">
          {!props.editingPlaceId && !props.isAddingPlace ? (
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--secondary)]"
              type="button"
              onClick={props.onStartAddPlace}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              장소 추가
            </button>
          ) : null}
          {props.visiblePlaces.length === 0 ? (
            <div className="grid place-items-start gap-2 rounded-md border border-dashed border-[var(--strong-line)] bg-[var(--surface-soft)] p-4 text-left">
              <strong className="text-sm">후보 장소가 없습니다</strong>
              <span className="text-xs leading-relaxed text-[var(--secondary)]">장소를 추가하면 일정 노드로 바로 가져올 수 있습니다.</span>
            </div>
          ) : null}
          {props.isAddingPlace ? (
            <MobilePlaceForm
              form={props.placeForm}
              mode="create"
              onChange={props.onPlaceFormChange}
              onSubmit={props.onSubmitPlace}
              onCancel={props.onCancelPlace}
            />
          ) : null}
          {props.visiblePlaces.map((place) => (
            <MobilePlaceCard
              key={place.id}
              place={place}
              editing={props.editingPlaceId === place.id}
              expanded={props.expandedPlaces.has(place.id) || props.editingPlaceId === place.id}
              highlighted={props.detailHighlight?.type === "place" && props.detailHighlight.id === place.id}
              placeForm={props.placeForm}
              onPlaceFormChange={props.onPlaceFormChange}
              onSubmitPlace={props.onSubmitPlace}
              onCancelPlace={props.onCancelPlace}
              onFocusPlaceOnMap={onFocusPlaceOnMap}
              onUsePlace={onUsePlace}
              onEditPlace={onEditPlace}
              onDeletePlace={onDeletePlace}
              onToggleExpandedPlace={onToggleExpandedPlace}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface MobilePlaceCardProps {
  place: Place;
  editing: boolean;
  expanded: boolean;
  highlighted: boolean;
  placeForm: PlacesSectionProps["placeForm"];
  onPlaceFormChange: PlacesSectionProps["onPlaceFormChange"];
  onSubmitPlace: PlacesSectionProps["onSubmitPlace"];
  onCancelPlace: PlacesSectionProps["onCancelPlace"];
  onFocusPlaceOnMap: (place: Place) => void;
  onUsePlace: (place: Place) => void;
  onEditPlace: (place: Place) => void;
  onDeletePlace: (place: Place) => void;
  onToggleExpandedPlace: (placeId: string) => void;
}

const MobilePlaceCard = memo(function MobilePlaceCard(props: MobilePlaceCardProps) {
  const localName = useMemo(() => localizedPlaceName(props.place), [props.place]);
  const detailState = useMemo(() => {
    const detailText = placeDetailText(props.place);
    const previewText = previewPlaceDetail(detailText);
    const expandable = previewText !== detailText || hasVisuallyLongPlaceLine(detailText);
    return {
      detailText,
      expandable,
      previewText,
      renderedText: expandable && !props.expanded ? previewText : detailText || "설명 없음"
    };
  }, [props.expanded, props.place]);

  if (props.editing) {
    return (
      <MobilePlaceForm
        form={props.placeForm}
        mode="edit"
        onChange={props.onPlaceFormChange}
        onSubmit={props.onSubmitPlace}
        onCancel={props.onCancelPlace}
      />
    );
  }

  return (
    <article
      className={[
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border bg-[var(--surface)] p-3",
        props.highlighted ? "border-dashed border-[rgba(107,114,128,0.64)]" : "border-[var(--line)]"
      ].join(" ")}
      data-detail-place-id={props.place.id}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--secondary)]" aria-hidden="true">
        <MapPinned className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="grid min-w-0 gap-1">
          <strong className="min-w-0 text-[16px] font-extrabold leading-snug [overflow-wrap:anywhere]">{localName}</strong>
          {localName !== props.place.name ? <em className="text-xs not-italic text-[var(--muted)]">{props.place.name}</em> : null}
        </div>
        <MarkdownContent
          content={detailState.renderedText}
          className="mt-1 text-[13px] leading-relaxed text-[var(--secondary)]"
        />
        {detailState.expandable ? (
          <button
            className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-extrabold text-[var(--secondary)]"
            type="button"
            aria-expanded={props.expanded}
            onClick={() => props.onToggleExpandedPlace(props.place.id)}
          >
            <span>{props.expanded ? "접기" : "전체 보기"}</span>
            <em className="text-[var(--muted)] not-italic">{props.expanded ? "요약" : placeDetailCountLabel(detailState.detailText)}</em>
            {props.expanded ? <ChevronUp className="h-3.5 w-3.5 text-[var(--teal)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--teal)]" />}
          </button>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <MobileAction disabled={!hasCoordinates(props.place)} onClick={() => props.onFocusPlaceOnMap(props.place)} icon={<Navigation className="h-3.5 w-3.5" aria-hidden="true" />}>
            {hasCoordinates(props.place) ? "지도" : "좌표 없음"}
          </MobileAction>
          <MobileAction onClick={() => props.onUsePlace(props.place)} icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}>일정</MobileAction>
          <MobileAction onClick={() => props.onEditPlace(props.place)} icon={<Edit3 className="h-3.5 w-3.5" aria-hidden="true" />}>수정</MobileAction>
          <MobileAction danger onClick={() => props.onDeletePlace(props.place)} icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}>삭제</MobileAction>
        </div>
      </div>
    </article>
  );
}, areMobilePlaceCardsEqual);

function areMobilePlaceCardsEqual(previous: MobilePlaceCardProps, next: MobilePlaceCardProps) {
  return previous.place.id === next.place.id
    && previous.place.name === next.place.name
    && previous.place.category === next.place.category
    && previous.place.rating === next.place.rating
    && previous.place.reviews === next.place.reviews
    && previous.place.note === next.place.note
    && previous.place.address === next.place.address
    && previous.place.source === next.place.source
    && previous.place.sourceUrl === next.place.sourceUrl
    && previous.place.imageUrl === next.place.imageUrl
    && previous.place.lat === next.place.lat
    && previous.place.lng === next.place.lng
    && previous.place.status === next.place.status
    && previous.editing === next.editing
    && previous.expanded === next.expanded
    && previous.highlighted === next.highlighted
    && previous.placeForm === next.placeForm
    && previous.onPlaceFormChange === next.onPlaceFormChange
    && previous.onSubmitPlace === next.onSubmitPlace
    && previous.onCancelPlace === next.onCancelPlace
    && previous.onFocusPlaceOnMap === next.onFocusPlaceOnMap
    && previous.onUsePlace === next.onUsePlace
    && previous.onEditPlace === next.onEditPlace
    && previous.onDeletePlace === next.onDeletePlace
    && previous.onToggleExpandedPlace === next.onToggleExpandedPlace;
}

function MobileAction(props: { children: string; danger?: boolean; disabled?: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className={props.danger
        ? "inline-flex min-h-8 items-center gap-1 border-0 bg-transparent text-xs font-bold text-[var(--secondary)]"
        : "inline-flex min-h-8 items-center gap-1 border-0 bg-transparent text-xs font-bold text-[var(--secondary)] enabled:hover:text-[var(--teal)]"}
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.icon}
      {props.children}
    </button>
  );
}

function useStableEvent<Args extends unknown[], Return>(callback: (...args: Args) => Return) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
