const chatDraftStoragePrefix = "trip-planner-chat-draft";

function chatDraftStorageKey(tripId: string, chatSessionId: string): string {
  return `${chatDraftStoragePrefix}:${tripId}:${chatSessionId}`;
}

export function readChatDraft(tripId: string, chatSessionId: string): string {
  try {
    return window.localStorage.getItem(chatDraftStorageKey(tripId, chatSessionId)) ?? "";
  } catch {
    return "";
  }
}

export function writeChatDraft(tripId: string, chatSessionId: string, value: string) {
  try {
    const key = chatDraftStorageKey(tripId, chatSessionId);
    if (value.trim()) {
      window.localStorage.setItem(key, value);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Draft persistence is a UX enhancement; storage failures should not block chat input.
  }
}

export function removeChatDraft(tripId: string, chatSessionId: string) {
  try {
    window.localStorage.removeItem(chatDraftStorageKey(tripId, chatSessionId));
  } catch {
    // Ignore storage failures.
  }
}
