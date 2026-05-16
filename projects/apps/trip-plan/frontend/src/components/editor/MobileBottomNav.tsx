import { Bot, CalendarDays, MapPinned } from "lucide-react";

import type { MobileEditorView } from "../../lib/mobileView";

interface MobileBottomNavProps {
  mobileView: MobileEditorView;
  onOpenDetails: () => void;
  onOpenMap: () => void;
  onOpenChatList: () => void;
}

export function MobileBottomNav(props: MobileBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 화면 전환">
      <button className={props.mobileView === "details" ? "active" : ""} type="button" onClick={props.onOpenDetails}>
        <CalendarDays size={17} />
        <span>상세</span>
      </button>
      <button className={props.mobileView === "map" ? "active" : ""} type="button" onClick={props.onOpenMap}>
        <MapPinned size={17} />
        <span>지도</span>
      </button>
      <button className={props.mobileView === "chat" ? "active" : ""} type="button" onClick={props.onOpenChatList}>
        <Bot size={17} />
        <span>대화</span>
      </button>
    </nav>
  );
}
