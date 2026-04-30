# Examples

이 폴더는 새 프로젝트에 복사할 수 있는 예시 코드와 실행 가능한 샘플 앱을 함께 둔다.

목표는 다음 AI Agent가 새 프로젝트를 만들 때 바로 기준으로 삼을 수 있는 패턴을 제공하는 것이다.

## 구성

```text
examples/
  apps/
    trip-plan/
      여행 계획 + 지도 + AI 편집 예제
    mind-plan/
      마인드/생각 정리 도메인 예제
    todo-ai/
      Todo 원천 데이터 + Codex app-server 연결 최소 예제
  reusable/
    frontend/
      src/chat/
        chatTypes.ts
        chatApi.ts
        markdown.ts
        useChatStream.ts
        ChatPanel.tsx
        ChatMessageBubble.tsx
        OperationPreviewList.tsx
    backend/
      src/main/kotlin/app/aichatworkspace/example/
        ai/
        chat/
        domain/
```

## 실행형 예제

- `apps/trip-plan`: 기존 여행 계획 서비스 전체를 예제로 복사한 버전이다. 지도, 워크스페이스, 채팅 세션, provider 설정, operation 적용 흐름을 확인할 때 기준으로 쓴다.
- `apps/mind-plan`: 같은 "원천 데이터 + AI 채팅 편집" 구조를 다른 도메인으로 적용한 예제다.
- `apps/todo-ai`: 가장 작은 Todo 도메인으로 Codex app-server, SSE, Markdown 렌더링, operation parsing을 확인하는 예제다.

## 복사 원칙

- `.git`, `node_modules`, `build`, `.gradle`, `.data`, `.logs`, `dist` 같은 이력/빌드/런타임 산출물은 예제에 포함하지 않는다.
- package/module 이름은 실제 프로젝트에 맞게 바꾼다.
- DTO 필드는 실제 DB schema에 맞게 조정한다.
- domain operation은 예시 adapter를 버리고 실제 domain adapter로 교체한다.
- provider 구현은 Codex/OpenAI/OpenRouter adapter를 붙이기 전까지 `ExampleAiProvider`로 테스트한다.
