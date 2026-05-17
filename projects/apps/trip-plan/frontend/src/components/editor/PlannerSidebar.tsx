import { CalendarDays, ChevronLeft, Info, MapPin, PanelLeftClose } from "lucide-react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useState } from "react";

import type {
  ItineraryItem,
  Place,
  TripFormState,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../../types";
import { ThemeToggle } from "../common/ThemeToggle";
import { TripMetaForm } from "./TripMetaForm";
import { PlacesSection } from "./PlacesSection";
import { ScheduleSection } from "./ScheduleSection";

interface PlannerSidebarProps {
  tripState: TripState;
  selectedDayId: string;
  placesHeight: number;
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
  onTogglePlanner: () => void;
  onMetaFormChange: (form: TripFormState) => void;
  onSubmitMeta: (event: FormEvent) => void;
  onDeleteTrip: () => void;
  onSelectDay: (dayId: string) => void;
  onClearDetailHighlight: () => void;
  onToggleSchedule: () => void;
  onTogglePlaces: () => void;
  onStartPlacesResize: (event: ReactPointerEvent) => void;
  onResizePlacesByKey: (event: ReactKeyboardEvent) => void;
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
  const [metaOpen, setMetaOpen] = useState(false);
  const destinationText = props.metaForm.destinationName || props.tripState.trip.destinationName || "목적지 미정";
  const startDate = props.metaForm.startDate || props.tripState.trip.startDate;
  const endDate = props.metaForm.endDate || props.tripState.trip.endDate;
  const dateText = [startDate, endDate].filter(Boolean).join(" - ") || "기간 미정";

  return (
    <aside className="planner-sidebar">
      <div className="panel-header">
        <button className="icon-button header-icon-button workspace-back-button" type="button" aria-label="여행 목록으로 돌아가기" onClick={props.onBack}>
          <ChevronLeft size={16} />
        </button>
        <div className="planner-header-title">
          <strong>{props.metaForm.title || props.tripState.trip.title || "여행 이름 미정"}</strong>
          <div className="planner-header-meta">
            <span>
              <MapPin size={12} />
              {destinationText}
            </span>
            <em>
              <CalendarDays size={12} />
              {dateText}
            </em>
          </div>
        </div>
        <div className="panel-header-actions">
          <ThemeToggle />
          <button
            className={metaOpen ? "icon-button header-icon-button active" : "icon-button header-icon-button"}
            type="button"
            aria-label="여행 정보"
            aria-pressed={metaOpen}
            onClick={() => setMetaOpen((value) => !value)}
          >
            <Info size={16} />
          </button>
          <button className="icon-button header-icon-button desktop-panel-toggle" type="button" aria-label="왼쪽 패널 접기" onClick={props.onTogglePlanner}>
            <PanelLeftClose size={17} />
          </button>
        </div>
      </div>

      <TripMetaForm
        form={props.metaForm}
        open={metaOpen}
        saving={props.isMetaSaving}
        onChange={props.onMetaFormChange}
        onSubmit={props.onSubmitMeta}
        onDelete={props.onDeleteTrip}
      />

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
            aria-valuemin={190}
            aria-valuemax={520}
            aria-valuenow={props.placesHeight}
            tabIndex={0}
            onPointerDown={props.onStartPlacesResize}
            onKeyDown={props.onResizePlacesByKey}
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
