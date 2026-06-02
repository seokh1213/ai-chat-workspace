# M5 / Knowledge Core 개발 태스크

이 문서는 신규 개인형 Agent 플랫폼의 `M5 Knowledge Core`를 실제 구현 가능한 작은 태스크로 분해한 작업 티켓이다. 기존 앱은 reference-only이며, 복사/마이그레이션 전제 작업은 포함하지 않는다.

## 1. Milestone 목표

사용자가 URL, 영상, 기사, 블로그, PDF, 파일, 메모를 모으고, AI가 처리한 결과를 검수한 뒤 `source -> memory/file/document/topic`으로 승격할 수 있게 만든다. 핵심 결과는 자료 inbox, 파일 관리, 장기 기억 검수, 리포트 빌더, citation 검증, 삭제/비용/민감 정보 안전장치가 연결된 지식 흐름이다.

## 2. 기준 문서

| 구분 | 문서 |
| --- | --- |
| 태스크 규약 | [00-task-format.md](../00-task-format.md) |
| 기획 인덱스 | [README.md](../../README.md) |
| 화면 계약 | [screen-contracts.md](../../screen-contracts.md) |
| 구현 순서 | [implementation-plan.md](../../common/implementation-plan.md#8-m5--knowledge-core) |
| 공통 동선 | [navigation-and-cross-screen-flows.md](../../common/navigation-and-cross-screen-flows.md#9-스크랩---기억---문서---주제-연결) |
| 공통 객체/상태/API | [domain-model-and-state-policy.md](../../common/domain-model-and-state-policy.md) |
| 스크랩 화면 | [07-scrap.md](../../screens/07-scrap.md) |
| 기억 화면 | [04-memory.md](../../screens/04-memory.md) |
| 파일 화면 | [10-files.md](../../screens/10-files.md) |
| 리포트 빌더 | [15-report-builder.md](../../screens/15-report-builder.md) |

## 3. 선행 조건

| 선행 | 필요 이유 |
| --- | --- |
| `M1` Shell + Domain Foundation | route, ID/key, canonical enum, permission/error/loading 기반 필요 |
| `M2` Control Tower MVP | global/topic conversation과 채팅 첨부 진입점 필요 |
| `M3` Workspace Bridge | topic relation, workspace activity, 자료 탭 연결 필요 |
| `M4` Execution Core 일부 | 긴 처리 job, progress, retry, cancel을 run/event 패턴과 맞춰야 함 |
| `M6` Connection Core 일부 결정 | Google Drive, YouTube transcript, 외부 provider는 connection 상태를 참조해야 함. M5에서는 미연결 CTA와 차단 상태까지만 구현 가능 |

## 4. 범위

| 포함 | 제외 |
| --- | --- |
| source inbox, source content, extraction status, retry, manual fallback | 외부 사이트에 쓰기 작업 |
| URL, memo, file, video, article, blog, PDF 처리 상태 | 팀/공유 허브 권한 모델 |
| file upload/import, preview, summary, relation | 외부 Drive 전체 양방향 동기화 |
| memory review, scope, source links, usage history, forget | 자동으로 모든 대화를 memory화하는 기능 |
| report builder session, source picker, outline, draft, section generation | Google Docs/Notion 같은 외부 문서 직접 publish |
| citation anchor, verification, conflict, broken citation status | 완전한 공동 편집 |
| export file_asset 생성, document snapshot, version | 결제/플랜 시스템 |
| 삭제/보관 impact, 민감 memory, 긴 문서 비용 gate | 기존 앱 복사 또는 마이그레이션 |

## 5. Task 요약

| Task | 제목 | Size | Area | 주요 화면 |
| --- | --- | --- | --- | --- |
| `DEV-M5-T01` | Knowledge 도메인 계약과 API skeleton 확정 | `M` | `BE`, `Docs` | `SCR-07`, `SCR-04`, `SCR-10`, `SCR-15` |
| `DEV-M5-T02` | Source inbox 목록/상세 read model | `M` | `Fullstack` | `SCR-07` |
| `DEV-M5-T03` | URL/메모/다중 입력 source 생성과 dedupe | `M` | `Fullstack` | `SCR-07` |
| `DEV-M5-T04` | URL/영상/기사/블로그/PDF 처리 상태 모델 | `M` | `BE`, `AI` | `SCR-07` |
| `DEV-M5-T05` | Extraction retry, progress event, 수동 원문 fallback | `M` | `Fullstack` | `SCR-07` |
| `DEV-M5-T06` | Source 상세 편집, 태그, 메모, 관련 소스 | `S` | `Fullstack` | `SCR-07` |
| `DEV-M5-T07` | Source relation과 승격 entry point | `M` | `Fullstack` | `SCR-07`, `SCR-02`, `SCR-09`, `SCR-15` |
| `DEV-M5-T08` | File upload/import와 file_asset lifecycle | `M` | `Fullstack` | `SCR-10`, `SCR-07` |
| `DEV-M5-T09` | File 목록/상세/preview/summary/chat attachment | `M` | `Fullstack` | `SCR-10` |
| `DEV-M5-T10` | Memory 후보 생성과 review queue | `M` | `Fullstack`, `AI` | `SCR-04`, `SCR-07`, `SCR-10` |
| `DEV-M5-T11` | Memory 상세, scope, source links, usage history | `M` | `Fullstack` | `SCR-04` |
| `DEV-M5-T12` | 민감 memory와 forget/exclude/archive/delete | `M` | `Fullstack`, `BE` | `SCR-04` |
| `DEV-M5-T13` | Report builder session과 source picker | `M` | `Fullstack` | `SCR-15` |
| `DEV-M5-T14` | Outline/draft/section generation run | `M` | `Fullstack`, `AI` | `SCR-15` |
| `DEV-M5-T15` | Citation anchor, coverage, conflict, broken source | `M` | `Fullstack`, `BE`, `AI` | `SCR-15`, `SCR-07`, `SCR-04`, `SCR-10` |
| `DEV-M5-T16` | Document save/version/export/promotion | `M` | `Fullstack` | `SCR-15`, `SCR-10`, `SCR-02`, `SCR-09`, `SCR-04` |
| `DEV-M5-T17` | 긴 문서/영상/OCR 비용 gate와 승인 preview | `S` | `Fullstack`, `BE` | `SCR-07`, `SCR-10`, `SCR-15` |
| `DEV-M5-T18` | Knowledge 삭제/보관 impact API와 audit | `M` | `Fullstack`, `BE` | `SCR-07`, `SCR-04`, `SCR-10`, `SCR-15` |

## 6. Dependency Map

```text
DEV-M5-T01
  -> DEV-M5-T02
  -> DEV-M5-T03 -> DEV-M5-T04 -> DEV-M5-T05
  -> DEV-M5-T08 -> DEV-M5-T09
  -> DEV-M5-T10 -> DEV-M5-T11 -> DEV-M5-T12
  -> DEV-M5-T13 -> DEV-M5-T14 -> DEV-M5-T15 -> DEV-M5-T16

DEV-M5-T17 gates DEV-M5-T04, DEV-M5-T05, DEV-M5-T08, DEV-M5-T14, DEV-M5-T16
DEV-M5-T18 gates destructive actions in DEV-M5-T06, DEV-M5-T07, DEV-M5-T09, DEV-M5-T12, DEV-M5-T16
```

## DEV-M5-T01 / Knowledge 도메인 계약과 API skeleton 확정

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P0` |
| Size | `M` |
| Area | `BE`, `Docs` |
| Screens | `SCR-07`, `SCR-04`, `SCR-10`, `SCR-15` |
| Objects | `source`, `file_asset`, `memory`, `document`, `citation` |
| Depends on | `M1` |
| Blocks | `DEV-M5-T02`, `DEV-M5-T03`, `DEV-M5-T08`, `DEV-M5-T10`, `DEV-M5-T13` |
| Source docs | [공통 객체/상태/API](../../common/domain-model-and-state-policy.md), [화면 계약](../../screen-contracts.md) |

### 목적

M5 전체가 같은 객체명, 상태 enum, relation 이름, API 경로를 쓰게 만드는 기반 작업.

### 구현 범위

- `source`, `source_content`, `file_asset`, `file_summary`, `memory`, `memorySourceLink`, `document`, `document_section`, `citation`, `source_anchor`, `source_conflict`, `verification_result` 계약 확정
- canonical status와 화면 표시 status 매핑
- 목록/상세/처리/삭제/impact/relation API skeleton 정의
- event 이름과 payload 최소 필드 정의

### 제외 범위

- 실제 extraction 모델 연동
- 파일 storage provider 구현
- 리포트 생성 모델 프롬프트 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T01-S01` | M5 canonical object schema 초안 작성 | `BE` | 공통 정책의 필드 후보가 API/DB/FE DTO 후보로 매핑됨 |
| `DEV-M5-T01-S02` | relation 객체명 정리 | `BE` | `source`와 `memorySourceLink` 의미 충돌이 제거됨 |
| `DEV-M5-T01-S03` | status enum 매핑 정의 | `BE` | `source`, `file_asset`, `memory`, `document`, `citation` 상태 전이가 문서화됨 |
| `DEV-M5-T01-S04` | API skeleton 목록 작성 | `BE` | 목록, 상세, 생성, 수정, retry, process, relation, impact API가 누락 없이 정리됨 |
| `DEV-M5-T01-S05` | event contract 작성 | `BE` | source/file/memory/document/citation 이벤트명이 공통 event stream과 연결됨 |

### Acceptance Criteria

- [ ] M5에서 쓰는 모든 객체가 공통 객체 문서의 canonical 이름을 따른다.
- [ ] `source`, `file_asset`, `memory`, `document`, `citation`의 ID prefix와 안정 key가 정의된다.
- [ ] 화면 상세 문서의 API 힌트와 충돌하는 이름이 있으면 충돌 표가 작성된다.
- [ ] 삭제/보관/참조 제외/깨진 citation 상태가 한 enum에 섞이지 않는다.

### Test / Verification

- [ ] `screen-contracts.md`의 `SCR-04`, `SCR-07`, `SCR-10`, `SCR-15` read/write와 API skeleton 대조
- [ ] 상태 전이 표에서 도달 불가능하거나 되돌릴 수 없는 상태 확인
- [ ] FE DTO 후보와 BE response 필드명이 같은지 수동 리뷰

### Edge Cases

- file형 source가 `source`와 `file_asset`을 모두 가지는 경우
- memory 출처 relation을 source 객체로 오인하는 경우
- document와 help_article 이름 충돌
- citation이 source/file/memory/conversation을 모두 참조하는 경우

### Open Decisions

- `DEC-M5-01`: file형 source와 `file_asset`을 항상 1:1로 생성할지, 필요 시에만 연결할지 결정 필요.

## DEV-M5-T02 / Source inbox 목록/상세 read model

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-07` |
| Objects | `source`, `source_content`, `source_relation` |
| Depends on | `DEV-M5-T01` |
| Blocks | `DEV-M5-T03`, `DEV-M5-T05`, `DEV-M5-T06`, `DEV-M5-T07` |
| Source docs | [스크랩 화면](../../screens/07-scrap.md) |

### 목적

스크랩 화면에서 source inbox를 조회하고, 카드 선택 시 상세 패널을 안정적으로 복원하는 read flow 구현.

### 구현 범위

- `/scrap`, `/scrap/{sourceId}`, query 기반 검색/탭/정렬/필터 상태
- source 목록 카드 read model
- source 상세 패널 기본 정보, 요약, 원문 탭 lazy load
- empty/loading/error 상태

### 제외 범위

- source 생성
- AI 요약 생성
- memory/document 승격

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T02-S01` | source 목록 query model 작성 | `BE` | type/status/provider/tag/topic/permission/sort/page 조건이 API에 반영됨 |
| `DEV-M5-T02-S02` | inbox 목록 UI 구현 계획 | `FE` | 탭, 검색, 정렬, 필터, 그리드/리스트 전환 상태가 URL query로 유지됨 |
| `DEV-M5-T02-S03` | 상세 패널 route 복원 | `FE` | `/scrap/{sourceId}?tab=script` 직접 접근 시 목록과 상세가 복원됨 |
| `DEV-M5-T02-S04` | 원문 lazy loading | `Fullstack` | 긴 transcript/PDF content는 상세 탭에서 별도 조회됨 |
| `DEV-M5-T02-S05` | 권한/삭제/보관 fallback | `Fullstack` | 권한 없음, 삭제됨, 보관 상태 deep link fallback이 표시됨 |

### Acceptance Criteria

- [ ] 전체/유튜브/기사/블로그/PDF/대기 중 탭과 카운트가 표시된다.
- [ ] source 선택 후 필터 전환, 보기 전환, 새로고침에서 선택 상태가 일관된다.
- [ ] 목록 API는 카드에 필요한 요약 필드만 반환하고 긴 원문은 상세 API에서 조회한다.
- [ ] 삭제/권한 없음/보관 source 직접 접근 시 안전한 fallback이 제공된다.

### Test / Verification

- [ ] 탭/검색/정렬/필터 조합 URL query 복원 수동 테스트
- [ ] source 0개, 검색 결과 0개, 권한 제한, 삭제됨 상태 테스트
- [ ] 1,000개 source pagination 또는 virtual list 성능 점검

### Edge Cases

- 선택된 source가 새 필터 결과 밖으로 빠지는 경우
- `sourceId`는 유효하지만 사용자가 읽을 권한이 없는 경우
- transcript/PDF 원문이 매우 길어 상세 탭 로딩이 지연되는 경우
- 실시간 처리 완료 이벤트가 현재 목록 필터와 맞지 않는 경우

### Open Decisions

- `DEC-M5-02`: 유형 탭 카운트를 현재 검색/필터 기준으로 계산할지, hub 전체 기준으로 계산할지 결정 필요.

## DEV-M5-T03 / URL/메모/다중 입력 source 생성과 dedupe

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-07`, `SCR-01`, `SCR-02` |
| Objects | `source`, `source_content`, `topic` |
| Depends on | `DEV-M5-T01`, `DEV-M5-T02`, `M2`, `M3` |
| Blocks | `DEV-M5-T04`, `DEV-M5-T05`, `DEV-M5-T07` |
| Source docs | [스크랩 화면](../../screens/07-scrap.md), [공통 동선](../../common/navigation-and-cross-screen-flows.md#7-chat---crud) |

### 목적

사용자가 URL, 일반 메모, 여러 URL을 빠르게 source inbox에 추가하고, 중복 URL은 자동 병합하지 않고 선택지를 제공하게 함.

### 구현 범위

- 빠른 입력창, 새 스크랩 모달
- URL/provider/type 감지 후보 표시
- 다중 URL 분리와 일괄 태그/topic 적용
- canonicalUrl dedupe와 기존 source 이동/새 메모 추가 선택
- chat/topic에서 `스크랩에 저장` 진입

### 제외 범위

- 파일 업로드
- 실제 extraction 처리
- 브라우저 확장 프로그램

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T03-S01` | URL/memo 입력 validator | `Fullstack` | URL, memo, 빈 입력, 너무 긴 메모가 분리 처리됨 |
| `DEV-M5-T03-S02` | provider/type detection | `BE` | YouTube, 일반 web, article/blog 후보, PDF URL 후보가 분류됨 |
| `DEV-M5-T03-S03` | batch source create | `Fullstack` | 여러 URL을 입력하면 생성 후보 목록과 일괄 옵션이 표시됨 |
| `DEV-M5-T03-S04` | canonicalUrl dedupe | `BE` | 같은 원본 URL은 중복 후보로 표시되고 자동 병합되지 않음 |
| `DEV-M5-T03-S05` | chat/topic entry integration | `Fullstack` | 채팅 첨부 URL과 topic 자료 추가에서 source 생성 후 원래 scope로 돌아감 |

### Acceptance Criteria

- [ ] URL, YouTube URL, PDF URL, 일반 메모가 같은 입력 영역에서 생성 가능하다.
- [ ] 다중 URL 붙여넣기 시 각각 별도 source 후보로 표시된다.
- [ ] 중복 URL은 기존 source로 이동하거나 새 메모만 추가하는 선택지를 제공한다.
- [ ] topicId가 있는 진입에서는 생성 source가 해당 topic과 relation을 가진다.

### Test / Verification

- [ ] URL/memo/PDF URL/YouTube URL/여러 URL 입력 케이스 테스트
- [ ] canonical URL normalization 테스트
- [ ] duplicate candidate API와 UI 선택 결과 테스트
- [ ] 채팅에서 저장 후 source 상세로 이동하는 deep link 테스트

### Edge Cases

- 같은 URL을 동시에 두 탭에서 추가하는 경우
- URL처럼 보이지만 유효하지 않은 문자열
- paywall/login-required URL
- 사용자가 같은 URL을 다른 목적의 메모로 저장하려는 경우

### Open Decisions

- `DEC-M5-03`: 중복 URL에서 새 source 생성을 완전히 막을지, 같은 URL + 다른 user note로 허용할지 결정 필요.

## DEV-M5-T04 / URL/영상/기사/블로그/PDF 처리 상태 모델

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `BE`, `AI` |
| Screens | `SCR-07` |
| Objects | `source`, `source_content`, `source_processing_log` |
| Depends on | `DEV-M5-T03`, `DEV-M5-T17` |
| Blocks | `DEV-M5-T05`, `DEV-M5-T06`, `DEV-M5-T13` |
| Source docs | [스크랩 처리 상태](../../screens/07-scrap.md#6-url메모파일영상기사pdf-처리-상태) |

### 목적

source type별 처리 과정을 `pending -> processing -> summarized/failed`로 관리하고, 원문 anchor를 citation 가능한 형태로 저장할 기반 마련.

### 구현 범위

- URL metadata/OpenGraph/readable text extraction 상태
- YouTube/video metadata, transcript 또는 전사 상태
- article/blog readable text extraction 상태
- PDF URL 확보, 페이지 텍스트, page anchor 상태
- source processing log 저장

### 제외 범위

- 파일 업로드 처리
- 리포트 문서 생성
- full OCR 고도화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T04-S01` | source processing job contract | `BE` | type별 step, status, errorCode, retryCount가 정의됨 |
| `DEV-M5-T04-S02` | URL/article/blog extraction 상태 | `BE` | metadata/text/summary 단계가 `extractionState`에 반영됨 |
| `DEV-M5-T04-S03` | video transcript 상태 | `BE`, `AI` | 자막 있음/없음/전사 필요/비공개/삭제 영상 상태가 구분됨 |
| `DEV-M5-T04-S04` | PDF URL 처리 상태 | `BE` | pageCount, page text, page anchor, encrypted/too_large 상태가 저장됨 |
| `DEV-M5-T04-S05` | summary/keyPoints/tags 생성 결과 저장 | `AI` | source card와 상세 요약 탭에 필요한 결과가 저장됨 |

### Acceptance Criteria

- [ ] source type별 처리 단계가 processing log에 남는다.
- [ ] 실패 source는 실패 사유와 가능한 후속 액션을 반환한다.
- [ ] PDF는 page anchor를 저장해 report builder citation에 전달할 수 있다.
- [ ] transcript 없는 영상은 비용/시간 안내 후 전사 실행 여부를 결정할 수 있다.

### Test / Verification

- [ ] 성공 URL, dead link, paywall, SPA 본문 누락, YouTube 자막 없음, 암호화 PDF 케이스 테스트
- [ ] processing log 순서와 최종 source 상태 대조
- [ ] page/timestamp/paragraph anchor 생성 여부 검증

### Edge Cases

- robots/paywall/login_required로 원문을 얻지 못하는 경우
- YouTube 비공개/삭제 영상
- PDF가 텍스트 없이 스캔본인 경우
- 긴 영상/긴 PDF에서 비용 gate가 먼저 필요한 경우

### Open Decisions

- `DEC-M5-04`: `retrying`을 별도 source status로 둘지, `processing + retryCount`로 표현할지 결정 필요.

## DEV-M5-T05 / Extraction retry, progress event, 수동 원문 fallback

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-07`, `SCR-10` |
| Objects | `source`, `file_asset`, `run`, `audit_log` |
| Depends on | `DEV-M5-T04`, `M4` |
| Blocks | `DEV-M5-T06`, `DEV-M5-T07`, `DEV-M5-T13` |
| Source docs | [스크랩 실패 재시도](../../screens/07-scrap.md#시나리오-e-처리-실패한-스크랩을-재시도), [공통 이벤트](../../common/domain-model-and-state-policy.md#103-이벤트-후보) |

### 목적

추출 실패/부분 성공 source를 사용자가 재시도하거나 수동 원문으로 보완할 수 있게 하고, 진행 상태를 목록/상세에 실시간 반영.

### 구현 범위

- `POST /api/sources/{sourceId}/retry`
- progress event 또는 polling
- retry idempotency와 retryCount 표시
- 수동 원문 붙여넣기 fallback
- 처리 중 삭제/보관 시 job cancel 요청

### 제외 범위

- 모델/provider fallback 고도화
- 외부 서비스 재인증 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T05-S01` | retry API와 idempotency key | `BE` | 같은 retry를 중복 클릭해도 job이 중복 생성되지 않음 |
| `DEV-M5-T05-S02` | progress event 반영 | `Fullstack` | 목록 카드, 대기 중 탭 카운트, 상세 로그가 같은 상태를 표시함 |
| `DEV-M5-T05-S03` | manual text fallback | `Fullstack` | 실패 source에 사용자가 원문을 붙여넣고 재요약할 수 있음 |
| `DEV-M5-T05-S04` | retry/cancel/delete race 처리 | `BE` | deleting/archived 전환 시 처리 job이 정리됨 |
| `DEV-M5-T05-S05` | 실패 원인별 CTA | `FE` | 원본 열기, 재시도, 수동 원문, 연결 재인증, 비용 설정 이동이 구분됨 |

### Acceptance Criteria

- [ ] failed source는 실패 사유, 재시도 CTA, 원문 수동 입력 옵션을 표시한다.
- [ ] retry 중에는 상태와 progress가 목록/상세/탭 카운트에 반영된다.
- [ ] 처리 중 source를 삭제/보관하면 job cancel 또는 deleting 상태가 표시된다.
- [ ] retry 실패가 반복되어도 기존 summary/user note가 손상되지 않는다.

### Test / Verification

- [ ] retry 버튼 연타 idempotency 테스트
- [ ] event 역순 도착 시 최종 상태 정합성 테스트
- [ ] manual text 입력 후 summary 재생성 테스트
- [ ] 처리 중 삭제/보관 race 테스트

### Edge Cases

- retry 완료 이벤트가 삭제 후 도착하는 경우
- 사용자가 요약 편집 중 재요약 결과가 도착하는 경우
- 비용 차단으로 retry가 시작되지 않는 경우
- 원문 일부만 추출된 상태에서 사용자가 수동 보완하는 경우

### Open Decisions

- `DEC-M5-05`: 수동 원문 fallback을 `source_content.rawText`로 저장할지 별도 user-provided chunk로 저장할지 결정 필요.

## DEV-M5-T06 / Source 상세 편집, 태그, 메모, 관련 소스

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P2` |
| Size | `S` |
| Area | `Fullstack` |
| Screens | `SCR-07` |
| Objects | `source`, `source_tag`, `related_source` |
| Depends on | `DEV-M5-T02`, `DEV-M5-T05` |
| Blocks | `DEV-M5-T07`, `DEV-M5-T13` |
| Source docs | [스크랩 상세 탭](../../screens/07-scrap.md#상세-탭), [태그/관련 소스](../../screens/07-scrap.md#7-원문스크립트태그메모관련-소스) |

### 목적

source를 나중에 찾고 활용하기 쉽게 요약, 태그, 사용자 메모, 관련 소스를 관리하는 상세 편집 기능 구현.

### 구현 범위

- 사용자 태그 추가/삭제와 AI 태그 숨김
- 사용자 메모 autosave
- 요약 편집과 재요약 history 보존
- 관련 소스 추천 목록
- source favorite/bookmark

### 제외 범위

- 고급 semantic search 모델 튜닝
- 일괄 태그 정리

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T06-S01` | user tag CRUD | `Fullstack` | 중복 태그 방지와 자동완성 후보가 동작함 |
| `DEV-M5-T06-S02` | AI tag hide policy | `Fullstack` | 사용자가 삭제한 AI 태그는 재요약 후 다시 무단 표시되지 않음 |
| `DEV-M5-T06-S03` | source note autosave | `Fullstack` | 저장 중/저장 완료/실패 상태가 표시됨 |
| `DEV-M5-T06-S04` | summary edit/history | `Fullstack` | 사용자 편집 요약과 AI 재요약 결과가 덮어쓰기 충돌 없이 관리됨 |
| `DEV-M5-T06-S05` | related source read model | `BE` | 같은 topic/tag/report 후보 기준 관련 소스가 반환됨 |

### Acceptance Criteria

- [ ] AI 태그와 사용자 태그가 UI/API에서 구분된다.
- [ ] 메모 autosave 실패 시 사용자 입력이 사라지지 않는다.
- [ ] 요약 편집 후 재요약을 실행해도 history로 이전 내용을 확인할 수 있다.
- [ ] 관련 소스는 삭제/권한 제한 source를 잠금/삭제 상태로 표시한다.

### Test / Verification

- [ ] 태그 중복, 삭제, 자동완성 수동 테스트
- [ ] autosave 중 route 이동/새로고침 테스트
- [ ] 재요약과 수동 편집 동시성 테스트
- [ ] 관련 소스 삭제/권한 제한 상태 테스트

### Edge Cases

- source가 archived 상태인데 태그 편집을 시도하는 경우
- AI 재요약이 사용자 편집 요약을 덮는 경우
- 관련 source가 리포트에 이미 사용됐는데 삭제되는 경우

### Open Decisions

- `DEC-M5-06`: source type별 상세 탭 라벨을 `스크립트/원문/추출 텍스트`로 바꿀지 공통 라벨로 둘지 결정 필요.

## DEV-M5-T07 / Source relation과 승격 entry point

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-07`, `SCR-02`, `SCR-09`, `SCR-15` |
| Objects | `source`, `topic`, `task`, `memory`, `document` |
| Depends on | `DEV-M5-T03`, `DEV-M5-T06`, `M3`, `M4` |
| Blocks | `DEV-M5-T10`, `DEV-M5-T13`, `DEV-M5-T16` |
| Source docs | [스크랩 연계](../../screens/07-scrap.md#8-기억주제할-일리포트-빌더-연계), [공통 동선 9장](../../common/navigation-and-cross-screen-flows.md#9-스크랩---기억---문서---주제-연결) |

### 목적

source를 주제, 기억, 할 일, 리포트 빌더로 넘기는 출입구를 구현하고 relation 변경을 각 화면에 일관되게 반영.

### 구현 범위

- topic-source relation 추가/해제
- source 기반 task 후보 생성 진입
- source 기반 memory 후보 생성 진입
- 단일/다중 source를 report builder session에 전달
- relation 변경 이벤트와 activity 기록

### 제외 범위

- memory 후보 저장 상세
- report 초안 생성
- task graph 편집

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T07-S01` | topic-source relation API | `Fullstack` | source를 여러 topic에 연결/해제하고 topic 자료 탭에 반영됨 |
| `DEV-M5-T07-S02` | task candidate entry | `Fullstack` | source 요약 기반 task 생성 preview가 열림 |
| `DEV-M5-T07-S03` | memory candidate entry | `Fullstack` | summarized source에서 memory 후보 생성 화면으로 이동함 |
| `DEV-M5-T07-S04` | report builder handoff | `Fullstack` | 단일/다중 sourceIds가 report builder source picker에 유지됨 |
| `DEV-M5-T07-S05` | relation event/activity | `BE` | relation 변경이 source 상세, topic activity, 관련 count에 반영됨 |

### Acceptance Criteria

- [ ] source는 하나 이상의 topic에 연결/해제 가능하다.
- [ ] relation 해제는 source 삭제가 아니며 목록/상세에서 즉시 구분된다.
- [ ] `리포트에 사용`은 source summary뿐 아니라 citation anchor 가능 정보를 전달한다.
- [ ] source 기반 task/memory/document 생성 후 원 source로 돌아가는 링크가 남는다.

### Test / Verification

- [ ] topic 연결/해제 후 SCR-02 자료 탭과 SCR-07 상세 동기화 테스트
- [ ] source에서 task 생성 preview 이동 테스트
- [ ] 다중 source report builder 진입 테스트
- [ ] relation 중복 생성 방지 테스트

### Edge Cases

- topic이 보관/삭제된 상태에서 relation을 추가하려는 경우
- source가 failed 상태라 memory/report 승격 근거가 부족한 경우
- 권한이 좁은 source를 공유 topic에 연결하는 경우

### Open Decisions

- `DEC-M5-07`: 보관 상태 source를 topic/document에 새로 연결할 수 있게 할지, 복원 후만 허용할지 결정 필요.

## DEV-M5-T08 / File upload/import와 file_asset lifecycle

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-10`, `SCR-07` |
| Objects | `file_asset`, `source`, `file_summary` |
| Depends on | `DEV-M5-T01`, `DEV-M5-T17` |
| Blocks | `DEV-M5-T09`, `DEV-M5-T10`, `DEV-M5-T13` |
| Source docs | [파일 업로드 정책](../../screens/10-files.md#71-업로드-정책), [스크랩 파일 연계](../../screens/07-scrap.md#파일-연계) |

### 목적

로컬 파일과 외부 import 후보를 `file_asset`으로 등록하고, 필요 시 file형 source와 연결해 AI 처리 흐름으로 넘김.

### 구현 범위

- upload session 생성, progress, 완료 처리
- MIME/type/size/checksum 검증
- file_asset lifecycle: uploading/uploaded/scanning/extracting/summarizing/summarized/failed/restricted
- PDF/file형 source 연결 정책
- 외부 Drive import는 연결 상태 참조와 placeholder import까지만

### 제외 범위

- 외부 Drive 완전 동기화
- 파일 내용 편집
- 바이러스 검사 엔진 자체 구현

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T08-S01` | upload session API | `BE` | 파일명/크기/MIME/checksum 기반 업로드 세션이 생성됨 |
| `DEV-M5-T08-S02` | upload progress UI | `FE` | 업로드 중 행과 실패/재시도 상태가 표시됨 |
| `DEV-M5-T08-S03` | file validation | `BE` | 허용 형식, 최대 용량, checksum 중복 후보가 처리됨 |
| `DEV-M5-T08-S04` | file_asset-source relation | `BE` | PDF/첨부 파일이 source로 읽힐 때 relation이 생성됨 |
| `DEV-M5-T08-S05` | import placeholder | `Fullstack` | Drive 미연결/만료 시 연결 CTA, 연결됨이면 import 후보 생성이 가능함 |

### Acceptance Criteria

- [ ] PDF, DOCX, XLSX, PPTX, TXT, CSV, PNG, JPG 업로드 제한이 UI/API에서 일치한다.
- [ ] 업로드 완료 후 파일 목록에 새 행이 나타나고 처리 상태가 갱신된다.
- [ ] checksum 중복은 자동 병합하지 않고 후보로 표시한다.
- [ ] PDF/file형 source 생성 여부가 relation으로 추적된다.

### Test / Verification

- [ ] 허용/비허용 MIME, 용량 초과, 같은 checksum 파일 테스트
- [ ] 업로드 중 route 이동 후 목록 상태 복원 테스트
- [ ] PDF 업로드 후 file_asset과 source relation 생성 테스트
- [ ] Drive 연결 만료 상태에서 import 차단 테스트

### Edge Cases

- 업로드 완료 직전 네트워크가 끊기는 경우
- 같은 파일명 다른 checksum
- 파일 삭제 요청이 업로드 중 들어오는 경우
- 외부 import 원본 권한이 읽기 전용인 경우

### Open Decisions

- `DEC-M5-08`: 외부 Drive 원본을 플랫폼 storage에 캐시할지, 메타데이터/요약만 저장할지 결정 필요.

## DEV-M5-T09 / File 목록/상세/preview/summary/chat attachment

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-10`, `SCR-01`, `SCR-02` |
| Objects | `file_asset`, `file_summary`, `file_connection`, `conversation` |
| Depends on | `DEV-M5-T08`, `M2`, `M3` |
| Blocks | `DEV-M5-T10`, `DEV-M5-T13`, `DEV-M5-T16` |
| Source docs | [파일 화면](../../screens/10-files.md), [파일 채팅 첨부](../../screens/10-files.md#84-채팅-첨부-연계) |

### 목적

파일 화면에서 업로드/외부/생성 파일을 탐색하고, 미리보기/요약/연결/채팅 첨부를 제어.

### 구현 범위

- 파일 목록 타입 탭, 검색, 필터, 정렬
- 우측 상세 패널: 미리보기, 요약, 세부 정보, 연결
- AI 요약 재실행/실패 표시
- topic/memory/source/chat/run/artifact relation 조회
- 채팅 첨부 권한/AI 참조 상태 확인

### 제외 범위

- 폴더 트리 고도화
- 외부 공유 링크 생성
- 대량 다운로드

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T09-S01` | file list read model | `Fullstack` | 타입/출처/요약상태/권한/연결 필터가 동작함 |
| `DEV-M5-T09-S02` | file detail panel | `FE` | preview/summary/detail/connections 탭과 route 복원이 동작함 |
| `DEV-M5-T09-S03` | summary process action | `Fullstack` | 요약 대기/추출 중/요약 중/요약 완료/실패 상태가 표시됨 |
| `DEV-M5-T09-S04` | file connections | `Fullstack` | topic/memory/source/chat/run/artifact 연결 조회/해제가 가능함 |
| `DEV-M5-T09-S05` | chat attachment flow | `Fullstack` | 파일 읽기 권한과 AI 참조 허용 여부 확인 후 chat scope에 첨부됨 |

### Acceptance Criteria

- [ ] 파일 행에는 타입, 파일명, 크기, 출처, 연결 주제, 요약 상태, 수정일, 권한이 표시된다.
- [ ] PDF preview는 page 기반 preview 또는 실패 상태를 표시한다.
- [ ] 요약 실패 파일은 실패 사유와 재시도 진입점을 제공한다.
- [ ] 채팅 첨부는 권한, AI 참조 정책, 원문 추출 가능 여부를 확인한다.

### Test / Verification

- [ ] PDF/TXT/CSV/이미지/지원 안 함 파일 목록과 상세 테스트
- [ ] 요약 처리 이벤트가 목록 행과 상세 탭에 반영되는지 테스트
- [ ] 권한 제한 파일의 첨부 차단 테스트
- [ ] 삭제된 topic/memory 연결 chip fallback 테스트

### Edge Cases

- 외부 Drive 연결이 끊겼지만 캐시 요약은 있는 경우
- 요약 중 파일을 채팅에 첨부하려는 경우
- 파일 삭제 중 채팅 첨부 요청
- 이미지 OCR 비용이 필요한 경우

### Open Decisions

- `DEC-M5-09`: 요약 완료 전 파일 첨부를 원문 추출 가능 상태만으로 허용할지 결정 필요.

## DEV-M5-T10 / Memory 후보 생성과 review queue

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-04`, `SCR-07`, `SCR-10`, `SCR-01`, `SCR-02` |
| Objects | `memory`, `memorySourceLink`, `source`, `file_asset`, `conversation` |
| Depends on | `DEV-M5-T07`, `DEV-M5-T09` |
| Blocks | `DEV-M5-T11`, `DEV-M5-T12` |
| Source docs | [기억 생성/검수](../../screens/04-memory.md#4-핵심-시나리오), [스크랩 기억 연계](../../screens/07-scrap.md#기억-연계) |

### 목적

스크랩, 파일, 채팅, 주제 결정에서 memory 후보를 만들고 사용자가 검수한 항목만 장기 기억으로 활성화.

### 구현 범위

- memory 후보 생성 API
- review_required queue
- 후보별 title/type/content/confidence/scope/sourceLinks 표시
- 중복 memory 후보와 민감 가능성 검사
- 사용자가 저장/수정/거절하는 review flow

### 제외 범위

- 모든 대화 자동 memory 생성
- agent-specific knowledge binding 고도화

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T10-S01` | memory extraction API | `AI`, `BE` | source/file/conversation 입력에서 후보 memory가 생성됨 |
| `DEV-M5-T10-S02` | review queue read model | `Fullstack` | 검수 필요 기억이 목록/필터에 표시됨 |
| `DEV-M5-T10-S03` | candidate edit before save | `FE` | 사용자가 제목/유형/본문/scope/source link를 저장 전 수정 가능함 |
| `DEV-M5-T10-S04` | duplicate candidate detection | `BE` | 유사 기억 후보를 표시하고 자동 병합하지 않음 |
| `DEV-M5-T10-S05` | sensitive candidate default policy | `Fullstack` | 민감 가능 후보는 기본 `review_required`와 AI 참조 제외로 생성됨 |

### Acceptance Criteria

- [ ] summarized source와 summarized file에서 memory 후보를 생성할 수 있다.
- [ ] 자동 추출 memory는 출처와 검수 상태를 가진다.
- [ ] 민감 가능 후보는 기본적으로 AI 답변 컨텍스트에 쓰이지 않는다.
- [ ] 후보 저장 후 memory 상세의 출처 목록에 원 source/file/conversation이 표시된다.

### Test / Verification

- [ ] source, file, conversation 기반 후보 생성 테스트
- [ ] review_required 필터와 저장/거절 flow 테스트
- [ ] 중복 후보 표시 테스트
- [ ] 민감 키워드/개인정보 후보 기본 상태 테스트

### Edge Cases

- source가 failed라 원문이 없고 사용자 메모만 있는 경우
- 같은 내용의 기억이 이미 active 상태인 경우
- source 삭제 중 memory 후보 저장 요청
- 민감 후보를 사용자가 active로 바꾸려는 경우

### Open Decisions

- `DEC-M5-10`: memory 후보를 요약 완료 즉시 자동 생성할지, 사용자가 `기억으로 저장`을 누를 때만 생성할지 결정 필요.

## DEV-M5-T11 / Memory 상세, scope, source links, usage history

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-04`, `SCR-02` |
| Objects | `memory`, `memorySourceLink`, `memory_usage`, `topic` |
| Depends on | `DEV-M5-T10`, `M3` |
| Blocks | `DEV-M5-T12`, `DEV-M5-T15` |
| Source docs | [기억 상세/연결/사용 기록](../../screens/04-memory.md#5-컴포넌트별-상세-기능) |

### 목적

AI가 어떤 기억을 어떤 scope에서 쓰는지 사용자가 확인하고, 출처/사용 기록/주제 연결을 관리하게 함.

### 구현 범위

- memory 목록, 검색, 유형 탭, 신뢰도/소스/최근 사용 필터
- 상세 패널: 개요, 연결, 사용 기록
- memory scope: global/topic/agent/excluded
- source/file/conversation/manual link 추가/해제
- usage history 기록 조회

### 제외 범위

- agent builder knowledge binding 설정
- 팀/공유 hub memory 권한

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T11-S01` | memory list/detail read model | `Fullstack` | 목록 카드와 상세 패널이 별도 API로 조회됨 |
| `DEV-M5-T11-S02` | scope edit flow | `Fullstack` | global/topic/agent/excluded scope 변경과 영향 안내가 제공됨 |
| `DEV-M5-T11-S03` | source link management | `Fullstack` | 출처 추가/해제 후 sourceCount와 confidence가 갱신됨 |
| `DEV-M5-T11-S04` | topic-memory relation | `Fullstack` | 기억을 topic에 연결/해제하고 topic scope 검색 우선순위가 반영됨 |
| `DEV-M5-T11-S05` | usage history view | `BE`, `FE` | AI 답변/검색에서 memory가 사용된 기록을 조회함 |

### Acceptance Criteria

- [ ] 기억 목록은 검색, 유형, 신뢰도, 연결 상태, 최근 사용일 필터를 지원한다.
- [ ] memory 상세에서 출처, 편집 기록, 사용 기록을 확인할 수 있다.
- [ ] scope가 `excluded`인 기억은 AI 검색/답변 컨텍스트에서 제외된다.
- [ ] source link 해제 후 출처 수와 신뢰도 재계산 결과가 표시된다.

### Test / Verification

- [ ] scope 변경 후 chat context 검색 제외/포함 테스트
- [ ] source link 추가/해제와 sourceCount 갱신 테스트
- [ ] topic memory relation 후 topic 화면 조회 테스트
- [ ] memory usage 기록 생성/조회 테스트

### Edge Cases

- 출처가 0개인 수동 memory
- 삭제된 source/file/conversation이 출처로 남아 있는 경우
- memory가 답변에 직접 노출되지 않고 검색 context로만 사용된 경우
- topic이 보관되었는데 memory scope가 topic인 경우

### Open Decisions

- `DEC-M5-11`: 출처 없는 수동 memory의 기본 confidence를 `high`로 둘지 `medium/review_required`로 둘지 결정 필요.

## DEV-M5-T12 / 민감 memory와 forget/exclude/archive/delete

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `BE` |
| Screens | `SCR-04`, `SCR-01` |
| Objects | `memory`, `approval_request`, `audit_log`, `citation` |
| Depends on | `DEV-M5-T11`, `DEV-M5-T18` |
| Blocks | `DEV-M5-T15` |
| Source docs | [기억 잊기 정책](../../screens/04-memory.md#6-기억-유형-신뢰도-출처-편집-이력-잊기-정책), [개인정보 edge case](../../screens/04-memory.md#7-개인정보와-삭제-edge-case) |

### 목적

민감하거나 원치 않는 기억을 `AI 참조 제외`, `보관`, `완전 삭제`로 구분 처리하고, 영향 범위와 audit를 남김.

### 구현 범위

- sensitive flag와 review_required 기본 정책
- forget action: excluded/archive/delete 선택
- 완전 삭제 전 impact 표시
- embedding/search index 즉시 제외 요청
- audit log와 실패 재시도 상태

### 제외 범위

- 법적 보존 정책 구현
- 팀/공유 memory 정책

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T12-S01` | sensitive memory display | `FE` | 민감 가능 memory는 경고와 AI 참조 제외 상태를 표시함 |
| `DEV-M5-T12-S02` | forget option modal | `Fullstack` | 제외/보관/완전 삭제 차이와 복구 가능성을 보여줌 |
| `DEV-M5-T12-S03` | memory impact preview | `BE` | topic/source/file/conversation/document/agent 영향 범위가 계산됨 |
| `DEV-M5-T12-S04` | delete/exclude execution | `BE` | index 제외, relation 처리, deletedAt/status 변경이 분리됨 |
| `DEV-M5-T12-S05` | audit and retry state | `BE` | 삭제/잊기 요청자, 대상, 옵션, 실패 사유가 audit에 남음 |

### Acceptance Criteria

- [ ] 민감 가능 memory는 기본적으로 AI 참조에서 제외된다.
- [ ] `잊기`는 AI 참조 제외, 보관, 완전 삭제를 구분해 선택한다.
- [ ] 완전 삭제 전 연결된 주제, 출처, 대화, 문서 citation, 에이전트 영향을 표시한다.
- [ ] 삭제 실패 시 `deleting` 또는 실패 상태와 재시도 액션을 제공한다.

### Test / Verification

- [ ] sensitive memory 생성 후 chat context 미포함 테스트
- [ ] excluded/archive/delete 각각 목록/검색/context 반영 테스트
- [ ] 완전 삭제 impact API 결과 검증
- [ ] audit log payload에 민감 원문이 저장되지 않는지 검증

### Edge Cases

- 기억 삭제 후 원본 대화에 같은 내용이 남아 있는 경우
- 기억 삭제 후 생성 문서에 citation이 남아 있는 경우
- 삭제 처리 중 network failure
- 유사 memory가 남아 있어 사용자가 삭제 효과를 오해하는 경우

### Open Decisions

- `DEC-M5-12`: 완전 삭제를 즉시 물리 삭제로 처리할지, 복구 가능 기간을 둔 soft delete로 처리할지 결정 필요.

## DEV-M5-T13 / Report builder session과 source picker

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-15`, `SCR-07`, `SCR-04`, `SCR-10`, `SCR-02` |
| Objects | `report_builder_session`, `source`, `memory`, `file_asset`, `document` |
| Depends on | `DEV-M5-T07`, `DEV-M5-T09`, `DEV-M5-T11` |
| Blocks | `DEV-M5-T14`, `DEV-M5-T15`, `DEV-M5-T16` |
| Source docs | [리포트 빌더 source 선택](../../screens/15-report-builder.md#7-스크랩--기억--파일--메모--문서-source-선택-상세) |

### 목적

리포트 작업면의 임시 상태를 session으로 저장하고, 스크랩/기억/파일/메모/문서를 하나의 source picker에서 선택.

### 구현 범위

- report builder session 생성/복원
- selectedSourceIds, topicId, templateId, tone, audience, outputFormat 저장
- source picker 탭: 스크랩, 기억, 파일, 메모, 문서
- 최대 선택 수, 중복 경고, 권한/처리 상태 표시
- source 선택 변경 시 문서 메타/출처 칩/coverage/conflict invalidate

### 제외 범위

- 초안 생성
- citation 검증
- 공동 편집

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T13-S01` | session create/restore API | `Fullstack` | `/reports/new`, `/reports/{documentId}` 진입 상태가 복원됨 |
| `DEV-M5-T13-S02` | selected source panel | `FE` | 선택 수 `n / 20`, source 상태, 모두 해제, source chip이 표시됨 |
| `DEV-M5-T13-S03` | source picker search | `Fullstack` | source/memory/file/document를 탭별 검색하고 이미 선택된 항목을 표시함 |
| `DEV-M5-T13-S04` | selection validation | `BE` | 최대 수, 권한, 처리 상태, 중복 canonicalUrl/fileHash/documentId가 검증됨 |
| `DEV-M5-T13-S05` | topic/tone/template/output settings | `FE` | generation context에 필요한 설정이 session에 저장됨 |

### Acceptance Criteria

- [ ] 사용자는 스크랩, 기억, 파일, 메모, 문서 source를 하나의 picker에서 검색/선택할 수 있다.
- [ ] 선택한 source 수는 `n / 20`으로 표시되고 초과 선택은 차단된다.
- [ ] 권한이 없거나 처리 미완료 source는 생성 포함 여부가 명확히 표시된다.
- [ ] source 변경 후 다음 생성 run의 입력 scope가 갱신된다.

### Test / Verification

- [ ] 스크랩 다중 선택에서 report builder 진입 테스트
- [ ] session 저장 후 새로고침/탭 닫힘 복원 테스트
- [ ] 20개 초과 선택 차단 테스트
- [ ] 처리 중/권한 만료/source 삭제 상태 source 선택 테스트

### Edge Cases

- 선택 source가 0개인 경우
- source 처리 중이라 제한 사용만 가능한 경우
- 같은 원본 URL과 같은 파일에서 파생된 항목을 동시에 선택하는 경우
- topic 변경 후 선택 source 권한이 맞지 않는 경우

### Open Decisions

- `DEC-M5-13`: source 최대 선택 수 20개를 고정할지 모델/context budget에 따라 동적으로 둘지 결정 필요.

## DEV-M5-T14 / Outline/draft/section generation run

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `AI` |
| Screens | `SCR-15`, `SCR-03` |
| Objects | `report_builder_session`, `document_section`, `report_generation_run`, `run` |
| Depends on | `DEV-M5-T13`, `DEV-M5-T17`, `M4` |
| Blocks | `DEV-M5-T15`, `DEV-M5-T16` |
| Source docs | [리포트 생성 단계](../../screens/15-report-builder.md#613-초안-생성--비교--추천--다음-할-일) |

### 목적

선택 source를 기반으로 outline, 섹션 초안, 비교표, 추천 방향, 다음 할 일을 단계별로 생성하고 실패한 단계만 재시도.

### 구현 범위

- generation step: outline/insights/comparison/recommendations/next_actions
- 단계별 run 시작/취소/재시도
- 진행률과 하단 timeline
- 에디터 block 생성과 generationStepId 연결
- source snapshot 기반 generation input 구성

### 제외 범위

- citation 검증
- export
- 외부 문서 publish

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T14-S01` | generation run API | `BE`, `AI` | stepTypes 기반 생성 run이 시작되고 상태가 추적됨 |
| `DEV-M5-T14-S02` | outline generation | `AI`, `FE` | 사용자가 outline 생성 후 섹션 추가/삭제/순서 변경 가능함 |
| `DEV-M5-T14-S03` | section draft generation | `AI`, `FE` | 선택 섹션만 생성/재생성하고 기존 편집 block을 보존함 |
| `DEV-M5-T14-S04` | progress/cancel/retry UI | `Fullstack` | 실패 단계만 재시도하고 취소 시 draft를 보존함 |
| `DEV-M5-T14-S05` | inference metadata | `AI`, `BE` | source 근거와 AI 추론 문장을 구분하는 metadata가 저장됨 |

### Acceptance Criteria

- [ ] outline, 핵심 인사이트, 비교 분석, 추천 방향, 다음 할 일을 단계별로 생성할 수 있다.
- [ ] 실패한 단계는 전체 리포트를 버리지 않고 해당 단계만 재시도할 수 있다.
- [ ] 생성 중 취소해도 현재까지 생성된 본문은 draft로 보존된다.
- [ ] AI 추론 문장은 직접 source claim과 구분 가능한 metadata를 가진다.

### Test / Verification

- [ ] outline만 생성 후 섹션별 초안 생성 테스트
- [ ] run 실패 후 특정 단계 재시도 테스트
- [ ] run 취소 후 draft 복원 테스트
- [ ] 긴 source 선택 시 비용 gate가 먼저 동작하는지 테스트

### Edge Cases

- source가 생성 중 삭제/권한 만료되는 경우
- 사용자가 섹션을 편집하는 중 재생성 결과가 도착하는 경우
- selectedSourceIds가 변경된 뒤 오래된 run 결과가 도착하는 경우
- token budget 초과로 일부 source만 사용 가능한 경우

### Open Decisions

- `DEC-M5-14`: section 재생성 시 기존 사용자 편집 block을 잠금/보존/덮어쓰기 중 어떤 기본값으로 둘지 결정 필요.

## DEV-M5-T15 / Citation anchor, coverage, conflict, broken source

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `BE`, `AI` |
| Screens | `SCR-15`, `SCR-07`, `SCR-04`, `SCR-10` |
| Objects | `citation`, `source_anchor`, `source_conflict`, `verification_result`, `document` |
| Depends on | `DEV-M5-T14`, `DEV-M5-T18` |
| Blocks | `DEV-M5-T16` |
| Source docs | [리포트 citation/검증](../../screens/15-report-builder.md#610-citation--인용-삽입), [공통 citation 정책](../../common/domain-model-and-state-policy.md#413-citation) |

### 목적

리포트의 문장/표 셀/블록에 근거 anchor를 연결하고, source 삭제/권한 변경 후에도 깨진 근거를 상태로 표시.

### 구현 범위

- source_anchor: paragraph/page/timestamp/cell/chunk locator
- 자동/수동 citation 생성/삭제/재매핑
- citation coverage 계산
- 근거 검증: supported/weak/unsupported/conflict/missing_source
- source_conflict 목록과 resolution
- source 삭제/권한 변경 후 citation status 갱신

### 제외 범위

- 법률 문서 수준의 완전한 fact-checking
- 외부 웹 실시간 재검증

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T15-S01` | source anchor model | `BE` | PDF page, YouTube timestamp, article paragraph, XLSX cell anchor가 저장됨 |
| `DEV-M5-T15-S02` | citation CRUD | `Fullstack` | 문장/표 셀 citation 추가/삭제/hover/click이 동작함 |
| `DEV-M5-T15-S03` | coverage metric | `BE`, `FE` | cited/weak/uncited claim count와 percentage가 표시됨 |
| `DEV-M5-T15-S04` | verification run | `AI`, `BE` | 문장별 supported/weak/unsupported/conflict/missing_source 결과가 저장됨 |
| `DEV-M5-T15-S05` | conflict resolution | `Fullstack` | source별 원문, 날짜, 추천 액션, 사용자 resolution이 저장됨 |
| `DEV-M5-T15-S06` | broken citation propagation | `BE` | source/file/memory 삭제 또는 권한 변경 시 citation status가 갱신됨 |

### Acceptance Criteria

- [ ] 초안 생성 결과의 사실 주장 문장은 가능한 citation을 가진다.
- [ ] 사용자는 선택 문장과 표 셀에 citation을 수동 연결할 수 있다.
- [ ] source 체크 해제/삭제/권한 만료 시 관련 citation은 제거되지 않고 `missing_source`, `source_deleted`, `permission_blocked` 등으로 표시된다.
- [ ] conflict는 유형, 관련 source, 원문 anchor, 추천 해결 액션을 제공한다.

### Test / Verification

- [ ] citation 추가/삭제 후 coverage 재계산 테스트
- [ ] source 삭제 후 document citation 상태 갱신 테스트
- [ ] PDF page, YouTube timestamp, article paragraph anchor 클릭 이동 테스트
- [ ] conflict resolution 저장 후 verification result 갱신 테스트

### Edge Cases

- source snapshot은 남아 있지만 원본 source가 삭제된 경우
- 한 문장에 여러 source가 연결되고 일부만 권한 만료된 경우
- 표 셀 citation 누락
- AI가 source에 없는 문장을 citation 붙여 생성한 경우

### Open Decisions

- `DEC-M5-15`: citation 번호를 source 목록 순서로 둘지 문서 등장 순서로 둘지 결정 필요.

## DEV-M5-T16 / Document save/version/export/promotion

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack` |
| Screens | `SCR-15`, `SCR-10`, `SCR-02`, `SCR-09`, `SCR-04` |
| Objects | `document`, `document_section`, `citation`, `file_asset`, `task`, `memory`, `topic` |
| Depends on | `DEV-M5-T15` |
| Blocks | `M6`, `M7` knowledge usage |
| Source docs | [리포트 저장/승격](../../screens/15-report-builder.md#614-문서-저장--승격) |

### 목적

리포트 초안을 document로 저장하고, source snapshot/citation/conflict/verification을 함께 보존하며 export와 후속 승격을 지원.

### 구현 범위

- autosave draft와 document 저장
- document version
- topic artifact/document relation
- export: PDF/DOCX/Markdown 우선
- export 결과 file_asset 등록
- 리포트 요약/결정 memory 후보 승격
- next action checklist task 후보 승격

### 제외 범위

- HTML/공유 링크 MVP 포함 여부 미정
- 외부 문서 도구 publish
- 공동 편집

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T16-S01` | document save API | `Fullstack` | bodyBlocks, citations, sourceSnapshotIds, verification result가 함께 저장됨 |
| `DEV-M5-T16-S02` | autosave/version UI | `FE` | draft 저장 상태, 저장 실패, 버전 기록 진입점이 표시됨 |
| `DEV-M5-T16-S03` | topic document relation | `Fullstack` | 저장 document가 topic 산출물 목록에서 열림 |
| `DEV-M5-T16-S04` | export file generation | `Fullstack` | PDF/DOCX/Markdown export run과 file_asset 등록이 동작함 |
| `DEV-M5-T16-S05` | promote memories/tasks | `Fullstack` | 리포트 결정/요약은 memory 후보로, 체크리스트는 task 후보로 승격됨 |

### Acceptance Criteria

- [ ] `문서로 저장`은 document와 source snapshot, citations, conflicts, verification result를 함께 저장한다.
- [ ] 저장된 document는 연결 topic의 산출물 목록에서 열 수 있다.
- [ ] export 결과는 file_asset으로 등록되어 파일 화면에서 조회 가능하다.
- [ ] 리포트의 다음 할 일 체크리스트는 task 후보로 승격할 수 있다.
- [ ] 리포트 요약이나 결정은 memory 후보로 승격할 수 있다.

### Test / Verification

- [ ] 저장 후 새로고침/documentId 직접 접근 테스트
- [ ] source 삭제 후에도 저장 snapshot 기반 문서 열람 테스트
- [ ] PDF/DOCX/Markdown export 성공/실패 테스트
- [ ] task/memory 후보 승격 후 원 document relation 테스트

### Edge Cases

- 문서 제목 없음
- export 실패했지만 document 저장은 성공한 경우
- 저장 직전 citation coverage가 낮은 경우
- source conflict가 unresolved인 상태에서 저장하는 경우

### Open Decisions

- `DEC-M5-16`: conflict 미해결 문서도 저장/내보내기를 허용할지, verified 상태만 export 허용할지 결정 필요.

## DEV-M5-T17 / 긴 문서/영상/OCR 비용 gate와 승인 preview

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `S` |
| Area | `Fullstack`, `BE` |
| Screens | `SCR-07`, `SCR-10`, `SCR-15`, `SCR-11` |
| Objects | `cost_policy`, `approval_request`, `source`, `file_asset`, `document`, `run` |
| Depends on | `M1`, `M4`, `M6` policy skeleton |
| Blocks | `DEV-M5-T04`, `DEV-M5-T05`, `DEV-M5-T08`, `DEV-M5-T14`, `DEV-M5-T16` |
| Source docs | [공통 승인/비용 정책](../../common/navigation-and-cross-screen-flows.md#12-권한비용연결-미비-시-공통-ux) |

### 목적

긴 영상 전사, 큰 PDF/OCR, 대량 source 리포트 생성, export 같은 비용 증가 액션 전에 예상 비용과 대안을 보여주고 차단/승인 처리.

### 구현 범위

- token/page/duration/file size 기반 cost estimate
- 비용 추정 불가 시 fail-closed 또는 샘플 실행
- approval preview card
- 저비용 대안: source 수 줄이기, OCR 제외, outline만 생성, 저비용 모델
- 비용 설정 deep link

### 제외 범위

- 결제 시스템
- provider별 실제 과금 reconciliation

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T17-S01` | cost estimation inputs | `BE` | duration/pageCount/tokenEstimate/fileSize/sourceCount가 비용 추정에 쓰임 |
| `DEV-M5-T17-S02` | cost preview API | `BE` | 처리 전 estimatedCost, confidence, alternatives가 반환됨 |
| `DEV-M5-T17-S03` | approval card UI | `FE` | 비용, 대상, 권한 scope, 영향 범위, 만료 시간이 표시됨 |
| `DEV-M5-T17-S04` | low-cost alternatives | `Fullstack` | 샘플 실행, source 줄이기, outline만 생성, 저비용 모델 선택 가능함 |
| `DEV-M5-T17-S05` | execution recheck | `BE` | 승인 직전 비용/권한/source 상태를 재검증함 |

### Acceptance Criteria

- [ ] 자막 없는 긴 영상 전사, 큰 PDF OCR, 긴 리포트 생성 전 비용 preview가 표시된다.
- [ ] 비용 한도 초과 시 실행은 차단되거나 approval_request로 전환된다.
- [ ] 비용 추정이 불확실하면 실제 비용처럼 오인되지 않게 표시한다.
- [ ] 승인 후 실행 직전에 source 상태와 비용 정책을 다시 확인한다.

### Test / Verification

- [ ] 1시간 영상, 300쪽 PDF, 20개 source 리포트 비용 preview 테스트
- [ ] 비용 한도 초과와 사용자 승인/거절 테스트
- [ ] 비용 정책 변경 중 실행 요청 race 테스트
- [ ] 승인 payload 변경 시 기존 승인 무효화 테스트

### Edge Cases

- pageCount/duration/tokenEstimate를 알 수 없는 경우
- provider fallback이 외부 전송 비용과 개인정보 위험을 높이는 경우
- 이미 진행 중인 run이 비용 정책 축소를 만나는 경우
- export만 실패하고 document 저장은 성공한 경우

### Open Decisions

- `DEC-M5-17`: 비용 추정 불가 작업을 기본 차단할지, 샘플 실행만 허용할지 결정 필요.

## DEV-M5-T18 / Knowledge 삭제/보관 impact API와 audit

| 필드 | 값 |
| --- | --- |
| Status | `planned` |
| Priority | `P1` |
| Size | `M` |
| Area | `Fullstack`, `BE` |
| Screens | `SCR-07`, `SCR-04`, `SCR-10`, `SCR-15` |
| Objects | `source`, `file_asset`, `memory`, `document`, `citation`, `audit_log`, `approval_request` |
| Depends on | `DEV-M5-T01`, `M1` |
| Blocks | `DEV-M5-T05`, `DEV-M5-T07`, `DEV-M5-T09`, `DEV-M5-T12`, `DEV-M5-T15`, `DEV-M5-T16` |
| Source docs | [삭제와 보관 정책](../../common/domain-model-and-state-policy.md#93-삭제와-보관), [공통 동선 approval](../../common/navigation-and-cross-screen-flows.md#11-approval-flow) |

### 목적

source/file/memory/document 삭제와 보관이 relation, citation, embedding, 검색, audit에 미치는 영향을 실행 전 보여주고 안전하게 처리.

### 구현 범위

- `GET .../impact` API for source/file/memory/document
- archive/soft delete/hard delete 옵션 구분
- source 삭제 후 memory confidence/sourceCount, document citation status 갱신
- file 삭제 후 source/memory/chat attachment/document citation 영향 처리
- document 삭제/보관과 export file 보존 정책
- destructive action audit log

### 제외 범위

- 법적 보존/컴플라이언스 시스템
- 팀 단위 삭제 승인

### Subtasks

| ID | 제목 | 영역 | 완료 조건 |
| --- | --- | --- | --- |
| `DEV-M5-T18-S01` | impact API schema | `BE` | 영향을 받는 topic/memory/file/source/document/citation/task/run 수와 목록 요약이 반환됨 |
| `DEV-M5-T18-S02` | archive/delete UI pattern | `FE` | 보관, soft delete, hard delete 차이와 복구 가능성이 표시됨 |
| `DEV-M5-T18-S03` | source deletion propagation | `BE` | memory 출처 수, task 근거, document citation, embedding 상태가 갱신됨 |
| `DEV-M5-T18-S04` | file deletion propagation | `BE` | source, memory, chat attachment, run artifact, document citation 영향이 처리됨 |
| `DEV-M5-T18-S05` | document archive/delete policy | `BE` | topic relation, export file, citation snapshot 보존/삭제 정책이 적용됨 |
| `DEV-M5-T18-S06` | audit and approval gate | `Fullstack` | 삭제/권한 완화/대량 삭제는 approval/audit 조건을 통과해야 실행됨 |

### Acceptance Criteria

- [ ] source/file/memory/document 삭제 전 영향 범위가 표시된다.
- [ ] archive는 기본 목록에서 숨기되 relation과 기록을 보존한다.
- [ ] source 삭제 후 document citation은 즉시 제거되지 않고 `source_deleted` 또는 `missing_source` 상태로 바뀐다.
- [ ] file 삭제 후 연결 memory와 document citation 영향이 표시되고 검색/embedding에서 제외된다.
- [ ] destructive action은 audit log에 남고 민감 payload는 저장하지 않는다.

### Test / Verification

- [ ] source 삭제 impact가 memory/sourceCount/document citation에 반영되는지 테스트
- [ ] file 삭제 impact가 chat attachment/run artifact/document citation에 반영되는지 테스트
- [ ] archive 후 목록/보관함/직접 URL fallback 테스트
- [ ] audit log 저장 실패 시 삭제 fail-closed 테스트

### Edge Cases

- 처리 중 source를 삭제하는 경우
- memory 생성 중 source 삭제가 들어오는 경우
- document가 source snapshot을 보관하고 원 source는 삭제된 경우
- audit log 저장 실패
- hard delete 후 복구 요청

### Open Decisions

- `DEC-M5-18`: source/file/document hard delete의 복구 가능 기간과 snapshot 보존 범위를 결정 필요.

## 7. Milestone 완료 조건

- [ ] source inbox에서 URL/메모/파일/영상/기사/블로그/PDF를 수집하고 처리 상태를 볼 수 있다.
- [ ] 실패한 extraction은 원인별 CTA, retry, 수동 원문 fallback을 제공한다.
- [ ] 파일 업로드/import/요약/미리보기/채팅 첨부가 권한과 처리 상태를 반영한다.
- [ ] source/file/chat에서 memory 후보를 만들고 사용자가 review 후 active/excluded/archive/delete를 제어한다.
- [ ] report builder에서 source picker, outline, section draft, citation, verification, save, export가 연결된다.
- [ ] source/file/memory/document 삭제 전 impact가 표시되고 citation 깨짐이 상태로 보존된다.
- [ ] 긴 영상/PDF/OCR/리포트 생성 전 비용 preview와 승인/차단 flow가 동작한다.
- [ ] 모든 목록형 UI는 안정 ID를 key로 사용한다.
- [ ] 기존 앱 복사/마이그레이션 전제 태스크가 없다.

## 8. 검수 체크리스트

- [ ] 모든 task ID가 `DEV-M5-Tnn` 형식을 따른다.
- [ ] 모든 task에 Subtasks, Acceptance Criteria, Test / Verification, Edge Cases, Open Decisions가 있다.
- [ ] `L` 크기 task가 없다.
- [ ] source/file/memory/document/citation read/write 경계가 분리되어 있다.
- [ ] 삭제/보관/source 삭제 후 citation 깨짐/민감 memory/긴 문서 비용 위험이 별도 task로 다뤄진다.
- [ ] 기존 프로젝트는 reference-only로만 언급된다.
