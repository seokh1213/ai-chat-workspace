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
      className="flex shrink-0 gap-2 overflow-x-auto border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        "grid min-h-14 min-w-20 content-center gap-0.5 rounded-lg border px-2.5 text-left",
        props.active
          ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--text)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--text)]"
      ].join(" ")}
      type="button"
      aria-current={props.active ? "date" : undefined}
      onClick={() => props.onSelectDay(props.day.id)}
    >
      <strong className="truncate text-[13px] font-extrabold leading-4">Day {props.day.dayNumber}</strong>
      <span className="truncate text-[11px] font-bold leading-4 text-[var(--secondary)]">{mobileDayLabel(props.day)}</span>
      <em className="truncate text-[11px] not-italic font-extrabold leading-4 text-[var(--muted)]">
        {props.itemCount}개
      </em>
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
