# 지식 기반 리포트 빌더 / Report Builder 화면 상세 기획

## 1. 화면 목적

`지식 기반 리포트 빌더`는 사용자가 스크랩, 기억, 파일, 메모, 기존 문서에서 고른 자료를 근거로 AI 리포트를 만들고, 근거 연결 상태를 검증한 뒤 저장하거나 문서로 승격하는 작업면이다. PRD 기준으로 긴 문서와 리포트는 채팅 inline 답변이 아니라 `작업면(surface)`으로 펼쳐져야 한다. 이 화면은 그 작업면 중 문서형 artifact를 만드는 고급 화면이다.

핵심 목적은 “AI가 그럴듯한 글을 써주는 화면”이 아니라 “선택한 지식 소스만 근거로 삼아 리포트 구조, 초안, 비교 분석, 추천 방향, 다음 할 일을 만들고 인용 커버리지와 소스 충돌을 검증하는 화면”이다.

| 사용자 문제 | 화면에서의 해결 방식 |
| --- | --- |
| 스크랩과 파일이 많아 리포트 재료를 고르기 어려움 | 좌측 `선택한 지식 소스` 패널에서 유형, 날짜, 출처, 신뢰도, 연결 주제 기준으로 소스를 선택 |
| AI 리포트가 어떤 자료를 근거로 썼는지 알기 어려움 | 중앙 에디터 문장 단위 citation, 우측 인용 커버리지, 근거 검증 CTA 제공 |
| 여러 자료의 수치나 주장이 서로 다를 때 놓치기 쉬움 | `소스 충돌 감지` 패널에서 conflict 항목과 검토 액션 제공 |
| 리포트 구조를 직접 잡기 번거로움 | 우측 `AI 개요/아웃라인 생성` 단계에서 개요, 핵심 인사이트, 비교 분석, 추천 방향, 다음 할 일을 순차 생성 |
| 독자와 톤에 따라 같은 자료도 다른 문서가 필요함 | 톤, 대상 독자, 템플릿, 출력 형식 설정으로 생성 결과 제어 |
| 초안을 만든 뒤 실제 문서로 보관하거나 이어서 쓰고 싶음 | `문서로 저장`, 버전 저장, 주제/기억/파일로 승격 동선 제공 |

첨부 이미지 기준으로 확인된 기능은 다음이다.

| 화면 요소 | 이미지에서 확인된 내용 | 요구사항 반영 |
| --- | --- | --- |
| 좌측 글로벌 내비게이션 | 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말 | 공통 셸 유지. 현재 위치는 스크랩 하위 리포트 작업면 |
| 브레드크럼 | `스크랩 > 리포트` | 스크랩 자료에서 리포트 빌더로 진입한 맥락 표시 |
| 화면 제목 | `리포트 만들기` | 선택 자료 기반 지식 리포트 생성 |
| 보조 문구 | `선택한 자료를 바탕으로 AI가 지식 리포트를 작성합니다.` | 화면 목적 설명 |
| 상단 액션 | `템플릿 불러오기`, 더보기 | 문서 템플릿 적용, 기타 작업 메뉴 |
| 좌측 소스 패널 | `선택한 지식 소스 6 / 20`, `모두 해제`, 체크박스 소스 목록, `소스 추가` | 다중 source 선택, 최대 선택 수, 일괄 해제, 추가 |
| 소스 예시 | YouTube 요약, Tech Daily 기사, 개발자 블로그, PDF, 내 메모, 사용자 피드백 xlsx | 스크랩/기억/파일/메모/문서 source 모두 지원 |
| 연결 주제 | `AI 허브 만들기`, `변경` | 리포트가 귀속될 topic 선택 |
| 중앙 에디터 | H1, bold, 목록, quote, 이미지, 표, 링크, 인용 삽입, undo/redo, 미리보기 | 리치 텍스트 편집과 citation 삽입 |
| 문서 본문 | `AI 에이전트 플랫폼 UX 리포트`, 작성일, 작성자, 소스 6개, 섹션 1~5, 비교 표, 체크리스트, 출처 칩 | 리포트 본문과 근거 표시 |
| 우측 생성 패널 | `AI 개요/아웃라인 생성`, `다시 생성`, 5단계 생성 상태 | outline/초안/비교/추천/다음 할 일 생성 플로우 |
| 글 톤 | 전문적, 간결함, 친근함, 설명형 | tone preset |
| 대상 독자 | 제품 기획자, UX 디자이너, 개발자 | audience preset |
| 인용 커버리지 | 92%, `본문 중 45개 문장에 근거가 연결되었습니다.` | citation coverage metric |
| 소스 충돌 감지 | `플랫폼 자동화 범위 관련 수치가 상이합니다. 소스 2와 4의 내용이 다릅니다.` | source conflict detection |
| 주요 CTA | `초안 생성`, `근거 검증`, `문서로 저장` | 생성, 검증, 저장 단계 |
| 하단 진행률 | `리포트 생성 진행률`, 68%, 요약 생성 완료, 초안 생성 중, 검토 대기 | run progress timeline |
| 예상 완료 | `약 1분 후` | 비동기 생성 예상 시간 |

## 2. 화면 범위와 전제

- 이 문서는 첨부 이미지와 `/docs/personal-agent-platform-prd.md` 기준의 PC 웹 고급 화면 상세다.
- 소유 범위는 `리포트 빌더 작업면`이다. 좌측 글로벌 내비게이션은 공통 셸로 간주하되, 이 화면에서 보이는 활성 상태와 이동 요구사항은 기록한다.
- 이 화면은 새 자료를 수집하는 스크랩 inbox가 아니다. 새 source 추가는 가능하지만, 본질은 이미 수집된 자료를 선택해 문서형 artifact를 만드는 것이다.
- 리포트는 `document` 객체이면서 `artifact`다. 초안 생성 run, citation, source conflict, 저장 버전, 출력 파일은 분리 관리한다.
- MVP는 개인 허브 기준이다. 공유 편집, 동시 편집, 승인 워크플로우는 확장 요구사항으로 둔다.
- 생성 모델은 선택한 source의 접근 권한과 사용자가 지정한 tone/audience/template/outputFormat을 지켜야 한다.
- 외부 공개 발행은 이 화면의 기본 범위가 아니다. 저장, 다운로드, 파일 생성, 주제 연결까지를 1차 범위로 한다.

## 3. 정보 구조

### 3.1 전체 레이아웃

PC 기준 4영역 구조다.

