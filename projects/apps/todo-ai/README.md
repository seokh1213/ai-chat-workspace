# Todo AI Workspace Demo

Kotlin Spring Boot API와 React 프론트를 붙인 실행 가능한 예시 프로젝트다.  
원천 데이터는 `Todo`, AI 채팅은 `codex app-server`를 실제 호출하고 SSE로 응답 델타와 변경 작업을 전달한다.

## 사전 조건

Codex app-server가 떠 있어야 한다.

```bash
codex app-server --listen ws://127.0.0.1:8765
```

이미 다른 프로젝트에서 app-server를 띄웠다면 그대로 재사용한다. 기본 설정은 `ws://127.0.0.1:8765`, `gpt-5.4-mini`, `medium`이다.

## 실행

터미널 1:

```bash
cd projects/apps/todo-ai
export JAVA_HOME="$(/usr/libexec/java_home -v 21)"
./gradlew :backend:bootRun
```

터미널 2:

```bash
cd projects/apps/todo-ai/frontend
npm install
npm run dev
```

브라우저:

```text
http://127.0.0.1:4178
```

## API

- `GET /api/workspaces`: 작업공간 목록
- `POST /api/workspaces`: 작업공간 생성
- `PATCH /api/workspaces/{workspaceId}`: 이름/LLM provider 설정 수정
- `DELETE /api/workspaces/{workspaceId}`: 작업공간 삭제
- `GET /api/workspaces/{workspaceId}/state`: 작업공간별 Todo/채팅/체크포인트 조회
- `POST /api/workspaces/{workspaceId}/chat/messages`: 작업공간 설정으로 Codex 채팅 실행
- `GET /api/state`: 현재 Todo, 채팅 메시지, 체크포인트 조회
- `GET /api/chat/events`: SSE 이벤트 스트림
- `POST /api/chat/messages`: 채팅 메시지 전송
- `POST /api/todos`: 할일 직접 추가
- `PATCH /api/todos/{id}`: 할일 수정
- `DELETE /api/todos/{id}`: 할일 삭제
- `POST /api/reset`: 데모 데이터 초기화

## 예시 프롬프트

- `보고서 초안 작성 할일 추가해줘`
- `SSE 채팅 연결 점검 완료 처리해줘`
- `스크린샷용 데모 다듬기 높은 우선순위로 바꿔줘`

## 구조

```text
projects/apps/todo-ai
├── backend   # Spring Boot Kotlin API
└── frontend  # Vite React app
```

AI 응답은 사용자에게 보이는 Markdown과 숨김 `<tool>{"operations":[...]}</tool>` 블록으로 구성된다. 백엔드는 tool block을 화면에 노출하지 않고 파싱해서 Todo 데이터에 적용한다.

## UX 흐름

```text
작업공간 목록
→ 작업공간 생성/선택
→ LLM provider 설정 확인/수정
→ 편집 화면 진입
→ Todo 원천 데이터와 AI 채팅을 함께 편집
```
