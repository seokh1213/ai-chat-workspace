# External Bot Integration

목표는 웹앱의 채팅 세션을 Telegram, Discord 같은 외부 채팅 앱에서도 이어서 사용하는 것이다.

지도, kanban, calendar 같은 rich view는 웹앱에서 보고, 외부 채팅앱에서는 텍스트와 데이터 조작만 담당한다.

## 구조

```text
Telegram / Discord
  -> Bot Adapter
  -> Backend Chat API
  -> ChatRunService
  -> AiProvider
  -> DB
```

Bot adapter는 AI provider에 직접 붙지 않는다. 반드시 backend API를 호출한다.

## 추가 테이블

```sql
CREATE TABLE external_chat_bindings (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  external_user_id TEXT NOT NULL,
  external_chat_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  data_space_id TEXT REFERENCES data_spaces(id) ON DELETE SET NULL,
  chat_session_id TEXT REFERENCES chat_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, external_user_id, external_chat_id)
);
```

## 연결 흐름

1. 웹에서 bot link code 생성
2. 사용자가 Telegram/Discord에서 `/link ABC123` 입력
3. backend가 external account와 workspace를 묶음
4. 이후 `/spaces`, `/sessions`로 이동 가능

## 명령어 후보

```text
/start
/link <code>
/workspaces
/spaces
/select_space <id>
/sessions
/new_session
/select_session <id>
/records
/checkpoint
/rollback <checkpointId>
/web
```

## Streaming UX

Telegram/Discord는 browser SSE처럼 token 단위 렌더링이 자연스럽지 않다.

권장:

- run.started 때 "응답 준비 중" 메시지 전송
- delta를 서버 내부 buffer에 모음
- 1~2초 간격으로 bot message edit
- run.completed 때 최종 메시지로 교체
- operations proposed/applied는 짧은 요약으로 추가

## 보안

- Bot token은 backend 또는 adapter service 환경변수로만 보관한다.
- 외부 chat id만으로 workspace 접근을 허용하지 않는다.
- 반드시 link code나 계정 인증을 거친다.
- destructive operation은 웹에서 확인하도록 유도할 수 있다.

