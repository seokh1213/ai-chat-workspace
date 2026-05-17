import { ChevronLeft, Info } from "lucide-react";
import type { ReactNode } from "react";

interface MobileTripTopBarProps {
  title: string;
  subtitle: string;
  backLabel: string;
  infoOpen?: boolean;
  onBack: () => void;
  onToggleInfo?: () => void;
  actions?: ReactNode;
}

export function MobileTripTopBar({
  title,
  subtitle,
  backLabel,
  infoOpen = false,
  onBack,
  onToggleInfo,
  actions
}: MobileTripTopBarProps) {
  return (
    <header className="relative z-[1000] flex shrink-0 items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-3 pb-2 pt-[calc(env(safe-area-inset-top,0px)+10px)] text-[var(--text)]">
      <button
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--teal)]"
        type="button"
        aria-label={backLabel}
        onClick={onBack}
      >
        <ChevronLeft size={18} />
      </button>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <strong className="truncate text-[15px] font-extrabold leading-5">{title}</strong>
        <span className="truncate text-[11px] font-bold leading-4 text-[var(--secondary)]">{subtitle}</span>
      </div>
      {onToggleInfo ? (
        <button
          className={infoOpen
            ? "grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-[var(--teal-soft)] text-[var(--teal)]"
            : "grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-transparent text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--teal)]"}
          type="button"
          aria-label="여행 정보"
          aria-pressed={infoOpen}
          onClick={onToggleInfo}
        >
          <Info size={17} />
        </button>
      ) : null}
      {actions}
    </header>
  );
}
