import type { ComponentType, ReactNode } from "react";
import { Bell, Bookmark, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, ExternalLink, FileText, MessageCircle, MoreVertical, Plus, Settings } from "lucide-react";
import { activeDelegations, promptModes, recentTopics, scheduledTasks, sidebarPrimaryItems, sidebarSecondaryItems, suggestedTools } from "@/lib/design-data";
import { SwitchControl } from "@/components/ui/switch-control";
import { ChatComposer } from "@/components/design/chat-composer";

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export default function RefinedPage() {
  return (
    <main className="refined-shell">
      <RefinedSidebar />
      <section className="refined-main">
        <header className="refined-header">
          <div>
            <h1>안녕하세요, 민호님! 👋</h1>
            <p>계획하고, 조사하고, 만들어내고, 자동으로 처리까지. 무엇이든 물어보세요.</p>
          </div>
          <div className="refined-header-actions">
            <button className="refined-primary-button" type="button">
              <Plus size={15} />
              새 주제 만들기
            </button>
          </div>
        </header>
        <section className="refined-command-card">
          <h2 className="refined-command-heading">무엇을 도와줄까요?</h2>
          <ChatComposer placeholder="메시지를 입력하세요..." variant="refined" />
          <div className="refined-mode-row">
            {promptModes.map((mode) => (
              <RefinedModeCard description={mode.description} icon={mode.icon} key={mode.id} title={mode.title} tone={mode.tone} />
            ))}
          </div>
          <div className="refined-tool-band">
            <span className="refined-tool-band-title">추천 도구</span>
            <div className="refined-tool-grid">
              {suggestedTools.map((tool) => (
                <RefinedToolCard description={tool.description} icon={tool.icon} key={tool.id} title={tool.title} tone={tool.tone} />
              ))}
              <button aria-label="추천 도구 더 보기" className="refined-tool-next-button" type="button">
                <ChevronRight size={19} />
              </button>
            </div>
          </div>
        </section>
        <section className="refined-work-grid">
          <div className="refined-section-title">
            <h2>최근 주제</h2>
            <a href="#">모두 보기</a>
          </div>
          <div className="refined-topic-grid">
            {recentTopics.map((topic) => (
              <RefinedTopicCard topic={topic} key={topic.id} />
            ))}
          </div>
          <button className="refined-more-topic-button" type="button">
            <Plus size={17} />
            더 많은 주제 보기
          </button>
        </section>
      </section>
      <RefinedRightRail />
    </main>
  );
}

function RefinedSidebar() {
  return (
    <aside className="refined-sidebar">
      <div className="refined-brand">
        <img alt="" src="/mock-assets/profile.png" />
        <strong>내 AI 허브</strong>
        <ChevronDown size={16} />
        <Bell className="refined-brand-bell" size={18} />
      </div>
      <nav className="refined-nav" aria-label="주요 메뉴">
        {sidebarPrimaryItems.map((item) => (
          <RefinedNavItem active={item.active} icon={item.icon} key={item.id} label={item.label} />
        ))}
      </nav>
      <div className="refined-nav-divider" />
      <nav className="refined-nav compact" aria-label="작업 메뉴">
        {sidebarSecondaryItems.map((item) => (
          <RefinedNavItem icon={item.icon} key={item.id} label={item.label} />
        ))}
      </nav>
      <div className="refined-sidebar-footer">
        <RefinedNavItem icon={Settings} label="설정" />
        <RefinedNavItem icon={CircleHelp} label="도움말" />
        <div className="refined-account">
          <div className="refined-account-mark">M</div>
          <div className="refined-account-copy">
            <strong>Minho</strong>
            <span>프로 플랜</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </aside>
  );
}

function RefinedNavItem({ active = false, icon: Icon, label }: { active?: boolean; icon: IconComponent; label: string }) {
  return (
    <a className={active ? "refined-nav-item active" : "refined-nav-item"} href="#">
      <Icon size={19} />
      <span>{label}</span>
    </a>
  );
}

