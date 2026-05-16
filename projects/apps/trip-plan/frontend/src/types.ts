export type Workspace = {
  id: string;
  name: string;
  aiProvider: string;
  aiModel: string;
  aiEffort: string;
  openAiBaseUrl: string | null;
  openAiApiKey: string | null;
  openRouterApiKey: string | null;
  openRouterReferer: string | null;
  openRouterTitle: string | null;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateWorkspaceRequest = {
  name?: string;
  aiProvider?: string;
  aiModel?: string;
  aiEffort?: string;
  openAiBaseUrl?: string;
  openAiApiKey?: string;
  openRouterApiKey?: string;
  openRouterReferer?: string;
  openRouterTitle?: string;
};

export type Trip = {
  id: string;
  workspaceId: string;
  title: string;
  destinationName: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTripRequest = {
  title: string;
  destinationName?: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  startDate?: string;
  endDate?: string;
  timezone?: string;
};

export type UpdateTripRequest = CreateTripRequest;

export type TripFormState = {
  title: string;
  destinationName: string;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string;
  endDate: string;
};

export type TripTextField = "title" | "destinationName" | "startDate" | "endDate";

export type TripDay = {
  id: string;
  tripId: string;
  dayNumber: number;
  dateText: string | null;
  weekday: string | null;
  title: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Place = {
  id: string;
  tripId: string;
  name: string;
  category: string | null;
  rating: string | null;
  reviews: string | null;
  note: string | null;
  address: string | null;
  source: string | null;
  sourceUrl: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  rawJson: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertPlaceRequest = {
  name: string;
  category?: string;
  note?: string;
  address?: string;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
};

export type ItineraryItem = {
  id: string;
  tripDayId: string;
  placeId: string | null;
  type: string;
  title: string;
  category: string | null;
  timeText: string | null;
  durationMinutes: number | null;
  memo: string | null;
  lat: number | null;
  lng: number | null;
  sortOrder: number;
  locked: boolean;
  rawJson: string;
  createdAt: string;
  updatedAt: string;
};

export type UpsertItineraryItemRequest = {
  title: string;
  type?: string;
  category?: string;
  timeText?: string;
  durationMinutes?: number;
  memo?: string;
  lat?: number;
  lng?: number;
};

export type TripState = {
  trip: Trip;
  days: TripDay[];
  places: Place[];
  itineraryItems: ItineraryItem[];
  latestCheckpoint: CheckpointSummary | null;
  checkpoints: CheckpointSummary[];
};

export type CheckpointSummary = {
  id: string;
  label: string | null;
  reason: string | null;
  source: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  tripId: string;
  title: string;
  provider: string;
  model: string | null;
  status: string;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  status: string;
  metadataJson: string;
  createdAt: string;
  attachments: ChatAttachment[];
};

export type ChatAttachment = {
  id: string;
  chatSessionId: string;
  chatMessageId: string | null;
  fileName: string;
  contentType: string;
  byteSize: number;
  kind: "image" | "file" | string;
  downloadUrl: string;
  textPreview: string | null;
  createdAt: string;
};

export type ChatSessionDetail = {
  session: ChatSession;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
};

export type ChatMessagePair = {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  tripState: TripState | null;
  checkpoint: CheckpointSummary | null;
  editRun: AiEditRunSummary | null;
};

export type ChatMessageRun = {
  runId: string;
  userMessage: ChatMessage;
};

export type ChatRunActivityEvent = {
  runId: string;
  kind: string;
  label: string;
  detail: string | null;
  rawType: string | null;
  createdAt: string;
};

export type CancelChatRunResponse = {
  runId: string | null;
  cancelled: boolean;
  message: string;
};

export type AiEditRunSummary = {
  id: string;
  tripId: string;
  chatSessionId: string | null;
  providerSessionId: string | null;
  provider: string;
  model: string | null;
  providerRunId: string | null;
  userMessageId: string | null;
  assistantMessageId: string | null;
  status: string;
  error: string | null;
  checkpointId: string | null;
  operationCount: number;
  operationPreview: string[];
  durationMs: number | null;
  createdAt: string;
};

export type AiProviderStatus = {
  id: string;
  displayName: string;
  available: boolean;
  status: string;
  detail: string | null;
  checks: AiProviderCheck[];
};

export type AiProviderCheck = {
  label: string;
  status: string;
  detail: string | null;
};

export type SetupAssistantMessage = {
  role: "user" | "assistant";
  content: string;
  durationMs?: number;
  appliedActions?: string[];
};

export type SetupAssistantAction = {
  type: "updateDraftTrip";
  title: string | null;
  destinationName: string | null;
  destinationLat: number | null;
  destinationLng: number | null;
  startDate: string | null;
  endDate: string | null;
  reason: string | null;
};

export type SetupAssistantResponse = {
  message: SetupAssistantMessage;
  actions: SetupAssistantAction[];
};