| 영역 | 구성 | 역할 |
| --- | --- | --- |
| 좌측 글로벌 내비게이션 | 허브명, 알림, 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말, 사용자 플랜 | 앱 전체 이동. 이미지에서는 `스크랩` 활성화 |
| 작업 헤더 | 브레드크럼, 제목, 설명, 템플릿 불러오기, 더보기 | 현재 작업면 맥락과 상위 액션 제공 |
| 좌측 소스 패널 | 선택한 지식 소스, 선택 수, 모두 해제, 소스 목록, 소스 추가, 연결 주제 | 리포트 생성에 사용할 근거 범위 제어 |
| 중앙 문서 에디터 | 리치 텍스트 툴바, 문서 본문, 문장 citation, 비교 표, 할 일 체크리스트, 출처 칩 | 리포트 작성과 편집의 주 작업 영역 |
| 우측 AI 패널 | 생성 단계, 톤, 대상 독자, 템플릿, 출력 형식, 인용 커버리지, 소스 충돌, 주요 CTA, 예상 완료 | 생성 제어와 품질 검증 |
| 하단 진행 바 | 진행률, 단계별 상태, 현재 run 상태 | 긴 생성 작업의 비동기 진행 상태 표시 |

### 3.2 화면에 보이는 주요 정보

| 항목 | 화면 표시 | 설명 |
| --- | --- | --- |
| 브레드크럼 | `스크랩 > 리포트` | 스크랩에서 리포트 작업면으로 진입한 상태 |
| 제목 | `리포트 만들기` | 화면 최상위 제목 |
| 설명 | `선택한 자료를 바탕으로 AI가 지식 리포트를 작성합니다.` | 소스 기반 생성 목적 |
| 템플릿 액션 | `템플릿 불러오기` | 리포트 템플릿 선택 |
| 선택 수 | `선택한 지식 소스 6 / 20` | 현재 선택 source 수와 최대 선택 수 |
| 연결 주제 | `AI 허브 만들기` | 리포트가 연결될 topic |
| 문서 제목 | `AI 에이전트 플랫폼 UX 리포트` | 생성 또는 사용자가 입력한 report title |
| 문서 메타 | 작성일 2024. 5. 20, 작성자 Minho, 소스 6개 | document metadata |
| 본문 섹션 | 개요, 핵심 인사이트, 주요 플랫폼 비교, 추천 방향, 다음 할 일 | 생성 단계와 대응되는 기본 outline |
| citation | `[1]`, `[2]`, `[3]`, `[4]`, `[5]`, `[6]` | 문장 또는 단락에 연결된 source anchor |
| 출처 칩 | YouTube, Tech Daily, 개발자 블로그, PDF 리포트, 내 메모, 사용자 피드백.xlsx | 문서 하단 source 요약 |
| 생성 단계 | 개요 완료, 핵심 인사이트 완료, 비교 분석 진행 중, 추천 방향 대기, 다음 할 일 대기 | AI 생성 pipeline 상태 |
| 품질 지표 | 인용 커버리지 92%, 소스 충돌 1건 | 근거 연결과 충돌 감지 |
| CTA | 초안 생성, 근거 검증, 문서로 저장 | 다음 주요 작업 |
| 진행률 | 68%, `분석 및 초안 생성 중...` | run progress |

### 3.3 소스 유형

리포트 빌더는 다음 source 유형을 선택 대상으로 제공한다.

| 사용자에게 보이는 유형 | 내부 객체 | 예시 | 리포트에서 쓰는 정보 |
| --- | --- | --- | --- |
| 스크랩 | `source` | YouTube 요약, 기사, 블로그 | 제목, 요약, 원문 추출 텍스트, transcript, URL, source anchor |
| 기억 | `memory` | 장기 저장된 선호도, 결정, 조사 메모 | 기억 내용, 생성 근거 source, 신뢰도, 연결 topic |
| 파일 | `file_asset` + `source` | PDF, XLSX, CSV, DOCX | 추출 텍스트, 표 데이터, 페이지/셀 anchor, 파일 메타 |
| 메모 | `source(type=memo)` 또는 `note` | 사용자 리뷰 메모, 회의 메모 | 사용자 작성 원문, 태그, 작성일 |
| 문서 | `document` | 기존 초안, 이전 리포트, 비교표 | 문서 구조, 본문, 기존 citation, 버전 |
| 채팅 결과 | `artifact` 또는 `conversation excerpt` | 이전 채팅 요약, agent run 결과 | 요약문, 생성 run, 참조 source |

### 3.4 문서 기본 구조

이미지의 기본 템플릿은 `UX 리포트` 계열이다.

| 섹션 | 목적 | 생성 방식 |
| --- | --- | --- |
| 제목 | 리포트 주제 명시 | topic, selected source 제목, template에서 제안 |
| 메타 | 작성일, 작성자, 소스 수 | 시스템 자동 입력 |
| 1. 개요 | 리포트 목적과 범위 | outline 단계에서 생성 |
| 2. 핵심 인사이트 | 주요 발견 요약 | source 요약과 중복 포인트 clustering |
| 3. 주요 플랫폼 비교 | 대상 간 비교 표 | 파일/기사/메모에서 비교 축 추출 |
| 4. 추천 방향 | 설계/전략 제안 | 인사이트와 비교 결과 기반 생성 |
| 5. 다음 할 일 | 후속 액션 체크리스트 | task 후보 생성 |
| 출처 | 사용 source 칩 | selected source 자동 표시 |

## 4. 진입 / 종료 / 전환 동선

### 4.1 진입 동선

| 진입점 | 처리 |
| --- | --- |
| 스크랩 화면에서 여러 자료 선택 후 `리포트 만들기` | 선택 sourceIds를 유지한 채 진입. 브레드크럼은 `스크랩 > 리포트` |
| 기억 화면에서 기억 묶음 선택 후 `리포트 생성` | memoryIds와 연결 sourceIds를 후보로 로드 |
| 파일 화면에서 PDF/XLSX 선택 후 `리포트로 만들기` | fileAssetIds를 source 후보로 변환하고 파일 기반 citation anchor 생성 |
| 주제 화면의 자료 탭에서 `리포트 만들기` | topicId를 고정하고 해당 주제 연결 자료를 기본 후보로 로드 |
| 오늘 또는 채팅에서 “이 자료들로 리포트 만들어줘” | 채팅 첨부 source와 대화 scope를 기반으로 작업면 생성 |
| 기존 document의 `다시 작성` | 기존 documentId, template, tone, audience, citation 설정을 복사해 새 버전 또는 새 문서로 진입 |
| 맡긴 일 run 결과에서 리포트 artifact 클릭 | run output document를 열고 생성 단계와 로그를 복원 |
| URL 직접 접근 | reportBuilderSessionId 또는 documentId가 있으면 상태 복원. 권한 없으면 접근 제한 상태 표시 |

### 4.2 종료 동선

