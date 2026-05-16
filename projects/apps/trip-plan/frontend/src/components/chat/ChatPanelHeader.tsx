import { ChevronLeft, PanelRightClose, Plus } from "lucide-react";

interface ChatPanelHeaderProps {
  activeChatId: string | null;
  isChatSessionCreating: boolean;
  isChatSessionsLoading: boolean;
  onCloseMobileChat: () => void;
  onCreateChatSession: () => void;
  onToggleChat: () => void;
}

export function ChatPanelHeader(props: ChatPanelHeaderProps) {
  return (
    <div className="chat-header">
      <div className="chat-header-main">
        <button className="text-back-button compact mobile-planner-entry" type="button" onClick={props.onCloseMobileChat}>
          <ChevronLeft size={16} />
          지도
        </button>
        <div className="chat-heading">
          {props.activeChatId ? (
            <>
              <strong>AI 대화</strong>
              <span>메시지별 복사와 변경 내역을 확인합니다</span>
            </>
          ) : (
            <>
              <strong>AI 대화</strong>
              <span>주제별로 나눠서 이어갑니다</span>
            </>
          )}
        </div>
      </div>
      <div className="chat-header-actions">
        <button
          className="icon-button"
          type="button"
          aria-label="새 대화"
          disabled={props.isChatSessionCreating || props.isChatSessionsLoading}
          onClick={props.onCreateChatSession}
        >
          <Plus size={17} />
        </button>
        <button className="icon-button desktop-chat-collapse" type="button" aria-label="일정 조율 접기" onClick={props.onToggleChat}>
          <PanelRightClose size={17} />
        </button>
      </div>
    </div>
  );
}
