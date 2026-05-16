import { Bot, ChevronLeft, PanelLeftClose } from "lucide-react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";

import { mobileDayLabel } from "../../lib/tripDisplay";
import type {
  ItineraryItem,
  Place,
  TripFormState,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../../types";
import { TripMetaForm } from "./TripMetaForm";
import { PlacesSection } from "./PlacesSection";
import { ScheduleSection } from "./ScheduleSection";

interface PlannerSidebarProps {
  tripState: TripState;
  selectedDayId: string;
  dayItems: ItineraryItem[];
  itemCountByDay: Map<string, number>;
  routeNumbers: Map<string, number>;
  visiblePlaces: Place[];
  metaForm: TripFormState;
  isMetaSaving: boolean;
  itemForm: UpsertItineraryItemRequest;
  editingItemId: string | null;
  isAddingItem: boolean;
  expandedItems: Set<string>;
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  isAddingPlace: boolean;
  expandedPlaces: Set<string>;
  scheduleCollapsed: boolean;
  placesCollapsed: boolean;
  detailHighlight: { type: "item" | "place"; id: string } | null;
  onBack: () => void;
  onOpenMobileChatList: () => void;
  onTogglePlanner: () => void;
  onMetaFormChange: (form: TripFormState) => void;
  onSubmitMeta: (event: FormEvent) => void;
  onDeleteTrip: () => void;
  onSelectDay: (dayId: string) => void;
  onClearDetailHighlight: () => void;
  onToggleSchedule: () => void;
  onTogglePlaces: () => void;
  onStartPlacesResize: (event: ReactPointerEvent) => void;
  onStartAddItem: () => void;
  onItemFormChange: (form: UpsertItineraryItemRequest) => void;
  onSubmitItem: (event: FormEvent) => void;
  onCancelItem: () => void;
  onFocusItemOnMap: (itemId: string) => void;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleExpandedItem: (itemId: string) => void;
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

export function PlannerSidebar(props: PlannerSidebarProps) {
  return (
    <aside className="planner-sidebar">
      <div className="panel-header">
        <button className="text-back-button" type="button" onClick={props.onBack}>
          <ChevronLeft size={16} />
          여행 목록
        </button>
        <div className="panel-header-actions">
          <button className="secondary-button mobile-chat-entry" type="button" onClick={props.onOpenMobileChatList}>
            <Bot size={15} />
            대화
          </button>
          <button className="icon-button" type="button" aria-label="왼쪽 패널 접기" onClick={props.onTogglePlanner}>
            <PanelLeftClose size={17} />
          </button>
        </div>
      </div>

      <TripMetaForm
        form={props.metaForm}
        saving={props.isMetaSaving}
        onChange={props.onMetaFormChange}
        onSubmit={props.onSubmitMeta}
        onDelete={props.onDeleteTrip}
      />

      <nav className="mobile-day-picker" aria-label="날짜 선택">
        {props.tripState.days.map((day) => (
          <button
            className={day.id === props.selectedDayId ? "active" : ""}
            key={day.id}
            type="button"
            onClick={() => props.onSelectDay(day.id)}
          >
            <strong>Day {day.dayNumber}</strong>
            <span>{mobileDayLabel(day)}</span>
            <em>{props.itemCountByDay.get(day.id) ?? 0}개</em>
          </button>
        ))}
      </nav>

      <div
        className="planner-sections"
        onScroll={props.onClearDetailHighlight}
        onTouchStart={props.onClearDetailHighlight}
        onWheel={props.onClearDetailHighlight}
      >
        <ScheduleSection
          collapsed={props.scheduleCollapsed}
          days={props.tripState.days}
          selectedDayId={props.selectedDayId}
          dayItems={props.dayItems}
          itemForm={props.itemForm}
          editingItemId={props.editingItemId}
          isAddingItem={props.isAddingItem}
          expandedItems={props.expandedItems}
          routeNumbers={props.routeNumbers}
          detailHighlight={props.detailHighlight}
          onToggle={props.onToggleSchedule}
          onSelectDay={props.onSelectDay}
          onStartAddItem={props.onStartAddItem}
          onItemFormChange={props.onItemFormChange}
          onSubmitItem={props.onSubmitItem}
          onCancelItem={props.onCancelItem}
          onFocusItemOnMap={props.onFocusItemOnMap}
          onEditItem={props.onEditItem}
          onDeleteItem={props.onDeleteItem}
          onToggleExpandedItem={props.onToggleExpandedItem}
        />

        {!props.scheduleCollapsed && !props.placesCollapsed ? (
          <div
            className="sidebar-splitter"
            role="separator"
            aria-label="일정과 조사 장소 높이 조절"
            aria-orientation="horizontal"
            onPointerDown={props.onStartPlacesResize}
          />
        ) : null}

        <PlacesSection
          collapsed={props.placesCollapsed}
          visiblePlaces={props.visiblePlaces}
          placeForm={props.placeForm}
          editingPlaceId={props.editingPlaceId}
          isAddingPlace={props.isAddingPlace}
          expandedPlaces={props.expandedPlaces}
          detailHighlight={props.detailHighlight}
          onToggle={props.onTogglePlaces}
          onStartAddPlace={props.onStartAddPlace}
          onPlaceFormChange={props.onPlaceFormChange}
          onSubmitPlace={props.onSubmitPlace}
          onCancelPlace={props.onCancelPlace}
          onFocusPlaceOnMap={props.onFocusPlaceOnMap}
          onUsePlace={props.onUsePlace}
          onEditPlace={props.onEditPlace}
          onDeletePlace={props.onDeletePlace}
          onToggleExpandedPlace={props.onToggleExpandedPlace}
        />
      </div>
    </aside>
  );
}
