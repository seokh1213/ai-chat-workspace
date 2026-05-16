import { X } from "lucide-react";
import type { FormEvent } from "react";

import type { UpsertPlaceRequest } from "../../types";

export function PlaceForm(props: {
  form: UpsertPlaceRequest;
  mode: "create" | "edit";
  onChange: (form: UpsertPlaceRequest) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}) {
  const setField = (field: keyof UpsertPlaceRequest, value: string) => {
    props.onChange({ ...props.form, [field]: value });
  };
  const setNumberField = (field: "lat" | "lng", value: string) => {
    props.onChange({ ...props.form, [field]: value ? Number(value) : undefined });
  };
  const editing = props.mode === "edit";

  return (
    <form className="item-form place-form editing" onSubmit={props.onSubmit}>
      <div className="edit-page-header">
        <div>
          <strong>{editing ? "장소 수정" : "장소 추가"}</strong>
          <span>{editing ? "장소 설명, 주소, 좌표를 조정합니다" : "조사 장소 목록에 새 후보를 추가합니다"}</span>
        </div>
        <button type="button" aria-label={editing ? "장소 수정 닫기" : "장소 추가 닫기"} onClick={props.onCancel}>
          <X size={16} />
        </button>
      </div>
      <input value={props.form.name} onChange={(event) => setField("name", event.target.value)} placeholder="장소 이름" />
      <div className="form-grid">
        <input value={props.form.category ?? ""} onChange={(event) => setField("category", event.target.value)} placeholder="분류" />
        <input value={props.form.source ?? ""} onChange={(event) => setField("source", event.target.value)} placeholder="출처" />
      </div>
      <textarea value={props.form.note ?? ""} onChange={(event) => setField("note", event.target.value)} placeholder="설명" rows={3} />
      <input value={props.form.address ?? ""} onChange={(event) => setField("address", event.target.value)} placeholder="주소" />
      <input value={props.form.sourceUrl ?? ""} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="참고 링크" />
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
      <div className="form-actions compact edit-actions">
        <button className="primary-button" type="submit">
          {editing ? "수정 저장" : "장소 추가"}
        </button>
        <button type="button" onClick={props.onCancel}>
          취소
        </button>
      </div>
    </form>
  );
}
