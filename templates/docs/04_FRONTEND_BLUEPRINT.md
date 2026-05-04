# Frontend Blueprint

권장 스택:

- React
- TypeScript
- Tailwind CSS 또는 기존 CSS module
- React Markdown + remark-gfm + remark-breaks
- SSE EventSource

## Layout

```text
Workspace Select Screen
  - workspace list
  - workspace settings
  - data space list

Data Space Editor
  - left/domain panel
  - center/domain view
  - right/chat panel

Chat Panel
  - session list
  - active session header
  - message log
  - streaming assistant bubble
  - composer
```

## 재사용할 UI 컴포넌트

### Workspace

- `WorkspaceSwitcher`
- `WorkspaceSettingsDialog`
- `DataSpaceList`
- `DataSpaceCreateDialog`

### Chat

- `ChatHome`
- `ChatSessionRow`
- `ActiveChatHeader`
- `ChatMessageBubble`
- `StreamingMessageBubble`
- `OperationPreviewList`
- `ChatComposer`
- `MarkdownContent`
- `ScrollToLatestButton`

### Provider

- `ProviderStatusCard`
- `ProviderSettingsForm`

## Chat UX Rules

- 세션 목록 URL과 세션 상세 URL을 분리한다.
- `chatId`가 없으면 세션 목록을 보여준다.
- `chatId`가 있으면 해당 대화를 보여준다.
- 세션 제목은 inline edit 가능해야 한다.
- 세션 전체 Markdown 복사와 메시지별 본문 복사를 모두 제공한다.
- 메시지 메타는 `시각 · 소요시간 · 변경 N개` 형태로 보인다.
- streaming 중 사용자가 위로 스크롤하면 자동 스크롤을 중단한다.
- 하단 근처일 때만 자동 추적한다.
- 자동 추적이 중단되면 `최신으로` 버튼을 제공한다.

## Markdown Rendering

필수 처리:

- `remarkGfm`
- `remarkBreaks`
- list marker 표시
- 긴 문단 줄바꿈
- provider가 잘못 준 `Sources:` 같은 라벨 한국어 정규화는 optional
- tool block은 메시지에 노출하지 않는다.

## Domain View Slot

도메인별 화면은 공통 shell 안에 끼운다.

```tsx
<DataSpaceEditorShell
  leftPanel={<DomainSidebar />}
  mainView={<DomainPrimaryView />}
  chatPanel={<ChatPanel />}
/>
```

여행 앱에서는:

- `DomainSidebar` = 일정/조사장소
- `DomainPrimaryView` = 지도

다른 앱에서는:

- CRM = pipeline/sidebar + kanban/table
- 콘텐츠 = calendar/sidebar + editor
- 연구 = source list + graph/table