| 종료 액션 | 처리 |
| --- | --- |
| 좌측 다른 메뉴 클릭 | 미저장 변경이 있으면 저장/버리기/계속 편집 확인 |
| 브레드크럼 `스크랩` 클릭 | 선택 source와 draft 상태 저장 후 스크랩 목록으로 복귀 |
| `문서로 저장` 완료 | documentId 생성 또는 갱신, 저장 완료 토스트, 문서 상세 또는 현재 편집 유지 옵션 제공 |
| 저장 버튼의 드롭다운에서 파일 생성 | PDF/DOCX/Markdown/HTML 중 선택한 outputFormat으로 file_asset 생성 |
| 생성 run 취소 | 현재까지 생성된 본문은 draft로 보존하고 run status를 `cancelled`로 기록 |
| 에디터 닫기 | autosave draft가 있으면 최근 문서 또는 주제 산출물에 표시 |
| 외부 원본 열기 | source 원본 URL 또는 파일 미리보기를 새 탭/상세 패널로 열고 편집 상태 유지 |

### 4.3 화면 내 전환

| 전환 | 트리거 | 기대 동작 |
| --- | --- | --- |
| source 체크/해제 | 좌측 소스 체크박스 클릭 | selectedSourceIds 갱신, 인용 커버리지와 conflict 상태 재계산 |
| `모두 해제` | 소스 패널 상단 클릭 | 모든 source 해제. 본문이 있으면 근거 없는 문장 경고 표시 |
| `소스 추가` | 좌측 하단 클릭 | source picker 모달 열기. 스크랩/기억/파일/메모/문서 탭 제공 |
| 연결 주제 변경 | `변경` 버튼 클릭 | topic picker 열기. topic 변경 시 source 추천 후보 갱신 |
| 에디터 서식 변경 | 툴바 클릭 | 선택 블록의 markdown/rich-text node 갱신 |
| 인용 삽입 | 툴바 `인용 삽입` 클릭 | 선택 문장 또는 커서 위치에 citation picker 표시 |
| 미리보기 | `미리보기` 버튼 클릭 | 읽기 모드 또는 별도 preview pane 표시 |
| 생성 단계 클릭 | 우측 단계 항목 클릭 | 해당 섹션으로 스크롤하고 생성/재생성 대상 설정 |
| 톤 변경 | tone segmented control 클릭 | 다음 생성부터 적용. 기존 본문에는 즉시 덮어쓰지 않음 |
| 대상 독자 변경 | audience dropdown 변경 | 다음 생성 prompt와 용어 수준에 반영 |
| conflict 검토 | `검토하기` 클릭 | 충돌 상세 모달 또는 에디터 내 관련 문장 하이라이트 |
| 진행률 단계 클릭 | 하단 run timeline 클릭 | run log 또는 단계별 산출물 요약 표시 |

## 5. 핵심 시나리오

### 5.1 스크랩 6개를 선택해 UX 리포트 초안 생성

1. 사용자가 스크랩 목록에서 YouTube, 기사, 블로그, PDF, 메모, XLSX를 선택한다.
2. `리포트 만들기`를 실행하면 화면은 선택 소스 6개를 좌측 패널에 표시한다.
3. 시스템은 source별 요약, 원문 추출 상태, citation anchor, 접근 권한을 확인한다.
4. 사용자는 연결 주제를 `AI 허브 만들기`로 유지한다.
5. 우측 패널에서 톤을 `전문적`, 대상 독자를 `제품 기획자, UX 디자이너, 개발자`로 선택한다.
6. `초안 생성`을 누르면 시스템은 개요, 핵심 인사이트, 비교 분석, 추천 방향, 다음 할 일 순서로 run을 실행한다.
7. 중앙 에디터에는 `AI 에이전트 플랫폼 UX 리포트` 초안이 생성되고 각 문장에 `[1]` 같은 citation이 붙는다.
8. 사용자는 인용 커버리지와 소스 충돌을 확인한 뒤 본문을 편집한다.
9. `문서로 저장`을 눌러 document로 저장한다.

### 5.2 source를 추가하거나 제거하며 근거 범위 조정

1. 사용자가 좌측 `소스 추가`를 클릭한다.
2. source picker는 스크랩, 기억, 파일, 메모, 문서 탭을 제공한다.
3. 사용자는 새 PDF 리포트 1개를 추가한다.
4. 선택 수는 `7 / 20`으로 갱신되고, 우측 패널은 새 source 분석 상태를 표시한다.
5. 사용자가 기존 YouTube source를 해제하면 해당 source에만 연결된 citation은 `missing source` 상태가 된다.
6. 시스템은 관련 문장과 표 셀을 하이라이트하고 재생성 또는 다른 source로 대체할 수 있게 한다.
7. 사용자는 `근거 검증`을 실행해 source 변경 후 citation 유효성을 다시 확인한다.

### 5.3 outline만 먼저 생성한 뒤 섹션별로 초안 작성

1. 사용자가 본문이 빈 상태에서 `AI 개요/아웃라인 생성`의 `개요` 단계를 실행한다.
2. 시스템은 선택 source의 공통 주제와 conflict 가능성을 고려해 섹션 후보를 만든다.
3. 중앙 에디터에는 제목과 H2/H3 구조만 생성된다.
4. 사용자는 섹션 제목을 직접 수정하거나 순서를 바꾼다.
5. 특정 섹션에서 `이 섹션 초안 생성`을 실행한다.
6. 시스템은 해당 섹션에 필요한 source만 우선 참조하고 citation을 붙인다.
7. 사용자는 단계별 결과를 검토하며 전체 초안 생성보다 세밀하게 문서를 완성한다.

### 5.4 비교 표와 추천 방향 생성

1. 사용자가 비교 분석 단계에서 플랫폼 후보와 비교 축을 확인한다.
2. 시스템은 source에서 플랫폼명, 기능 범위, 자동화 수준, 커스터마이징, 투명성/신뢰, 가격 정보를 추출한다.
3. 중앙 에디터에는 표가 생성되고 각 표 셀은 근거 source anchor를 가진다.
4. source 간 값이 다르면 표 셀에 conflict 표시를 붙인다.
5. 사용자는 conflict 상세를 열어 source 2와 source 4의 원문 차이를 확인한다.
6. 사용자가 더 신뢰할 source를 선택하면 표 셀과 추천 방향 문장이 갱신된다.

### 5.5 citation 커버리지와 근거 검증

