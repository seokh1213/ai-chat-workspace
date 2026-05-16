import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import type { FormEvent } from "react";

import type { EditorLayout } from "../../lib/editorLayout";
import type {
  AiEditRunSummary,
  ChatMessage,
  ChatRunActivityEvent,
  ChatSession,
  CheckpointSummary,
  ItineraryItem,
  Place,
  TripDay,
  TripFormState,
  TripState,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest
} from "../../types";
import { ChatPanel } from "../chat/ChatPanel";
import type { PendingChatAttachment } from "../chat/types";
import { MapCanvas } from "../map/MapCanvas";
import { MapDayPicker } from "./MapDayPicker";
import { MobileBottomNav } from "./MobileBottomNav";
import { PlannerSidebar } from "./PlannerSidebar";
import { useEditorScreenState } from "./useEditorScreenState";

interface EditorScreenProps {
  className: string;
  tripState: TripState;
  selectedDay?: TripDay;
  selectedDayId: string;
  focusedItemId: string | null;
  layout: EditorLayout;
  metaForm: TripFormState;
  isMetaSaving: boolean;
  onLayoutChange: (layout: EditorLayout) => void;
  onMetaFormChange: (form: TripFormState) => void;
  onSubmitMeta: (event: FormEvent) => void;
  onSelectDay: (dayId: string) => void;
  dayItems: ItineraryItem[];
  plannerCollapsed: boolean;
  chatCollapsed: boolean;
  scheduleCollapsed: boolean;
  placesCollapsed: boolean;
  onTogglePlanner: () => void;
  onToggleChat: () => void;
  onToggleSchedule: () => void;
  onTogglePlaces: () => void;
  itemForm: UpsertItineraryItemRequest;
  editingItemId: string | null;
  onItemFormChange: (form: UpsertItineraryItemRequest) => void;
  onSubmitItem: (event: FormEvent) => void;
  onEditItem: (item: ItineraryItem) => void;
  onCancelEditItem: () => void;
  onUsePlace: (place: Place) => void;
  placeForm: UpsertPlaceRequest;
  editingPlaceId: string | null;
  onPlaceFormChange: (form: UpsertPlaceRequest) => void;
  onSubmitPlace: (event: FormEvent) => void;
  onEditPlace: (place: Place) => void;
  onCancelEditPlace: () => void;
  onDeletePlace: (place: Place) => void;
  onFocusItem: (itemId: string | null) => void;
  onDeleteItem: (itemId: string) => void;
  onBack: () => void;
  chatSessions: ChatSession[];
  chatSessionId: string;
  activeChatId: string | null;
  isChatSessionCreating: boolean;
  isChatSessionsLoading: boolean;
  isChatDetailLoading: boolean;
  checkpoints: CheckpointSummary[];
  isRollingBack: boolean;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
  pendingChatAttachments: PendingChatAttachment[];
  chatText: string;
  isChatSending: boolean;
  chatStreamLabel: string | null;
  chatActivity: ChatRunActivityEvent | null;
  chatElapsedSeconds: number;
  chatStreamingText: string;
  chatOperationPreview: string[];
  onSelectChatSession: (sessionId: string) => void;
  onCreateChatSession: () => void;
  onOpenChatList: () => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
  onChatTextChange: (text: string) => void;
  onAddChatFiles: (files: FileList | File[] | null) => void;
  onRemovePendingChatAttachment: (localId: string) => void;
  onSubmitChat: (event: FormEvent) => void;
  onStopChat: () => void;
  onDeleteTrip: () => void;
  onRenameChatSession: (session: ChatSession) => void;
  onUpdateChatSessionTitle: (session: ChatSession, title: string) => Promise<void>;
  onCopyChatSession: (session: ChatSession) => Promise<void>;
  onDeleteChatSession: (session: ChatSession) => void;
}

