import { CheckCircle2, ChevronRight, Copy, Edit3, History, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatDateTime } from "../../lib/format";
import type { ChatSession, CheckpointSummary } from "../../types";
import { LoadingState } from "../common/LoadingState";

export function ChatHome(props: {
  sessions: ChatSession[];
  checkpoints: CheckpointSummary[];
  creating: boolean;
  loading: boolean;
  rollingBack: boolean;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (session: ChatSession) => void;
  onCopySession: (session: ChatSession) => Promise<void>;
  onDeleteSession: (session: ChatSession) => void;
  onRollbackCheckpoint: (checkpointId: string) => void;
}) {
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);

  async function copySession(session: ChatSession) {
    await props.onCopySession(session);
    setCopiedSessionId(session.id);
    window.setTimeout(() => setCopiedSessionId(null), 1400);
  }

  return (
    <div className="chat-home">
      <section className="chat-home-section">
        <div className="chat-home-title">
          <strong>대화</strong>
          <div className="new-chat-controls">
            <button
              className="primary-button small-action"
              type="button"
              disabled={props.creating || props.loading}
              onClick={props.onCreateSession}
            >
              <Plus size={15} />
              새 대화
            </button>
          </div>
        </div>
        <div className="chat-session-list">
          {props.loading ? (
            <LoadingState
              title="대화 목록을 불러오는 중입니다"
              detail="세션 목록과 최근 변경 기록을 확인하고 있습니다."
              compact
            />
          ) : null}
          {!props.loading && props.sessions.length === 0 ? (
            <div className="empty-state compact">
              <strong>아직 대화가 없습니다</strong>
              <span>새 대화를 만들고 여행 계획을 조율하세요.</span>
            </div>
          ) : null}
          {!props.loading ? props.sessions.map((session) => (
            <article className="chat-session-row" key={session.id}>
              <button className="chat-session-main" type="button" onClick={() => props.onSelectSession(session.id)}>
                <span>
                  <strong>{session.title}</strong>
                  <em>{formatDateTime(session.updatedAt)}</em>
                </span>
                <ChevronRight size={16} />
              </button>
              <span className="row-actions">
                <button type="button" aria-label="대화 Markdown 복사" onClick={() => void copySession(session)}>
                  {copiedSessionId === session.id ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
                <button type="button" aria-label="대화 이름 변경" onClick={() => props.onRenameSession(session)}>
                  <Edit3 size={14} />
                </button>
                <button type="button" aria-label="대화 삭제" onClick={() => props.onDeleteSession(session)}>
                  <Trash2 size={14} />
                </button>
              </span>
            </article>
          )) : null}
        </div>
      </section>

      <section className="chat-home-section">
        <div className="chat-home-title">
          <strong>변경 내역</strong>
          <History size={16} />
        </div>
        <div className="checkpoint-list">
          {props.checkpoints.length === 0 ? (
            <div className="empty-state compact">
              <strong>체크포인트가 없습니다</strong>
              <span>AI가 일정을 적용하면 변경 전후 상태가 이곳에 남습니다.</span>
            </div>
          ) : null}
          {props.checkpoints.map((checkpoint) => (
            <article className="checkpoint-row" key={checkpoint.id}>
              <div>
                <strong>{checkpoint.label || "변경"}</strong>
                <span>{checkpoint.reason || checkpoint.source}</span>
                <em>{formatDateTime(checkpoint.createdAt)}</em>
              </div>
              <button
                className="secondary-button checkpoint-rollback-button"
                type="button"
                disabled={props.rollingBack}
                onClick={() => props.onRollbackCheckpoint(checkpoint.id)}
              >
                되돌리기
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
