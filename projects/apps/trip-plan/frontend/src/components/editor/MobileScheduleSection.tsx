import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { useCallback, useRef } from "react";

import { MobileItemForm } from "./MobileItemForm";
import { MobileScheduleItem } from "./MobileScheduleItem";
import type { ScheduleSectionProps } from "./ScheduleSection";

export function MobileScheduleSection(props: ScheduleSectionProps) {
  const onFocusItemOnMap = useStableEvent(props.onFocusItemOnMap);
  const onEditItem = useStableEvent(props.onEditItem);
  const onDeleteItem = useStableEvent(props.onDeleteItem);
  const onToggleExpandedItem = useStableEvent(props.onToggleExpandedItem);

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
            {props.dayItems.map((item) => (
              <MobileScheduleItem
                key={item.id}
                item={item}
                routeNumber={props.routeNumbers.get(item.id)}
                expanded={props.expandedItems.has(item.id) || item.id === props.editingItemId}
                highlighted={props.detailHighlight?.type === "item" && props.detailHighlight.id === item.id}
                onFocusItemOnMap={onFocusItemOnMap}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                onToggleExpandedItem={onToggleExpandedItem}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function useStableEvent<Args extends unknown[], Return>(callback: (...args: Args) => Return) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...args: Args) => callbackRef.current(...args), []);
}