1. 초안 생성이 끝나면 우측 인용 커버리지가 92%로 표시된다.
2. 사용자가 `근거 검증`을 누른다.
3. 시스템은 문장별로 연결 citation의 원문 anchor가 실제 주장을 뒷받침하는지 검사한다.
4. 근거가 부족한 문장은 `근거 없음`, 과장된 문장은 `근거 약함`, source끼리 불일치하는 문장은 `충돌`로 표시한다.
5. 사용자는 각 항목에서 source 추가, 문장 약화, 문장 삭제, 수동 인용 연결 중 하나를 선택한다.
6. 검증을 통과하면 document status를 `verified` 또는 `ready_to_save`로 전환할 수 있다.

### 5.6 저장 후 문서와 할 일로 승격

1. 사용자가 초안과 근거 검증을 마친 뒤 `문서로 저장`을 클릭한다.
2. 시스템은 document title, body, blocks, citations, selectedSourceIds, topicId, tone, audience, templateId를 저장한다.
3. 하단 `다음 할 일` 섹션의 체크리스트는 task 후보로 변환할 수 있다.
4. 사용자가 저장 드롭다운에서 `할 일로 내보내기`를 선택하면 체크리스트 항목이 task로 생성된다.
5. 저장된 document는 주제 산출물, 파일 생성물, 기억의 출처로 다시 참조될 수 있다.
6. 사용자가 outputFormat을 선택하면 PDF, DOCX, Markdown, HTML 파일이 `file_asset`으로 생성된다.

## 6. 컴포넌트별 상세 기능

### 6.1 좌측 글로벌 내비게이션

| 요소 | 기능 |
| --- | --- |
| 허브명 `내 AI 허브` | 워크스페이스/허브 전환 드롭다운 |
| 알림 아이콘 | 생성 완료, 검증 실패, conflict 발생, 저장 실패 알림 |
| 메뉴 목록 | 현재 이미지 기준 `스크랩` 활성화. 리포트 빌더는 스크랩에서 파생된 작업면 |
| 설정/도움말 | 리포트 생성 기본 모델, citation 정책, 문서 저장 정책 도움말로 이동 |
| 사용자 카드 | 사용자명, 플랜, 계정 메뉴, 사용량 상태 |

### 6.2 작업 헤더

| 요소 | 기능 |
| --- | --- |
| 브레드크럼 `스크랩 > 리포트` | 이전 화면 복귀와 현재 작업면 맥락 표시 |
| 제목 `리포트 만들기` | 화면 정체성 표시 |
| 보조 문구 | 선택 자료 기반 AI 리포트 작성 목적 설명 |
| `템플릿 불러오기` | 템플릿 선택 모달 열기 |
| 더보기 | 새 리포트, 현재 draft 복제, 버전 기록, 내보내기, 생성 설정, 삭제 |

`템플릿 불러오기`는 본문이 비어 있으면 즉시 적용한다. 본문이 있는 경우 섹션 구조만 적용할지, 전체 본문을 재생성할지, 현재 본문을 유지하고 누락 섹션만 추가할지 선택받는다.

### 6.3 선택한 지식 소스 패널

| 요소 | 기능 |
| --- | --- |
| 제목 `선택한 지식 소스` | 리포트 근거로 쓰는 source 목록 표시 |
| 선택 수 `6 / 20` | 현재 선택 수와 정책상 최대 선택 수 표시 |
| `모두 해제` | 모든 source 선택 해제 |
| source 체크박스 | 개별 source 사용 여부 제어 |
| source 썸네일/아이콘 | YouTube, 기사, 블로그, PDF, 메모, XLSX 등 유형 표시 |
| source 제목 | 원본 제목 또는 파일명 표시 |
| source 메타 | 출처명, 날짜, 파일 크기, 처리 상태 표시 |
| source 배지 숫자 | 해당 source가 연결된 citation 수 또는 주요 chunk 수 표시 |
| `소스 추가` | source picker 열기 |

source 목록의 각 항목은 다음 상태를 가진다.

| 상태 | 표시 | 처리 |
| --- | --- | --- |
| 선택됨 | 체크박스 파란색 | 생성/검증에 포함 |
| 선택 해제 | 빈 체크박스 | 기존 citation은 missing 상태가 될 수 있음 |
| 처리 중 | spinner 또는 `분석 중` | 초안 생성 전 대기 또는 요약 기반 제한 사용 |
| 접근 불가 | 잠금 아이콘 | 권한 확인 전 생성 제외 |
| 충돌 관련 | warning 배지 | conflict 상세에서 참조 |
| 근거 부족 | 흐린 citation 배지 | 원문 anchor 없음. 요약만 근거로 사용 제한 |

### 6.4 source picker

`소스 추가`에서 열리는 모달은 리포트 재료를 한 번에 찾는 고급 선택기다.

| 탭 | 검색 대상 | 주요 필터 |
| --- | --- | --- |
| 스크랩 | URL, YouTube, 기사, 블로그, PDF source | 유형, 처리 상태, 태그, 출처, 날짜, 연결 주제 |
| 기억 | 장기 기억, 결정, 선호도, 요약 지식 | 기억 유형, 신뢰도, 업데이트일, 연결 source |
| 파일 | 업로드/외부 파일, 생성 파일 | 파일 타입, 요약 상태, 권한, 크기, 폴더 |
| 메모 | 사용자 메모, 회의 메모, 빠른 노트 | 작성자, 날짜, 태그, topic |
| 문서 | 기존 report/document/artifact | 템플릿, 버전, 검증 상태, 작성자 |

선택기는 최대 선택 수 20개를 넘으면 추가를 막고, 이미 선택된 source는 체크 상태로 표시한다. 같은 원본 URL이나 같은 파일에서 파생된 source가 중복 선택되면 중복 경고를 표시한다.

### 6.5 연결 주제

| 요소 | 기능 |
| --- | --- |
| 주제 칩 `AI 허브 만들기` | 현재 리포트가 연결될 topic 표시 |
| `변경` 버튼 | topic picker 열기 |
| 새 주제 생성 | 리포트 목적에 맞는 topic을 새로 생성 |
| 주제 변경 영향 안내 | 추천 source, 저장 위치, 후속 task 연결 범위 변경 안내 |

topicId는 document 저장 위치와 source 추천의 기준이다. topic을 변경해도 선택 source를 자동으로 해제하지 않는다. 단, 권한과 topic scope가 맞지 않는 source는 경고한다.

### 6.6 리치 텍스트 에디터

중앙 에디터는 문서 작성의 주 작업면이다. 이미지 기준 툴바 기능은 다음이다.

