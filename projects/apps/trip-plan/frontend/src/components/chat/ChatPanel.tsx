import { ChevronDown } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  buildChatMessageContentMarkdown,
  messageDurationMsFromRun
} from "../../lib/chat";
import { isChatLogNearBottom, writeClipboardText } from "../../lib/dom";
import type { AiEditRunSummary, ChatMessage, ChatRunActivityEvent, ChatSession, CheckpointSummary } from "../../types";
import { LoadingState } from "../common/LoadingState";
import { MarkdownContent } from "../common/MarkdownContent";
import { ChatComposer } from "./ChatComposer";
import { ChatHome } from "./ChatHome";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatPendingStatus } from "./ChatPendingStatus";
import { OperationPreviewList } from "./OperationPreviewList";
import { ChatPanelHeader } from "./ChatPanelHeader";
import type { PendingChatAttachment } from "./types";

interface ChatPanelProps {
  className?: string;
  activeChatId: string | null;
  chatSessions: ChatSession[];
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
  onBack: () => void;
  onToggleChat: () => void;
  onOpenChatList: () => void;
  onCreateChatSession: () => void;
  onSelectChatSession: (sessionId: string) => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
  onChatTextChange: (text: string) => void;
  onAddChatFiles: (files: FileList | File[] | null) => void;
  onRemovePendingChatAttachment: (localId: string) => void;
  onSubmitChat: (event: FormEvent) => void;
  onStopChat: () => void;
  onRenameChatSession: (session: ChatSession) => void;
  onUpdateChatSessionTitle: (session: ChatSession, title: string) => Promise<void>;
  onCopyChatSession: (session: ChatSession) => Promise<void>;
  onDeleteChatSession: (session: ChatSession) => void;
  mobileHeaderAction?: ReactNode;
  mobileHeaderInset?: boolean;
  hideActiveHeaderActions?: boolean;
  hideCollapseButton?: boolean;
  showListBackButton?: boolean;
}

