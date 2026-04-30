export type TodoStatus = "TODO" | "DOING" | "DONE";
export type TodoPriority = "LOW" | "MEDIUM" | "HIGH";
export type ChatRole = "USER" | "ASSISTANT";
export type RunStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type OperationType = "ADD_TODO" | "UPDATE_TODO" | "COMPLETE_TODO" | "DELETE_TODO";

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  priority: TodoPriority;
  createdAt: string;
  updatedAt: string;
}

export interface TodoPatch {
  title?: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
}

export interface TodoOperation {
  type: OperationType;
  todoId?: string;
  title?: string;
  description?: string;
  priority?: TodoPriority;
  patch?: TodoPatch;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  operations: TodoOperation[];
  durationMs?: number;
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  label: string;
  todoCount: number;
  createdAt: string;
}

export interface AiActivity {
  kind: string;
  label: string;
  detail?: string;
  rawType?: string;
}

export interface Workspace {
  id: string;
  name: string;
  aiProvider: string;
  aiModel: string;
  aiEffort: string;
  codexUrl: string;
  codexCwd?: string;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceForm {
  name: string;
  aiProvider?: string;
  aiModel?: string;
  aiEffort?: string;
  codexUrl?: string;
  codexCwd?: string;
}

export interface WorkspaceState {
  workspace: Workspace;
  todos: TodoItem[];
  messages: ChatMessage[];
  checkpoints: Checkpoint[];
}

export interface SendMessageResponse {
  runId: string;
  userMessage: ChatMessage;
}

export interface ChatRunEvent {
  type: string;
  runId: string;
  workspaceId?: string;
  status?: RunStatus;
  delta?: string;
  content?: string;
  message?: ChatMessage;
  operations?: TodoOperation[];
  activity?: AiActivity;
  state?: WorkspaceState;
  error?: string;
  createdAt: string;
}