| 툴바 요소 | 기능 |
| --- | --- |
| heading dropdown `H1` | H1/H2/H3/본문/캡션 스타일 변경 |
| Bold `B` | 선택 텍스트 굵게 |
| 목록 아이콘 | bullet list, numbered list, checklist |
| quote 아이콘 | 인용문 블록 |
| 이미지 아이콘 | 이미지 삽입 또는 source 이미지 첨부 |
| 표 아이콘 | 표 삽입, 비교 표 생성 |
| 링크 아이콘 | URL 또는 내부 source/document 링크 삽입 |
| `인용 삽입` | citation picker 열기 |
| undo/redo | 편집 이력 되돌리기/다시 실행 |
| `미리보기` | 읽기 모드 전환 |

에디터는 다음 편집 단위를 지원한다.

| 편집 단위 | 요구사항 |
| --- | --- |
| 문서 제목 | 별도 title 필드와 본문 H1 동기화 정책 필요 |
| 메타 정보 | 작성일, 작성자, 소스 수 자동 표시. 사용자가 숨김 가능 |
| 단락 | 문장 단위 citation 연결 |
| 표 | 셀 단위 citation과 conflict 표시 |
| 체크리스트 | task 후보로 내보내기 가능 |
| 출처 칩 | selected source 자동 반영. 수동 순서 변경 가능 |
| AI 생성 블록 | 생성 run id, 생성 시점, 사용 source snapshot 기록 |

에디터 저장 방식은 block 기반을 권장한다. 각 block은 rich text content, plain text, citationIds, sourceAnchorIds, generationStepId를 가진다.

### 6.7 AI 개요/아웃라인 생성 패널

우측 상단 패널은 생성 진행을 단계형으로 보여준다.

| 단계 | 이미지 상태 | 생성 결과 |
| --- | --- | --- |
| 1. 개요 | 완료 | 리포트 목적과 범위 |
| 2. 핵심 인사이트 | 완료 | 주요 발견 요약 |
| 3. 비교 분석 | 진행 중 | 플랫폼/기능 비교 표와 해석 |
| 4. 추천 방향 | 대기 | 설계 및 전략 제안 |
| 5. 다음 할 일 | 대기 | 후속 액션 체크리스트 |

각 단계는 다음 액션을 가진다.

| 액션 | 기능 |
| --- | --- |
| 단계 실행 | 해당 섹션만 생성 |
| 단계 재생성 | 기존 섹션을 대체하거나 새 variant로 추가 |
| 단계 적용 | 생성 결과를 에디터에 반영 |
| 단계 비교 | 이전 variant와 새 variant를 비교 |
| 단계 잠금 | 사용자가 수정한 섹션을 다음 전체 생성에서 보호 |

`다시 생성`은 전체 단계 재실행이 아니라 현재 선택한 단계 또는 실패한 단계 재실행이 기본이다. 전체 재생성은 더보기 메뉴에서 제공한다.

### 6.8 톤, 독자, 템플릿, 출력 형식

| 설정 | 이미지 표시/요구사항 | 생성 반영 |
| --- | --- | --- |
| 글 톤 | 전문적, 간결함, 친근함, 설명형 | 문체, 문장 길이, 전문 용어 사용량 |
| 대상 독자 | 제품 기획자, UX 디자이너, 개발자 | 배경 설명 수준, 비교 축, 추천 표현 |
| 템플릿 | 템플릿 불러오기, 우측 설정 확장 | 섹션 구조, 필수 표/체크리스트, 메타 필드 |
| 출력 형식 | 문서 저장 드롭다운 또는 설정 | document, PDF, DOCX, Markdown, HTML, 공유 링크 |

템플릿 예시는 다음을 지원한다.

| 템플릿 | 기본 섹션 |
| --- | --- |
| UX 리포트 | 개요, 사용자 문제, 핵심 인사이트, 비교 분석, 추천 방향, 다음 할 일 |
| 리서치 브리프 | 배경, 핵심 질문, 발견, 근거, 결론, 리스크 |
| 의사결정 메모 | 결정 필요 사항, 옵션, 장단점, 추천, 미해결 질문 |
| 경쟁사 비교 | 비교 대상, 비교 축, 표, 차별점, 가격/기능, 추천 |
| 회의 보고서 | 목적, 논의 내용, 결정, 액션 아이템, 후속 일정 |

### 6.9 인용 커버리지

인용 커버리지는 “본문 중 근거가 연결된 문장의 비율”이다. 이미지에서는 `92%`, `본문 중 45개 문장에 근거가 연결되었습니다.`가 표시된다.

| 지표 | 정의 |
| --- | --- |
| citedSentenceCount | citation이 1개 이상 연결된 문장 수 |
| totalClaimSentenceCount | 사실 주장으로 분류된 문장 수 |
| coveragePercent | citedSentenceCount / totalClaimSentenceCount |
| weakCitationCount | citation은 있으나 source anchor가 주장과 약하게 연결된 문장 수 |
| uncitedClaimCount | 사실 주장인데 citation이 없는 문장 수 |

커버리지 계산에서 제목, 메타, 단순 연결어, 사용자의 주관적 제안 문장 일부는 제외할 수 있다. 제외 기준은 근거 검증 로그에 기록한다.

### 6.10 citation / 인용 삽입

| 기능 | 요구사항 |
| --- | --- |
| 자동 citation | 초안 생성 시 source chunk 또는 file page/cell anchor를 문장에 연결 |
| 수동 citation | 사용자가 선택 문장에 source picker로 인용 추가 |
| citation 번호 | 문서 내 표시 번호는 source 순서 또는 인용 등장 순서 기준 |
| source anchor | YouTube timestamp, 기사 문단, PDF page, XLSX sheet/cell, 메모 위치, 문서 block |
| citation hover | 원문 미리보기, source 제목, 발행일, 신뢰도, anchor 표시 |
| citation click | 우측 원문 패널 또는 source 상세로 이동 |
| citation 삭제 | 문장 citation 제거 후 coverage 재계산 |
| citation 재매핑 | source 해제/삭제 시 대체 source 추천 |

문장에 여러 source가 연결되면 `[1] [4]`처럼 병렬 표시한다. 하나의 문장이 source 간 상충 내용을 포함하면 conflict 상태가 우선 표시된다.

### 6.11 근거 검증

`근거 검증` CTA는 초안의 주장과 source anchor를 비교하는 품질 검증 작업이다.

| 검증 항목 | 판정 |
| --- | --- |
| citation 존재 여부 | cited, uncited |
| anchor 적합성 | strong, weak, unrelated |
| 수치 일치 | exact, rounded, mismatch |
| 날짜/버전 일치 | current, outdated, ambiguous |
| source 권한 | accessible, revoked, expired |
| hallucination 가능성 | supported, inferred, unsupported |

검증 결과는 문장 단위로 에디터에 표시한다. 사용자가 `수정 제안 적용`을 누르면 unsupported 문장은 더 약한 표현으로 바꾸거나 삭제한다. 자동 수정은 사용자의 확인 후 적용한다.

