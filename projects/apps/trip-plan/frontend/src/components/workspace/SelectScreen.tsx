import { CalendarDays, ChevronRight, Edit3, MapPinned, Plus, Settings2, Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import { formatDateRange } from "../../lib/tripDisplay";
import type { WorkspaceSettingsForm } from "../../lib/workspaceSettings";
import type { AiProviderStatus, Trip, Workspace } from "../../types";
import { LoadingState } from "../common/LoadingState";
import { ThemeToggle } from "../common/ThemeToggle";
import { WorkspaceSettingsDialog } from "./WorkspaceSettingsDialog";

export function SelectScreen(props: {
  workspaces: Workspace[];
  workspaceId: string;
  workspaceName: string;
  settingsWorkspace: Workspace | null;
  workspaceSettingsForm: WorkspaceSettingsForm;
  providerStatuses: AiProviderStatus[];
  trips: Trip[];
  loading: boolean;
  openingTrip: boolean;
  onWorkspaceChange: (workspaceId: string) => void;
  onWorkspaceNameChange: (name: string) => void;
  onCreateWorkspace: (event: FormEvent) => void;
  onRenameWorkspace: (workspace: Workspace) => void;
  onOpenWorkspaceSettings: (workspace: Workspace) => void;
  onWorkspaceSettingsFormChange: (form: WorkspaceSettingsForm) => void;
  onSubmitWorkspaceSettings: (event: FormEvent) => void;
  onCloseWorkspaceSettings: () => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  onCreateTrip: () => void;
  onEnterTrip: (tripId: string) => void;
  onRenameTrip: (trip: Trip) => void;
  onDeleteTrip: (trip: Trip) => void;
}) {
  return (
    <main className="app-page select-page">
      <section className="select-shell">
        <div className="select-main">
          <div className="select-header">
            <div>
              <p className="eyebrow">Trip workspace</p>
              <h1>여행 작업실</h1>
            </div>
            <div className="screen-header-actions">
              <ThemeToggle />
              <button className="primary-button" type="button" disabled={!props.workspaceId} onClick={props.onCreateTrip}>
                <Plus size={16} />
                여행 생성
              </button>
            </div>
          </div>

          <div className="workspace-strip">
            {props.workspaces.map((workspace) => (
              <span className="workspace-pill" key={workspace.id}>
                <button
                  className={workspace.id === props.workspaceId ? "workspace-chip active" : "workspace-chip"}
                  type="button"
                  onClick={() => props.onWorkspaceChange(workspace.id)}
                >
                  {workspace.name}
                </button>
                <button type="button" aria-label="워크스페이스 이름 변경" onClick={() => props.onRenameWorkspace(workspace)}>
                  <Edit3 size={13} />
                </button>
                <button type="button" aria-label="워크스페이스 설정" onClick={() => props.onOpenWorkspaceSettings(workspace)}>
                  <Settings2 size={13} />
                </button>
                <button type="button" aria-label="워크스페이스 삭제" onClick={() => props.onDeleteWorkspace(workspace)}>
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
            <form className="workspace-create" onSubmit={props.onCreateWorkspace}>
              <input
                value={props.workspaceName}
                onChange={(event) => props.onWorkspaceNameChange(event.target.value)}
                aria-label="워크스페이스 이름"
                placeholder="워크스페이스 이름을 입력해 주세요"
              />
              <button type="submit" aria-label="워크스페이스 추가">
                <Plus size={14} />
              </button>
            </form>
          </div>

          <div className="trip-list">
            {props.loading ? (
              <LoadingState
                title="여행 목록을 불러오는 중입니다"
                detail="DB나 네트워크가 느리면 잠시 걸릴 수 있습니다."
              />
            ) : null}
            {!props.loading && props.trips.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={22} />
                <strong>아직 여행이 없습니다</strong>
                <span>목적지와 날짜를 정하면 편집 화면이 만들어집니다.</span>
              </div>
            ) : null}
            {!props.loading ? props.trips.map((trip) => (
              <article className="trip-row" key={trip.id}>
                <button
                  className="trip-row-main"
                  type="button"
                  disabled={props.openingTrip}
                  onClick={() => props.onEnterTrip(trip.id)}
                >
                  <span className="trip-row-icon">
                    <MapPinned size={18} />
                  </span>
                  <span className="trip-row-body">
                    <strong>{trip.title}</strong>
                    <span>
                      {[trip.destinationName, formatDateRange(trip)].filter(Boolean).join(" · ") || "날짜 미정"}
                    </span>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <span className="row-actions">
                  <button type="button" aria-label="여행 이름 변경" onClick={() => props.onRenameTrip(trip)}>
                    <Edit3 size={14} />
                  </button>
                  <button type="button" aria-label="여행 삭제" onClick={() => props.onDeleteTrip(trip)}>
                    <Trash2 size={14} />
                  </button>
                </span>
              </article>
            )) : null}
          </div>
        </div>
        {props.settingsWorkspace ? (
          <WorkspaceSettingsDialog
            workspace={props.settingsWorkspace}
            form={props.workspaceSettingsForm}
            providerStatuses={props.providerStatuses}
            onChange={props.onWorkspaceSettingsFormChange}
            onSubmit={props.onSubmitWorkspaceSettings}
            onClose={props.onCloseWorkspaceSettings}
          />
        ) : null}
      </section>
    </main>
  );
}
