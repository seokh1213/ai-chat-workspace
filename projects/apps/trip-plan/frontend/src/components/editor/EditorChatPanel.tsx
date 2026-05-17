import type { ReactNode } from "react";

import { ChatPanel } from "../chat/ChatPanel";
import type { EditorChatProps } from "./EditorScreen.types";

interface EditorChatPanelProps {
  chat: EditorChatProps;
  className?: string;
  hideActiveHeaderActions?: boolean;
  hideCollapseButton?: boolean;
  mobileHeaderAction?: ReactNode;
  mobileHeaderInset?: boolean;
  showListBackButton?: boolean;
  onBack: () => void;
  onCreateChatSession: () => void;
  onOpenChatList: () => void;
  onSelectChatSession: (sessionId: string) => void;
  onToggleChat: () => void;
}

export function EditorChatPanel({
  chat,
  className,
  hideActiveHeaderActions,
  hideCollapseButton,
  mobileHeaderAction,
  mobileHeaderInset,
  showListBackButton,
  onBack,
  onCreateChatSession,
  onOpenChatList,
  onSelectChatSession,
  onToggleChat
}: EditorChatPanelProps) {
  return (
    <ChatPanel
      className={className}
      activeChatId={chat.activeChatId}
      chatSessions={chat.sessions}
      isChatSessionCreating={chat.isSessionCreating}
      isChatSessionsLoading={chat.isSessionsLoading}
      isChatDetailLoading={chat.isDetailLoading}
      checkpoints={chat.checkpoints}
      isRollingBack={chat.isRollingBack}
      messages={chat.messages}
      editRuns={chat.editRuns}
      pendingChatAttachments={chat.pendingAttachments}
      chatText={chat.text}
      isChatSending={chat.isSending}
      chatStreamLabel={chat.streamLabel}
      chatActivity={chat.activity}
      chatElapsedSeconds={chat.elapsedSeconds}
      chatStreamingText={chat.streamingText}
      chatOperationPreview={chat.operationPreview}
      mobileHeaderAction={mobileHeaderAction}
      mobileHeaderInset={mobileHeaderInset}
      onBack={onBack}
      onToggleChat={onToggleChat}
      onOpenChatList={onOpenChatList}
      onCreateChatSession={onCreateChatSession}
      onSelectChatSession={onSelectChatSession}
      onRollbackCheckpoint={chat.onRollbackCheckpoint}
      onChatTextChange={chat.onTextChange}
      onAddChatFiles={chat.onAddFiles}
      onRemovePendingChatAttachment={chat.onRemovePendingAttachment}
      onSubmitChat={chat.onSubmit}
      onStopChat={chat.onStop}
      onRenameChatSession={chat.onRenameSession}
      onUpdateChatSessionTitle={chat.onUpdateSessionTitle}
      onCopyChatSession={chat.onCopySession}
      onDeleteChatSession={chat.onDeleteSession}
      hideActiveHeaderActions={hideActiveHeaderActions}
      hideCollapseButton={hideCollapseButton}
      showListBackButton={showListBackButton}
    />
  );
}