export function EditorScreen(props: EditorScreenProps) {
  const state = useEditorScreenState(props);

  return (
    <main className={state.editorClassName} style={state.layoutStyle}>
      {!props.plannerCollapsed ? (
        <PlannerSidebar
          tripState={props.tripState}
          selectedDayId={props.selectedDayId}
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
          onOpenMobileChatList={state.openMobileChatList}
          onTogglePlanner={props.onTogglePlanner}
          onMetaFormChange={props.onMetaFormChange}
          onSubmitMeta={props.onSubmitMeta}
          onDeleteTrip={props.onDeleteTrip}
          onSelectDay={props.onSelectDay}
          onClearDetailHighlight={state.clearDetailHighlight}
          onToggleSchedule={props.onToggleSchedule}
          onTogglePlaces={props.onTogglePlaces}
          onStartPlacesResize={state.startPlacesResize}
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
          onUsePlace={props.onUsePlace}
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
          onPointerDown={(event) => state.startPanelResize(event, "planner")}
        />
      ) : null}

      <section className="map-zone">
        <MapDayPicker
          days={props.tripState.days}
          selectedDayId={props.selectedDayId}
          itemCountByDay={state.itemCountByDay}
          onSelectDay={props.onSelectDay}
        />
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
          layoutKey={`${state.mobileView}-${props.plannerCollapsed}-${props.chatCollapsed}-${props.layout.plannerWidth}-${props.layout.chatWidth}-${props.layout.placesHeight}`}
        />
      </section>

      {!props.chatCollapsed ? (
        <div
          className="panel-resizer chat-resizer"
          role="separator"
          aria-label="AI 대화 패널 너비 조절"
          aria-orientation="vertical"
          onPointerDown={(event) => state.startPanelResize(event, "chat")}
        />
      ) : null}

      {!props.chatCollapsed ? (
        <ChatPanel
          activeChatId={props.activeChatId}
          chatSessions={props.chatSessions}
          isChatSessionCreating={props.isChatSessionCreating}
          isChatSessionsLoading={props.isChatSessionsLoading}
          isChatDetailLoading={props.isChatDetailLoading}
          checkpoints={props.checkpoints}
          isRollingBack={props.isRollingBack}
          messages={props.messages}
          editRuns={props.editRuns}
          pendingChatAttachments={props.pendingChatAttachments}
          chatText={props.chatText}
          isChatSending={props.isChatSending}
          chatStreamLabel={props.chatStreamLabel}
          chatActivity={props.chatActivity}
          chatElapsedSeconds={props.chatElapsedSeconds}
          chatStreamingText={props.chatStreamingText}
          chatOperationPreview={props.chatOperationPreview}
          onCloseMobileChat={state.closeMobileChat}
          onToggleChat={props.onToggleChat}
          onOpenChatList={state.openChatList}
          onCreateChatSession={state.createChatSession}
          onSelectChatSession={state.selectChatSession}
          onRollbackCheckpoint={props.onRollbackCheckpoint}
          onChatTextChange={props.onChatTextChange}
          onAddChatFiles={props.onAddChatFiles}
          onRemovePendingChatAttachment={props.onRemovePendingChatAttachment}
          onSubmitChat={props.onSubmitChat}
          onStopChat={props.onStopChat}
          onRenameChatSession={props.onRenameChatSession}
          onUpdateChatSessionTitle={props.onUpdateChatSessionTitle}
          onCopyChatSession={props.onCopyChatSession}
          onDeleteChatSession={props.onDeleteChatSession}
        />
      ) : (
        <button className="map-panel-button right" type="button" aria-label="일정 조율 열기" onClick={props.onToggleChat}>
          <PanelRightOpen size={18} />
        </button>
      )}
      <MobileBottomNav
        mobileView={state.mobileView}
        onOpenDetails={state.openMobileDetails}
        onOpenMap={state.openMobileMap}
        onOpenChatList={state.openMobileChatList}
      />
    </main>
  );
}
