# Target Architecture

## 구조

```text
frontend
  app-shell
  workspace-ui
  data-space-ui
  chat-ui
  markdown-ui
  domain-adapter-ui

backend
  workspace
  data-space
  source-record
  chat
  ai-provider
  operation
  checkpoint
  domain-adapter

ai providers
  codex-app-server
  openai-compatible
  openrouter

external adapters
  web app
  telegram bot
  discord bot
```

## 핵심 흐름

```text
User message
  -> ChatController
  -> ChatRunService
  -> DomainContextBuilder
  -> AiProvider.streamChat()
  -> SSE events
  -> ToolBlockParser
  -> OperationValidator
  -> DomainOperationApplier
  -> CheckpointService
  -> Chat message persisted
```

## 계층 경계

### Generic Core

도메인과 무관하게 재사용한다.

- workspace
- data_space
- chat_sessions
- chat_messages
- ai_edit_runs
- ai_provider_sessions
- checkpoints
- AI provider abstraction
- streaming/SSE contract
- Markdown rendering conventions
- operation envelope parser

### Domain Adapter

프로젝트마다 교체한다.

- domain schema
- prompt context snapshot
- operation schema
- operation validation
- operation application
- domain-specific views
- seed/import tools

### Integration Adapter

입력 채널별로 추가한다.

- Web frontend
- Telegram bot
- Discord bot
- Slack bot
- CLI

## 설계 원칙

- AI는 DB를 직접 수정하지 않는다.
- 모든 변경은 operation으로 표현한다.
- operation은 서버에서 검증한다.
- checkpoint는 operation 적용 전후를 저장한다.
- provider transport는 UI와 domain adapter에 새지 않는다.
- UI는 provider가 Codex인지 OpenAI-compatible인지 몰라도 된다.

