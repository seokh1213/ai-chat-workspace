import type { AiProviderStatus } from "../../types";

export function ProviderStatusCard(props: { status?: AiProviderStatus }) {
  if (!props.status) {
    return (
      <div className="provider-status-card muted">
        <strong>상태 확인 중</strong>
        <span>설정 창을 열면 서버에서 공급자 상태를 확인합니다.</span>
      </div>
    );
  }

  return (
    <div className={props.status.available ? "provider-status-card ready" : "provider-status-card"}>
      <div className="provider-status-head">
        <strong>{props.status.displayName}</strong>
        <span>{providerStatusLabel(props.status.status)}</span>
      </div>
      {props.status.detail ? <p>{props.status.detail}</p> : null}
      {props.status.checks.length > 0 ? (
        <div className="provider-check-list">
          {props.status.checks.map((check) => (
            <span className={`provider-check ${check.status}`} key={`${check.label}-${check.detail ?? ""}`}>
              <strong>{check.label}</strong>
              <em>{providerCheckStatusLabel(check.status)}</em>
              {check.detail ? <small>{check.detail}</small> : null}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function providerStatusLabel(status: string): string {
  if (status === "ready") return "사용 가능";
  if (status === "offline") return "오프라인";
  if (status === "unavailable") return "확인 필요";
  if (status === "configurable") return "설정 필요";
  return status;
}

function providerCheckStatusLabel(status: string): string {
  if (status === "ok") return "정상";
  if (status === "warning") return "확인";
  if (status === "error") return "오류";
  return status;
}
