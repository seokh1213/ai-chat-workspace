# Design System PRD

## 배경

Ulsabio는 chat-first 제품이지만 채팅 앱만은 아님. 단발 질문은 채팅 안에서 끝나고, 누적되는 일은 workspace로 승격되며, agent와 tool은 사용자가 직접 조립하고 관리한다. 디자인 시스템의 목적은 이 다양한 화면을 하나의 제품처럼 보이게 하면서도, 흔한 AI 생성 웹사이트의 반복 패턴을 피하는 것임.

## 목표

- 채팅, workspace, agent builder, todo map, report builder, settings를 하나의 제품 언어로 묶음.
- 이미지 기반 high-fidelity mockup을 빠르게 React 화면으로 옮길 수 있는 토큰과 컴포넌트 체계 제공.
- 동일 화면에 `image fidelity` 버전과 `refined production` 버전을 병렬로 만들 수 있게 함.
- shadcn/ui, AI Elements, lucide-react, React Flow, Tiptap, react-markdown을 상업 사용 가능한 라이선스 기준으로 채택.
- AI가 만든 초안을 검수할 수 있는 AI 냄새 제거 하네스를 디자인 프로세스에 포함.

## 비목표

- 공개 SaaS 랜딩 페이지 제작.
- 모든 기능을 첫 버전에서 완성.
- 시각 효과 중심의 demo page 제작.
- proprietary UI kit에 종속.

## 제품 톤

| 축 | 방향 |
|---|---|
| 밀도 | 개인 운영 도구처럼 촘촘하되 과밀하지 않음 |
| 색 | 어두운 graphite base, muted cyan/amber/green accent, purple gradient 기본 제외 |
| 형태 | 6-8px radius, 명확한 panel boundary, nested card 최소화 |
| 타이포 | sans 중심, mono는 technical value 전용 |
| 모션 | 실행 상태, 전환, 승인 대기처럼 의미 있는 상태에만 사용 |
| 카피 | 감성 문구보다 현재 객체와 다음 행동 중심 |

## 시각 트랙

| 트랙 | 목적 | 산출물 |
|---|---|---|
| Image Fidelity | 생성 이미지와 최대한 같은 구도·색·밀도 재현 | 빠른 설득용 mock, 화면별 visual reference |
| Refined Production | 실제 제품 운영에 맞게 절제, 접근성, 확장성 반영 | 구현 기준 mock, design token 반영 |

두 트랙은 경쟁이 아니라 단계임. 먼저 image fidelity로 방향을 확인하고, refined production에서 장식과 반복 패턴을 줄여 실제 구현 기준으로 고정한다.

## Stack Decision

| 영역 | 선택 | 이유 | 라이선스/주의 |
|---|---|---|---|
| App framework | Next.js App Router | 채팅, workspace, API route, streaming UI를 한 프론트에서 다루기 좋음 | 공식 App Router는 file-system router와 Server Components 기반 |
| UI base | shadcn/ui | 컴포넌트를 소스 형태로 소유하고 제품 톤에 맞게 수정 가능 | registry 기반으로 내부 디자인 시스템 배포 가능 |
| AI UI | AI Elements | conversation, message, tool, reasoning, prompt input 같은 AI-native 패턴 제공 | React 19, Tailwind 4, AI SDK 전제 |
| Icon | lucide-react | 도구형 UI에 필요한 범용 outline icon 충분 | 기존 trip-plan에서도 사용 중 |
| Styling | Tailwind CSS 4 + CSS tokens | shadcn/AI Elements와 궁합 좋고 토큰화 쉬움 | token source와 compiled class 혼재 금지 |
| Infinite canvas | @xyflow/react | agent builder, workflow graph, tool pipeline에 적합 | React Flow는 MIT open source |
| Markdown | AI Elements MessageResponse 우선, 일반 문서는 react-markdown | streaming AI text와 일반 markdown 모두 대응 | react-markdown은 MIT, XSS 플러그인 주의 |
| WYSIWYG | Tiptap OSS Editor | report/document builder에 맞는 headless rich editor | OSS editor는 MIT, Pro/Platform 기능은 별도 |
| State | Zustand 후보 | local shell state와 panel state에 적합 | 서버 데이터와 혼용 금지 |
| Server cache | TanStack Query 후보 | tool CRUD, workspace data fetch에 적합 | Next cache와 책임 분리 필요 |
| Backend | Kotlin/Spring Boot | 사용자의 주력 스택, orchestrator API 구현에 적합 | transaction 안에 외부 LLM/tool call 넣지 않음 |

