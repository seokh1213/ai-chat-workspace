export type Workspace = {
  id: string;
  name: string;
  aiProvider: string;
  aiSettingsJson: string;
  createdAt: string;
  updatedAt: string;
};

export type Plan = {
  id: string;
  workspaceId: string;
  title: string;
  summary: string | null;
  dueDate: string | null;
  status: "active" | "paused" | "done";
  currentView: ViewMode;
  createdAt: string;
  updatedAt: string;
};

export type ViewMode = "canvas" | "kanban" | "mindmap";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";

export type TaskNode = {
  id: string;
  planId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  x: number;
  y: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TaskLink = {
  id: string;
  planId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label: string | null;
  createdAt: string;
};

export type PlanDetail = {
  plan: Plan;
  tasks: TaskNode[];
  links: TaskLink[];
};

export type ChatSession = {
  id: string;
  planId: string;
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
  role: "user" | "assistant" | string;
  content: string;
  status: string;
  metadataJson: string;
  createdAt: string;
};

export type AiEditRun = {
  id: string;
  planId: string;
  chatSessionId: string;
  provider: string;
  model: string | null;
  userMessageId: string;
  assistantMessageId: string | null;
  operationsJson: string;
  status: string;
  error: string | null;
  checkpointId: string | null;
  durationMs: number | null;
  createdAt: string;
};

export type ChatSessionDetail = {
  session: ChatSession;
  messages: ChatMessage[];
  runs: AiEditRun[];
};

export type AiOperation = {
  op: string;
  taskId?: string | null;
  linkId?: string | null;
  patch?: Record<string, unknown>;
};

export type ChatStreamEvent =
  | { type: "run_started"; runId: string; message: string; createdAt: string }
  | { type: "assistant_delta"; runId: string; delta: string; createdAt: string }
  | {
      type: "run_completed";
      runId: string;
      content: string;
      operations: AiOperation[];
      operationCount: number;
      checkpointId: string | null;
      durationMs: number;
      detail: ChatSessionDetail;
      createdAt: string;
    }
  | { type: "run_failed"; runId: string; error: string; createdAt: string };

export type ProviderStatus = {
  provider: string;
  label: string;
  id?: string;
  displayName?: string;
  available: boolean;
  status?: string;
  detail: string;
  checks?: ProviderCheck[];
  models?: ProviderModel[];
};

export type ProviderCheck = {
  label: string;
  status: string;
  detail: string | null;
};

export type ProviderModel = {
  value: string;
  label: string;
  description: string;
};
