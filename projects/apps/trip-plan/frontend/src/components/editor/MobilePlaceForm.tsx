import { X } from "lucide-react";
import type { FormEvent } from "react";

import type { UpsertPlaceRequest } from "../../types";

interface MobilePlaceFormProps {
  form: UpsertPlaceRequest;
  mode: "create" | "edit";
  onChange: (form: UpsertPlaceRequest) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

const inputClass = "min-h-11 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none focus:border-[rgba(31,193,182,0.65)] focus:ring-4 focus:ring-[rgba(31,193,182,0.12)]";

export function MobilePlaceForm({ form, mode, onChange, onSubmit, onCancel }: MobilePlaceFormProps) {
  const editing = mode === "edit";
  const setField = (field: keyof UpsertPlaceRequest, value: string) => {
    onChange({ ...form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    onChange({ ...form, [field]: value ? Number(value) : undefined });
  };

  return (
    <form
      className="fixed inset-0 z-[1300] grid content-start gap-3 overflow-y-auto bg-[var(--surface)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-[calc(env(safe-area-inset-top,0px)+14px)] text-[var(--text)]"
      onSubmit={onSubmit}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-[var(--surface)] pb-2">
        <div className="grid min-w-0 gap-1">
          <strong className="text-xl font-extrabold leading-6">{editing ? "장소 수정" : "장소 추가"}</strong>
          <span className="text-xs font-bold text-[var(--secondary)]">
            {editing ? "장소 설명, 주소, 좌표를 조정합니다" : "조사 장소 목록에 새 후보를 추가합니다"}
          </span>
        </div>
        <button
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--secondary)]"
          type="button"
          aria-label={editing ? "장소 수정 닫기" : "장소 추가 닫기"}
          onClick={onCancel}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <input className={inputClass} value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="장소 이름" />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} value={form.category ?? ""} onChange={(event) => setField("category", event.target.value)} placeholder="분류" />
        <input className={inputClass} value={form.source ?? ""} onChange={(event) => setField("source", event.target.value)} placeholder="출처" />
      </div>
      <textarea
        className={`${inputClass} min-h-[clamp(180px,30dvh,360px)] py-3 leading-relaxed`}
        value={form.note ?? ""}
        onChange={(event) => setField("note", event.target.value)}
        placeholder="설명"
      />
      <input className={inputClass} value={form.address ?? ""} onChange={(event) => setField("address", event.target.value)} placeholder="주소" />
      <input className={inputClass} value={form.sourceUrl ?? ""} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="참고 링크" />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} type="number" step="any" value={form.lat ?? ""} onChange={(event) => setNumberField("lat", event.target.value)} placeholder="위도" />
        <input className={inputClass} type="number" step="any" value={form.lng ?? ""} onChange={(event) => setNumberField("lng", event.target.value)} placeholder="경도" />
      </div>
      <div className="sticky bottom-0 grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-[var(--surface)] pt-2">
        <button className="min-h-11 rounded-md border-0 bg-[var(--teal)] px-4 text-sm font-extrabold text-white" type="submit">
          {editing ? "수정 저장" : "장소 추가"}
        </button>
        <button className="min-h-11 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--secondary)]" type="button" onClick={onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
