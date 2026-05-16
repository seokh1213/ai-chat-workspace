import { X } from "lucide-react";
import type { FormEvent } from "react";

import type { UpsertItineraryItemRequest } from "../../types";

export function ItemForm(props: {
  form: UpsertItineraryItemRequest;
  page: boolean;
  mode: "create" | "edit";
  onChange: (form: UpsertItineraryItemRequest) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const setField = (field: keyof UpsertItineraryItemRequest, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    props.onChange({ ...props.form, [field]: value ? Number(value) : undefined });
  };
  const editing = props.mode === "edit";

  return (
    <form className={props.page ? "item-form editing" : "item-form"} onSubmit={props.onSubmit}>
      {props.page ? (
        <div className="edit-page-header">
          <div>
            <strong>{editing ? "일정 수정" : "일정 추가"}</strong>
            <span>{editing ? "시간, 설명, 위치 정보를 조정합니다" : "선택한 날짜에 새 일정을 추가합니다"}</span>
          </div>
          <button type="button" aria-label={editing ? "일정 수정 닫기" : "일정 추가 닫기"} onClick={props.onCancel}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      <div className="form-grid">
        <input value={props.form.timeText ?? ""} onChange={(event) => setField("timeText", event.target.value)} placeholder="시간" />
        <input value={props.form.category ?? ""} onChange={(event) => setField("category", event.target.value)} placeholder="분류" />
      </div>
      <input value={props.form.title} onChange={(event) => setField("title", event.target.value)} placeholder="일정 제목" />
      <textarea value={props.form.memo ?? ""} onChange={(event) => setField("memo", event.target.value)} placeholder="메모" rows={2} />
      <div className="form-grid">
        <input
          type="number"
          step="any"
          value={props.form.lat ?? ""}
          onChange={(event) => setNumberField("lat", event.target.value)}
          placeholder="위도"
        />
        <input
          type="number"
          step="any"
          value={props.form.lng ?? ""}
          onChange={(event) => setNumberField("lng", event.target.value)}
          placeholder="경도"
        />
      </div>
      <div className={props.page ? "form-actions compact edit-actions" : "form-actions compact"}>
        <button className="primary-button" type="submit">
          {editing ? "수정 저장" : "일정 추가"}
        </button>
        {props.page ? (
          <button type="button" onClick={props.onCancel}>
            취소
          </button>
        ) : null}
      </div>
    </form>
  );
}
