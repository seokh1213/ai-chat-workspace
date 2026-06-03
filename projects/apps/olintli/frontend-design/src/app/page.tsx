import type { ComponentType, ReactNode } from "react";
import { Bell, Bookmark, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ExternalLink, FileText, MessageCircle, MoreVertical, Plus, Settings } from "lucide-react";
import { activeDelegations, promptModes, recentTopics, scheduledTasks, sidebarPrimaryItems, sidebarSecondaryItems, suggestedTools } from "@/lib/design-data";
import { SwitchControl } from "@/components/ui/switch-control";
import { ChatComposer } from "@/components/design/chat-composer";

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export default function DesignLabPage() {
  return (
    <main className="hub-shell">
      <Sidebar />
      <section className="hub-main">
        <header className="hero-row">
          <div>
            <h1>안녕하세요, 민호님! 👋</h1>
            <p>계획하고, 조사하고, 만들어내고, 자동으로 처리까지. 무엇이든 물어보세요.</p>
          </div>
          <button className="new-topic-button" type="button">
            <Plus size={15} />
            새 주제 만들기
          </button>
        </header>
        <AssistantPanel />
        <RecentTopics />
      </section>
      <RightRail />
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hub-sidebar">
      <div className="sidebar-brand">
        <img alt="" className="sidebar-avatar" src="/mock-assets/profile.png" />
        <strong>내 AI 허브</strong>
        <ChevronDown size={16} />
        <Bell className="brand-bell" size={18} />
      </div>
      <nav className="sidebar-nav" aria-label="주요 메뉴">
        {sidebarPrimaryItems.map((item) => (
          <SidebarItem active={item.active} icon={item.icon} key={item.id} label={item.label} />
        ))}
      </nav>
      <div className="sidebar-divider" />
      <nav className="sidebar-nav secondary" aria-label="도구 메뉴">
        {sidebarSecondaryItems.map((item) => (
          <SidebarItem icon={item.icon} key={item.id} label={item.label} />
        ))}
      </nav>
      <div className="sidebar-bottom">
        <SidebarItem icon={Settings} label="설정" />
        <SidebarItem icon={CircleHelp} label="도움말" />
        <div className="account-card">
          <div className="account-mark">M</div>
          <div>
            <strong>Minho</strong>
            <span>프로 플랜</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ active = false, icon: Icon, label }: { active?: boolean; icon: IconComponent; label: string }) {
  return (
    <a className={active ? "sidebar-item active" : "sidebar-item"} href="#">
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </a>
  );
}

