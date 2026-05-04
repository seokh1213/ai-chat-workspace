# AI Chat Workspace

범용 "원천 데이터 + AI 채팅 편집" 애플리케이션 뼈대 프로젝트다.

이 프로젝트는 기존 `trip-planner`에서 잘 동작한 다음 요소를 재사용 가능한 형태로 분리하기 위한 작업 공간이다.

- 워크스페이스
- 원천 데이터 문서/엔티티
- 채팅 세션 목록
- Markdown 채팅 렌더링
- 스트리밍 응답
- AI operation 파싱/검증/적용
- 체크포인트와 롤백
- provider 추상화
- 외부 채팅 앱 연동 가능성

## 목표

여행 도메인에 묶인 코드를 그대로 복제하지 않는다.

대신 `여행 계획`을 첫 번째 예시 domain adapter로 보고, 핵심 프레임은 아래처럼 일반화한다.

```text
Workspace
  Data Space
    Source Records
    Views
    Chat Sessions
      Messages
      AI Runs
    Checkpoints
```

## Projects

실행 가능한 예제 앱은 `projects/` 아래에 둔다. Git 이력은 포함하지 않고 소스만 둔다.

```text
projects/
  apps/
    trip-plan/ # 여행 계획 + 지도 + AI 편집, 원본 trip-planner 기반
    mind-plan/ # 마인드/생각 정리 도메인 예제
    todo-ai/   # 최소 Todo 도메인 + Codex app-server 예제
  reusable/
    frontend/  # 재사용 가능한 React 채팅 조각
    backend/   # 재사용 가능한 Spring/Kotlin 조각
```

참고 원본:

```text
/Users/user/personal/여행/오키나와/trip-planner
/Users/user/personal/mind-plan
```

## 문서 순서

1. [Project Brief](docs/00_PROJECT_BRIEF.md)
2. [Target Architecture](docs/01_TARGET_ARCHITECTURE.md)
3. [Core Data Model](docs/02_CORE_DATA_MODEL.md)
4. [Backend Blueprint](docs/03_BACKEND_BLUEPRINT.md)
5. [Frontend Blueprint](docs/04_FRONTEND_BLUEPRINT.md)
6. [AI Provider And Streaming](docs/05_AI_PROVIDER_AND_STREAMING.md)
7. [Domain Adapter Guide](docs/06_DOMAIN_ADAPTER_GUIDE.md)
8. [Migration From Trip Planner](docs/07_MIGRATION_FROM_TRIP_PLANNER.md)
9. [External Bot Integration](docs/08_EXTERNAL_BOT_INTEGRATION.md)
10. [Docker Deployment](docs/09_DOCKER_DEPLOYMENT.md)
11. [Reusable Component Catalog](docs/10_REUSABLE_COMPONENT_CATALOG.md)
12. [Customization Checklist](docs/11_CUSTOMIZATION_CHECKLIST.md)
13. [Quality Gates](docs/12_QUALITY_GATES.md)
14. [Security Notes](docs/13_SECURITY_NOTES.md)

## Agent 작업 지침

다음 AI Agent는 [Agent Implementation Plan](agents/IMPLEMENTATION_PLAN.md)부터 읽는다.
새 프로젝트 착수용 복사 프롬프트는 [Start Here Prompt](agents/START_HERE_PROMPT.md)를 사용한다.