### 6.12 source conflict

이미지의 `소스 충돌 감지`는 source끼리 같은 주제에 대해 다른 값을 말할 때 표시된다.

| conflict 유형 | 예시 | 처리 |
| --- | --- | --- |
| 수치 불일치 | 자동화 범위 점수 3점 vs 5점 | source별 원문과 날짜 표시, 선택/병기/제외 |
| 날짜 불일치 | 출시일 또는 업데이트일 차이 | 최신 source 우선 제안 |
| 정의 차이 | “자동화 범위” 기준이 source마다 다름 | 정의를 본문에 명시하도록 제안 |
| 평가 관점 차이 | UX 리뷰와 개발자 블로그 평가가 다름 | 독자 관점에 맞춰 분리 서술 |
| 권한/신뢰도 차이 | 내 메모 vs 공식 문서 | 신뢰도 가중치 적용 |

conflict 상세는 다음 정보를 보여준다.

| 필드 | 설명 |
| --- | --- |
| conflictId | 충돌 식별자 |
| claim | 충돌이 발생한 주장 |
| sourceA/sourceB | 충돌 source와 anchor |
| values | 서로 다른 값 또는 표현 |
| detectedReason | 충돌 감지 이유 |
| recommendedAction | 병기, 최신 source 채택, 신뢰 source 채택, 문장 삭제, 추가 조사 |
| resolution | 사용자가 선택한 해결 방식 |

### 6.13 초안 생성 / 비교 / 추천 / 다음 할 일

| 생성 기능 | 결과물 | 사용자 제어 |
| --- | --- | --- |
| outline 생성 | 문서 섹션 구조 | 섹션 추가/삭제/순서 변경 |
| 초안 생성 | 본문 단락과 표 | tone, audience, template, source 범위 |
| 비교 생성 | 비교 표와 해석 | 비교 대상, 비교 축, 점수 방식 |
| 추천 생성 | 전략/설계 방향 | 보수적/공격적/중립 추천 관점 |
| 다음 할 일 생성 | 체크리스트와 task 후보 | 담당자, 기한, 주제 연결, task 생성 여부 |

비교 결과는 표와 서술을 함께 생성한다. 추천 방향은 source에서 직접 말한 결론과 AI가 추론한 결론을 구분해야 한다. AI 추론 문장은 citation 외에 `inference` 메타를 가진다.

### 6.14 문서 저장 / 승격

| 액션 | 결과 |
| --- | --- |
| draft autosave | reportBuilderSession에 임시 저장 |
| `문서로 저장` | document 생성 또는 기존 document 새 version 저장 |
| `주제에 저장` | topic 산출물 목록에 document 연결 |
| `기억으로 저장` | 리포트의 결정/선호/요약을 memory 후보로 추출 |
| `파일로 내보내기` | PDF/DOCX/Markdown/HTML file_asset 생성 |
| `할 일로 내보내기` | 체크리스트 항목을 task로 생성 |
| `맡긴 일로 전환` | 긴 검증/추가 조사 run을 delegated work로 생성 |

저장 시 document는 selectedSource snapshot을 보관한다. 나중에 source 원문이 바뀌거나 삭제되어도 당시 리포트가 어떤 근거로 생성됐는지 재현할 수 있어야 한다.

### 6.15 하단 진행률

| 요소 | 이미지 표시 | 기능 |
| --- | --- | --- |
| 제목 | `리포트 생성 진행률` | 현재 run 진행 상태 |
| 진행 바 | 68% | 전체 생성 pipeline 진행률 |
| 현재 상태 | `분석 및 초안 생성 중...` | 현재 실행 중인 단계 설명 |
| 단계 1 | `요약 생성 완료`, `6개 소스 분석 완료` | source 분석 완료 |
| 단계 2 | `초안 생성 중`, `문서 구조 및 내용 구성 중` | draft 생성 진행 |
| 단계 3 | `검토 대기`, `근거 검증 후 최종본 생성` | 검증 대기 |

진행률은 source 분석, outline 생성, draft 생성, citation 연결, conflict 감지, 검증 대기 단계의 가중 평균으로 계산한다. run이 실패하면 해당 단계에 실패 상태와 재시도 CTA를 표시한다.

## 7. 스크랩 / 기억 / 파일 / 메모 / 문서 source 선택 상세

### 7.1 공통 선택 규칙

| 규칙 | 요구사항 |
| --- | --- |
| 최대 선택 수 | 기본 20개. 초과 시 추가 차단 |
| 중복 방지 | 같은 canonicalUrl, fileHash, documentId는 중복 경고 |
| 권한 확인 | source별 read permission 확인 후 생성 포함 |
| 처리 상태 확인 | extraction 미완료 source는 요약 기반 제한 사용 또는 처리 완료 대기 |
| 신뢰도 표시 | 공식 문서, 사용자 메모, 외부 블로그 등 신뢰도 힌트 표시 |
| 날짜 표시 | 최신성 판단이 필요한 source는 발행일/수정일 표시 |
| topic 일치 | 현재 topic과 연결되지 않은 source는 외부 source 표시 |

### 7.2 유형별 선택 요구사항

| 유형 | 선택 시 필요한 정보 | citation anchor |
| --- | --- | --- |
| YouTube 스크랩 | 제목, 채널, 썸네일, 영상 길이, 업로드일, transcript 상태 | timestamp range |
| 기사/블로그 | 제목, 출처, 발행일, 원문 URL, 본문 추출 상태 | paragraph offset |
| PDF | 파일명, 크기, 페이지 수, 추출 상태 | page number, bounding box |
| XLSX/CSV | 파일명, sheet/table, 행/열 정보 | sheet, cell range |
| 내 메모 | 작성자, 작성일, 태그, 원문 | note block offset |
| 기억 | memory type, confidence, 원 근거 | memoryId, supporting source |
| 기존 문서 | document title, version, 검증 상태 | blockId, citationId |

### 7.3 source 선택 결과 반영

source 선택이 변경되면 다음 값이 갱신된다.

| 갱신 대상 | 처리 |
| --- | --- |
| source count | 좌측 선택 수와 문서 메타의 소스 수 갱신 |
| source chip | 본문 하단 출처 칩 갱신 |
| generation context | 다음 AI 생성 run의 입력 source scope 갱신 |
| citation status | 제거된 source citation을 missing으로 표시 |
| coverage | 인용 커버리지 재계산 |
| conflict | 신규/해소 conflict 재계산 |
| save snapshot | 저장 시 source snapshot 갱신 |

## 8. 데이터 필드 / API 힌트

### 8.1 주요 객체

