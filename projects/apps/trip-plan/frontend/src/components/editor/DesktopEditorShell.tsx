import { PanelLeftOpen, PanelRightOpen } from "lucide-react";

import { MapCanvas } from "../map/MapCanvas";
import { EditorChatPanel } from "./EditorChatPanel";
import type { EditorScreenProps } from "./EditorScreen.types";
import { PlannerSidebar } from "./PlannerSidebar";
import type { EditorScreenState } from "./useEditorScreenState";

interface DesktopEditorShellProps {
  props: EditorScreenProps;
  state: EditorScreenState;
}

export function DesktopEditorShell({ props, state }: DesktopEditorShellProps) {
  return (
    <main className={state.editorClassName} style={state.layoutStyle}>
      {!props.plannerCollapsed ? (
        <PlannerSidebar
          tripState={props.tripState}
          selectedDayId={props.selectedDayId}
          placesHeight={props.layout.placesHeight}
          dayItems={props.dayItems}
          itemCountByDay={state.itemCountByDay}
          routeNumbers={state.routeNumbers}
          visiblePlaces={state.visiblePlaces}
          metaForm={props.metaForm}
          isMetaSaving={props.isMetaSaving}
          itemForm={props.itemForm}
          editingItemId={props.editingItemId}
          isAddingItem={state.isAddingItem}
          expandedItems={state.expandedItems}
          placeForm={props.placeForm}
          editingPlaceId={props.editingPlaceId}
          isAddingPlace={state.isAddingPlace}
          expandedPlaces={state.expandedPlaces}
          scheduleCollapsed={props.scheduleCollapsed}
          placesCollapsed={props.placesCollapsed}
          detailHighlight={state.detailHighlight}
          onBack={props.onBack}
          onTogglePlanner={props.onTogglePlanner}
          onMetaFormChange={props.onMetaFormChange}
          onSubmitMeta={props.onSubmitMeta}
          onDeleteTrip={props.onDeleteTrip}
          onSelectDay={props.onSelectDay}
          onClearDetailHighlight={state.clearDetailHighlight}
          onToggleSchedule={props.onToggleSchedule}
          onTogglePlaces={props.onTogglePlaces}
          onStartPlacesResize={state.startPlacesResize}
          onResizePlacesByKey={state.resizePlacesByKey}
          onStartAddItem={state.startAddItem}
          onItemFormChange={props.onItemFormChange}
          onSubmitItem={state.submitItemForm}
          onCancelItem={state.cancelItemForm}
          onFocusItemOnMap={state.focusItemOnMap}
          onEditItem={props.onEditItem}
          onDeleteItem={props.onDeleteItem}
          onToggleExpandedItem={state.toggleExpandedItem}
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
      ) : (
        <button className="map-panel-button left" type="button" aria-label="일정과 장소 열기" onClick={props.onTogglePlanner}>
          <PanelLeftOpen size={18} />
        </button>
      )}

      {!props.plannerCollapsed ? (
        <div
          className="panel-resizer planner-resizer"
          role="separator"
          aria-label="왼쪽 패널 너비 조절"
          aria-orientation="vertical"
          aria-valuemin={420}
          aria-valuemax={580}
          aria-valuenow={props.layout.plannerWidth}
          tabIndex={0}
          onPointerDown={(event) => state.startPanelResize(event, "planner")}
          onKeyDown={(event) => state.resizePanelByKey(event, "planner")}
        />
      ) : null}

      <section className="map-zone">
        <MapCanvas
          tripState={props.tripState}
          dayItems={props.dayItems}
          selectedDay={props.selectedDay}
          focusedItemId={props.focusedItemId}
          focusedPlaceId={state.focusedMapPlaceId}
          centerFocusedPlace={state.shouldCenterFocusedPlace}
          onFocusPlace={state.highlightPlaceOnMap}
          onShowItemDetails={state.showItemDetails}
          onShowPlaceDetails={state.showPlaceDetails}
          layoutKey={`desktop-${props.plannerCollapsed}-${props.chatCollapsed}-${props.layout.plannerWidth}-${props.layout.chatWidth}-${props.layout.placesHeight}`}
        />
      </section>

      {!props.chatCollapsed ? (
        <div
          className="panel-resizer chat-resizer"
          role="separator"
          aria-label="AI 대화 패널 너비 조절"
          aria-orientation="vertical"
          aria-valuemin={360}
          aria-valuemax={560}
          aria-valuenow={props.layout.chatWidth}
          tabIndex={0}
          onPointerDown={(event) => state.startPanelResize(event, "chat")}
          onKeyDown={(event) => state.resizePanelByKey(event, "chat")}
        />
      ) : null}

      {!props.chatCollapsed ? (
        <EditorChatPanel
          chat={props.chat}
          onBack={props.onBack}
          onCreateChatSession={state.createChatSession}
          onOpenChatList={state.openChatList}
          onSelectChatSession={state.selectChatSession}
          onToggleChat={props.onToggleChat}
        />
      ) : (
        <button className="map-panel-button right" type="button" aria-label="일정 조율 열기" onClick={props.onToggleChat}>
          <PanelRightOpen size={18} />
        </button>
      )}
    </main>
  );
}
