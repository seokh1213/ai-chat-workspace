import { memo, useCallback, useRef } from "react";

import { mobileDayLabel } from "../../lib/tripDisplay";
import type { TripDay } from "../../types";

interface MobileDayStripProps {
  days: TripDay[];
  selectedDayId: string;
  itemCountByDay: Map<string, number>;
  onSelectDay: (dayId: string) => void;
}

export const MobileDayStrip = memo(function MobileDayStrip({ days, selectedDayId, itemCountByDay, onSelectDay }: MobileDayStripProps) {
  const stableSelectDay = useStableEvent(onSelectDay);

  return (
    <nav
      className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[var(--line)] bg-app-surface px-3 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="날짜 선택"
    >
      {days.map((day) => (
        <MobileDayButton
          key={day.id}
          day={day}
          active={day.id === selectedDayId}
          itemCount={itemCountByDay.get(day.id) ?? 0}
          onSelectDay={stableSelectDay}
        />
      ))}
    </nav>
  );
});

function useStableEvent<Args extends unknown[], Return>(callback: (...args: Args) => Return) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args: Args) => callbackRef.current(...args), []);
}

interface MobileDayButtonProps {
  day: TripDay;
  active: boolean;
  itemCount: number;
  onSelectDay: (dayId: string) => void;
}

const MobileDayButton = memo(function MobileDayButton(props: MobileDayButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-7 min-w-max items-center gap-1 rounded-full border px-2 text-left text-2xs font-medium leading-none",
        props.active
          ? "border-app-day-active-border bg-app-surface text-app-secondary"
          : "border-app-day-border bg-app-surface text-app-muted"
      ].join(" ")}
      type="button"
      aria-current={props.active ? "date" : undefined}
      onClick={() => props.onSelectDay(props.day.id)}
    >
      <strong className="text-2xs font-semibold leading-none">Day {props.day.dayNumber}</strong>
      <span className="text-app-day-divider" aria-hidden="true">·</span>
      <span className="max-w-[3.9rem] truncate text-2xs text-app-muted">{mobileDayLabel(props.day)}</span>
      <em className="text-2xs not-italic text-app-muted">{props.itemCount}</em>
    </button>
  );
}, areMobileDayButtonsEqual);

function areMobileDayButtonsEqual(previous: MobileDayButtonProps, next: MobileDayButtonProps) {
  return previous.day.id === next.day.id
    && previous.day.dayNumber === next.day.dayNumber
    && previous.day.dateText === next.day.dateText
    && previous.day.weekday === next.day.weekday
    && previous.active === next.active
    && previous.itemCount === next.itemCount
    && previous.onSelectDay === next.onSelectDay;
}
