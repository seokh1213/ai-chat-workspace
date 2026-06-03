import { Activity, Bot, CalendarClock, FileText, KeyRound, Map, MessageSquareText, Network, Search, Settings, Sparkles, Waypoints } from "lucide-react";
import { workspaces, runEvents } from "@/lib/mock-data";

const navigationItems = [
  { label: "Today", icon: Activity, active: true },
  { label: "Chat", icon: MessageSquareText, active: false },
  { label: "Workspaces", icon: Waypoints, active: false },
  { label: "Agents", icon: Bot, active: false },
  { label: "Knowledge", icon: Search, active: false },
  { label: "Reports", icon: FileText, active: false },
  { label: "Travel", icon: Map, active: false },
  { label: "Calendar", icon: CalendarClock, active: false },
  { label: "Settings", icon: Settings, active: false }
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">U</div>
          <div>
            <div className="brand-title">Olintli</div>
            <div className="brand-subtitle">Personal orchestrator</div>
          </div>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <a className={item.active ? "nav-item active" : "nav-item"} href="#" key={item.label}>
                <Icon size={17} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="provider-card">
          <KeyRound size={16} />
          <div>
            <strong>OpenRouter connected</strong>
            <span>Local Codex OAuth pending</span>
          </div>
        </div>
      </aside>
      <section className="main-surface">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today Control Tower</p>
            <h1>오늘 이어서 할 작업</h1>
          </div>
          <button className="primary-action" type="button">
            <Sparkles size={16} />
            새 실행 만들기
          </button>
        </header>
        <section className="workspace-grid" aria-label="Workspace summary">
          {workspaces.map((workspace) => (
            <article className="workspace-card" key={workspace.id}>
              <div className="card-kicker">{workspace.type}</div>
              <h2>{workspace.title}</h2>
              <p>{workspace.summary}</p>
              <div className="card-meta">
                <span>{workspace.status}</span>
                <span>{workspace.updatedAt}</span>
              </div>
            </article>
          ))}
        </section>
        <section className="control-layout">
          <article className="chat-panel">
            <div className="panel-heading">
              <h2>Control Chat</h2>
              <span>workspace 연결 가능</span>
            </div>
            <div className="message-list">
              <div className="message user">저번에 작업하던 여행 목록 보여줘.</div>
              <div className="message assistant">부산 3박 4일 workspace가 최근 수정됨. 일정, 지도, 숙소 후보가 열려 있음.</div>
            </div>
            <form className="composer">
              <input aria-label="Message" placeholder="작업을 말하면 workspace나 tool로 연결함" />
              <button type="submit">전송</button>
            </form>
          </article>
          <article className="timeline-panel">
            <div className="panel-heading">
              <h2>Run Timeline</h2>
              <span>최근 agent/tool 실행</span>
            </div>
            <div className="run-list">
              {runEvents.map((event) => (
                <div className="run-event" key={event.id}>
                  <Network size={15} />
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                  <em>{event.status}</em>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
