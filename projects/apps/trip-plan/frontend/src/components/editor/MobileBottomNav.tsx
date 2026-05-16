import { Bot, CalendarDays, MapPinned } from "lucide-react";
import type { ReactNode } from "react";

import type { MobileEditorView } from "../../lib/mobileView";

interface MobileBottomNavProps {
  mobileView: MobileEditorView;
  onOpenDetails: () => void;
  onOpenMap: () => void;
  onOpenChatList: () => void;
}

export function MobileBottomNav(props: MobileBottomNavProps) {
  const tabs = [
    { view: "details", label: "상세", icon: <CalendarDays size={17} />, onClick: props.onOpenDetails },
    { view: "map", label: "지도", icon: <MapPinned size={17} />, onClick: props.onOpenMap },
    { view: "chat", label: "대화", icon: <Bot size={17} />, onClick: props.onOpenChatList }
  ] satisfies Array<{ view: MobileEditorView; label: string; icon: ReactNode; onClick: () => void }>;

  return (
    <nav className="mobile-bottom-nav" aria-label="모바일 화면 전환">
      {tabs.map((tab) => (
        <MobileBottomTab
          active={props.mobileView === tab.view}
          icon={tab.icon}
          key={tab.view}
          label={tab.label}
          onClick={tab.onClick}
        />
      ))}
    </nav>
  );
}

function MobileBottomTab(props: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={props.active ? "active" : ""} type="button" aria-current={props.active ? "page" : undefined} onClick={props.onClick}>
      {props.icon}
      <span>{props.label}</span>
    </button>
  );
}
