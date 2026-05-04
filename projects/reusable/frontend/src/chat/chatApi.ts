import type { ChatSessionDetail, CreateChatMessageResponse } from "./chatTypes";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
  return requestJson<ChatSessionDetail>(`/api/chat-sessions/${encodeURIComponent(sessionId)}`);
}

export function sendChatMessage(
  sessionId: string,
  content: string,
  signal?: AbortSignal
): Promise<CreateChatMessageResponse> {
  return requestJson<CreateChatMessageResponse>(`/api/chat-sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    signal,
    body: JSON.stringify({ content })
  });
}

export function cancelChatRun(sessionId: string): Promise<void> {
  return requestJson<void>(`/api/chat-sessions/${encodeURIComponent(sessionId)}/cancel`, {
    method: "POST"
  });
}

