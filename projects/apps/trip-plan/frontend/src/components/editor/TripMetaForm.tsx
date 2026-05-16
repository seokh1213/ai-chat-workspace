import { Edit3, Save, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import type { TripFormState, TripTextField } from "../../types";

export function TripMetaForm(props: {
  form: TripFormState;
  saving: boolean;
  onChange: (form: TripFormState) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const setField = (field: TripTextField, value: string) => {
    props.onChange({
      ...props.form,
      [field]: value,
      ...(field === "destinationName" ? { destinationLat: null, destinationLng: null } : {})
    });
  };
  const dateText = [props.form.startDate, props.form.endDate].filter(Boolean).join(" - ") || "날짜 미정";

  return (
    <section className="trip-meta-section">
      <div className="trip-meta-summary">
        <div>
          <strong>{props.form.title || "여행 이름 미정"}</strong>
          <span>{[props.form.destinationName || "목적지 미정", dateText].join(" · ")}</span>
        </div>
        <button
          className={open ? "secondary-button small-action active" : "secondary-button small-action"}
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          <Edit3 size={14} />
          정보
        </button>
      </div>
      {open ? (
        <form className="meta-form" onSubmit={props.onSubmit}>
          <label className="field">
            <span>여행 이름</span>
            <input value={props.form.title} onChange={(event) => setField("title", event.target.value)} />
          </label>
          <label className="field">
            <span>목적지</span>
            <input value={props.form.destinationName} onChange={(event) => setField("destinationName", event.target.value)} />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>시작</span>
              <input type="date" value={props.form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
            </label>
            <label className="field">
              <span>종료</span>
              <input type="date" value={props.form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
            </label>
          </div>
          <div className="meta-actions">
            <button className="secondary-button meta-save-button" type="submit" disabled={props.saving}>
              <Save size={16} />
              저장
            </button>
            <button className="danger-button" type="button" onClick={props.onDelete}>
              <Trash2 size={15} />
              삭제
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
