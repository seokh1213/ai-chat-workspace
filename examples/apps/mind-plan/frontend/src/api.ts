import type {
  ChatSession,
  ChatSessionDetail,
  ChatStreamEvent,
  Plan,
  PlanDetail,
  ProviderStatus,
  TaskLink,
  TaskNode,
  Workspace
} from "./types";

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  workspaces: () => request<Workspace[]>("/api/workspaces"),
  createWorkspace: (name: string) =>
    request<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ name }) }),
  updateWorkspace: (workspace: Workspace) =>
    request<Workspace>(`/api/workspaces/${workspace.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: workspace.name,
        aiProvider: workspace.aiProvider,
        aiSettingsJson: workspace.aiSettingsJson
      })
    }),
  deleteWorkspace: (workspaceId: string) =>
    request<void>(`/api/workspaces/${workspaceId}`, { method: "DELETE" }),
  providerStatus: (workspaceId: string) =>
    request<ProviderStatus[]>(`/api/workspaces/${workspaceId}/provider-status`),

  plans: (workspaceId: string) => request<Plan[]>(`/api/workspaces/${workspaceId}/plans`),
  createPlan: (workspaceId: string, input: { title: string; summary?: string; dueDate?: string }) =>
    request<PlanDetail>(`/api/workspaces/${workspaceId}/plans`, {
      method: "POST",
      body: JSON.stringify(input)
    }),
  planDetail: (planId: string) => request<PlanDetail>(`/api/plans/${planId}`),
  updatePlan: (plan: Plan) =>
    request<Plan>(`/api/plans/${plan.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: plan.title,
        summary: plan.summary,
        dueDate: plan.dueDate,
        status: plan.status,
        currentView: plan.currentView
      })
    }),
  deletePlan: (planId: string) => request<void>(`/api/plans/${planId}`, { method: "DELETE" }),

  createTask: (planId: string, input: Partial<TaskNode> & { title: string }) =>
    request<TaskNode>(`/api/plans/${planId}/tasks`, { method: "POST", body: JSON.stringify(input) }),
  updateTask: (task: TaskNode) =>
    request<TaskNode>(`/api/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        parentId: task.parentId,
        x: task.x,
        y: task.y,
        sortOrder: task.sortOrder
      })
    }),
  deleteTask: (taskId: string) => request<void>(`/api/tasks/${taskId}`, { method: "DELETE" }),
  createLink: (planId: string, input: { id?: string; sourceNodeId: string; targetNodeId: string; label?: string }) =>
    request<TaskLink>(`/api/plans/${planId}/links`, { method: "POST", body: JSON.stringify(input) }),
  deleteLink: (planId: string, linkId: string) =>
    request<void>(`/api/plans/${planId}/links/${linkId}`, { method: "DELETE" }),

  chatSessions: (planId: string) => request<ChatSession[]>(`/api/plans/${planId}/chat-sessions`),
  createChatSession: (
    planId: string,
    input: { title?: string; provider?: string; model?: string; settingsJson?: string } = {}
  ) =>
    request<ChatSession>(`/api/plans/${planId}/chat-sessions`, {
      method: "POST",
      body: JSON.stringify(input)
    }),
  chatDetail: (sessionId: string) => request<ChatSessionDetail>(`/api/chat-sessions/${sessionId}`),
  updateChatSession: (sessionId: string, title: string) =>
    request<ChatSession>(`/api/chat-sessions/${sessionId}`, {
      method: "PUT",
      body: JSON.stringify({ title })
    }),
  deleteChatSession: (sessionId: string) =>
    request<void>(`/api/chat-sessions/${sessionId}`, { method: "DELETE" })
};

export async function sendChatMessage(
  sessionId: string,
  content: string,
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  const response = await fetch(`/api/chat-sessions/${sessionId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content })
  });
  if (!response.ok || !response.body) {
    throw new Error(await response.text());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    parts.forEach((part) => {
      part
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean)
        .forEach((json) => onEvent(JSON.parse(json) as ChatStreamEvent));
    });
  }
}