export function ChatPanel(props: ChatPanelProps) {
  const activeChatSession = props.chatSessions.find((session) => session.id === props.activeChatId) ?? null;
  const [chatTitleDraft, setChatTitleDraft] = useState(activeChatSession?.title ?? "");
  const [isChatTitleSaving, setIsChatTitleSaving] = useState(false);
  const [isChatMarkdownCopied, setIsChatMarkdownCopied] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const chatCopyTimerRef = useRef<number | null>(null);
  const messageCopyTimerRef = useRef<number | null>(null);
  const shouldAutoScrollChatRef = useRef(true);
  const messageMeta = useMemo(() => buildMessageRenderMeta(props.messages, props.editRuns), [props.editRuns, props.messages]);

  useEffect(() => {
    return () => {
      if (chatCopyTimerRef.current != null) window.clearTimeout(chatCopyTimerRef.current);
      if (messageCopyTimerRef.current != null) window.clearTimeout(messageCopyTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    setChatTitleDraft(activeChatSession?.title ?? "");
    setIsChatMarkdownCopied(false);
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
    scrollChatToLatest("auto");
  }, [activeChatSession?.id, activeChatSession?.title]);

  useLayoutEffect(() => {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;

    if (shouldAutoScrollChatRef.current || isChatLogNearBottom(chatLog)) {
      scrollChatToLatest("auto");
    } else if (props.isChatSending || props.chatStreamingText) {
      setShowScrollToLatest(true);
    }
  }, [
    props.messages.length,
    props.chatStreamingText,
    props.isChatSending,
    props.chatOperationPreview.length,
    props.chatActivity?.detail,
    props.chatActivity?.label
  ]);

  function scrollChatToLatest(behavior: ScrollBehavior = "smooth") {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    chatLog.scrollTo({ top: chatLog.scrollHeight, behavior });
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
  }

  function handleChatLogScroll() {
    const chatLog = chatLogRef.current;
    if (!chatLog) return;
    const nearBottom = isChatLogNearBottom(chatLog);
    shouldAutoScrollChatRef.current = nearBottom;
    if (nearBottom) {
      setShowScrollToLatest(false);
    } else if (props.isChatSending || props.chatStreamingText) {
      setShowScrollToLatest(true);
    }
  }

  function pauseChatAutoScroll() {
    const chatLog = chatLogRef.current;
    if (!chatLog || isChatLogNearBottom(chatLog)) return;
    shouldAutoScrollChatRef.current = false;
    if (props.isChatSending || props.chatStreamingText) {
      setShowScrollToLatest(true);
    }
  }

  function submitChatForm(event: FormEvent) {
    shouldAutoScrollChatRef.current = true;
    setShowScrollToLatest(false);
    props.onSubmitChat(event);
    window.requestAnimationFrame(() => scrollChatToLatest("auto"));
  }

  async function submitActiveChatTitle(event: FormEvent) {
    event.preventDefault();
    const title = chatTitleDraft.trim();
    if (!activeChatSession || !title || title === activeChatSession.title) return;

    setIsChatTitleSaving(true);
    try {
      await props.onUpdateChatSessionTitle(activeChatSession, title);
    } finally {
      setIsChatTitleSaving(false);
    }
  }

  async function copyActiveChatMarkdown() {
    if (!activeChatSession) return;
    await props.onCopyChatSession(activeChatSession);
    setIsChatMarkdownCopied(true);
    if (chatCopyTimerRef.current != null) window.clearTimeout(chatCopyTimerRef.current);
    chatCopyTimerRef.current = window.setTimeout(() => {
      setIsChatMarkdownCopied(false);
      chatCopyTimerRef.current = null;
    }, 1600);
  }

  const copyChatMessageMarkdown = useCallback(async (message: ChatMessage) => {
    await writeClipboardText(buildChatMessageContentMarkdown(message));
    setCopiedMessageId(message.id);
    if (messageCopyTimerRef.current != null) window.clearTimeout(messageCopyTimerRef.current);
    messageCopyTimerRef.current = window.setTimeout(() => {
      setCopiedMessageId(null);
      messageCopyTimerRef.current = null;
    }, 1400);
  }, []);

  return (
    <aside className={["chat-panel", props.className].filter(Boolean).join(" ")}>
      <ChatPanelHeader
        activeChatSession={activeChatSession}
        chatTitleDraft={chatTitleDraft}
        isChatMarkdownCopied={isChatMarkdownCopied}
        isChatSessionCreating={props.isChatSessionCreating}
        isChatSessionsLoading={props.isChatSessionsLoading}
        isChatTitleSaving={isChatTitleSaving}
        hideActiveHeaderActions={props.hideActiveHeaderActions}
        hideCollapseButton={props.hideCollapseButton}
        mobileHeaderInset={props.mobileHeaderInset}
        showListBackButton={props.showListBackButton}
        onBack={props.onBack}
        onChatTitleChange={setChatTitleDraft}
        onCopyActiveChat={() => void copyActiveChatMarkdown()}
        onCreateChatSession={props.onCreateChatSession}
        mobileHeaderAction={props.mobileHeaderAction}
        onOpenChatList={props.onOpenChatList}
        onSubmitChatTitle={submitActiveChatTitle}
        onToggleChat={props.onToggleChat}
      />
      {props.activeChatId ? (
        <>
          <div className="chat-log-frame">
            <div
              className="chat-log"
              ref={chatLogRef}
              onScroll={handleChatLogScroll}
              onTouchStart={pauseChatAutoScroll}
              onWheel={pauseChatAutoScroll}
            >
              {props.isChatDetailLoading ? (
                <LoadingState
                  title="대화 내용을 불러오는 중입니다"
                  detail="느린 연결에서는 메시지와 변경 내역 동기화가 잠시 걸릴 수 있습니다."
                  compact
                />
              ) : null}
              {!props.isChatDetailLoading && props.messages.length === 0 ? (
                <div className="assistant-message">
                  <p>전체 일정 조정, 날짜별 권역 변경, 장소 추가 요청을 이곳에서 이어갈 수 있습니다.</p>
                </div>
              ) : null}
              {!props.isChatDetailLoading ? props.messages.map((message, index) => (
                <ChatMessageBubble
                  copied={copiedMessageId === message.id}
                  durationMs={messageMeta.get(message.id)?.durationMs ?? null}
                  editRun={messageMeta.get(message.id)?.editRun ?? null}
                  key={message.id}
                  message={message}
                  messageIndex={index + 1}
                  onCopyMessage={copyChatMessageMarkdown}
                />
              )) : null}
              {props.isChatSending ? (
                <div className={props.chatStreamingText ? "assistant-message streaming" : "assistant-message pending"}>
                  {props.chatStreamingText ? (
                    <>
                      {props.chatActivity ? (
                        <div className="chat-activity-strip">
                          <ChatPendingStatus
                            activity={props.chatActivity}
                            elapsedSeconds={props.chatElapsedSeconds}
                            label={props.chatStreamLabel}
                          />
                        </div>
                      ) : null}
                      <MarkdownContent content={props.chatStreamingText} />
                    </>
                  ) : (
                    <ChatPendingStatus
                      activity={props.chatActivity}
                      elapsedSeconds={props.chatElapsedSeconds}
                      label={props.chatStreamLabel}
                    />
                  )}
                  <OperationPreviewList items={props.chatOperationPreview} status="pending" defaultOpen />
                </div>
              ) : null}
            </div>
            {showScrollToLatest ? (
              <button className="chat-scroll-latest" type="button" onClick={() => scrollChatToLatest()}>
                <ChevronDown size={14} />
                최신으로
              </button>
            ) : null}
          </div>
          <ChatComposer
            pendingChatAttachments={props.pendingChatAttachments}
            chatText={props.chatText}
            isChatDetailLoading={props.isChatDetailLoading}
            isChatSending={props.isChatSending}
            onAddChatFiles={props.onAddChatFiles}
            onRemovePendingChatAttachment={props.onRemovePendingChatAttachment}
            onChatTextChange={props.onChatTextChange}
            onSubmitChat={submitChatForm}
            onStopChat={props.onStopChat}
          />
        </>
      ) : (
        <ChatHome
          sessions={props.chatSessions}
          checkpoints={props.checkpoints}
          creating={props.isChatSessionCreating}
          loading={props.isChatSessionsLoading}
          rollingBack={props.isRollingBack}
          onCreateSession={props.onCreateChatSession}
          onSelectSession={props.onSelectChatSession}
          onRenameSession={props.onRenameChatSession}
          onCopySession={props.onCopyChatSession}
          onDeleteSession={props.onDeleteChatSession}
          onRollbackCheckpoint={props.onRollbackCheckpoint}
        />
      )}
    </aside>
  );
}

type MessageRenderMeta = {
  durationMs: number | null;
  editRun: AiEditRunSummary | null;
};

function buildMessageRenderMeta(messages: ChatMessage[], editRuns: AiEditRunSummary[]): Map<string, MessageRenderMeta> {
  const editRunByAssistantMessageId = new Map<string, AiEditRunSummary>();
  editRuns.forEach((run) => {
    if (run.assistantMessageId) editRunByAssistantMessageId.set(run.assistantMessageId, run);
  });

  const metaByMessageId = new Map<string, MessageRenderMeta>();
  let previousUserMessage: ChatMessage | null = null;
  messages.forEach((message) => {
    const isUser = message.role === "user";
    const editRun = isUser ? null : editRunByAssistantMessageId.get(message.id) ?? null;
    metaByMessageId.set(message.id, {
      durationMs: isUser ? null : messageDurationMsFromRun(message, editRun, previousUserMessage),
      editRun
    });
    if (isUser) previousUserMessage = message;
  });
  return metaByMessageId;
}