## Trip-plan 참고 결과

기존 `projects/apps/trip-plan/frontend`는 Vite + React 19 + Tailwind v4 기반이고 shadcn을 쓰지 않는다. 디자인 시스템은 `styles/global/tokens.css`와 여러 CSS module-style 파일을 직접 조합하는 방식이다. 신규 Ulsabio는 trip-plan의 여행 UX와 상태 흐름만 참고하고, UI 기반은 Next + shadcn + AI Elements로 새로 간다.

## Token Model

| 토큰 | 기준 |
|---|---|
| `background.base` | 전체 app shell 배경 |
| `background.panel` | sidebar, inspector, chat panel |
| `background.raised` | modal, popover, selected item |
| `border.subtle` | panel 경계 |
| `border.strong` | focus, active, warning |
| `text.primary` | 본문 주요 텍스트 |
| `text.secondary` | 설명, timestamp |
| `text.muted` | empty, disabled |
| `accent.cyan` | active workspace, navigation |
| `accent.green` | completed, connected |
| `accent.amber` | pending approval, schedule |
| `accent.red` | destructive, failed |
| `radius.control` | button, input |
| `radius.panel` | repeated card, dialog |
| `space.shell` | app shell gutter |
| `space.panel` | panel inner padding |

## Component Inventory

| 그룹 | 컴포넌트 | 우선순위 |
|---|---|---|
| Shell | AppShell, Sidebar, TopCommandBar, WorkspaceBreadcrumb | P0 |
| Chat | Conversation, Message, PromptInput, ToolCallCard, WorkspaceTransitionCard | P0 |
| Workspace | WorkspaceHeader, ArtifactTabs, ActivityTimeline, InspectorPanel | P0 |
| Agent | AgentList, AgentCard, AgentCanvasNode, ToolBindingPanel, EvaluationPanel | P1 |
| Todo | TodoList, TodoMap, MarkmapPane, DependencyEdge, ScheduleBadge | P1 |
| Knowledge | ScrapInbox, SourceCard, ReportBuilder, CitationPanel | P1 |
| Settings | ProviderCredentialCard, ModelSelector, UsageMeter, LocalCodexAuthCard, DevTokenPanel | P1 |
| Feedback | EmptyState, LoadingState, ErrorState, ApprovalGate, Toast | P0 |

## Accessibility Criteria

- 모든 icon-only button은 accessible name 필요.
- focus ring은 panel 배경 위에서 명확해야 함.
- keyboard만으로 sidebar, chat composer, canvas node, inspector 이동 가능.
- color만으로 status를 구분하지 않음.
- chart/canvas는 list fallback 또는 inspector summary 제공.
- animation은 reduced motion에서 정지 또는 단순화.

## License Policy

- 기본 허용: MIT, Apache-2.0, BSD, ISC.
- 조건부 허용: MPL-2.0, EPL처럼 파일 단위 의무가 있는 라이선스는 별도 검토.
- 기본 제외: GPL/AGPL, 상업 사용 제한, attribution 제거 금지 외 추가 제한이 강한 dual-license.
- 모든 dependency는 추가 시 `docs/design-system` 또는 별도 `license-ledger`에 출처와 license를 적음.

## Rollout

| 단계 | 산출물 | 완료 조건 |
|---|---|---|
| DS-0 | 문서와 예제 scaffold | design docs, frontend, frontend-design, backend 폴더 존재 |
| DS-1 | 디자인 샘플 앱 | 12개 sidebar 화면 중 3개 이상이 image/refined 두 트랙으로 동작 |
| DS-2 | Core shell | sidebar, chat control tower, workspace transition 구현 |
| DS-3 | Component registry | shadcn 기반 내부 컴포넌트 설치/복제 규칙 고정 |
| DS-4 | Product integration | workspace/tool/agent data와 연결 |

## Open Questions

- Next app을 monorepo package로 묶을지, 예제 폴더를 독립 앱으로 유지할지 결정 필요.
- Tiptap collaboration, comments, version history를 OSS로 직접 만들지 Platform/Pro로 갈지 추후 결정.
- local codex oauth와 app-server orchestration의 인증 경계 정의 필요.
- model provider usage meter의 과금 집계 기준 필요.
