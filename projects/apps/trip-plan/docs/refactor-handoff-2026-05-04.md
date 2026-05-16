# Trip Plan 리팩토링 인수인계 - 2026-05-04

## 현재 상태

- 작업 위치: `/home/wukong/ai-chat-workspace`
- 대상 앱: `/home/wukong/ai-chat-workspace/projects/apps/trip-plan`
- 브랜치: `main`
- 커밋 상태: 아직 커밋하지 않은 변경사항이 있음. 다음 세션은 먼저 `git status --short --branch`로 현재 변경분을 확인하고 이어가기.
- 사용자 목표: 프론트 파일을 계속 작게 나누기. `App.tsx`가 아직 3000줄대라서, 파일 하나당 대략 300줄 수준을 목표로 더 분리해야 함.

## 이번 세션에서 한 일

### 프론트엔드

- `frontend/src/App.tsx`를 약 5200줄대에서 3118줄까지 줄임.
- 공통/도메인 로직을 `frontend/src/lib/`로 분리함.
  - `chat.ts`
  - `date.ts`
  - `format.ts`
  - `tripDisplay.ts`
  - `device.ts`
  - `workspaceSettings.ts`
- UI 컴포넌트를 `frontend/src/components/`로 분리함.
  - `common/LoadingState.tsx`
  - `common/MarkdownContent.tsx`
  - `setup/DateRangeCalendar.tsx`
  - `setup/SetupScreen.tsx`
  - `chat/types.ts`
  - `chat/ChatMessageParts.tsx`
  - `editor/EditorForms.tsx`
  - `workspace/SelectScreen.tsx`
  - `map/MapCanvas.tsx`
- `frontend/src/types.ts`에 `TripFormState`, `TripTextField` 타입을 추가함.
- 현재 큰 파일:
  - `frontend/src/App.tsx`: 3118줄
  - `frontend/src/components/map/MapCanvas.tsx`: 574줄
  - `frontend/src/components/workspace/SelectScreen.tsx`: 377줄
  - `frontend/src/components/editor/EditorForms.tsx`: 213줄

### 백엔드

- `TripDtos.kt`에 `TripOperation`, `TripOperations` 타입 별칭을 추가함.
- raw `List<Map<String, Any?>>` 사용을 `TripOperations` 중심으로 정리함.
- 여행 변경 operation 접근 로직을 `TripOperationAccessors.kt`로 모음.
- JSON 파싱 로직을 `TripOperationJson.kt`로 분리함.
- 관련 파일을 업데이트함.
  - `AiProvider.kt`
  - `AiProviderResponseParser.kt`
  - `OpenAiStyleProviders.kt`
  - `ChatRunMapping.kt`
  - `ChatRunService.kt`
  - `TripService.kt`

## 검증 결과

- `git diff --check` 통과.
- Docker 이미지 빌드 통과.
  - 작업 디렉터리: `/home/wukong/ai-chat-workspace/projects/apps/trip-plan`
  - 이미지 태그: `trip-plan/app:refactor-structure-test`
  - Docker 빌드 안에서 프론트 `npm run build`와 백엔드 `bootJar`가 함께 수행됨.
- 임시 컨테이너 실행 및 API 확인 완료.
  - 컨테이너 이름: `trip-plan-app-refactor-test-1777910768`
  - 접근 주소: `http://100.73.37.58:18081`
  - readiness: `GET /actuator/health/readiness` -> 200
  - provider API: `GET /api/ai/providers` -> 200
  - 프론트 HTML: `GET /` -> 200
  - `127.0.0.1:18081`, `192.168.0.18:18081` 접근은 실패해서 Tailscale/VPN 주소로만 접근되는 상태였음.
- 남은 빌드 경고:
  - `CodexAppServerClient.kt:352`에서 deprecated `JsonNode.fields()` 경고가 있음. 동작 문제는 아니지만 나중에 정리 가능.
- 브라우저 자동 검증은 못 함.
  - `agent-browser` CLI가 설치되어 있지 않았음.

## 현재 떠 있는 임시 서버

- 사용자 테스트용 로컬 Docker 컨테이너가 남아 있음.
- 정리할 때는 아래 컨테이너를 내리면 됨.

```bash
docker rm -f trip-plan-app-refactor-test-1777910768
```

## 다음 세션에서 바로 할 일

### 1. 프론트 분리 계속 진행

`react-best-practices` 기준을 유지한다.

- 한 파일에 컴포넌트 하나를 원칙으로 두기.
- props interface는 해당 컴포넌트 파일에 colocate하기.
- named export 사용하기.
- hooks 규칙과 dependency array 유지하기.
- 동작 변경 없이 먼저 파일 경계를 나누기.
- barrel file은 만들지 않기.

권장 순서:

1. `App.tsx`에서 JSX 없는 helper부터 `lib/`로 이동한다.
   - route helper
   - chat draft helper
   - editor layout helper
   - mobile view helper
2. `ChatHome`을 `components/chat/ChatHome.tsx`로 이동한다.
3. `EditorScreen` 내부 JSX를 props-only 하위 컴포넌트로 나눈다.
   - `PlannerSidebar`
   - `ScheduleSection`
   - `PlacesSection`
   - `ChatPanel`
   - `MobileBottomNav`
4. 상태 orchestration은 처음에는 `EditorScreen`에 남긴다. UI 분리와 상태 이동을 한 번에 하지 말기.
5. 그 다음 `MapCanvas.tsx`를 300줄 이하로 줄인다.
   - 지도 계산 helper: `mapView.ts`
   - 팝업 JSX: `mapPopups.tsx`
   - 사용량/타일 helper: `mapUsage.ts`, `mapTiles.ts`
6. 마지막에 `App.tsx`, `MapCanvas.tsx`, `SelectScreen.tsx`가 300줄대 이하에 가까워졌는지 다시 확인한다.

### 2. 백엔드는 지금은 과한 구조 분리 금지

- `ChatRunService`, `TripService`, `TripRepository`는 아직 동작 경계가 크고 리스크가 있어서 바로 쪼개지 않는 것이 좋음.
- 백엔드를 더 나누려면 먼저 `TripOperation` 적용 로직 테스트를 추가하고, 그 후 `TripOperationApplier` 같은 작은 단위로 분리하는 순서가 안전함.
- 선택 작업: `CodexAppServerClient.kt`의 deprecated `JsonNode.fields()` 경고 정리.

### 3. 각 작업 후 검증 프로토콜

사용자가 로컬 Node/JDK 빌드보다 Docker 기반 검증을 선호했으므로 다음 순서를 유지한다.

1. `git diff --check`
2. Docker 이미지 빌드
3. 임시 컨테이너 실행
4. API 확인
   - `GET /actuator/health/readiness`
   - `GET /api/ai/providers`
   - `GET /`
5. Tailscale/VPN 주소에서는 열리고, localhost/LAN 직접 접근은 막혀 있는지 확인
6. 가능하면 브라우저 시각 검증도 수행

## 새 세션에서 먼저 읽을 파일

- 이 파일: `/home/wukong/ai-chat-workspace/projects/apps/trip-plan/docs/refactor-handoff-2026-05-04.md`
- React 기준: `/home/wukong/.codex/skills/react-best-practices/SKILL.md`
- Docker/K8s 배포 기준: `/home/wukong/.codex/skills/home-server-trip-plan-docker-deploy/SKILL.md`
- 현재 핵심 파일: `/home/wukong/ai-chat-workspace/projects/apps/trip-plan/frontend/src/App.tsx`
- 지도 파일: `/home/wukong/ai-chat-workspace/projects/apps/trip-plan/frontend/src/components/map/MapCanvas.tsx`

