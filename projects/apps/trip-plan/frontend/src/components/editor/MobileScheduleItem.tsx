import { ChevronDown, ChevronUp, Edit3, Navigation, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import type { ReactNode } from "react";

import {
  hasVisuallyLongItineraryLine,
  itineraryMemoCountLabel,
  itineraryMemoText,
  previewItineraryMemo
} from "../../lib/tripDisplay";
import type { ItineraryItem } from "../../types";
import { MarkdownContent } from "../common/MarkdownContent";

interface MobileScheduleItemProps {
  item: ItineraryItem;
  routeNumber: number | undefined;
  expanded: boolean;
  highlighted: boolean;
  onFocusItemOnMap: (itemId: string) => void;
  onEditItem: (item: ItineraryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleExpandedItem: (itemId: string) => void;
}

export const MobileScheduleItem = memo(function MobileScheduleItem(props: MobileScheduleItemProps) {
  const isMappable = props.routeNumber != null;
  const memoState = useMemo(() => {
    const memoText = itineraryMemoText(props.item);
    const previewText = previewItineraryMemo(memoText);
    const expandable = previewText !== memoText || hasVisuallyLongItineraryLine(memoText);
    return {
      expandable,
      memoText,
      previewText,
      renderedText: expandable && !props.expanded ? previewText : memoText
    };
  }, [props.expanded, props.item.category, props.item.memo]);

  return (
    <article
      className={[
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border bg-[var(--surface)] p-3",
        props.highlighted ? "border-dashed border-[rgba(107,114,128,0.64)]" : "border-[var(--line)]"
      ].join(" ")}
      data-detail-item-id={props.item.id}
    >
      <button
        className={isMappable
          ? "grid h-8 w-8 place-items-center rounded-full border-0 bg-[var(--violet)] text-xs font-black text-white"
          : "grid h-8 min-w-12 place-items-center rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2 text-[11px] font-extrabold text-[var(--secondary)]"}
        type="button"
        aria-label={isMappable ? `${props.item.title} 지도에서 보기` : `${props.item.title} 메모 노드`}
        disabled={!isMappable}
        onClick={() => props.onFocusItemOnMap(props.item.id)}
      >
        {isMappable ? props.routeNumber : "메모"}
      </button>
      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <strong className="min-w-0 text-[17px] font-extrabold leading-snug [overflow-wrap:anywhere]">{props.item.title}</strong>
          <span className="max-w-[72px] truncate text-right text-xs text-[var(--secondary)]">{props.item.timeText || "시간 미정"}</span>
        </div>
        <MarkdownContent content={memoState.renderedText} className="mt-1 text-[13px] leading-relaxed text-[var(--secondary)]" />
        {memoState.expandable ? (
          <button
            className="mt-2 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-extrabold text-[var(--secondary)]"
            type="button"
            aria-expanded={props.expanded}
            onClick={() => props.onToggleExpandedItem(props.item.id)}
          >
            <span>{props.expanded ? "접기" : "전체 보기"}</span>
            <em className="text-[var(--muted)] not-italic">{props.expanded ? "요약" : itineraryMemoCountLabel(memoState.memoText)}</em>
            {props.expanded ? <ChevronUp className="h-3.5 w-3.5 text-[var(--teal)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--teal)]" />}
          </button>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-2">
          <MobileAction disabled={!isMappable} onClick={() => props.onFocusItemOnMap(props.item.id)} icon={<Navigation className="h-3.5 w-3.5" aria-hidden="true" />}>
            {isMappable ? "지도" : "좌표 없음"}
          </MobileAction>
          <MobileAction onClick={() => props.onEditItem(props.item)} icon={<Edit3 className="h-3.5 w-3.5" aria-hidden="true" />}>수정</MobileAction>
          <MobileAction danger onClick={() => props.onDeleteItem(props.item.id)} icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}>삭제</MobileAction>
        </div>
      </div>
    </article>
  );
}, areMobileScheduleItemsEqual);

function areMobileScheduleItemsEqual(previous: MobileScheduleItemProps, next: MobileScheduleItemProps) {
  return previous.item.id === next.item.id
    && previous.item.title === next.item.title
    && previous.item.timeText === next.item.timeText
    && previous.item.category === next.item.category
    && previous.item.memo === next.item.memo
    && previous.routeNumber === next.routeNumber
    && previous.expanded === next.expanded
    && previous.highlighted === next.highlighted
    && previous.onFocusItemOnMap === next.onFocusItemOnMap
    && previous.onEditItem === next.onEditItem
    && previous.onDeleteItem === next.onDeleteItem
    && previous.onToggleExpandedItem === next.onToggleExpandedItem;
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
