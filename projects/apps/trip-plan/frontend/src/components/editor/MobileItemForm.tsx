import { X } from "lucide-react";
import type { FormEvent } from "react";
import { useRef } from "react";

import type { UpsertItineraryItemRequest } from "../../types";
import { useModalFocus } from "./useModalFocus";

interface MobileItemFormProps {
  form: UpsertItineraryItemRequest;
  mode: "create" | "edit";
  onChange: (form: UpsertItineraryItemRequest) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

const inputClass = "min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none focus:border-[rgba(31,193,182,0.65)] focus:ring-4 focus:ring-[rgba(31,193,182,0.12)]";

export function MobileItemForm({ form, mode, onChange, onSubmit, onCancel }: MobileItemFormProps) {
  const editing = mode === "edit";
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const headingId = editing ? "mobile-item-edit-title" : "mobile-item-create-title";
  useModalFocus({ initialFocusRef: titleInputRef, onClose: onCancel });
  const setField = (field: keyof UpsertItineraryItemRequest, value: string) => {
    onChange({ ...form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    onChange({ ...form, [field]: value ? Number(value) : undefined });
  };

  return (
    <form
      className="fixed inset-0 z-[1300] grid content-start gap-3 overflow-y-auto bg-[var(--surface)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-[calc(env(safe-area-inset-top,0px)+14px)] text-[var(--text)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onSubmit={onSubmit}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[var(--surface)] pb-2">
        <div className="grid min-w-0 gap-1">
          <strong className="text-xl font-extrabold leading-6" id={headingId}>{editing ? "일정 수정" : "일정 추가"}</strong>
          <span className="text-xs font-bold text-[var(--secondary)]">
            {editing ? "시간, 설명, 위치 정보를 조정합니다" : "선택한 날짜에 새 일정을 추가합니다"}
          </span>
        </div>
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--secondary)]"
          type="button"
          aria-label={editing ? "일정 수정 닫기" : "일정 추가 닫기"}
          onClick={onCancel}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} value={form.timeText ?? ""} onChange={(event) => setField("timeText", event.target.value)} placeholder="시간" />
        <input className={inputClass} value={form.category ?? ""} onChange={(event) => setField("category", event.target.value)} placeholder="분류" />
      </div>
      <input ref={titleInputRef} className={inputClass} value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="일정 제목" />
      <textarea
        className={`${inputClass} min-h-[clamp(220px,34dvh,420px)] py-3 leading-relaxed`}
        value={form.memo ?? ""}
        onChange={(event) => setField("memo", event.target.value)}
        placeholder="메모"
      />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} type="number" step="any" value={form.lat ?? ""} onChange={(event) => setNumberField("lat", event.target.value)} placeholder="위도" />
        <input className={inputClass} type="number" step="any" value={form.lng ?? ""} onChange={(event) => setNumberField("lng", event.target.value)} placeholder="경도" />
      </div>
      <div className="sticky bottom-0 grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-[var(--surface)] pt-2">
        <button className="min-h-11 rounded-md border-0 bg-[var(--teal)] px-4 text-sm font-extrabold text-white" type="submit">
          {editing ? "수정 저장" : "일정 추가"}
        </button>
        <button className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--secondary)]" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
