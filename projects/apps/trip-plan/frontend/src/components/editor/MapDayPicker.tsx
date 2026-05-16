import type { TripDay } from "../../types";

interface MapDayPickerProps {
  days: TripDay[];
  selectedDayId: string;
  itemCountByDay: Map<string, number>;
  onSelectDay: (dayId: string) => void;
}

export function MapDayPicker(props: MapDayPickerProps) {
  return (
    <nav className="map-day-picker" aria-label="지도 날짜 선택">
      {props.days.map((day) => (
        <button
          className={day.id === props.selectedDayId ? "active" : ""}
          key={day.id}
          type="button"
          onClick={() => props.onSelectDay(day.id)}
        >
          <strong>Day {day.dayNumber}</strong>
          <i aria-hidden="true">·</i>
          <span>{props.itemCountByDay.get(day.id) ?? 0}일정</span>
        </button>
      ))}
    </nav>
  );
}
