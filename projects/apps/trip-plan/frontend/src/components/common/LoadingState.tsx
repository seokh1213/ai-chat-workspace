import { Loader2 } from "lucide-react";

export function LoadingState(props: { title: string; detail?: string; compact?: boolean; className?: string }) {
  return (
    <div className={["loading-state", props.compact ? "compact" : "", props.className].filter(Boolean).join(" ")} role="status">
      <span className="loading-spinner" aria-hidden="true">
        <Loader2 size={props.compact ? 18 : 22} />
      </span>
      <strong>{props.title}</strong>
      {props.detail ? <span>{props.detail}</span> : null}
    </div>
  );
}
