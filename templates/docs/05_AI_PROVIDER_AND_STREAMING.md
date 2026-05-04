# AI Provider And Streaming

## Provider 목표

프론트는 provider 종류를 몰라야 한다. 모든 provider는 서버에서 공통 이벤트로 변환된다.

지원 대상:

- `codex-app-server`
- `openai-compatible`
- `openrouter`

## 공통 이벤트

```kotlin
sealed interface AiStreamEvent {
    data object RunStarted : AiStreamEvent
    data class Activity(val activity: AiProviderActivity) : AiStreamEvent
    data class MessageDelta(val content: String) : AiStreamEvent
    data class MessageCompleted(val content: String) : AiStreamEvent
    data class OperationsProposed(val operations: List<Map<String, Any?>>) : AiStreamEvent
    data class ResultCompleted(val result: AiProviderResult) : AiStreamEvent
    data object RunCompleted : AiStreamEvent
}
```

## Tool Block Convention

모델에게 사용자 메시지와 내부 operation을 분리하게 한다.

```text
사용자에게 보이는 Markdown 답변

<tool>
{"operations":[{"op":"domain.update_record","recordId":"rec_1","patch":{"title":"새 제목"}}]}
</tool>
```

프론트에는 `<tool>` 블록을 노출하지 않는다.

## Streaming Rules

- provider가 delta를 주면 그대로 SSE로 보낸다.
- provider가 final content만 주면 `assistant.message.completed`로 한 번에 보낸다.
- 서버가 임의로 streaming 흉내를 내지 않는다.
- 단, 프론트에서 표시 안정성을 위해 작은 queue/pump를 둘 수 있다.
- delta가 들어오기 전에는 `run.activity`를 표시한다.
- delta가 시작되면 activity strip을 숨긴다.

## Codex app-server

장점:

- 로컬 Codex auth와 세션 재사용
- WebSocket 기반 turn control
- provider thread resume 가능
- interrupt 가능

주의:

- app-server를 공개망에 노출하지 않는다.
- Docker 사용 시 `backend -> codex-app-server`는 내부 network로만 연결한다.
- `~/.codex/auth`는 컨테이너 안에서만 읽게 하고 브라우저/API 응답에 절대 노출하지 않는다.

## OpenAI-Compatible / OpenRouter

장점:

- 배포 환경에서 운영하기 쉽다.
- Codex CLI 설치가 필요 없다.
- external bot adapter와도 잘 맞는다.

주의:

- provider별 streaming delta shape 차이를 adapter에서 흡수한다.
- API key는 workspace settings에 저장하더라도 서버에서만 사용한다.

