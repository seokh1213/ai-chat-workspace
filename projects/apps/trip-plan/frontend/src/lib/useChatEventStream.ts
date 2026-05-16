import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

import { getChatSession, getTripState } from "../api";
import type { AiEditRunSummary, ChatMessage, ChatRunActivityEvent, ChatSession, TripState } from "../types";
import { isTerminalChatRunStatus, parseEventTimeMs, parseSseData, sortChatMessages } from "./chat";
import { useStreamedTextBuffer } from "./useStreamedTextBuffer";

const chatEventSilenceTimeoutMs = 20_000;
const chatEventReconnectDelayMs = 500;

interface UseChatEventStreamProps {
  activeChatId: string | null;
  tripId: string | null;
  setChatSessions: Dispatch<SetStateAction<ChatSession[]>>;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setEditRuns: Dispatch<SetStateAction<AiEditRunSummary[]>>;
  setTripState: Dispatch<SetStateAction<TripState | null>>;
  setSelectedDayId: Dispatch<SetStateAction<string>>;
}

export function useChatEventStream({
  activeChatId,
  tripId,
  setChatSessions,
  setMessages,
  setEditRuns,
  setTripState,
  setSelectedDayId
}: UseChatEventStreamProps) {
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatStreamLabel, setChatStreamLabel] = useState<string | null>(null);
  const [chatActivity, setChatActivity] = useState<ChatRunActivityEvent | null>(null);
  const [chatStreamingText, setChatStreamingText] = useState("");
  const [chatOperationPreview, setChatOperationPreview] = useState<string[]>([]);
  const [chatRunStartedAtMs, setChatRunStartedAtMs] = useState<number | null>(null);
  const [chatElapsedSeconds, setChatElapsedSeconds] = useState(0);
  const streamText = useStreamedTextBuffer(setChatStreamingText);
  const streamMutedRef = useRef(false);
  const activeRunIdRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);
  const eventStreamControlRef = useRef<{ poke: () => void; restart: (reason: string) => void } | null>(null);

  useEffect(() => {
    if (!isChatSending || chatRunStartedAtMs == null) {
      setChatElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setChatElapsedSeconds(Math.max(0, Math.floor((Date.now() - chatRunStartedAtMs) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [chatRunStartedAtMs, isChatSending]);

  useEffect(() => {
    isSendingRef.current = isChatSending;
    if (isChatSending) {
      eventStreamControlRef.current?.poke();
    }
  }, [isChatSending]);

  useEffect(() => {
    if (!activeChatId) {
      isSendingRef.current = false;
      setIsChatSending(false);
      setChatStreamLabel(null);
      setChatActivity(null);
      setChatStreamingText("");
      setChatRunStartedAtMs(null);
      activeRunIdRef.current = null;
      streamText.clear();
      return;
    }

    const eventSessionId = activeChatId;
    streamMutedRef.current = false;
    streamText.clear();
    setChatStreamingText("");
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let silenceTimer: number | null = null;
    let lastServerEventAt = Date.now();
    let isDisposed = false;

    const shouldWatchStream = () => isSendingRef.current && !streamMutedRef.current;
    const clearSilenceTimer = () => {
      if (silenceTimer != null) {
        window.clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };
    const scheduleSilenceWatch = () => {
      clearSilenceTimer();
      if (!shouldWatchStream()) return;
      const elapsedMs = Date.now() - lastServerEventAt;
      silenceTimer = window.setTimeout(() => {
        if (isDisposed || !shouldWatchStream()) return;
        if (Date.now() - lastServerEventAt >= chatEventSilenceTimeoutMs) {
          restartEventStream("silent");
          return;
        }
        scheduleSilenceWatch();
      }, Math.max(0, chatEventSilenceTimeoutMs - elapsedMs));
    };
    const noteServerEvent = () => {
      lastServerEventAt = Date.now();
      scheduleSilenceWatch();
    };
    const refreshInterruptedStreamState = async () => {
      try {
        const detail = await getChatSession(eventSessionId);
        if (isDisposed) return;

        setChatSessions((current) => current.map((session) => (session.id === detail.session.id ? detail.session : session)));
        setMessages(detail.messages);
        setEditRuns(detail.editRuns);

        const activeRunId = activeRunIdRef.current;
        const activeRun = activeRunId ? detail.editRuns.find((run) => run.id === activeRunId) : null;
        const latestMessage = detail.messages[detail.messages.length - 1] ?? null;
        const activeRunFinished = activeRun ? isTerminalChatRunStatus(activeRun.status) : false;
        const latestMessageFinished = activeRunId != null && latestMessage?.role === "assistant";

        if (activeRunFinished || latestMessageFinished) {
          if (activeRun?.status === "applied" && tripId) {
            const nextState = await getTripState(tripId);
            if (!isDisposed) {
              setTripState(nextState);
              setSelectedDayId((currentDayId) =>
                nextState.days.some((day) => day.id === currentDayId) ? currentDayId : nextState.days[0]?.id ?? ""
              );
            }
          }
          if (!isDisposed) {
            clearLocalSendingState("응답 상태를 동기화했습니다.");
          }
        }
      } catch (nextError) {
        console.debug("chat stream recovery refresh failed", nextError);
      }
    };

    function restartEventStream(reason: string) {
      if (isDisposed) return;
      console.debug("chat event stream restarting", reason);
      clearSilenceTimer();
      source?.close();
      source = null;
      void refreshInterruptedStreamState();
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        if (!isDisposed) openEventStream();
      }, chatEventReconnectDelayMs);
    }

    const settle = (label: string) => {
      if (streamMutedRef.current) return;
      setChatStreamLabel(label);
      window.setTimeout(() => setChatStreamLabel(null), 1200);
    };
    const upsertLiveMessage = (message: ChatMessage | null) => {
      if (!message || message.chatSessionId !== eventSessionId) return;
      setMessages((current) => {
        const existingIndex = current.findIndex((candidate) => candidate.id === message.id);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = message;
          return next;
        }
        return sortChatMessages([...current, message]);
      });
    };
    const refreshCompletedRun = async (run: AiEditRunSummary | null) => {
      try {
        if (isDisposed) return;
        if (eventSessionId) {
          const detail = await getChatSession(eventSessionId);
          if (isDisposed) return;
          setChatSessions((current) => current.map((session) => (session.id === detail.session.id ? detail.session : session)));
          setMessages(detail.messages);
          setEditRuns(detail.editRuns);
        }
        if (run?.status === "applied" && tripId) {
          const nextState = await getTripState(tripId);
          if (isDisposed) return;
          setTripState(nextState);
          setSelectedDayId((currentDayId) =>
            nextState.days.some((day) => day.id === currentDayId) ? currentDayId : nextState.days[0]?.id ?? ""
          );
        }
      } catch (nextError) {
        console.debug("chat stream final refresh failed", nextError);
      } finally {
        if (!isDisposed) clearLocalSendingState();
      }
    };
    const onCompleted = (event: MessageEvent) => {
      noteServerEvent();
      const run = parseSseData<AiEditRunSummary>(event);
      activeRunIdRef.current = run?.id ?? activeRunIdRef.current;
      if (run?.id) {
        setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
      }
      settle(run?.status === "failed" ? "적용 실패" : "처리 완료");
      void streamText.waitForDrain().then(() => refreshCompletedRun(run ?? null));
    };

    function openEventStream() {
      source?.close();
      source = new EventSource(`/api/chat-sessions/${encodeURIComponent(eventSessionId)}/events`);
      source.addEventListener("ready", noteServerEvent);
      source.addEventListener("user.message.created", (event) => {
        noteServerEvent();
        upsertLiveMessage(parseSseData<ChatMessage>(event));
      });
      source.addEventListener("run.started", (event) => {
        noteServerEvent();
        const data = parseSseData<{ runId?: string; createdAt?: string; message?: string }>(event);
        activeRunIdRef.current = data?.runId ?? activeRunIdRef.current;
        streamMutedRef.current = false;
        streamText.clear();
        isSendingRef.current = true;
        setIsChatSending(true);
        setChatStreamingText("");
        setChatActivity(null);
        setChatRunStartedAtMs(parseEventTimeMs(data?.createdAt) ?? Date.now());
        setChatStreamLabel(data?.message ?? "요청을 분석하는 중입니다.");
      });
      source.addEventListener("run.activity", (event) => {
        noteServerEvent();
        if (streamMutedRef.current) return;
        const data = parseSseData<ChatRunActivityEvent>(event);
        if (!data) return;
        activeRunIdRef.current = data.runId ?? activeRunIdRef.current;
        isSendingRef.current = true;
        setIsChatSending(true);
        setChatActivity(data);
        setChatStreamLabel(data.label);
      });
      source.addEventListener("assistant.message.delta", (event) => {
        noteServerEvent();
        if (streamMutedRef.current) return;
        const data = parseSseData<{ runId?: string; delta?: string }>(event);
        activeRunIdRef.current = data?.runId ?? activeRunIdRef.current;
        if (data?.delta) {
          isSendingRef.current = true;
          setIsChatSending(true);
          setChatRunStartedAtMs((current) => current ?? Date.now());
          streamText.enqueue(data.delta);
          setChatActivity(null);
          setChatStreamLabel(null);
        }
      });
      source.addEventListener("assistant.message.completed", (event) => {
        noteServerEvent();
        if (streamMutedRef.current) return;
        const data = parseSseData<{ runId?: string; content?: string }>(event);
        activeRunIdRef.current = data?.runId ?? activeRunIdRef.current;
        if (data?.content && !streamText.hasSeenDelta()) {
          isSendingRef.current = true;
          setIsChatSending(true);
          setChatStreamingText(data.content);
          setChatActivity(null);
          setChatStreamLabel(null);
        }
      });
      source.addEventListener("operations.proposed", (event) => {
        noteServerEvent();
        if (streamMutedRef.current) return;
        const data = parseSseData<{ runId?: string; operationCount?: number; operationPreview?: string[] }>(event);
        activeRunIdRef.current = data?.runId ?? activeRunIdRef.current;
        setChatOperationPreview(data?.operationPreview ?? []);
        setChatStreamLabel(data?.operationCount ? "변경안을 검증하는 중입니다." : "응답을 정리하는 중입니다.");
      });
      source.addEventListener("run.applied", onCompleted);
      source.addEventListener("run.completed", onCompleted);
      source.addEventListener("run.failed", onCompleted);
      source.addEventListener("run.cancelled", (event) => {
        noteServerEvent();
        streamMutedRef.current = true;
        clearLocalSendingState("중지됨");
        const run = parseSseData<AiEditRunSummary>(event);
        if (run?.id) {
          setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
        }
        if (eventSessionId) {
          void getChatSession(eventSessionId).then((detail) => {
            if (isDisposed) return;
            setChatSessions((current) => current.map((session) => (session.id === detail.session.id ? detail.session : session)));
            setMessages(detail.messages);
            setEditRuns(detail.editRuns);
          }).catch((nextError) => {
            console.debug("chat cancel refresh failed", nextError);
          });
        }
      });
      source.addEventListener("run.snapshot", (event) => {
        noteServerEvent();
        const run = parseSseData<AiEditRunSummary>(event);
        if (run?.id) {
          setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
        }
      });
      source.onerror = (event) => {
        console.debug("chat event stream error", event);
        if (shouldWatchStream()) restartEventStream("error");
      };
      scheduleSilenceWatch();
    }

    eventStreamControlRef.current = {
      poke: () => {
        lastServerEventAt = Date.now();
        scheduleSilenceWatch();
      },
      restart: restartEventStream
    };
    openEventStream();

    return () => {
      isDisposed = true;
      if (eventStreamControlRef.current?.restart === restartEventStream) {
        eventStreamControlRef.current = null;
      }
      if (reconnectTimer != null) window.clearTimeout(reconnectTimer);
      clearSilenceTimer();
      source?.close();
      streamText.clear();
    };
  }, [activeChatId, tripId, setChatSessions, setEditRuns, setMessages, setSelectedDayId, setTripState]);

  function clearLocalSendingState(label?: string) {
    activeRunIdRef.current = null;
    isSendingRef.current = false;
    setIsChatSending(false);
    setChatStreamingText("");
    setChatOperationPreview([]);
    setChatActivity(null);
    setChatRunStartedAtMs(null);
    streamText.clear();
    if (label) {
      setChatStreamLabel(label);
      window.setTimeout(() => setChatStreamLabel(null), 1200);
    }
  }

  return {
    isChatSending,
    chatStreamLabel,
    chatActivity,
    chatElapsedSeconds,
    chatStreamingText,
    chatOperationPreview,
    startRequest: () => {
      streamMutedRef.current = false;
      activeRunIdRef.current = null;
      isSendingRef.current = true;
      streamText.clear();
      setIsChatSending(true);
      setChatStreamLabel("요청을 보내는 중입니다.");
      setChatActivity(null);
      setChatRunStartedAtMs(Date.now());
      setChatStreamingText("");
      setChatOperationPreview([]);
    },
    markRunAccepted: (runId: string) => {
      activeRunIdRef.current = runId;
    },
    markAbortHandled: () => {
      isSendingRef.current = false;
    },
    markSendFailure: () => clearLocalSendingState(),
    completeUnacceptedSend: (aborted: boolean) => {
      if (!aborted) {
        streamMutedRef.current = false;
        clearLocalSendingState();
      }
    },
    stopLocally: () => {
      streamMutedRef.current = true;
      clearLocalSendingState("중지됨");
    }
  };
}
