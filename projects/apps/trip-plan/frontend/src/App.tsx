import {
  useEffect,
  useMemo,
  useState
} from "react";
import type { TripState } from "./types";
import { ErrorScreen } from "./components/common/ErrorScreen";
import { AppLoadingScreen } from "./components/common/AppLoadingScreen";
import { EditorScreen } from "./components/editor/EditorScreen";
import { SetupScreen } from "./components/setup/SetupScreen";
import { SelectScreen } from "./components/workspace/SelectScreen";
import { type EditorLayout, readEditorLayout, writeEditorLayout } from "./lib/editorLayout";
import { pushAppPath, type Screen } from "./lib/route";
import { useSetupTripCreator } from "./lib/useSetupTripCreator";
import { useTripChat } from "./lib/useTripChat";
import { useTripEditorActions } from "./lib/useTripEditorActions";
import { useTripRouteActions } from "./lib/useTripRouteActions";
import { useWorkspaceManager } from "./lib/useWorkspaceManager";

type LoadState = "loading" | "ready" | "error";

export function App() {
  const [screen, setScreen] = useState<Screen>("select");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isTripOpening, setIsTripOpening] = useState(false);
  const [tripState, setTripState] = useState<TripState | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [plannerCollapsed, setPlannerCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false);
  const [placesCollapsed, setPlacesCollapsed] = useState(false);
  const [editorLayout, setEditorLayout] = useState<EditorLayout>(() => readEditorLayout());
  const {
    workspaces,
    workspaceId,
    setWorkspaceId,
    workspaceName,
    setWorkspaceName,
    settingsWorkspace,
    workspaceSettingsForm,
    setWorkspaceSettingsForm,
    providerStatuses,
    trips,
    setTrips,
    isTripsLoading,
    loadWorkspaces,
    refreshProviderStatuses,
    submitWorkspace,
    renameWorkspace,
    openWorkspaceSettings,
    closeWorkspaceSettings,
    submitWorkspaceSettings,
    removeWorkspace
  } = useWorkspaceManager({
    onActiveWorkspaceDeleted: () => {
      setTripState(null);
      setScreen("select");
      pushAppPath("/");
    }
  });
  const activeTrip = tripState?.trip ?? null;
  const days = tripState?.days ?? [];
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0];
  const dayItems = useMemo(
    () => (selectedDay ? (tripState?.itineraryItems ?? []).filter((item) => item.tripDayId === selectedDay.id) : []),
    [selectedDay, tripState]
  );
  const {
    pendingChatAttachments,
    removePendingChatAttachment,
    addPendingChatFiles,
    chatSessions,
    chatSessionId,
    activeChatId,
    messages,
    editRuns,
    isChatSessionsLoading,
    isChatDetailLoading,
    chatText,
    setChatText,
    isChatSessionCreating,
    isChatSending,
    chatStreamLabel,
    chatActivity,
    chatElapsedSeconds,
    chatStreamingText,
    chatOperationPreview,
    prepareTripOpen,
    resetChatState,
    loadChat,
    selectChatSession,
    createNextChatSession,
    openChatList,
    renameChat,
    updateChatTitle,
    copyChatSessionMarkdown,
    removeChat,
    submitChat,
    stopChatResponse
  } = useTripChat({
    activeTrip,
    selectedDay,
    setTripState,
    setSelectedDayId,
    refreshProviderStatuses
  });
  useEffect(() => {
    writeEditorLayout(editorLayout);
  }, [editorLayout]);

  const {
    metaForm,
    setMetaForm,
    isMetaSaving,
    itemForm,
    setItemForm,
    editingItemId,
    placeForm,
    setPlaceForm,
    editingPlaceId,
    focusedItemId,
    setFocusedItemId,
    isRollingBack,
    selectDay,
    cancelEditItem,
    cancelEditPlace,
    submitMeta,
    rollbackToCheckpoint,
    submitItem,
    removeItem,
    startEditItem,
    usePlaceAsItem,
    startEditPlace,
    submitPlace,
    removePlace
  } = useTripEditorActions({
    activeTrip,
    selectedDay,
    selectedDayId,
    setTripState,
    setSelectedDayId,
    setTrips,
    setScheduleCollapsed,
    setPlacesCollapsed
  });
  const {
    bootstrap,
    enterTrip,
    navigateToCreate,
    navigateToSelect,
    renameTrip,
    removeTrip,
    deleteActiveTrip
  } = useTripRouteActions({
    activeTrip,
    tripState,
    loadWorkspaces,
    loadChat,
    prepareTripOpen,
    resetChatState,
    setLoadState,
    setError,
    setIsTripOpening,
    setTripState,
    setScreen,
    setMetaForm,
    setSelectedDayId,
    setFocusedItemId,
    setTrips
  });
  const {
    tripForm,
    setTripForm,
    isTripSubmitting,
    setupMessages,
    setupChatText,
    setSetupChatText,
    isSetupSending,
    submitTrip,
    submitSetupChat
  } = useSetupTripCreator({ workspaceId, setTrips, enterTrip });

  if (loadState === "error") {
    return <ErrorScreen message={error ?? "앱을 불러오지 못했습니다."} onRetry={bootstrap} />;
  }

  if (loadState === "loading") {
    return (
      <AppLoadingScreen
        title="여행 작업실을 준비하는 중입니다"
        detail="워크스페이스와 기본 설정을 확인하고 있습니다."
      />
    );
  }

  if (isTripOpening && !tripState) {
    return (
      <AppLoadingScreen
        title="여행을 여는 중입니다"
        detail="일정, 장소, 대화 상태를 불러오고 있습니다."
      />
    );
  }

  if (screen === "create") {
    return (
      <SetupScreen
        workspaceName={workspaces.find((workspace) => workspace.id === workspaceId)?.name ?? ""}
        tripForm={tripForm}
        setupMessages={setupMessages}
        setupChatText={setupChatText}
        isSetupSending={isSetupSending}
        isTripSubmitting={isTripSubmitting}
        onTripFormChange={setTripForm}
        onSetupChatTextChange={setSetupChatText}
        onSubmitSetupChat={submitSetupChat}
        onSubmit={submitTrip}
        onCancel={navigateToSelect}
      />
    );
  }

  if (screen === "edit" && tripState && activeTrip) {
    const editorClassName = [
      "editor-shell",
      plannerCollapsed ? "planner-collapsed" : "",
      chatCollapsed ? "chat-collapsed" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <EditorScreen
        className={editorClassName}
        tripState={tripState}
        selectedDay={selectedDay}
        selectedDayId={selectedDayId}
        focusedItemId={focusedItemId}
        layout={editorLayout}
        metaForm={metaForm}
        isMetaSaving={isMetaSaving}
        onLayoutChange={setEditorLayout}
        onMetaFormChange={setMetaForm}
        onSubmitMeta={submitMeta}
        onSelectDay={selectDay}
        dayItems={dayItems}
        plannerCollapsed={plannerCollapsed}
        chatCollapsed={chatCollapsed}
        scheduleCollapsed={scheduleCollapsed}
        placesCollapsed={placesCollapsed}
        onTogglePlanner={() => setPlannerCollapsed((value) => !value)}
        onToggleChat={() => setChatCollapsed((value) => !value)}
        onToggleSchedule={() => setScheduleCollapsed((value) => !value)}
        onTogglePlaces={() => setPlacesCollapsed((value) => !value)}
        itemForm={itemForm}
        editingItemId={editingItemId}
        onItemFormChange={setItemForm}
        onSubmitItem={submitItem}
        onEditItem={startEditItem}
        onCancelEditItem={cancelEditItem}
        onUsePlace={usePlaceAsItem}
        placeForm={placeForm}
        editingPlaceId={editingPlaceId}
        onPlaceFormChange={setPlaceForm}
        onSubmitPlace={submitPlace}
        onEditPlace={startEditPlace}
        onCancelEditPlace={cancelEditPlace}
        onDeletePlace={(place) => void removePlace(place)}
        onFocusItem={setFocusedItemId}
        onDeleteItem={removeItem}
        onBack={navigateToSelect}
        chatSessions={chatSessions}
        chatSessionId={chatSessionId}
        activeChatId={activeChatId}
        isChatSessionCreating={isChatSessionCreating}
        isChatSessionsLoading={isChatSessionsLoading}
        isChatDetailLoading={isChatDetailLoading}
        checkpoints={tripState.checkpoints}
        isRollingBack={isRollingBack}
        messages={messages}
        editRuns={editRuns}
        pendingChatAttachments={pendingChatAttachments}
        chatText={chatText}
        isChatSending={isChatSending}
        chatStreamLabel={chatStreamLabel}
        chatActivity={chatActivity}
        chatElapsedSeconds={chatElapsedSeconds}
        chatStreamingText={chatStreamingText}
        chatOperationPreview={chatOperationPreview}
        onSelectChatSession={(sessionId) => void selectChatSession(sessionId)}
        onCreateChatSession={() => void createNextChatSession()}
        onOpenChatList={openChatList}
        onRollbackCheckpoint={(checkpointId) => void rollbackToCheckpoint(checkpointId)}
        onChatTextChange={setChatText}
        onAddChatFiles={(files) => void addPendingChatFiles(files)}
        onRemovePendingChatAttachment={(localId) => void removePendingChatAttachment(localId)}
        onSubmitChat={submitChat}
        onStopChat={stopChatResponse}
        onDeleteTrip={() => void deleteActiveTrip()}
        onRenameChatSession={(session) => void renameChat(session)}
        onUpdateChatSessionTitle={(session, title) => updateChatTitle(session, title)}
        onCopyChatSession={(session) => copyChatSessionMarkdown(session)}
        onDeleteChatSession={(session) => void removeChat(session)}
      />
    );
  }

  return (
    <SelectScreen
      workspaces={workspaces}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      settingsWorkspace={settingsWorkspace}
      workspaceSettingsForm={workspaceSettingsForm}
      providerStatuses={providerStatuses}
      trips={trips}
      loading={isTripsLoading}
      openingTrip={isTripOpening}
      onWorkspaceChange={setWorkspaceId}
      onWorkspaceNameChange={setWorkspaceName}
      onCreateWorkspace={submitWorkspace}
      onRenameWorkspace={(workspace) => void renameWorkspace(workspace)}
      onOpenWorkspaceSettings={openWorkspaceSettings}
      onWorkspaceSettingsFormChange={setWorkspaceSettingsForm}
      onSubmitWorkspaceSettings={submitWorkspaceSettings}
      onCloseWorkspaceSettings={closeWorkspaceSettings}
      onDeleteWorkspace={(workspace) => void removeWorkspace(workspace)}
      onCreateTrip={navigateToCreate}
      onEnterTrip={enterTrip}
      onRenameTrip={(trip) => void renameTrip(trip)}
      onDeleteTrip={(trip) => void removeTrip(trip)}
    />
  );
}
