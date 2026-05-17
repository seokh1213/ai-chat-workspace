import { Save, Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import type { TripFormState, TripTextField } from "../../types";

const fieldClass = "grid gap-1.5";
const labelClass = "text-xs font-extrabold text-[var(--secondary)]";
const inputClass = "min-h-11 min-w-0 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-base text-[var(--text)] outline-none focus:border-[rgba(31,193,182,0.65)] focus:ring-4 focus:ring-[rgba(31,193,182,0.12)]";

export function TripMetaForm(props: {
  form: TripFormState;
  open: boolean;
  saving: boolean;
  onChange: (form: TripFormState) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => void;
}) {
  const setField = (field: TripTextField, value: string) => {
    props.onChange({
      ...props.form,
      [field]: value,
      ...(field === "destinationName" ? { destinationLat: null, destinationLng: null } : {})
    });
  };

  if (!props.open) return null;

  return (
    <section className="trip-meta-section">
      <form className="grid gap-3" onSubmit={props.onSubmit}>
        <label className={fieldClass}>
          <span className={labelClass}>여행 이름</span>
          <input className={inputClass} value={props.form.title} onChange={(event) => setField("title", event.target.value)} />
        </label>
        <label className={fieldClass}>
          <span className={labelClass}>목적지</span>
          <input className={inputClass} value={props.form.destinationName} onChange={(event) => setField("destinationName", event.target.value)} />
        </label>
        <div className="grid gap-2 min-[420px]:grid-cols-2">
          <label className={fieldClass}>
            <span className={labelClass}>시작</span>
            <input className={`${inputClass} w-full appearance-none`} type="date" value={props.form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
          </label>
          <label className={fieldClass}>
            <span className={labelClass}>종료</span>
            <input className={`${inputClass} w-full appearance-none`} type="date" value={props.form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <button className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-extrabold text-[var(--secondary)] disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={props.saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            저장
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-[rgba(255,97,104,0.35)] bg-[rgba(255,97,104,0.08)] px-3 text-sm font-extrabold text-[var(--danger)]" type="button" onClick={props.onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            삭제
          </button>
        </div>
      </form>
    </section>
  );
}
