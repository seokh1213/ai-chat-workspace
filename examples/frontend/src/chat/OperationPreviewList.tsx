import { useState } from "react";

export function OperationPreviewList(props: { items: string[]; status?: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(props.defaultOpen));
  if (!props.items.length) return null;

  const label = props.status === "applied" || props.status === "completed" ? "변경 내역" : "변경 미리보기";

  return (
    <div className="operation-preview">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <strong>{label}</strong>
        <span>{props.items.length}개</span>
      </button>
      {open ? (
        <ul>
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

