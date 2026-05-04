# Start Here Prompt

새 프로젝트를 이 skeleton 기반으로 만들 때 AI Agent에게 처음 전달할 프롬프트다.

```text
You are building a new "AI chat workspace" application from this skeleton.

Read these files first:
- README.md
- docs/00_PROJECT_BRIEF.md
- docs/01_TARGET_ARCHITECTURE.md
- docs/02_CORE_DATA_MODEL.md
- docs/03_BACKEND_BLUEPRINT.md
- docs/04_FRONTEND_BLUEPRINT.md
- docs/05_AI_PROVIDER_AND_STREAMING.md
- docs/06_DOMAIN_ADAPTER_GUIDE.md
- docs/11_CUSTOMIZATION_CHECKLIST.md
- agents/IMPLEMENTATION_PLAN.md
- agents/CODE_EXTRACTION_GUIDE.md

Goal:
- Build a reusable app where users manage workspaces, data spaces, source records, chat sessions, AI streaming responses, operations, checkpoints, and rollback.
- Do not hard-code a domain into the generic chat/workspace core.
- Implement the first domain through a DomainAdapter.

Non-negotiables:
- The browser must never call AI providers directly.
- AI must never mutate the DB directly.
- Every AI data change must be expressed as validated operations.
- Every applied AI change must create a checkpoint.
- Streaming UI must allow users to scroll while the AI is responding.
- Chat messages must render Markdown.
- Message copy and full-session Markdown export must work.

First phase:
1. Scaffold backend and frontend.
2. Implement workspace/data-space/source-record CRUD.
3. Implement chat session CRUD.
4. Implement SSE chat stream using the project apps in projects/.
5. Implement ExampleAiProvider.
6. Implement GenericRecordsDomainAdapter.
7. Add tests for operation parsing and checkpoint rollback.

Before coding, produce a short implementation plan with file paths and risk points.
Then implement end-to-end and run tests/build.
```
