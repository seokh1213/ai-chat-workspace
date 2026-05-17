import { Bot, CalendarDays, MapPinned, Menu, X, type LucideIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

import type { MobileEditorView } from "../../lib/mobileView";

interface MobileViewSwitcherProps {
  activeView: MobileEditorView;
  onOpenDetails: () => void;
  onOpenMap: () => void;
  onOpenChatList: () => void;
}

export function MobileViewSwitcher({
  activeView,
  onOpenDetails,
  onOpenMap,
  onOpenChatList
}: MobileViewSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const items = [
    { view: "details", label: "일정", Icon: CalendarDays, onSelect: onOpenDetails },
    { view: "map", label: "지도", Icon: MapPinned, onSelect: onOpenMap },
    { view: "chat", label: "AI 대화", Icon: Bot, onSelect: onOpenChatList }
  ] satisfies Array<{ view: MobileEditorView; label: string; Icon: LucideIcon; onSelect: () => void }>;

  function closeSheet() {
    setOpen(false);
    setMounted(false);
    triggerButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!mounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeSheet();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted]);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  function selectItem(onSelect: () => void) {
    closeSheet();
    onSelect();
  }

  function openSheet() {
    setMounted(true);
    setOpen(true);
  }

  return (
    <>
      <button
        className="grid h-9 w-9 place-items-center rounded-md border-0 bg-transparent p-0 text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--teal)]"
        type="button"
        ref={triggerButtonRef}
        aria-label="화면 전환 열기"
        aria-expanded={open}
        onClick={openSheet}
      >
        <Menu className="block h-[21px] w-[21px]" strokeWidth={2.1} aria-hidden="true" />
      </button>
      {mounted ? (
        <div className="fixed inset-0 z-[1400]" role="presentation">
          <button
            className={[
              "absolute inset-0 h-full w-full border-0 bg-black/45 p-0 transition-opacity duration-100 ease-out",
              open ? "opacity-100" : "opacity-0"
            ].join(" ")}
            type="button"
            aria-label="화면 전환 닫기"
            onClick={closeSheet}
          />
          <aside
            className={[
              "absolute bottom-0 right-0 top-0 grid w-[min(320px,86vw)] transform-gpu grid-rows-[auto_1fr] border-l border-[var(--line)] bg-[var(--surface)] text-[var(--text)] transition-transform duration-100 ease-out will-change-transform",
              open ? "translate-x-0 shadow-[var(--shadow-strong)]" : "translate-x-full shadow-none"
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label="화면 전환"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+14px)]">
              <div className="grid min-w-0 gap-0.5">
                <strong className="text-base font-extrabold leading-5">화면 전환</strong>
                <span className="text-xs font-bold text-[var(--secondary)]">일정, 지도, AI 대화</span>
              </div>
              <button
                className="grid h-9 w-9 shrink-0 place-items-center rounded-md border-0 bg-transparent p-0 text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--teal)]"
                type="button"
                ref={closeButtonRef}
                aria-label="화면 전환 닫기"
                onClick={closeSheet}
              >
                <X className="block h-[21px] w-[21px]" strokeWidth={2.1} aria-hidden="true" />
              </button>
            </div>
            <nav className="grid content-start overflow-y-auto px-3 py-2" aria-label="모바일 화면 전환">
              {items.map((item, index) => (
                <Fragment key={item.view}>
                  <DrawerItem
                    active={activeView === item.view}
                    Icon={item.Icon}
                    label={item.label}
                    onClick={() => selectItem(item.onSelect)}
                  />
                  {index < items.length - 1 ? <div className="mx-3 my-2 h-px bg-[var(--line)]" aria-hidden="true" /> : null}
                </Fragment>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function DrawerItem(props: { active: boolean; Icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      className={[
        "inline-flex min-h-12 w-full items-center gap-3 rounded-md border-0 px-3 text-left text-sm font-extrabold leading-none",
        props.active
          ? "bg-[var(--teal-soft)] text-[var(--text)]"
          : "bg-transparent text-[var(--secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
      ].join(" ")}
      type="button"
      aria-current={props.active ? "page" : undefined}
      onClick={props.onClick}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--surface-soft)] text-[var(--teal)]">
        <props.Icon className="block h-[22px] w-[22px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span>{props.label}</span>
    </button>
  );
}
