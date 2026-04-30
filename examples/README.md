# Examples

이 폴더는 새 프로젝트에 복사할 수 있는 예시 코드 조각이다.

목표는 완성 앱이 아니라, 다음 AI Agent가 구현할 때 바로 기준으로 삼을 수 있는 패턴을 제공하는 것이다.

## 구성

```text
examples/
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

## 복사 원칙

- package/module 이름은 실제 프로젝트에 맞게 바꾼다.
- DTO 필드는 실제 DB schema에 맞게 조정한다.
- domain operation은 예시 adapter를 버리고 실제 domain adapter로 교체한다.
- provider 구현은 Codex/OpenAI/OpenRouter adapter를 붙이기 전까지 `ExampleAiProvider`로 테스트한다.