function AssistantPanel() {
  return (
    <section className="assistant-panel">
      <h2>무엇을 도와줄까요?</h2>
      <ChatComposer placeholder="메시지를 입력하세요..." />
      <div className="prompt-mode-row">
        {promptModes.map((mode) => (
          <ActionChip description={mode.description} icon={mode.icon} key={mode.id} title={mode.title} tone={mode.tone} />
        ))}
      </div>
      <div className="tool-band">
        <span className="tool-band-title">추천 도구</span>
        <div className="tool-grid">
          {suggestedTools.map((tool) => (
            <ToolCard description={tool.description} icon={tool.icon} key={tool.id} title={tool.title} tone={tool.tone} />
          ))}
          <button aria-label="추천 도구 더 보기" className="tool-next-button" type="button">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

function ActionChip({ description, icon: Icon, title, tone }: { description: string; icon: IconComponent; title: string; tone: string }) {
  return (
    <button className="action-chip" type="button">
      <span className={`chip-icon ${tone}`}>
        <Icon size={17} />
      </span>
      <span>
        <strong>{title}</strong>
        <em>{description}</em>
      </span>
    </button>
  );
}

function ToolCard({ description, icon: Icon, title, tone }: { description: string; icon: IconComponent; title: string; tone: string }) {
  return (
    <button className="tool-card" type="button">
      <span className={`tool-icon ${tone}`}>
        <Icon size={21} />
      </span>
      <span>
        <strong>{title}</strong>
        <em>{description}</em>
      </span>
    </button>
  );
}

function RecentTopics() {
  return (
    <section className="recent-section">
      <div className="section-heading">
        <h2>최근 주제</h2>
        <a href="#">모두 보기</a>
      </div>
      <div className="topic-grid">
        {recentTopics.map((topic) => (
          <article className="topic-card" key={topic.id}>
            <img alt="" className="topic-image" src={topic.image} />
            <div className="topic-content">
              <div className="topic-title-row">
                <h3>{topic.title}</h3>
                <MoreVertical size={18} />
              </div>
              <p>{topic.subtitle}</p>
              <div className="topic-progress-row">
                <span>{topic.status}</span>
                <div className="progress-track">
                  <div style={{ width: `${topic.progress}%` }} />
                </div>
                <strong>{topic.progress}%</strong>
              </div>
              <div className="topic-meta">
                <span><MessageCircle size={16} />{topic.meta.comments}</span>
                <span><FileText size={16} />{topic.meta.files}</span>
                <span><Bookmark size={16} />{topic.meta.bookmarks}</span>
                <em>{topic.meta.updatedAt}</em>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button className="more-topic-button" type="button">
        <Plus size={17} />
        더 많은 주제 보기
      </button>
    </section>
  );
}

function RightRail() {
  return (
    <aside className="right-rail">
      <RailSection count={6} title="진행 중인 맡긴 일">
        <div className="delegation-list">
          {activeDelegations.map((item) => (
            <DelegationItem item={item} key={item.id} />
          ))}
        </div>
      </RailSection>
      <RailSection count={4} title="예정된 자동 작업">
        <div className="schedule-list">
          {scheduledTasks.map((task) => (
            <ScheduledTask task={task} key={task.id} />
          ))}
        </div>
      </RailSection>
      <GuideCard />
    </aside>
  );
}

function RailSection({ children, count, title }: { children: ReactNode; count: number; title: string }) {
  return (
    <section className="rail-section">
      <div className="rail-heading">
        <h2>{title}<span>{count}</span></h2>
        <a href="#">모두 보기</a>
      </div>
      {children}
    </section>
  );
}

function DelegationItem({ item }: { item: { title: string; description: string; progress: string; time: string; icon: IconComponent; color: string } }) {
  const Icon = item.icon;
  return (
    <article className={`delegation-item ${item.color}`}>
      <span className="timeline-dot" />
      <div className="rail-icon">
        <Icon size={22} />
      </div>
      <div className="delegation-copy">
        <strong>{item.title}</strong>
        <span>{item.description}</span>
        <em>{item.progress} · {item.time}</em>
      </div>
      <img alt="" className="small-avatar" src="/mock-assets/profile.png" />
    </article>
  );
}

function ScheduledTask({ task }: { task: { title: string; description: string; cadence: string; time: string; icon: IconComponent; color: string; enabled: boolean } }) {
  const Icon = task.icon;
  return (
    <article className="schedule-item">
      <div className={`schedule-icon ${task.color}`}>
        <Icon size={21} />
      </div>
      <div>
        <strong>{task.title}</strong>
        <span>{task.description}</span>
      </div>
      <div className="schedule-time">
        <span>{task.cadence}</span>
        <em>{task.time}</em>
      </div>
      <SwitchControl ariaLabel={`${task.title} 자동 작업`} checked={task.enabled} />
    </article>
  );
}

function GuideCard() {
  return (
    <section className="guide-card">
      <div className="guide-top">
        <strong>빠른 시작 가이드</strong>
        <span>1/3</span>
        <button aria-label="이전 가이드" type="button"><ChevronLeft size={17} /></button>
        <button aria-label="다음 가이드" type="button"><ChevronRight size={17} /></button>
      </div>
      <div className="guide-progress">
        <div />
      </div>
      <h3>연결을 추가해 보세요</h3>
      <p>캘린더, 이메일, 드라이브 등을 연결하면 더 정확하고 강력한 도움을 받을 수 있어요.</p>
      <button className="guide-button" type="button">
        연결 설정하기
        <ExternalLink size={14} />
      </button>
    </section>
  );
}
