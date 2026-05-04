# AI Chat Workspace

범용 "원천 데이터 + AI 채팅 편집" 애플리케이션 뼈대 프로젝트다.

이 프로젝트는 실행 가능한 예제 앱과 재사용 가능한 템플릿을 함께 관리하는 작업 공간이다.

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
    trip-plan/ # 여행 계획 + 지도 + AI 편집
    mind-plan/ # 마인드/생각 정리 도메인 예제
    todo-ai/   # 최소 Todo 도메인 + Codex app-server 예제
  reusable/
    frontend/  # 재사용 가능한 React 채팅 조각
    backend/   # 재사용 가능한 Spring/Kotlin 조각
```

## Templates

새 프로젝트를 시작할 때 참고할 빈 뼈대는 `templates/` 아래에 둔다.

```text
templates/
  agents/   # 작업 지침과 프롬프트
  backend/  # Kotlin Spring Boot 시작 템플릿
  docs/     # 공통 설계 문서
  frontend/ # React 시작 템플릿
```

## 문서 순서

1. [Project Brief](templates/docs/00_PROJECT_BRIEF.md)
2. [Target Architecture](templates/docs/01_TARGET_ARCHITECTURE.md)
3. [Core Data Model](templates/docs/02_CORE_DATA_MODEL.md)
4. [Backend Blueprint](templates/docs/03_BACKEND_BLUEPRINT.md)
5. [Frontend Blueprint](templates/docs/04_FRONTEND_BLUEPRINT.md)
6. [AI Provider And Streaming](templates/docs/05_AI_PROVIDER_AND_STREAMING.md)
7. [Domain Adapter Guide](templates/docs/06_DOMAIN_ADAPTER_GUIDE.md)
8. [Migration From Trip Planner](templates/docs/07_MIGRATION_FROM_TRIP_PLANNER.md)
9. [External Bot Integration](templates/docs/08_EXTERNAL_BOT_INTEGRATION.md)
10. [Docker Deployment](templates/docs/09_DOCKER_DEPLOYMENT.md)
11. [Reusable Component Catalog](templates/docs/10_REUSABLE_COMPONENT_CATALOG.md)
12. [Customization Checklist](templates/docs/11_CUSTOMIZATION_CHECKLIST.md)
13. [Quality Gates](templates/docs/12_QUALITY_GATES.md)
14. [Security Notes](templates/docs/13_SECURITY_NOTES.md)

## Agent 작업 지침

다음 AI Agent는 [Agent Implementation Plan](templates/agents/IMPLEMENTATION_PLAN.md)부터 읽는다.
새 프로젝트 착수용 복사 프롬프트는 [Start Here Prompt](templates/agents/START_HERE_PROMPT.md)를 사용한다.
