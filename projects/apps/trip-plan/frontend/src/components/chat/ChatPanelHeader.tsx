import { ChevronLeft, Copy, PanelRightClose, Plus, Save } from "lucide-react";
import type { FormEvent, ReactNode } from "react";

import type { ChatSession } from "../../types";

interface ChatPanelHeaderProps {
  activeChatSession: ChatSession | null;
  chatTitleDraft: string;
  isChatMarkdownCopied: boolean;
  isChatSessionCreating: boolean;
  isChatSessionsLoading: boolean;
  isChatTitleSaving: boolean;
  onBack: () => void;
  onChatTitleChange: (title: string) => void;
  onCopyActiveChat: () => void;
  onCreateChatSession: () => void;
  onOpenChatList: () => void;
  onSubmitChatTitle: (event: FormEvent) => void;
  onToggleChat: () => void;
  mobileHeaderAction?: ReactNode;
  hideActiveHeaderActions?: boolean;
  hideCollapseButton?: boolean;
  showListBackButton?: boolean;
}

export function ChatPanelHeader(props: ChatPanelHeaderProps) {
  if (props.activeChatSession) {
    return <ActiveChatPanelHeader {...props} activeChatSession={props.activeChatSession} />;
  }

  return (
    <div className="chat-header">
      <div className="chat-header-main">
        {props.showListBackButton ? (
          <button className="icon-button header-icon-button" type="button" aria-label="여행 목록으로 돌아가기" onClick={props.onBack}>
            <ChevronLeft size={16} />
          </button>
        ) : null}
        <div className="chat-heading">
          <strong>AI 대화</strong>
          <span>주제별로 나눠서 이어갑니다</span>
        </div>
      </div>
      <ChatHeaderActions
        isChatSessionCreating={props.isChatSessionCreating}
        isChatSessionsLoading={props.isChatSessionsLoading}
        hideCollapseButton={props.hideCollapseButton}
        mobileHeaderAction={props.mobileHeaderAction}
        onCreateChatSession={props.onCreateChatSession}
        onToggleChat={props.onToggleChat}
      />
    </div>
  );
}

function ActiveChatPanelHeader(props: ChatPanelHeaderProps & { activeChatSession: ChatSession }) {
  const title = props.chatTitleDraft.trim();
  const titleUnchanged = title === props.activeChatSession.title;

  return (
    <div className="chat-header active-chat-header">
      <button className="icon-button header-icon-button" type="button" aria-label="AI 대화 목록" onClick={props.onOpenChatList}>
        <ChevronLeft size={16} />
      </button>
      <form className="active-chat-toolbar" onSubmit={props.onSubmitChatTitle}>
        <div className="active-chat-name-field">
          <input
            value={props.chatTitleDraft}
            onChange={(event) => props.onChatTitleChange(event.target.value)}
            aria-label="현재 대화 이름"
            placeholder="대화 이름"
          />
        </div>
        <button
          className="icon-button header-icon-button"
          type="submit"
          aria-label="대화 이름 저장"
          disabled={props.isChatTitleSaving || !title || titleUnchanged}
        >
          <Save size={15} />
        </button>
        <button
          className={props.isChatMarkdownCopied ? "icon-button header-icon-button copied" : "icon-button header-icon-button"}
          type="button"
          aria-label={props.isChatMarkdownCopied ? "대화 내용 복사됨" : "대화 내용 전체 복사"}
          onClick={props.onCopyActiveChat}
        >
          <Copy size={15} />
        </button>
      </form>
      {!props.hideActiveHeaderActions ? (
        <ChatHeaderActions
          isChatSessionCreating={props.isChatSessionCreating}
          isChatSessionsLoading={props.isChatSessionsLoading}
          hideCollapseButton={props.hideCollapseButton}
          onCreateChatSession={props.onCreateChatSession}
          onToggleChat={props.onToggleChat}
        />
      ) : null}
    </div>
  );
}

function ChatHeaderActions(
  props: Pick<ChatPanelHeaderProps, "hideCollapseButton" | "isChatSessionCreating" | "isChatSessionsLoading" | "mobileHeaderAction" | "onCreateChatSession" | "onToggleChat">
) {
  return (
    <div className="chat-header-actions">
      <button
        className="icon-button header-icon-button"
        type="button"
        aria-label="새 대화"
        disabled={props.isChatSessionCreating || props.isChatSessionsLoading}
        onClick={props.onCreateChatSession}
      >
        <Plus size={17} />
      </button>
      {!props.hideCollapseButton ? (
        <button className="icon-button header-icon-button" type="button" aria-label="일정 조율 접기" onClick={props.onToggleChat}>
          <PanelRightClose size={17} />
        </button>
      ) : null}
      {props.mobileHeaderAction}
    </div>
  );
}
