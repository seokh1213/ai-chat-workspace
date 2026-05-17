import { formatElapsedSeconds } from "../../lib/format";
import type { ChatRunActivityEvent } from "../../types";

export function ChatPendingStatus(props: {
  activity: ChatRunActivityEvent | null;
  elapsedSeconds: number;
  label: string | null;
}) {
  const label = chatPendingLabel(props.label, props.activity, props.elapsedSeconds);
  const detail = chatActivityDetail(props.activity);
  return (
    <div className="grid gap-1 text-[13px] leading-[1.45] text-[var(--text)]">
      <span className="font-[750]">{label}</span>
      {props.elapsedSeconds > 0 ? (
        <small className="text-xs not-italic text-[var(--muted)] [overflow-wrap:anywhere]">
          {formatElapsedSeconds(props.elapsedSeconds)} 경과
        </small>
      ) : null}
      {detail ? <em className="text-xs not-italic text-[var(--muted)] [overflow-wrap:anywhere]">{detail}</em> : null}
    </div>
  );
}

function chatPendingLabel(
  label: string | null,
  activity: ChatRunActivityEvent | null,
  elapsedSeconds: number
): string {
  if (activity?.label) return activity.label;
  if (elapsedSeconds >= 20) return "AI가 자료를 확인하거나 응답을 준비 중입니다.";
  return label ?? "응답을 기다리는 중입니다.";
}

function chatActivityDetail(activity: ChatRunActivityEvent | null): string | null {
  return activity?.detail?.trim() || activity?.rawType?.trim() || null;
}
