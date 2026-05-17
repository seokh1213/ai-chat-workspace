import type { TripDay } from "../../types";

interface MobileMapDayStripProps {
  days: TripDay[];
  selectedDayId: string;
  itemCountByDay: Map<string, number>;
  onSelectDay: (dayId: string) => void;
}

export function MobileMapDayStrip({ days, selectedDayId, itemCountByDay, onSelectDay }: MobileMapDayStripProps) {
  return (
    <nav
      className="absolute left-3 right-3 top-[calc(env(safe-area-inset-top,0px)+66px)] z-[900] flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="지도 날짜 선택"
    >
      {days.map((day) => {
        const active = day.id === selectedDayId;
        return (
          <button
            className={[
              "inline-flex min-h-9 min-w-max items-center gap-1.5 rounded-full border px-3 text-xs font-extrabold shadow-sm",
              active
                ? "border-[var(--teal)] bg-[var(--surface)] text-[var(--text)]"
                : "border-[rgba(221,226,231,0.92)] bg-[var(--surface-glass)] text-[var(--secondary)]"
            ].join(" ")}
            key={day.id}
            type="button"
            aria-current={active ? "date" : undefined}
            onClick={() => onSelectDay(day.id)}
          >
            <strong className="leading-4">Day {day.dayNumber}</strong>
            <span aria-hidden="true" className="text-[var(--muted)]">·</span>
            <span className="leading-4">{itemCountByDay.get(day.id) ?? 0}일정</span>
          </button>
        );
      })}
    </nav>
  );
}
