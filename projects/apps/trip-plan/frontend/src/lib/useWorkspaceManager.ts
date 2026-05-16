import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  createWorkspace,
  deleteWorkspace,
  getAiProviderStatuses,
  getTrips,
  getWorkspaces,
  updateWorkspace
} from "../api";
import type { AiProviderStatus, Trip, Workspace } from "../types";
import { readError } from "./format";
import { type WorkspaceSettingsForm, workspaceToSettingsForm } from "./workspaceSettings";

interface UseWorkspaceManagerProps {
  onActiveWorkspaceDeleted: () => void;
}

export function useWorkspaceManager({ onActiveWorkspaceDeleted }: UseWorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [settingsWorkspace, setSettingsWorkspace] = useState<Workspace | null>(null);
  const [workspaceSettingsForm, setWorkspaceSettingsForm] = useState<WorkspaceSettingsForm>(() => workspaceToSettingsForm(null));
  const [providerStatuses, setProviderStatuses] = useState<AiProviderStatus[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(false);
  const tripListRequestRef = useRef(0);

  useEffect(() => {
    if (workspaceId) {
      void loadTrips(workspaceId);
    }
  }, [workspaceId]);

  async function loadWorkspaces(): Promise<Workspace[]> {
    const nextWorkspaces = await getWorkspaces();
    const nextWorkspace = nextWorkspaces[0];
    setWorkspaces(nextWorkspaces);
    setWorkspaceId(nextWorkspace?.id ?? "");
    return nextWorkspaces;
  }

  async function loadTrips(nextWorkspaceId: string) {
    const requestId = ++tripListRequestRef.current;
    setIsTripsLoading(true);
    try {
      const nextTrips = await getTrips(nextWorkspaceId);
      if (requestId === tripListRequestRef.current) {
        setTrips(nextTrips);
      }
    } catch (nextError) {
      if (requestId === tripListRequestRef.current) {
        window.alert(readError(nextError));
      }
    } finally {
      if (requestId === tripListRequestRef.current) {
        setIsTripsLoading(false);
      }
    }
  }

  async function refreshProviderStatuses(): Promise<void> {
    try {
      const statuses = await getAiProviderStatuses();
      setProviderStatuses(statuses);
    } catch (nextError) {
      console.debug("provider status refresh failed", nextError);
    }
  }

  async function submitWorkspace(event: FormEvent) {
    event.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;
    const workspace = await createWorkspace(name);
    setWorkspaces((current) => [...current, workspace]);
    setWorkspaceId(workspace.id);
    setWorkspaceName("");
  }

  async function renameWorkspace(workspace: Workspace) {
    const name = window.prompt("워크스페이스 이름", workspace.name)?.trim();
    if (!name || name === workspace.name) return;

    try {
      const updated = await updateWorkspace(workspace.id, { name });
      setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  function openWorkspaceSettings(workspace: Workspace) {
    setSettingsWorkspace(workspace);
    setWorkspaceSettingsForm(workspaceToSettingsForm(workspace));
    void refreshProviderStatuses();
  }

  function closeWorkspaceSettings() {
    setSettingsWorkspace(null);
    setWorkspaceSettingsForm(workspaceToSettingsForm(null));
  }

  async function submitWorkspaceSettings(event: FormEvent) {
    event.preventDefault();
    if (!settingsWorkspace) return;

    try {
      const updated = await updateWorkspace(settingsWorkspace.id, {
        name: workspaceSettingsForm.name.trim(),
        aiProvider: workspaceSettingsForm.aiProvider,
        aiModel: workspaceSettingsForm.aiModel.trim(),
        aiEffort: workspaceSettingsForm.aiEffort,
        openAiBaseUrl: workspaceSettingsForm.openAiBaseUrl.trim(),
        openAiApiKey: workspaceSettingsForm.openAiApiKey.trim(),
        openRouterApiKey: workspaceSettingsForm.openRouterApiKey.trim(),
        openRouterReferer: workspaceSettingsForm.openRouterReferer.trim(),
        openRouterTitle: workspaceSettingsForm.openRouterTitle.trim()
      });
      setWorkspaces((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      closeWorkspaceSettings();
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  async function removeWorkspace(workspace: Workspace) {
    if (workspaces.length <= 1) {
      window.alert("마지막 워크스페이스는 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`'${workspace.name}' 워크스페이스와 포함된 여행을 삭제할까요?`)) return;

    try {
      await deleteWorkspace(workspace.id);
      const remaining = workspaces.filter((candidate) => candidate.id !== workspace.id);
      setWorkspaces(remaining);
      if (workspace.id === workspaceId) {
        const nextWorkspace = remaining[0];
        setWorkspaceId(nextWorkspace?.id ?? "");
        onActiveWorkspaceDeleted();
      }
    } catch (nextError) {
      window.alert(readError(nextError));
    }
  }

  return {
    workspaces,
    workspaceId,
    setWorkspaceId,
    workspaceName,
    setWorkspaceName,
    settingsWorkspace,
    workspaceSettingsForm,
    setWorkspaceSettingsForm,
    providerStatuses,
    trips,
    setTrips,
    isTripsLoading,
    loadWorkspaces,
    refreshProviderStatuses,
    submitWorkspace,
    renameWorkspace,
    openWorkspaceSettings,
    closeWorkspaceSettings,
    submitWorkspaceSettings,
    removeWorkspace
  };
}
