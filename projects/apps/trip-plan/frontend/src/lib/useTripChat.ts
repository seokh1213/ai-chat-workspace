import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef, useState } from "react";

import {
  cancelCurrentChatRun,
  createChatSession,
  deleteChatSession,
  getChatSession,
  getChatSessions,
  sendChatMessage,
  updateChatSession
} from "../api";
import type { AiEditRunSummary, ChatAttachment, ChatMessage, ChatSession, Trip, TripDay, TripState } from "../types";
import { buildChatSessionMarkdown, isAbortError, sortChatMessages } from "./chat";
import { readChatDraft, removeChatDraft, writeChatDraft } from "./chatDraft";
import { writeClipboardText } from "./dom";
import { readError } from "./format";
import { pushAppPath } from "./route";
import { useChatEventStream } from "./useChatEventStream";
import { usePendingChatAttachments } from "./usePendingChatAttachments";

interface UseTripChatProps {
  activeTrip: Trip | null;
  selectedDay: TripDay | undefined;
  setTripState: Dispatch<SetStateAction<TripState | null>>;
  setSelectedDayId: Dispatch<SetStateAction<string>>;
  refreshProviderStatuses: () => Promise<void>;
}

export function useTripChat({
  activeTrip,
  selectedDay,
  setTripState,
  setSelectedDayId,
  refreshProviderStatuses
}: UseTripChatProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editRuns, setEditRuns] = useState<AiEditRunSummary[]>([]);
  const [isChatSessionsLoading, setIsChatSessionsLoading] = useState(false);
  const [isChatDetailLoading, setIsChatDetailLoading] = useState(false);
  const [chatText, setChatText] = useState("");
  const [isChatSessionCreating, setIsChatSessionCreating] = useState(false);
  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const chatLoadRequestRef = useRef(0);
  const {
    pendingChatAttachments,
    clearPendingChatAttachments,
    removePendingChatAttachment,
    addPendingChatFiles
  } = usePendingChatAttachments(activeChatId);
  const chatStream = useChatEventStream({
    activeChatId,
    tripId: activeTrip?.id ?? null,
    setChatSessions,
    setMessages,
    setEditRuns,
    setTripState,
    setSelectedDayId
  });

  useEffect(() => {
    const tripId = activeTrip?.id;
    if (!tripId || !activeChatId) return;
    writeChatDraft(tripId, activeChatId, chatText);
  }, [activeChatId, activeTrip?.id, chatText]);

  function cancelChatLoading() {
    ++chatLoadRequestRef.current;
    setIsChatSessionsLoading(false);
    setIsChatDetailLoading(false);
  }

  function prepareTripOpen() {
    clearPendingChatAttachments();
    setChatSessions([]);
    setChatSessionId("");
    setActiveChatId(null);
    setMessages([]);
    setEditRuns([]);
    setChatText("");
  }

  async function loadChat(tripId: string, preferredSessionId?: string) {
    const requestId = ++chatLoadRequestRef.current;
    setIsChatSessionsLoading(true);
    setIsChatDetailLoading(false);
    try {
      const sessions = await getChatSessions(tripId);
      if (requestId !== chatLoadRequestRef.current) return;
      setChatSessions(sessions);
      const session = sessions.find((candidate) => candidate.id === preferredSessionId);
      if (session) {
        setChatText(readChatDraft(tripId, session.id));
        setChatSessionId(session.id);
        setActiveChatId(session.id);
        setMessages([]);
        setEditRuns([]);
        setIsChatDetailLoading(true);
        try {
          const detail = await getChatSession(session.id);
          if (requestId !== chatLoadRequestRef.current) return;
          setMessages(detail.messages);
          setEditRuns(detail.editRuns);
        } finally {
          if (requestId === chatLoadRequestRef.current) {
            setIsChatDetailLoading(false);
          }
        }
        return;
      }

      setChatSessionId("");
      setActiveChatId(null);
      setMessages([]);
      setEditRuns([]);
      setChatText("");
    } catch (nextError) {
      if (requestId === chatLoadRequestRef.current) {
        window.alert(readError(nextError));
      }
    } finally {
      if (requestId === chatLoadRequestRef.current) {
        setIsChatSessionsLoading(false);
      }
    }
  }

  async function selectChatSession(sessionId: string) {
    if (sessionId === chatSessionId) return;
    const requestId = ++chatLoadRequestRef.current;
    clearPendingChatAttachments();
    setChatText(activeTrip ? readChatDraft(activeTrip.id, sessionId) : "");
    setChatSessionId(sessionId);
    setActiveChatId(sessionId);
    setMessages([]);
    setEditRuns([]);
    setIsChatDetailLoading(true);
    try {
      const detail = await getChatSession(sessionId);
      if (requestId !== chatLoadRequestRef.current) return;
      setMessages(detail.messages);
      setEditRuns(detail.editRuns);
      if (activeTrip) {
        pushChatPath(activeTrip.id, sessionId);
      }
    } catch (nextError) {
      if (requestId === chatLoadRequestRef.current) {
        window.alert(readError(nextError));
      }
    } finally {
      if (requestId === chatLoadRequestRef.current) {
        setIsChatDetailLoading(false);
      }
    }
  }

  async function createNextChatSession() {
    if (!activeTrip) return;
    setIsChatSessionCreating(true);
    try {
      await refreshProviderStatuses();
      const title = selectedDay ? `Day ${selectedDay.dayNumber} 일정 조율` : `전체 일정 조율 ${chatSessions.length + 1}`;
      const session = await createChatSession(activeTrip.id, title);
      ++chatLoadRequestRef.current;
      clearPendingChatAttachments();
      setChatSessions((current) => [session, ...current]);
      setChatSessionId(session.id);
      setActiveChatId(session.id);
      setMessages([]);
      setEditRuns([]);
      setIsChatDetailLoading(false);
      setChatText("");
      pushChatPath(activeTrip.id, session.id);
    } finally {
      setIsChatSessionCreating(false);
    }
  }

  function openChatList() {
    if (!activeTrip) return;
    ++chatLoadRequestRef.current;
    clearPendingChatAttachments();
    setChatSessionId("");
    setActiveChatId(null);
    setMessages([]);
    setEditRuns([]);
    setIsChatDetailLoading(false);
    setChatText("");
    pushAppPath(`/trips/${encodeURIComponent(activeTrip.id)}`);
  }

  async function renameChat(session: ChatSession) {
    const title = window.prompt("대화 이름", session.title)?.trim();
    if (!title) return;
    await updateChatTitle(session, title);
  }

  async function updateChatTitle(session: ChatSession, title: string) {
    const nextTitle = title.trim();
    if (!nextTitle || nextTitle === session.title) return;

    try {
      const updated = await updateChatSession(session.id, nextTitle);
      setChatSessions((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    } catch (nextError) {
      window.alert(readError(nextError));
      throw nextError;
    }
  }

  async function copyChatSessionMarkdown(session: ChatSession) {
    if (!activeTrip) return;

    try {
      const detail = session.id === activeChatId
        ? { session, messages, editRuns }
        : await getChatSession(session.id);
      await writeClipboardText(
        buildChatSessionMarkdown({
          trip: activeTrip,
          session: detail.session,
          messages: detail.messages,
          runs: detail.editRuns
        })
      );
    } catch (nextError) {
      window.alert(readError(nextError));
      throw nextError;
    }
  }

  async function removeChat(session: ChatSession) {
    if (!window.confirm(`'${session.title}' 대화를 삭제할까요?`)) return;

    try {
      await deleteChatSession(session.id);
      if (activeTrip) {
        removeChatDraft(activeTrip.id, session.id);
      }
      setChatSessions((current) => current.filter((candidate) => candidate.id !== session.id));
      if (activeChatId === session.id) {
        openChatList();
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const content = chatText.trim();
    const readyAttachments = pendingChatAttachments
      .filter((item) => item.status === "ready" && item.attachment)
      .map((item) => item.attachment as ChatAttachment);
    if ((!content && readyAttachments.length === 0) || !chatSessionId) return;
    if (pendingChatAttachments.some((item) => item.status === "queued" || item.status === "uploading")) return;
    if (pendingChatAttachments.some((item) => item.status === "failed")) {
      window.alert("업로드에 실패한 첨부를 제거한 뒤 전송해 주세요.");
      return;
    }

    const abortController = new AbortController();
    chatAbortControllerRef.current = abortController;
    chatStream.startRequest();
    setChatText("");
    const startedAt = performance.now();
    const localUserMessage: ChatMessage = {
      id: `local_user_${Date.now()}`,
      chatSessionId,
      role: "user",
      content,
      status: "pending",
      metadataJson: "{}",
      createdAt: new Date().toISOString(),
      attachments: readyAttachments
    };
    setMessages((current) => [...current, localUserMessage]);
    let accepted = false;
    try {
      const run = await sendChatMessage(chatSessionId, content, readyAttachments.map((attachment) => attachment.id), abortController.signal);
      accepted = true;
      clearPendingChatAttachments(false);
      chatStream.markRunAccepted(run.runId);
      setMessages((current) =>
        sortChatMessages([
          ...current.filter((message) => message.id !== localUserMessage.id && message.id !== run.userMessage.id),
          run.userMessage
        ])
      );
    } catch (nextError) {
      if (isAbortError(nextError)) {
        chatStream.markAbortHandled();
        setMessages((current) => [
          ...current.map((message) =>
            message.id === localUserMessage.id ? { ...message, status: "completed" } : message
          ),
          makeLocalAssistantMessage(chatSessionId, "응답 생성을 중지했습니다. 변경 사항은 적용하지 않습니다.", "cancelled", startedAt)
        ]);
        return;
      }
      setMessages((current) => [
        ...current,
        makeLocalAssistantMessage(chatSessionId, `요청을 처리하지 못했습니다. ${readError(nextError)}`, "failed", startedAt)
      ]);
      chatStream.markSendFailure();
    } finally {
      if (chatAbortControllerRef.current === abortController) {
        chatAbortControllerRef.current = null;
      }
      if (!accepted) chatStream.completeUnacceptedSend(abortController.signal.aborted);
    }
  }

  async function stopChatResponse() {
    if (!chatSessionId || !chatStream.isChatSending) return;
    chatAbortControllerRef.current?.abort();
    chatStream.stopLocally();

    try {
      await cancelCurrentChatRun(chatSessionId);
    } catch (nextError) {
      console.debug("chat run cancel failed", nextError);
    }
  }

  return {
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
    pendingChatAttachments,
    isChatSending: chatStream.isChatSending,
    chatStreamLabel: chatStream.chatStreamLabel,
    chatActivity: chatStream.chatActivity,
    chatElapsedSeconds: chatStream.chatElapsedSeconds,
    chatStreamingText: chatStream.chatStreamingText,
    chatOperationPreview: chatStream.chatOperationPreview,
    cancelChatLoading,
    prepareTripOpen,
    loadChat,
    selectChatSession,
    createNextChatSession,
    openChatList,
    renameChat,
    updateChatTitle,
    copyChatSessionMarkdown,
    removeChat,
    addPendingChatFiles,
    removePendingChatAttachment,
    submitChat,
    stopChatResponse
  };
}

function pushChatPath(tripId: string, sessionId: string) {
  pushAppPath(`/trips/${encodeURIComponent(tripId)}/chat/${encodeURIComponent(sessionId)}`);
}

function makeLocalAssistantMessage(
  chatSessionId: string,
  content: string,
  status: string,
  startedAt: number
): ChatMessage {
  return {
    id: `local_assistant_${Date.now()}`,
    chatSessionId,
    role: "assistant",
    content,
    status,
    metadataJson: JSON.stringify({ durationMs: performance.now() - startedAt }),
    createdAt: new Date().toISOString(),
    attachments: []
  };
}
