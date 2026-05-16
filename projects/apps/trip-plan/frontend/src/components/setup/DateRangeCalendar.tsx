import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { buildCalendarCells, parseIsoDate } from "../../lib/date";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function DateRangeCalendar(props: {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}) {
  const initialMonth = props.startDate ? parseIsoDate(props.startDate) : new Date();
  const [cursor, setCursor] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  useEffect(() => {
    if (props.startDate) {
      const next = parseIsoDate(props.startDate);
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }, [props.startDate]);

  const cells = useMemo(() => buildCalendarCells(cursor), [cursor]);

  function moveMonth(offset: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(iso: string) {
    if (!props.startDate || props.endDate || iso < props.startDate) {
      props.onChange(iso, "");
      return;
    }
    props.onChange(props.startDate, iso);
  }

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button className="icon-button small" type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>
          <ChevronLeft size={15} />
        </button>
        <strong>
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </strong>
        <button className="icon-button small" type="button" aria-label="다음 달" onClick={() => moveMonth(1)}>
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="weekday-grid">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) => {
          const isSelected = cell.iso === props.startDate || cell.iso === props.endDate;
          const inRange = Boolean(props.startDate && props.endDate && cell.iso > props.startDate && cell.iso < props.endDate);
          const className = [
            "calendar-day",
            cell.currentMonth ? "" : "outside",
            isSelected ? "selected" : "",
            inRange ? "in-range" : ""
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button className={className} key={cell.iso} type="button" onClick={() => selectDate(cell.iso)}>
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="calendar-summary">
        <span>{props.startDate || "시작일"}</span>
        <span>{props.endDate || "종료일"}</span>
      </div>
    </div>
  );
}
