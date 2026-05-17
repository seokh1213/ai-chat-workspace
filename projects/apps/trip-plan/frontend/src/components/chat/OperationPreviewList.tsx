import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function OperationPreviewList(props: { items: string[]; status?: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(props.defaultOpen));
  if (!props.items.length) return null;
  const label = props.status === "applied" || props.status === "completed" ? "변경 내역" : "변경 미리보기";
  return (
    <div className="mt-2.5 grid gap-1.5 rounded-[7px] border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-[9px] text-[var(--text)]">
      <button
        className="flex min-h-6 items-center gap-[7px] border-0 bg-transparent p-0 text-left text-[var(--muted)]"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <strong className="text-[11px] font-extrabold text-[var(--muted)]">{label}</strong>
        <span className="text-[11px] font-extrabold">{props.items.length}개</span>
        <ChevronRight
          className={["h-3.5 w-3.5 transition-transform duration-150 ease-out", open ? "rotate-90" : ""].join(" ")}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <ul className="grid gap-1 pl-[17px]">
          {props.items.map((item) => (
            <li className="pl-0.5" key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
