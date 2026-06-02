# 개발 태스크 포맷 / Task Format

이 문서는 개인형 Agent 플랫폼을 실제 개발 가능한 작은 작업으로 쪼갤 때 사용하는 공통 규약이다. 목적은 사람이 보기 좋은 로드맵보다, LLM이나 개발자가 바로 구현 범위와 완료 조건을 판별할 수 있는 작업 티켓을 만드는 것이다.

## 1. ID 규칙

| 단위 | 형식 | 예시 |
| --- | --- | --- |
| Milestone | `M0` ~ `M7` | `M2` |
| Task | `DEV-M{n}-T{nn}` | `DEV-M2-T03` |
| Subtask | `DEV-M{n}-T{nn}-S{nn}` | `DEV-M2-T03-S02` |
| Decision | `DEC-M{n}-{nn}` | `DEC-M2-01` |
| Risk | `RISK-M{n}-{nn}` | `RISK-M4-03` |

태스크 ID는 한 번 정하면 재사용하지 않는다. 삭제된 태스크는 `removed`로 상태만 바꾸고, 같은 ID를 새 의미로 재활용하지 않는다.

## 2. Milestone 범위

| Milestone | 이름 | 기준 문서 |
| --- | --- | --- |
| `M0` | Reference Audit + Bootstrap 결정 | [구현 순서](../common/implementation-plan.md#3-m0--reference-audit--bootstrap-결정) |
| `M1` | Shell + Domain Foundation | [구현 순서](../common/implementation-plan.md#4-m1--shell--domain-foundation) |
| `M2` | Control Tower MVP | [구현 순서](../common/implementation-plan.md#5-m2--control-tower-mvp) |
| `M3` | Workspace Bridge | [구현 순서](../common/implementation-plan.md#6-m3--workspace-bridge) |
| `M4` | Execution Core | [구현 순서](../common/implementation-plan.md#7-m4--execution-core) |
| `M5` | Knowledge Core | [구현 순서](../common/implementation-plan.md#8-m5--knowledge-core) |
| `M6` | Agent + Connection Core | [구현 순서](../common/implementation-plan.md#9-m6--agent--connection-core) |
| `M7` | Visual Planning + Help | [구현 순서](../common/implementation-plan.md#10-m7--visual-planning--help) |

## 3. 태스크 크기 기준

| 크기 | 기준 |
| --- | --- |
| `XS` | 한 파일 또는 한 컴포넌트/DTO 수준. 반나절 이하 예상 |
| `S` | 작은 UI/API 한 단위. 하루 안에 구현/검증 가능 |
| `M` | FE+BE 또는 화면 한 흐름. 1~2일 예상 |
| `L` | 여러 화면/도메인/상태 전이를 포함. 가능하면 `M` 이하로 재분해 필요 |

`L` 태스크는 원칙적으로 만들지 않는다. 만들 경우 반드시 “왜 더 못 쪼개는지”를 `Split note`에 적는다.

## 4. 태스크 쪼개기 규칙

| 규칙 | 설명 |
| --- | --- |
| 한 태스크는 하나의 완료 가능한 사용자/시스템 결과를 가진다 | 예: “주제 목록 API와 화면 표시”는 가능. “주제 전체 구현”은 너무 큼 |
| read/write 경계가 다르면 분리한다 | 조회, 생성, 상태 변경, 삭제/보관은 가능하면 별도 task |
| 공통 foundation과 화면 feature를 분리한다 | sidebar, route, status enum 같은 공통 작업은 `M1`에 둔다 |
| 위험한 쓰기는 독립 task로 둔다 | credential, external write, cost policy, approval, delete/archive |
| 통합 흐름은 마지막에 둔다 | 개별 API/UI가 준비된 뒤 chat -> workspace 같은 end-to-end task 작성 |
| 테스트/문서 보강은 task 안 subtasks로 포함한다 | 단, 공통 테스트 인프라는 별도 task 가능 |

## 5. 상태값

| 상태 | 의미 |
| --- | --- |
| `planned` | 기획상 필요한 작업. 아직 착수 조건 미확정 가능 |
| `ready` | 의존성/입력/완료 조건이 명확해 바로 개발 가능 |
| `blocked` | 결정/선행 작업/외부 연결 없이는 개발 불가 |
| `in_progress` | 구현 중 |
| `done` | 완료 조건과 검증을 통과 |
| `removed` | 더 이상 수행하지 않음. ID는 보존 |

## 6. 우선순위

| 우선순위 | 의미 |
| --- | --- |
| `P0` | 다음 milestone 진행을 막는 기반 작업 |
| `P1` | MVP에 직접 필요 |
| `P2` | 사용성/안전성/운영성 강화 |
| `P3` | 후속 개선 또는 polish |

## 7. 태스크 템플릿

```markdown
## DEV-Mn-Tnn / 제목

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `FE`, `BE`, `Fullstack`, `Infra`, `AI`, `Docs` |
| Screens | `SCR-01`, `SCR-02` |
| Objects | `topic`, `conversation` |
| Depends on | `DEV-M1-T01` |
| Blocks | `DEV-M2-T04` |
| Source docs | 링크 |

### 목적

### 구현 범위

### 제외 범위

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-Mn-Tnn-S01` | ... | `FE` | ... |

### Acceptance Criteria

- [ ] ...

### Test / Verification

- [ ] ...

### Edge Cases

- ...

### Open Decisions

- `DEC-Mn-01`: ...
```

## 8. Definition of Ready

태스크가 `ready`가 되려면 아래 조건을 만족해야 한다.

| 조건 | 설명 |
| --- | --- |
| 목적이 한 문장으로 명확함 | 무엇을 만들고 왜 필요한지 드러남 |
| 관련 화면/객체가 명시됨 | `SCR-XX`, canonical object 기준 |
| read/write가 분리됨 | 조회/생성/수정/삭제/실행 영향 파악 가능 |
| 선행 의존성이 있음 | 없으면 `None`으로 명시 |
| 완료 조건이 검증 가능함 | “잘 동작” 같은 표현 금지 |
| 모호한 결정이 분리됨 | 구현 전 필요한 결정은 `Open Decisions`에 등록 |

## 9. Definition of Done

태스크가 `done`이 되려면 아래 조건을 만족해야 한다.

| 조건 | 설명 |
| --- | --- |
| 구현 범위 완료 | 모든 subtasks 완료 |
| 수용 기준 통과 | Acceptance Criteria 전체 체크 가능 |
| 상태/권한/비용/연결 edge case 확인 | 해당 없으면 “N/A” 명시 |
| 테스트 또는 수동 검증 완료 | 실행한 명령/시나리오 기록 |
| 관련 문서 갱신 | 화면 계약/공통 정책 영향 시 갱신 |
| 회귀 영향 확인 | 연결 화면, 호출부, prop/API 이름 확인 |

## 10. 작업 문서 작성 규칙

| 규칙 | 설명 |
| --- | --- |
| milestone 문서는 독립적으로 읽혀야 함 | 해당 milestone 구현자가 필요한 맥락을 포함 |
| 같은 설명을 길게 반복하지 않음 | 공통 규칙은 이 문서와 common policy에 링크 |
| task는 가능한 작게 유지 | `L`이 보이면 다시 쪼갬 |
| 각 task에는 최소 3개 이하의 주요 객체 권장 | 객체가 많으면 통합 task일 가능성 높음 |
| task마다 완료 조건을 checklist로 씀 | 검증 가능한 문장만 사용 |
| 실제 파일 경로는 알면 적고 모르면 후보로 표기 | 환각성 파일 경로 생성 금지 |

## 11. 검수 체크리스트

- [ ] 모든 task ID가 중복되지 않음
- [ ] 모든 dependency가 존재하거나 외부 결정으로 표시됨
- [ ] `L` 크기 task가 없거나 split note가 있음
- [ ] 각 task에 subtasks와 acceptance criteria가 있음
- [ ] 권한/비용/승인/연결/삭제 관련 위험 task가 분리됨
- [ ] M2 이전에 M1 foundation 의존성이 빠지지 않음
- [ ] 기존 `trip-plan`, `todo-ai`, `mind-plan`은 reference-only로 다뤄지고 복사/마이그레이션 전제가 없음
- [ ] 신규 프로젝트 bootstrap, package/module 구조, reference audit 범위가 M0/M1/M3에 명시됨
