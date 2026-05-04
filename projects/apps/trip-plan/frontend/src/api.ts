import type {
  AiProviderStatus,
  CancelChatRunResponse,
  ChatAttachment,
  ChatMessage,
  ChatMessageRun,
  ChatSession,
  ChatSessionDetail,
  CreateTripRequest,
  ItineraryItem,
  Place,
  SetupAssistantMessage,
  SetupAssistantResponse,
  Trip,
  TripState,
  UpdateWorkspaceRequest,
  UpdateTripRequest,
  UpsertItineraryItemRequest,
  UpsertPlaceRequest,
  Workspace
} from "./types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getWorkspaces(): Promise<Workspace[]> {
  return requestJson<Workspace[]>("/api/workspaces");
}

export function createWorkspace(name: string): Promise<Workspace> {
  return requestJson<Workspace>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify({ name })
  });
}

export function updateWorkspace(workspaceId: string, payload: UpdateWorkspaceRequest): Promise<Workspace> {
  return requestJson<Workspace>(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function getTrips(workspaceId: string): Promise<Trip[]> {
  return requestJson<Trip[]>(`/api/workspaces/${workspaceId}/trips`);
}

export function createTrip(workspaceId: string, payload: CreateTripRequest): Promise<Trip> {
  return requestJson<Trip>(`/api/workspaces/${workspaceId}/trips`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTrip(tripId: string, payload: UpdateTripRequest): Promise<Trip> {
  return requestJson<Trip>(`/api/trips/${tripId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteTrip(tripId: string): Promise<void> {
  const response = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function getTripState(tripId: string): Promise<TripState> {
  return requestJson<TripState>(`/api/trips/${tripId}/state`);
}

export function rollbackCheckpoint(checkpointId: string): Promise<TripState> {
  return requestJson<TripState>(`/api/checkpoints/${checkpointId}/rollback`, {
    method: "POST"
  });
}

export function addItineraryItem(dayId: string, payload: UpsertItineraryItemRequest): Promise<ItineraryItem> {
  return requestJson<ItineraryItem>(`/api/trip-days/${dayId}/items`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateItineraryItem(itemId: string, payload: UpsertItineraryItemRequest): Promise<ItineraryItem> {
  return requestJson<ItineraryItem>(`/api/itinerary-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteItineraryItem(itemId: string): Promise<void> {
  const response = await fetch(`/api/itinerary-items/${itemId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function updatePlace(placeId: string, payload: UpsertPlaceRequest): Promise<Place> {
  return requestJson<Place>(`/api/places/${placeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function addPlace(tripId: string, payload: UpsertPlaceRequest): Promise<Place> {
  return requestJson<Place>(`/api/trips/${tripId}/places`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deletePlace(placeId: string): Promise<void> {
  const response = await fetch(`/api/places/${placeId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function getChatSessions(tripId: string): Promise<ChatSession[]> {
  return requestJson<ChatSession[]>(`/api/trips/${tripId}/chat-sessions`);
}

export function getAiProviderStatuses(): Promise<AiProviderStatus[]> {
  return requestJson<AiProviderStatus[]>("/api/ai/providers");
}

export function createChatSession(tripId: string, title: string): Promise<ChatSession> {
  return requestJson<ChatSession>(`/api/trips/${tripId}/chat-sessions`, {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

export function importSetupChatSession(
  tripId: string,
  title: string,
  messages: SetupAssistantMessage[]
): Promise<ChatSessionDetail> {
  return requestJson<ChatSessionDetail>(`/api/trips/${tripId}/chat-sessions/import-setup`, {
    method: "POST",
    body: JSON.stringify({
      title,
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
        durationMs: message.durationMs ?? null,
        appliedActions: message.appliedActions ?? []
      }))
    })
  });
}

export function updateChatSession(sessionId: string, title: string): Promise<ChatSession> {
  return requestJson<ChatSession>(`/api/chat-sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ title })
  });
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/chat-sessions/${sessionId}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function getChatSession(sessionId: string): Promise<ChatSessionDetail> {
  return requestJson<ChatSessionDetail>(`/api/chat-sessions/${sessionId}`);
}

export function sendChatMessage(
  sessionId: string,
  content: string,
  attachmentIds: string[] = [],
  signal?: AbortSignal
): Promise<ChatMessageRun> {
  return requestJson<ChatMessageRun>(`/api/chat-sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, attachmentIds }),
    signal
  });
}

export async function uploadChatAttachment(sessionId: string, file: File): Promise<ChatAttachment> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch(`/api/chat-sessions/${sessionId}/attachments`, {
    method: "POST",
    body
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json() as Promise<ChatAttachment>;
}

export async function deleteChatAttachment(sessionId: string, attachmentId: string): Promise<void> {
  const response = await fetch(`/api/chat-sessions/${sessionId}/attachments/${attachmentId}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function cancelCurrentChatRun(sessionId: string): Promise<CancelChatRunResponse> {
  return requestJson<CancelChatRunResponse>(`/api/chat-sessions/${sessionId}/runs/current/cancel`, {
    method: "POST"
  });
}

export function sendSetupAssistantMessage(
  content: string,
  draftTrip: CreateTripRequest,
  messages: SetupAssistantMessage[]
): Promise<SetupAssistantResponse> {
  return requestJson<SetupAssistantResponse>("/api/setup-assistant/messages", {
    method: "POST",
    body: JSON.stringify({
      content,
      draftTrip,
      messages: messages.map((message) => ({ role: message.role, content: message.content }))
    })
  });
}
