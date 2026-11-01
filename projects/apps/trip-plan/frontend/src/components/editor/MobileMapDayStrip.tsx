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
              "inline-flex min-h-7 min-w-max items-center gap-1 rounded-full border bg-app-glass px-2 text-2xs font-medium leading-none",
              active
                ? "border-app-day-active-border text-app-secondary"
                : "border-app-day-border text-app-muted"
            ].join(" ")}
            key={day.id}
            type="button"
            aria-current={active ? "date" : undefined}
            onClick={() => onSelectDay(day.id)}
          >
            <strong className="text-2xs font-semibold leading-none">Day {day.dayNumber}</strong>
            <span aria-hidden="true" className="text-app-day-divider">·</span>
            <span className="text-2xs text-app-muted">{itemCountByDay.get(day.id) ?? 0}</span>
          </button>
        );
      })}
    </nav>
  );
}