| 객체 | 필드 |
| --- | --- |
| `report_builder_session` | id, userId, topicId, documentId, selectedSourceIds, templateId, tone, audienceIds, outputFormat, status, progressPercent, createdAt, updatedAt |
| `document` | id, title, bodyBlocks, plainText, topicId, authorId, status, version, sourceSnapshotIds, citationCoverage, createdAt, updatedAt |
| `document_block` | id, documentId, type, order, content, plainText, citationIds, generationStepId, locked |
| `source` | id, sourceType, provider, title, originUrl, summary, extractedTextStatus, metadata, confidence, createdAt |
| `file_asset` | id, filename, mimeType, size, extractionStatus, storageKey, pageCount, sourceId |
| `memory` | id, memoryType, content, confidence, supportingSourceIds, topicIds, updatedAt |
| `citation` | id, documentId, blockId, sentenceId, sourceId, sourceAnchorId, labelNumber, strength, verificationStatus |
| `source_anchor` | id, sourceId, anchorType, locator, textSnippet, startOffset, endOffset, pageNumber, timestampStart, timestampEnd, cellRange |
| `report_generation_run` | id, sessionId, status, currentStep, progressPercent, model, tokenUsage, startedAt, completedAt, errorCode |
| `generation_step` | id, runId, stepType, status, inputSourceIds, outputBlockIds, variantId, startedAt, completedAt |
| `source_conflict` | id, sessionId, claim, sourceAnchorIds, conflictType, severity, recommendedAction, resolution, status |
| `verification_result` | id, documentId, citationId, sentenceId, status, reason, suggestedFix, checkedAt |

### 8.2 API 힌트

| API | 목적 |
| --- | --- |
| `GET /api/report-builder/sessions/{sessionId}` | 세션, 선택 source, document draft, run 상태 조회 |
| `POST /api/report-builder/sessions` | 새 리포트 빌더 세션 생성 |
| `PATCH /api/report-builder/sessions/{sessionId}` | topic, selectedSourceIds, tone, audience, template, outputFormat 변경 |
| `GET /api/sources/search` | source picker 검색 |
| `POST /api/report-builder/sessions/{sessionId}/runs` | outline/draft/compare/recommend/todo 생성 run 시작 |
| `POST /api/report-builder/runs/{runId}/cancel` | 생성 취소 |
| `GET /api/report-builder/runs/{runId}/events` | 진행률 stream 또는 polling |
| `POST /api/documents/{documentId}/citations` | 수동 citation 추가 |
| `DELETE /api/documents/{documentId}/citations/{citationId}` | citation 삭제 |
| `POST /api/documents/{documentId}/verify` | 근거 검증 실행 |
| `GET /api/report-builder/sessions/{sessionId}/conflicts` | source conflict 목록 조회 |
| `PATCH /api/source-conflicts/{conflictId}` | conflict resolution 저장 |
| `POST /api/report-builder/sessions/{sessionId}/save-document` | draft를 document로 저장 |
| `POST /api/documents/{documentId}/export` | PDF/DOCX/Markdown/HTML 생성 |
| `POST /api/documents/{documentId}/promote/memories` | 리포트 내용을 memory 후보로 승격 |
| `POST /api/documents/{documentId}/promote/tasks` | 다음 할 일 체크리스트를 task로 승격 |

### 8.3 생성 요청 payload 예시

```json
{
  "sessionId": "rbs_123",
  "stepTypes": ["outline", "insights", "comparison", "recommendations", "next_actions"],
  "selectedSourceIds": ["src_youtube_1", "src_article_2", "src_blog_3", "src_pdf_4", "src_memo_5", "src_xlsx_6"],
  "topicId": "topic_ai_hub",
  "templateId": "ux_report",
  "tone": "professional",
  "audienceIds": ["product_manager", "ux_designer", "developer"],
  "outputFormat": "document",
  "preserveLockedBlocks": true,
  "citationRequired": true
}
```

### 8.4 상태값

| 상태 그룹 | 값 |
| --- | --- |
| session status | draft, generating, verification_pending, verified, saved, cancelled, failed |
| run status | queued, running, paused, completed, failed, cancelled |
| step status | waiting, running, completed, failed, skipped |
| document status | draft, generated, edited, verification_pending, verified, saved, exported |
| citation status | unverified, verified, weak, unsupported, conflict, missing_source |
| conflict status | open, resolved, ignored |

## 9. Edge Case

| 상황 | 기대 동작 |
| --- | --- |
| 선택 source가 0개 | 초안 생성/근거 검증 비활성화. source 추가 안내 |
| 선택 source가 20개 초과 | 추가 선택 차단. 현재 최대 선택 수와 이유 표시 |
| source 처리 중 | 생성 전 대기 옵션과 요약 기반 제한 사용 옵션 제공 |
| source 추출 실패 | 해당 source를 제외하거나 수동 텍스트 붙여넣기 제안 |
| source 권한 만료 | 잠금 상태 표시. 재인증 또는 제외 필요 |
| source 삭제됨 | 기존 document snapshot은 유지하되 새 검증에서는 missing_source 표시 |
| 같은 URL 중복 선택 | canonicalUrl 기준 중복 경고. 하나만 선택 제안 |
| citation 없는 주장 다수 | 인용 커버리지 낮음 경고. 저장은 가능하되 verified 상태 불가 |
| conflict가 unresolved | 문서 저장은 가능하되 `검토 필요` 배지 유지 |
| 사용자가 생성 중 본문 편집 | 편집 block은 locked 처리하고 AI 적용 시 충돌 확인 |
| 생성 run 실패 | 실패 단계, 원인, 재시도 CTA 표시. 이전 생성 결과 유지 |
| 네트워크 끊김 | autosave queue 유지. 복구 후 동기화 |
| 모델 응답 지연 | 하단 예상 완료 갱신. 맡긴 일로 전환 옵션 표시 |
| template 변경 중 본문 있음 | 덮어쓰기/구조만 적용/취소 선택 |
| tone 변경 후 기존 본문 있음 | 다음 생성부터 적용. 기존 본문 즉시 변경 안 함 |
| 표 셀 citation 누락 | 셀 단위 경고. 표 전체 coverage 계산에 반영 |
| 파일 표 데이터가 너무 큼 | sheet/range 선택 후 생성. 전체 파일 무조건 주입 금지 |
| 민감 파일 포함 | 권한과 민감도 경고. 외부 모델 사용 전 승인 필요 |
| output export 실패 | document 저장 상태는 유지하고 export만 재시도 |
| 문서 제목 없음 | 저장 전 제목 입력 요구 또는 source 기반 제목 자동 제안 |
| browser 탭 닫힘 | autosave draft 복원 |
| 여러 창에서 같은 session 편집 | 최신 저장 충돌 감지. 버전 비교 후 병합/분기 |

