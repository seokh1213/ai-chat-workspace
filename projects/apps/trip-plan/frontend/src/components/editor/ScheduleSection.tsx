import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, Edit3, Navigation, Plus, Trash2 } from "lucide-react";
import type { FormEvent } from "react";

import {
  hasVisuallyLongItineraryLine,
  itineraryMemoCountLabel,
  itineraryMemoText,
  previewItineraryMemo
} from "../../lib/tripDisplay";
import type { ItineraryItem, TripDay, UpsertItineraryItemRequest } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";
import { ItemForm } from "./ItemForm";

interface ScheduleSectionProps {
  collapsed: boolean;
  days: TripDay[];
  selectedDayId: string;
  dayItems: ItineraryItem[];
  itemForm: UpsertItineraryItemRequest;
  editingItemId: string | null;
  isAddingItem: boolean;
  expandedItems: Set<string>;
  routeNumbers: Map<string, number>;
  detailHighlight: { type: "item" | "place"; id: string } | null;
  onToggle: () => void;
  onSelectDay: (dayId: string) => void;
  onStartAddItem: () => void;
  onItemFormChange: (form: UpsertItineraryItemRequest) => void;
  onSubmitItem: (event: FormEvent) => void;
  onCancelItem: () => void;
  onFocusItemOnMap: (itemId: string) => void;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleExpandedItem: (itemId: string) => void;
}

export function ScheduleSection(props: ScheduleSectionProps) {
  return (
    <section className={props.collapsed ? "sidebar-section schedule-section collapsed" : "sidebar-section schedule-section"}>
      <button
        className="section-toggle"
        type="button"
        aria-expanded={!props.collapsed}
        onClick={props.onToggle}
      >
        <span className="section-title">
          <CalendarDays size={16} />
          <span>일정</span>
          <em>{props.dayItems.length}개</em>
        </span>
        <ChevronRight size={16} />
      </button>
      {!props.collapsed ? (
        <div className="section-body">
          <div className="day-rail">
            {props.days.map((day) => (
              <button
                className={day.id === props.selectedDayId ? "day-card active" : "day-card"}
                key={day.id}
                type="button"
                onClick={() => props.onSelectDay(day.id)}
              >
                <strong>Day {day.dayNumber}</strong>
                <span>{day.dateText ?? "날짜 미정"}</span>
                <em>{day.weekday ?? ""}</em>
              </button>
            ))}
          </div>

          {!props.editingItemId && !props.isAddingItem ? (
            <button className="section-add-button" type="button" onClick={props.onStartAddItem}>
              <Plus size={15} />
              일정 추가
            </button>
          ) : null}
          {props.editingItemId || props.isAddingItem ? (
            <ItemForm
              form={props.itemForm}
              page
              mode={props.editingItemId ? "edit" : "create"}
              onChange={props.onItemFormChange}
              onSubmit={props.onSubmitItem}
              onCancel={props.onCancelItem}
            />
          ) : null}

          <div className="node-list">
            {props.dayItems.length === 0 ? (
              <div className="empty-state compact">
                <strong>이 날의 일정이 비어 있습니다</strong>
                <span>시간, 장소, 메모를 추가하면 지도에 순서대로 표시됩니다.</span>
              </div>
            ) : null}
            {props.dayItems.map((item) => {
              const routeNumber = props.routeNumbers.get(item.id);
              const isMappable = routeNumber != null;
              const memoText = itineraryMemoText(item);
              const expanded = props.expandedItems.has(item.id) || item.id === props.editingItemId;
              const previewText = previewItineraryMemo(memoText);
              const expandable = previewText !== memoText || hasVisuallyLongItineraryLine(memoText);
              return (
                <article
                  className={[
                    "plan-node",
                    isMappable ? "" : "memo-node",
                    expanded ? "expanded" : "",
                    props.detailHighlight?.type === "item" && props.detailHighlight.id === item.id ? "detail-highlight" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-detail-item-id={item.id}
                  key={item.id}
                >
                  <button
                    className={isMappable ? "node-sequence" : "node-sequence memo"}
                    type="button"
                    aria-label={isMappable ? `${item.title} 지도에서 보기` : `${item.title} 메모 노드`}
                    disabled={!isMappable}
                    onClick={() => props.onFocusItemOnMap(item.id)}
                  >
                    {isMappable ? routeNumber : "메모"}
                  </button>
                  <div className="node-content">
                    <div className="node-title-row">
                      <strong>{item.title}</strong>
                      <span>{item.timeText || "시간 미정"}</span>
                    </div>
                    <div className={expanded ? "node-memo expanded" : "node-memo"}>
                      <MarkdownContent content={expandable && !expanded ? previewText : memoText} className="node-markdown" />
                    </div>
                    {expandable ? (
                      <button
                        className="memo-toggle"
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => props.onToggleExpandedItem(item.id)}
                      >
                        <span>{expanded ? "접기" : "전체 보기"}</span>
                        <em>{expanded ? "요약" : itineraryMemoCountLabel(memoText)}</em>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    ) : null}
                    <div className="node-actions">
                      <button type="button" disabled={!isMappable} onClick={() => props.onFocusItemOnMap(item.id)}>
                        <Navigation size={14} />
                        {isMappable ? "지도" : "좌표 없음"}
                      </button>
                      <button type="button" onClick={() => props.onEditItem(item)}>
                        <Edit3 size={14} />
                        수정
                      </button>
                      <button className="danger-action" type="button" onClick={() => props.onDeleteItem(item.id)}>
                        <Trash2 size={14} />
                        삭제
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
