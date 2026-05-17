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
  mobileHeaderInset?: boolean;
  showListBackButton?: boolean;
}

const headerBaseClass = "flex shrink-0 items-center justify-between gap-3 border-b border-[var(--line)] px-3 text-[var(--text)]";
const desktopHeaderClass = `${headerBaseClass} min-h-14`;
const mobileHeaderClass = `${headerBaseClass} min-h-[calc(env(safe-area-inset-top,0px)+56px)] pb-2 pt-[calc(env(safe-area-inset-top,0px)+8px)]`;
const headerIconButtonClass = "grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-50";
const copiedIconButtonClass = "grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-[var(--teal-soft)] p-0 text-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-50";

export function ChatPanelHeader(props: ChatPanelHeaderProps) {
  if (props.activeChatSession) {
    return <ActiveChatPanelHeader {...props} activeChatSession={props.activeChatSession} />;
  }

  return (
    <div className={props.mobileHeaderInset ? mobileHeaderClass : desktopHeaderClass}>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {props.showListBackButton ? (
          <button className={headerIconButtonClass} type="button" aria-label="여행 목록으로 돌아가기" onClick={props.onBack}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <div className="grid min-w-0 gap-1">
          <strong className="truncate text-sm font-extrabold leading-4">AI 대화</strong>
          <span className="truncate text-xs font-bold text-[var(--secondary)]">주제별로 나눠서 이어갑니다</span>
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
    <div className={props.mobileHeaderInset ? mobileHeaderClass : desktopHeaderClass}>
      <button className={headerIconButtonClass} type="button" aria-label="AI 대화 목록" onClick={props.onOpenChatList}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <form className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2" onSubmit={props.onSubmitChatTitle}>
        <input
          className="h-9 min-w-0 rounded border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-bold text-[var(--text)] outline-none focus:border-[rgba(31,193,182,0.65)] focus:ring-4 focus:ring-[rgba(31,193,182,0.12)]"
          value={props.chatTitleDraft}
          onChange={(event) => props.onChatTitleChange(event.target.value)}
          aria-label="현재 대화 이름"
          placeholder="대화 이름"
        />
        <button
          className={headerIconButtonClass}
          type="submit"
          aria-label="대화 이름 저장"
          disabled={props.isChatTitleSaving || !title || titleUnchanged}
        >
          <Save className="h-[15px] w-[15px]" aria-hidden="true" />
        </button>
        <button
          className={props.isChatMarkdownCopied ? copiedIconButtonClass : headerIconButtonClass}
          type="button"
          aria-label={props.isChatMarkdownCopied ? "대화 내용 복사됨" : "대화 내용 전체 복사"}
          onClick={props.onCopyActiveChat}
        >
          <Copy className="h-[15px] w-[15px]" aria-hidden="true" />
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
    <div className="flex shrink-0 items-center gap-2">
      <button
        className={headerIconButtonClass}
        type="button"
        aria-label="새 대화"
        disabled={props.isChatSessionCreating || props.isChatSessionsLoading}
        onClick={props.onCreateChatSession}
      >
        <Plus className="h-[17px] w-[17px]" aria-hidden="true" />
      </button>
      {!props.hideCollapseButton ? (
        <button className={headerIconButtonClass} type="button" aria-label="일정 조율 접기" onClick={props.onToggleChat}>
          <PanelRightClose className="h-[17px] w-[17px]" aria-hidden="true" />
        </button>
      ) : null}
      {props.mobileHeaderAction}
    </div>
  );
}