## 10. 수용 기준

### 10.1 source 선택

- 사용자는 스크랩, 기억, 파일, 메모, 문서 source를 하나의 picker에서 검색하고 선택할 수 있어야 한다.
- 선택한 source 수는 `n / 20` 형식으로 표시되어야 한다.
- source를 체크 해제하면 다음 생성 run에서 제외되어야 한다.
- source 변경 후 문서 하단 출처 칩, 문서 메타의 소스 수, 인용 커버리지, conflict 상태가 갱신되어야 한다.
- 접근 권한이 없는 source는 생성에 포함되지 않아야 한다.

### 10.2 생성 단계

- 사용자는 outline, 핵심 인사이트, 비교 분석, 추천 방향, 다음 할 일을 단계별로 생성할 수 있어야 한다.
- 각 단계는 waiting/running/completed/failed 상태를 표시해야 한다.
- 전체 초안 생성 중 하단 진행률과 현재 단계 설명이 표시되어야 한다.
- 실패한 단계는 전체 리포트를 버리지 않고 해당 단계만 재시도할 수 있어야 한다.
- 사용자가 잠근 block은 재생성 시 덮어쓰지 않아야 한다.

### 10.3 에디터

- 사용자는 제목, 본문, 목록, 체크리스트, 표, 링크, 이미지, 인용을 편집할 수 있어야 한다.
- 인용 삽입 버튼으로 선택 문장에 source citation을 수동 연결할 수 있어야 한다.
- 표 셀에도 citation을 연결할 수 있어야 한다.
- 미리보기 모드에서 편집 UI 없이 문서 읽기 상태를 확인할 수 있어야 한다.
- undo/redo는 사용자의 편집과 AI 적용 액션을 모두 다뤄야 한다.

### 10.4 citation / 검증

- 초안 생성 결과에는 가능한 모든 사실 주장 문장에 citation이 연결되어야 한다.
- 인용 커버리지는 퍼센트와 근거 연결 문장 수로 표시되어야 한다.
- `근거 검증` 실행 시 문장별 supported/weak/unsupported/conflict/missing_source 결과가 표시되어야 한다.
- unsupported 문장은 저장 전 검토 대상으로 표시되어야 한다.
- source conflict는 conflict 유형, 관련 source, 원문 anchor, 추천 해결 액션을 제공해야 한다.

### 10.5 톤 / 독자 / 템플릿 / 출력

- 사용자는 전문적, 간결함, 친근함, 설명형 톤을 선택할 수 있어야 한다.
- 사용자는 대상 독자를 선택하거나 복수 선택할 수 있어야 한다.
- 템플릿 불러오기는 본문이 있을 때 덮어쓰기 위험을 확인해야 한다.
- outputFormat은 최소 document, PDF, DOCX, Markdown을 지원해야 한다.
- tone/audience/template 변경은 다음 생성 run에 반영되어야 한다.

### 10.6 저장 / 승격

- `문서로 저장`은 document와 source snapshot, citations, conflicts, verification result를 함께 저장해야 한다.
- 저장된 document는 연결 topic의 산출물 목록에서 열 수 있어야 한다.
- 리포트의 다음 할 일 체크리스트는 task 후보로 승격할 수 있어야 한다.
- 리포트 요약이나 결정은 memory 후보로 승격할 수 있어야 한다.
- export 결과는 file_asset으로 등록되어 파일 화면에서 조회 가능해야 한다.

## 11. 오픈 질문

| 질문 | 현재 제안 |
| --- | --- |
| source 최대 선택 수 20개는 고정인가, 플랜/모델별 가변인가 | 기본 20개, 고급 플랜에서 상향 가능 |
| citation 번호는 source 목록 순서인가, 문서 등장 순서인가 | 문서 등장 순서를 기본으로 하고 source 칩은 같은 번호 유지 |
| 인용 커버리지 계산에서 AI의 추천/추론 문장을 포함할지 | 사실 주장만 포함. 추론 문장은 별도 inference 표시 |
| conflict 미해결 상태에서도 저장 가능한가 | 저장 가능. verified 상태와 외부 export는 경고 |
| `문서로 저장` 후 현재 화면을 유지할지 문서 상세로 이동할지 | 기본은 현재 화면 유지, 토스트에서 문서 열기 제공 |
| 기존 document를 source로 쓸 때 원 citation까지 계승할지 | 계승하되 transitive citation임을 표시 |
| 템플릿 변경 시 기존 본문 일부를 자동 재배치할지 | MVP는 구조만 적용/전체 재생성 중 선택. 자동 재배치는 후순위 |
| outputFormat의 HTML/공유 링크를 MVP에 포함할지 | document/PDF/DOCX/Markdown 우선 |
| source conflict의 신뢰도 가중치는 누가 설정하는가 | 시스템 기본값과 사용자의 source 우선순위 설정 병행 |
| 여러 사용자가 같은 리포트를 공동 편집할지 | MVP 제외. 개인 draft와 버전 저장 우선 |

## 12. 자체 리뷰 / 엣지케이스 점검

사용자 요청상 nested subagent 리뷰를 시도했으나 실행 결과가 반환되지 않아 자체 점검으로 대체한다.

| 점검 항목 | 결과 |
| --- | --- |
| subagent 시도 | `codex-subagent` read-only 리뷰 실행 결과 `no agent_message found`로 실패. 파일 수정 없음 |
| 이미지 기능 누락 여부 | 좌측 source 선택, 중앙 리치 에디터, 우측 생성/검증 패널, 하단 진행률, 저장 CTA를 반영 |
| 필수 섹션 포함 여부 | 화면 목적, 정보 구조, 진입/종료/전환, 핵심 시나리오, 컴포넌트 상세, source 선택, 에디터, 생성 단계, citation/검증/conflict, 톤/독자/템플릿/출력, 저장/승격, edge case, 데이터/API, 수용 기준, 오픈 질문 포함 |
| 값 변경 후 읽는 곳 | selectedSourceIds 변경 시 문서 메타, 출처 칩, citation, coverage, conflict, save snapshot 갱신 필요를 명시 |
| 이름 충돌 | source, memory, file_asset, document, citation, artifact의 역할을 구분 |
| BE-FE prop 불일치 위험 | API 힌트에 sessionId, selectedSourceIds, topicId, templateId, tone, audienceIds, outputFormat 등 주요 prop 이름 제안 |
| 새 목록 key/ID | source, citation, block, conflict, generation_step에 id 필드 명시 |
| 보안/권한 | source 권한 만료, 민감 파일, 외부 모델 사용 전 승인 필요 edge case 포함 |
| 저장/버전 | document snapshot, version, autosave, export file_asset 반영 |
