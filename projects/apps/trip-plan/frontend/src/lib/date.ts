export type CalendarCell = {
  iso: string;
  day: number;
  currentMonth: boolean;
};

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildCalendarCells(cursor: Date): CalendarCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, 1 - startOffset + index);
    return {
      iso: toIsoDate(date),
      day: date.getDate(),
      currentMonth: date.getMonth() === month
    };
  });
}
