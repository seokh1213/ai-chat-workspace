import { mobileDayLabel } from "../../lib/tripDisplay";
import type { TripDay } from "../../types";

interface MobileDayStripProps {
  days: TripDay[];
  selectedDayId: string;
  itemCountByDay: Map<string, number>;
  onSelectDay: (dayId: string) => void;
}

export function MobileDayStrip({ days, selectedDayId, itemCountByDay, onSelectDay }: MobileDayStripProps) {
  return (
    <nav
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="날짜 선택"
    >
      {days.map((day) => {
        const active = day.id === selectedDayId;
        return (
          <button
            className={[
              "grid min-h-14 min-w-20 content-center gap-0.5 rounded-lg border px-2.5 text-left",
              active
                ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--text)]"
                : "border-[var(--line)] bg-[var(--surface)] text-[var(--text)]"
            ].join(" ")}
            key={day.id}
            type="button"
            aria-current={active ? "date" : undefined}
            onClick={() => onSelectDay(day.id)}
          >
            <strong className="truncate text-[13px] font-extrabold leading-4">Day {day.dayNumber}</strong>
            <span className="truncate text-[11px] font-bold leading-4 text-[var(--secondary)]">{mobileDayLabel(day)}</span>
            <em className="truncate text-[11px] not-italic font-extrabold leading-4 text-[var(--muted)]">
              {itemCountByDay.get(day.id) ?? 0}개
            </em>
          </button>
        );
      })}
    </nav>
  );
}
