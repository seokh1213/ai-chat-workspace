import type { SendMessageResponse, TodoItem, TodoPatch, Workspace, WorkspaceForm, WorkspaceState } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchState(): Promise<WorkspaceState> {
  return request<WorkspaceState>("/api/state");
}

export function fetchWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>("/api/workspaces");
}

export function createWorkspace(form: WorkspaceForm): Promise<Workspace> {
  return request<Workspace>("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(form)
  });
}

export function updateWorkspace(workspaceId: string, form: Partial<WorkspaceForm>): Promise<Workspace> {
  return request<Workspace>(`/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    body: JSON.stringify(form)
  });
}

export function deleteWorkspace(workspaceId: string): Promise<void> {
  return request<void>(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
}

export function fetchWorkspaceState(workspaceId: string): Promise<WorkspaceState> {
  return request<WorkspaceState>(`/api/workspaces/${workspaceId}/state`);
}

export function sendMessage(workspaceId: string, content: string): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(`/api/workspaces/${workspaceId}/chat/messages`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
}

export function createTodo(workspaceId: string, title: string): Promise<TodoItem> {
  return request<TodoItem>(`/api/workspaces/${workspaceId}/todos`, {
    method: "POST",
    body: JSON.stringify({ title })
  });
}

export function updateTodo(workspaceId: string, id: string, patch: TodoPatch): Promise<TodoItem> {
  return request<TodoItem>(`/api/workspaces/${workspaceId}/todos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
}

export function deleteTodo(workspaceId: string, id: string): Promise<void> {
  return request<void>(`/api/workspaces/${workspaceId}/todos/${id}`, { method: "DELETE" });
}

export function resetWorkspace(workspaceId: string): Promise<WorkspaceState> {
  return request<WorkspaceState>(`/api/workspaces/${workspaceId}/reset`, { method: "POST" });
}
