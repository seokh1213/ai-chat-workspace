import { ChatPanel } from "../chat/ChatPanel";
import type { EditorScreenProps } from "./EditorScreen.types";
import { MobileItineraryView } from "./MobileItineraryView";
import { MobileMapView } from "./MobileMapView";
import { MobileViewSwitcher } from "./MobileViewSwitcher";
import type { EditorScreenState } from "./useEditorScreenState";

interface MobileEditorShellProps {
  props: EditorScreenProps;
  state: EditorScreenState;
}

export function MobileEditorShell({ props, state }: MobileEditorShellProps) {
  if (state.mobileView === "details") {
    return <MobileItineraryView props={props} state={state} />;
  }

  if (state.mobileView === "map") {
    return <MobileMapView props={props} state={state} />;
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-[var(--surface)] text-[var(--text)] [&>.chat-panel]:h-dvh [&>.chat-panel]:w-full [&>.chat-panel]:border-0 [&_.chat-header]:min-h-[calc(env(safe-area-inset-top,0px)+56px)] [&_.chat-header]:pb-2 [&_.chat-header]:pt-[calc(env(safe-area-inset-top,0px)+8px)]">
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
        mobileHeaderAction={!props.activeChatId ? (
          <MobileViewSwitcher
            activeView={state.mobileView}
            onOpenDetails={state.openMobileDetails}
            onOpenMap={state.openMobileMap}
            onOpenChatList={state.openMobileChatList}
          />
        ) : undefined}
        onBack={props.onBack}
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
        hideActiveHeaderActions
        hideCollapseButton
        showListBackButton
      />
    </main>
  );
}
