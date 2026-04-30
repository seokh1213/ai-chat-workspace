import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getChatSession } from "./chatApi";
import type { AiEditRunSummary, ChatMessage, ChatRunActivityEvent } from "./chatTypes";

export type UseChatStreamState = {
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
  isSending: boolean;
  streamLabel: string | null;
  activity: ChatRunActivityEvent | null;
  streamingText: string;
  operationPreview: string[];
  elapsedSeconds: number;
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setEditRuns: Dispatch<SetStateAction<AiEditRunSummary[]>>;
};

export function useChatStream(chatSessionId: string | null): UseChatStreamState {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [editRuns, setEditRuns] = useState<AiEditRunSummary[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [streamLabel, setStreamLabel] = useState<string | null>(null);
  const [activity, setActivity] = useState<ChatRunActivityEvent | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [operationPreview, setOperationPreview] = useState<string[]>([]);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const queueRef = useRef("");
  const pumpRef = useRef<number | null>(null);
  const deltaSeenRef = useRef(false);

  useEffect(() => {
    if (!isSending || startedAtMs == null) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isSending, startedAtMs]);

  useEffect(() => {
    if (!chatSessionId) return;

    clearStreamQueue();
    setStreamingText("");
    const source = new EventSource(`/api/chat-sessions/${encodeURIComponent(chatSessionId)}/events`);

    source.addEventListener("run.started", (event) => {
      const data = parseSseData<{ createdAt?: string; message?: string }>(event);
      clearStreamQueue();
      setIsSending(true);
      setStreamingText("");
      setActivity(null);
      setStartedAtMs(parseEventTimeMs(data?.createdAt) ?? Date.now());
      setStreamLabel(data?.message ?? "요청을 분석하는 중입니다.");
    });

    source.addEventListener("run.activity", (event) => {
      const data = parseSseData<ChatRunActivityEvent>(event);
      if (!data) return;
      setIsSending(true);
      setActivity(data);
      setStreamLabel(data.label);
    });

    source.addEventListener("assistant.message.delta", (event) => {
      const data = parseSseData<{ delta?: string }>(event);
      if (!data?.delta) return;
      setIsSending(true);
      setStartedAtMs((current) => current ?? Date.now());
      enqueueDelta(data.delta);
      setActivity(null);
      setStreamLabel(null);
    });

    source.addEventListener("assistant.message.completed", (event) => {
      const data = parseSseData<{ content?: string }>(event);
      if (data?.content && !deltaSeenRef.current) {
        setIsSending(true);
        setStreamingText(data.content);
        setActivity(null);
        setStreamLabel(null);
      }
    });

    source.addEventListener("operations.proposed", (event) => {
      const data = parseSseData<{ operationCount?: number; operationPreview?: string[] }>(event);
      setOperationPreview(data?.operationPreview ?? []);
      setStreamLabel(data?.operationCount ? "변경안을 검증하는 중입니다." : "응답을 정리하는 중입니다.");
    });

    const refreshCompletedRun = async (run: AiEditRunSummary | null) => {
      try {
        const detail = await getChatSession(chatSessionId);
        setMessages(detail.messages);
        setEditRuns(detail.editRuns);
      } finally {
        setIsSending(false);
        setStreamingText("");
        setOperationPreview([]);
        setActivity(null);
        setStartedAtMs(null);
        clearStreamQueue();
      }
    };

    const onCompleted = (event: MessageEvent) => {
      const run = parseSseData<AiEditRunSummary>(event);
      if (run?.id) {
        setEditRuns((current) => [run, ...current.filter((candidate) => candidate.id !== run.id)]);
      }
      void waitForStreamDrain().then(() => refreshCompletedRun(run));
    };

    source.addEventListener("run.applied", onCompleted);
    source.addEventListener("run.completed", onCompleted);
    source.addEventListener("run.failed", onCompleted);
    source.addEventListener("run.cancelled", onCompleted);
    source.onerror = (event) => console.debug("chat event stream error", event);

    return () => {
      source.close();
      clearStreamQueue();
    };
  }, [chatSessionId]);

  function enqueueDelta(delta: string) {
    if (!delta) return;
    deltaSeenRef.current = true;
    queueRef.current += delta;
    if (pumpRef.current != null) return;

    pumpRef.current = window.setInterval(() => {
      const queued = queueRef.current;
      if (!queued) {
        clearStreamPumpOnly();
        return;
      }
      const chunkSize = queued.length > 600 ? 28 : queued.length > 180 ? 14 : 7;
      const chunk = queued.slice(0, chunkSize);
      queueRef.current = queued.slice(chunk.length);
      setStreamingText((current) => `${current}${chunk}`);
    }, 24);
  }

  function clearStreamPumpOnly() {
    if (pumpRef.current != null) {
      window.clearInterval(pumpRef.current);
      pumpRef.current = null;
    }
  }

  function clearStreamQueue() {
    clearStreamPumpOnly();
    queueRef.current = "";
    deltaSeenRef.current = false;
  }

  function waitForStreamDrain(timeoutMs = 5000): Promise<void> {
    const startedAt = window.performance.now();
    return new Promise((resolve) => {
      const poll = () => {
        const elapsed = window.performance.now() - startedAt;
        if ((!queueRef.current && pumpRef.current == null) || elapsed >= timeoutMs) {
          resolve();
          return;
        }
        window.setTimeout(poll, 40);
      };
      poll();
    });
  }

  return {
    messages,
    editRuns,
    isSending,
    streamLabel,
    activity,
    streamingText,
    operationPreview,
    elapsedSeconds,
    setMessages,
    setEditRuns
  };
}

function parseSseData<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

function parseEventTimeMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}