function RefinedModeCard({ description, icon: Icon, title, tone }: { description: string; icon: IconComponent; title: string; tone: string }) {
  return (
    <button className="refined-mode-card" type="button">
      <span className={`refined-mode-icon ${tone}`}><Icon size={17} /></span>
      <span className="refined-mode-copy">
        <strong>{title}</strong>
        <em>{description}</em>
      </span>
    </button>
  );
}

function RefinedToolCard({ description, icon: Icon, title, tone }: { description: string; icon: IconComponent; title: string; tone: string }) {
  return (
    <button className="refined-tool-card" type="button">
      <span className={`refined-tool-icon ${tone}`}>
        <Icon size={20} />
      </span>
      <span>
        <strong>{title}</strong>
        <em>{description}</em>
      </span>
    </button>
  );
}

function RefinedTopicCard({ topic }: { topic: (typeof recentTopics)[number] }) {
  return (
    <article className="refined-topic-card">
      <img alt="" src={topic.image} />
      <div className="refined-topic-body">
        <div className="refined-topic-heading">
          <h3>{topic.title}</h3>
          <MoreVertical size={17} />
        </div>
        <p>{topic.subtitle}</p>
        <div className="refined-progress-row">
          <span>{topic.status}</span>
          <div><i style={{ width: `${topic.progress}%` }} /></div>
          <strong>{topic.progress}%</strong>
        </div>
        <div className="refined-topic-meta">
          <span><MessageCircle size={15} />{topic.meta.comments}</span>
          <span><FileText size={15} />{topic.meta.files}</span>
          <span><Bookmark size={15} />{topic.meta.bookmarks}</span>
          <em>{topic.meta.updatedAt}</em>
        </div>
      </div>
    </article>
  );
}

function RefinedRightRail() {
  return (
    <aside className="refined-rail">
      <RefinedPanel title="진행 중인 맡긴 일" count={6}>
        <div className="refined-run-list">
          {activeDelegations.map((item) => {
            const Icon = item.icon;
            return (
              <article className="refined-run-item" key={item.id}>
                <span className={`refined-run-dot ${item.color}`} />
                <div className="refined-run-icon"><Icon size={19} /></div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  <em>{item.progress} · {item.time}</em>
                </div>
              </article>
            );
          })}
        </div>
      </RefinedPanel>
      <RefinedPanel title="예정된 자동 작업" count={4}>
        <div className="refined-schedule-list">
          {scheduledTasks.map((task) => {
            const Icon = task.icon;
            return (
              <article className="refined-schedule-row" key={task.id}>
                <span><Icon size={18} /></span>
                <div>
                  <strong>{task.title}</strong>
                  <em>{task.cadence} · {task.time}</em>
                </div>
                <SwitchControl ariaLabel={`${task.title} 자동 작업`} checked={task.enabled} />
              </article>
            );
          })}
        </div>
      </RefinedPanel>
      <section className="refined-guide">
        <div className="refined-guide-heading">
          <strong>빠른 시작 가이드</strong>
          <span>1/3</span>
          <button aria-label="이전 가이드" type="button"><ChevronLeft size={15} /></button>
          <button aria-label="다음 가이드" type="button"><ChevronRight size={15} /></button>
        </div>
        <div className="refined-guide-progress"><span /></div>
        <h3>연결을 추가해 보세요</h3>
        <p>캘린더, 이메일, 드라이브 등을 연결하면 더 정확하고 강력한 도움을 받을 수 있어요.</p>
        <button type="button">연결 설정하기 <ExternalLink size={14} /></button>
      </section>
    </aside>
  );
}

function RefinedPanel({ children, count, title }: { children: ReactNode; count: number; title: string }) {
  return (
    <section className="refined-panel">
      <div className="refined-panel-heading">
        <h2>{title}<span>{count}</span></h2>
        <a href="#">모두 보기</a>
      </div>
      {children}
    </section>
  );
}
