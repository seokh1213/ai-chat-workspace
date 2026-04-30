export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatMessage = {
  id: string;
  chatSessionId: string;
  role: ChatRole;
  content: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  metadataJson: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  dataSpaceId: string;
  title: string;
  provider: string;
  model: string | null;
  status: string;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type AiEditRunSummary = {
  id: string;
  dataSpaceId: string;
  chatSessionId: string | null;
  provider: string;
  model: string | null;
  userMessageId: string | null;
  assistantMessageId: string | null;
  status: "completed" | "applied" | "failed" | "cancelled" | string;
  error: string | null;
  checkpointId: string | null;
  operationCount: number;
  operationPreview: string[];
  durationMs: number | null;
  createdAt: string;
};

export type ChatRunActivityEvent = {
  runId: string;
  kind: string;
  label: string;
  detail: string | null;
  rawType: string | null;
  createdAt: string;
};

export type ChatSessionDetail = {
  session: ChatSession;
  messages: ChatMessage[];
  editRuns: AiEditRunSummary[];
};

export type CreateChatMessageResponse = {
  runId: string;
  userMessage: ChatMessage;
};

