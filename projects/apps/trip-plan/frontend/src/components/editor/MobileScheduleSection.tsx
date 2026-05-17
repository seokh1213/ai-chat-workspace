import { CalendarDays, ChevronDown, ChevronRight, ChevronUp, Edit3, Navigation, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  hasVisuallyLongItineraryLine,
  itineraryMemoCountLabel,
  itineraryMemoText,
  previewItineraryMemo
} from "../../lib/tripDisplay";
import { MarkdownContent } from "../common/MarkdownContent";
import { MobileItemForm } from "./MobileItemForm";
import type { ScheduleSectionProps } from "./ScheduleSection";

export function MobileScheduleSection(props: ScheduleSectionProps) {
  return (
    <section className="border-b border-[var(--line)] bg-[var(--surface)]">
      <button
        className="flex min-h-12 w-full items-center justify-between border-0 bg-[var(--surface)] px-3 text-left text-sm font-extrabold text-[var(--text)]"
        type="button"
        aria-expanded={!props.collapsed}
        onClick={props.onToggle}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" />
          <span>일정</span>
          <em className="rounded-full border border-[var(--line)] px-2 py-1 text-[11px] not-italic text-[var(--secondary)]">
            {props.dayItems.length}개
          </em>
        </span>
        <ChevronRight className={props.collapsed ? "h-4 w-4 text-[var(--teal)]" : "h-4 w-4 rotate-90 text-[var(--teal)]"} aria-hidden="true" />
      </button>
      {props.collapsed ? null : (
        <div className="grid gap-3 px-3 pb-4">
          {!props.editingItemId && !props.isAddingItem ? (
            <button
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface)] text-sm font-bold text-[var(--secondary)]"
              type="button"
              onClick={props.onStartAddItem}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              일정 추가
            </button>
          ) : null}
          {props.editingItemId || props.isAddingItem ? (
            <MobileItemForm
              form={props.itemForm}
              mode={props.editingItemId ? "edit" : "create"}
              onChange={props.onItemFormChange}
              onSubmit={props.onSubmitItem}
              onCancel={props.onCancelItem}
            />
          ) : null}

          <div className="grid gap-2">
            {props.dayItems.length === 0 ? (
              <div className="grid place-items-start gap-2 rounded-md border border-dashed border-[var(--strong-line)] bg-[var(--surface-soft)] p-4 text-left">
                <strong className="text-sm">이 날의 일정이 비어 있습니다</strong>
                <span className="text-xs leading-relaxed text-[var(--secondary)]">시간, 장소, 메모를 추가하면 지도에 순서대로 표시됩니다.</span>
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
                    "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border bg-[var(--surface)] p-3",
                    props.detailHighlight?.type === "item" && props.detailHighlight.id === item.id
                      ? "border-dashed border-[rgba(107,114,128,0.64)]"
                      : "border-[var(--line)]"
                  ].join(" ")}
                  data-detail-item-id={item.id}
                  key={item.id}
                >
                  <button
                    className={isMappable
                      ? "grid h-8 w-8 place-items-center rounded-full border-0 bg-[var(--violet)] text-xs font-black text-white"
                      : "grid h-8 min-w-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2 text-[11px] font-extrabold text-[var(--secondary)]"}
                    type="button"
                    aria-label={isMappable ? `${item.title} 지도에서 보기` : `${item.title} 메모 노드`}
                    disabled={!isMappable}
                    onClick={() => props.onFocusItemOnMap(item.id)}
                  >
                    {isMappable ? routeNumber : "메모"}
                  </button>
                  <div className="min-w-0">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                      <strong className="min-w-0 text-[17px] font-extrabold leading-snug [overflow-wrap:anywhere]">{item.title}</strong>
                      <span className="max-w-[72px] truncate text-right text-xs text-[var(--secondary)]">{item.timeText || "시간 미정"}</span>
                    </div>
                    <MarkdownContent content={expandable && !expanded ? previewText : memoText} className="mt-1 text-[13px] leading-relaxed text-[var(--secondary)]" />
                    {expandable ? (
                      <button
                        className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-extrabold text-[var(--secondary)]"
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => props.onToggleExpandedItem(item.id)}
                      >
                        <span>{expanded ? "접기" : "전체 보기"}</span>
                        <em className="text-[var(--muted)] not-italic">{expanded ? "요약" : itineraryMemoCountLabel(memoText)}</em>
                        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-[var(--teal)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--teal)]" />}
                      </button>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MobileAction disabled={!isMappable} onClick={() => props.onFocusItemOnMap(item.id)} icon={<Navigation className="h-3.5 w-3.5" aria-hidden="true" />}>
                        {isMappable ? "지도" : "좌표 없음"}
                      </MobileAction>
                      <MobileAction onClick={() => props.onEditItem(item)} icon={<Edit3 className="h-3.5 w-3.5" aria-hidden="true" />}>수정</MobileAction>
                      <MobileAction danger onClick={() => props.onDeleteItem(item.id)} icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}>삭제</MobileAction>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function MobileAction(props: { children: string; danger?: boolean; disabled?: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className={props.danger
        ? "inline-flex min-h-8 items-center gap-1 border-0 bg-transparent text-xs font-bold text-[var(--secondary)]"
        : "inline-flex min-h-8 items-center gap-1 border-0 bg-transparent text-xs font-bold text-[var(--secondary)] enabled:hover:text-[var(--teal)]"}
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.icon}
      {props.children}
    </button>
  );
}
