import { useState } from "react";

import type { EditorScreenProps } from "./EditorScreen.types";
import { MobileDayStrip } from "./MobileDayStrip";
import { MobileTripTopBar } from "./MobileTripTopBar";
import { MobileViewSwitcher } from "./MobileViewSwitcher";
import { MobilePlacesSection } from "./MobilePlacesSection";
import { MobileScheduleSection } from "./MobileScheduleSection";
import { TripMetaForm } from "./TripMetaForm";
import type { EditorScreenState } from "./useEditorScreenState";

interface MobileItineraryViewProps {
  props: EditorScreenProps;
  state: EditorScreenState;
}

export function MobileItineraryView({ props, state }: MobileItineraryViewProps) {
  const [metaOpen, setMetaOpen] = useState(false);
  const tripTitle = props.metaForm.title || props.tripState.trip.title || "여행 이름 미정";
  const destinationText = props.metaForm.destinationName || props.tripState.trip.destinationName || "목적지 미정";
  const startDate = props.metaForm.startDate || props.tripState.trip.startDate;
  const endDate = props.metaForm.endDate || props.tripState.trip.endDate;
  const dateText = [startDate, endDate].filter(Boolean).join(" - ") || "기간 미정";

  return (
    <section className="flex h-dvh flex-col overflow-hidden bg-[var(--surface)] text-[var(--text)]">
      <MobileTripTopBar
        title={tripTitle}
        subtitle={`${destinationText} · ${dateText}`}
        backLabel="여행 목록으로 돌아가기"
        infoOpen={metaOpen}
        onBack={props.onBack}
        onToggleInfo={() => setMetaOpen((value) => !value)}
        actions={(
          <MobileViewSwitcher
            activeView={state.mobileView}
            onOpenDetails={state.openMobileDetails}
            onOpenMap={state.openMobileMap}
            onOpenChatList={state.openMobileChatList}
          />
        )}
      />
      <TripMetaForm
        form={props.metaForm}
        open={metaOpen}
        saving={props.isMetaSaving}
        onChange={props.onMetaFormChange}
        onSubmit={props.onSubmitMeta}
        onDelete={props.onDeleteTrip}
      />
      <MobileDayStrip
        days={props.tripState.days}
        selectedDayId={props.selectedDayId}
        itemCountByDay={state.itemCountByDay}
        onSelectDay={props.onSelectDay}
      />
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface)] [-webkit-overflow-scrolling:touch]"
        onScroll={state.clearDetailHighlight}
        onTouchStart={state.clearDetailHighlight}
        onWheel={state.clearDetailHighlight}
      >
        <MobileScheduleSection
          collapsed={props.scheduleCollapsed}
          days={props.tripState.days}
          selectedDayId={props.selectedDayId}
          dayItems={props.dayItems}
          itemForm={props.itemForm}
          editingItemId={props.editingItemId}
          isAddingItem={state.isAddingItem}
          expandedItems={state.expandedItems}
          routeNumbers={state.routeNumbers}
          detailHighlight={state.detailHighlight}
          onToggle={props.onToggleSchedule}
          onSelectDay={props.onSelectDay}
          onStartAddItem={state.startAddItem}
          onItemFormChange={props.onItemFormChange}
          onSubmitItem={state.submitItemForm}
          onCancelItem={state.cancelItemForm}
          onFocusItemOnMap={state.focusItemOnMap}
          onEditItem={props.onEditItem}
          onDeleteItem={props.onDeleteItem}
          onToggleExpandedItem={state.toggleExpandedItem}
        />
        <MobilePlacesSection
          collapsed={props.placesCollapsed}
          visiblePlaces={state.visiblePlaces}
          placeForm={props.placeForm}
          editingPlaceId={props.editingPlaceId}
          isAddingPlace={state.isAddingPlace}
          expandedPlaces={state.expandedPlaces}
          detailHighlight={state.detailHighlight}
          onToggle={props.onTogglePlaces}
          onStartAddPlace={state.startAddPlace}
          onPlaceFormChange={props.onPlaceFormChange}
          onSubmitPlace={state.submitPlaceForm}
          onCancelPlace={state.cancelPlaceForm}
          onFocusPlaceOnMap={state.focusPlaceOnMap}
          onUsePlace={(place) => {
            state.startAddItem();
            props.onUsePlace(place);
          }}
          onEditPlace={props.onEditPlace}
          onDeletePlace={props.onDeletePlace}
          onToggleExpandedPlace={state.toggleExpandedPlace}
        />
      </div>
    </section>
  );
}
