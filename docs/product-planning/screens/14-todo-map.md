# 할 일 맵 / Todo Map 화면 상세 기획

## 1. 화면 목적

`할 일 맵`은 큰 목표, 중간 task, 세부 subtask, task 간 dependency를 markmap 형태로 펼쳐서 작업의 구조와 우선순위를 한눈에 파악하는 고급 작업면이다. 일반 `할 일` 화면이 오늘 처리할 항목과 상태별 보드를 관리한다면, `할 일 맵`은 “무엇이 무엇을 막고 있는지”, “큰 목표의 어느 가지가 지연되는지”, “AI에게 맡길 단위가 어디인지”를 시각적으로 판단하게 한다.

이 화면의 핵심 목적은 다음이다.

| 목적 | 설명 |
| --- | --- |
| 구조 파악 | 루트 목표에서 task, subtask까지 계층을 펼쳐 전체 작업 범위를 이해한다. |
| 우선순위 판단 | 색상, 진행률, 마감일, 연결 수, 의존성 표시로 먼저 볼 가지를 찾는다. |
| 의존성 관리 | 선행 task가 후행 task를 막는 관계를 dashed edge와 `의존` 배지로 표시한다. |
| 실행 전환 | 선택 노드에서 체크리스트, 대화, 자료, 일정, run을 확인하고 `AI에게 맡기기`로 실행을 만든다. |
| 보기 통일 | 목록/보드/맵은 같은 `task` 데이터를 다른 view로 표현하고, 한 view의 수정이 다른 view에 즉시 반영된다. |

PRD 기준으로 `할 일 맵`은 `task`, `checklist`, `dependency`, `topic`, `conversation`, `source`, `file_asset`, `calendar_event`, `run`, `schedule`, `ai_suggestion`, `audit_log`가 만나는 시각화 화면이다. `맡긴 일`은 실제 agent 실행 기록이고, `할 일 맵`은 사용자가 실행 항목을 구조화하고 일부를 run으로 승격시키는 준비면이다.

## 2. 화면 범위와 전제

- 이 문서는 첨부 이미지와 `/docs/personal-agent-platform-prd.md` 기준의 PC 웹 화면 상세다.
- 소유 파일은 이 문서 하나이며, 다른 화면 문서나 PRD는 수정하지 않는다.
- 화면명은 한국어 `할 일 맵`, 내부 view 이름은 `Todo Map` 또는 `map`을 사용한다.
- 기본 route 후보는 `/todos?view=map` 또는 `/todos/map`이다. 최종 라우팅은 앱 구조에 맞춰 결정한다.
- 기본 데이터는 `할 일 / Todo Board` 화면과 같은 `task` 데이터다. 맵 전용 별도 task 모델을 만들지 않는다.
- 이미지에 표시된 날짜와 예시 문구는 레퍼런스다. 구현 기준은 PRD의 상태 모델과 이 문서의 필드 정의를 우선한다.

## 3. 이미지 재분석 기반 기능 추출

첨부 이미지에서 확인되는 `할 일 맵` 화면 요소는 다음이다.

| 위치 | 화면 요소 | 기능 요구사항 |
| --- | --- | --- |
| 좌측 글로벌 내비 | `할 일` 메뉴 활성 상태 | 파란색 아이콘과 강조 배경으로 현재 화면 표시 |
| 중앙 헤더 | `할 일 맵`, `작업을 시각적으로 보고, 우선순위와 의존성을 한눈에 파악하세요.` | 화면 목적과 view 성격 안내 |
| 상단 view 전환 | `목록`, `보드`, `맵` segmented control | 같은 task 데이터를 목록/보드/맵으로 전환. 이미지에서는 `맵` 활성 |
| 상단 보조 액션 | 공유/내보내기 아이콘, 더보기 | 현재 view 공유, 이미지/JSON 내보내기, 표시 설정, 도움말 |
| 좌측 필터 패널 | 필터 제목, `초기화` | 전체 필터 초기화 |
| 주제 필터 | 전체 주제 드롭다운, 주제별 색상과 카운트, `+ 주제 추가` | topic 범위 선택과 주제 생성 |
| 우선순위 필터 | 높음 12, 중간 18, 낮음 16 | priority별 노드 표시/강조 |
| 상태 필터 | 진행 중 22, 예정 10, 완료 8, 보류 6 | status별 노드 표시/숨김 |
| 저장된 뷰 | `AI 허브 MVP 로드맵`, `이번 주 집중 과제`, `여행 준비 체크리스트`, `투자 리서치 파이프라인`, `+ 뷰 저장` | 필터, 레이아웃, 줌, 중심 노드 저장 |
| 중앙 캔버스 | root 노드 `AI 허브 만들기` | 목표 단위 루트. 진행률, 상태, 마감일, 우선순위, 연결 수, 자료 수 표시 |
| 중간 task 노드 | `UX 기획`, `데이터 모델`, `에이전트 빌더`, `스크랩 리포트`, `배포`, `검증` | 가지별 task. 색상은 주제/분류 또는 branch color |
| 세부 subtask 노드 | 사용자 리서치, 정보 구조 설계, 와이어프레임 작성 등 | 하위 실행 항목. 체크 원형, 진행률, 마감일 표시 |
| 의존성 edge | dashed curved arrow, `의존` 배지 | 계층과 별개인 선후행 관계 표시 |
| 캔버스 컨트롤 | 확대, 축소, fit, 잠금 | zoom/pan, 화면 맞춤, 편집 잠금 |
| 미니맵 | 좌하단 작은 전체 맵 | 현재 viewport와 전체 구조 위치 표시 |
| 하단 도구막대 | `자동 정렬`, `방사형`, `트리형`, `마인드맵`, 범례 | 레이아웃 전환과 색상 의미 표시 |
| 우측 상세 패널 | 선택 노드 `UX 기획` | 선택 task의 메타, 탭, 체크리스트, 연결 대화/자료/일정/run 표시 |
| 상세 헤더 | 상태 dot, 제목, 진행 중 배지, 즐겨찾기, 더보기 | task 상태와 주요 액션 |
| 상세 탭 | 개요, 작업, 의존성 2, 활동 기록 | 선택 노드의 다른 정보면 전환 |
| 상세 개요 | 설명, 연결 주제, 담당자 | task 목적과 소유 정보 |
| 체크리스트 | 2/4, progress bar 40% | 하위 checklist 완료율 표시 |
| 연결된 대화 | 2개, 모두 보기 | conversation/message 연결 |
| 연결된 자료 | 4개, 모두 보기 | PDF, Figma, Excel, ZIP 등 source/file 연결 |
| 일정 | 5월 28일 (수) 마감, 캘린더에서 보기 | deadline/calendar_event 연결 |
| 하단 CTA | `AI에게 맡기기`, 더보기 | task 기반 run 생성 또는 보조 액션 |

이미지에 보이는 예시 노드는 다음이다.

| 계층 | 노드 | 진행률 | 상태 | 마감 | 우선순위 | 연결/자료 |
| --- | --- | ---: | --- | --- | --- | --- |
| root | AI 허브 만들기 | 55% | 진행 중 | 6월 30일 (일) | 높음 | 연결 28 · 자료 14 |
| task | UX 기획 | 80% | 진행 중 | 5월 28일 (수) | 높음 | 연결 6 · 자료 4 |
| task | 데이터 모델 | 65% | 진행 중 | 6월 5일 (목) | 중간 | 연결 5 · 자료 3 |
| task | 에이전트 빌더 | 40% | 진행 중 | 6월 20일 (금) | 높음 | 연결 7 · 자료 2 |
| task | 스크랩 리포트 | 50% | 진행 중 | 6월 15일 (일) | 중간 | 연결 4 · 자료 3 |
| task | 배포 | 20% | 진행 중 | 6월 28일 (토) | 높음 | 연결 3 · 자료 2 |
| task | 검증 | 10% | 진행 중 | 6월 30일 (일) | 중간 | 연결 3 · 자료 표시 |

## 4. 정보 구조

### 4.1 전체 레이아웃

```text
좌측 글로벌 내비게이션
  └─ 할 일 메뉴 활성화

중앙 작업 영역
  ├─ 헤더: 제목 / 설명 / view 전환 / 공유 / 더보기
  ├─ 좌측 필터 패널
  │   ├─ 주제 필터
  │   ├─ 우선순위 필터
  │   ├─ 상태 필터
  │   └─ 저장된 뷰
  ├─ 맵 캔버스
  │   ├─ root task
  │   ├─ task node
  │   ├─ subtask node
  │   ├─ dependency edge
  │   ├─ zoom/fit/lock control
  │   └─ minimap
  └─ 하단 도구막대
      ├─ 자동 정렬
      ├─ 레이아웃 모드
      └─ 범례

우측 상세 패널
  ├─ 선택 노드 헤더
  ├─ 탭: 개요 / 작업 / 의존성 / 활동 기록
  ├─ 체크리스트
  ├─ 연결된 대화
  ├─ 연결된 자료
  ├─ 일정
  └─ AI에게 맡기기 / 더보기
```

### 4.2 좌측 글로벌 내비게이션

좌측 내비게이션은 공통 셸이다. 현재 화면에서는 `할 일`이 활성 상태다.

| 영역 | 항목 | 동작 |
| --- | --- | --- |
| 상단 | 프로필 이미지, `내 AI 허브`, 드롭다운, 알림 | 허브/계정 전환, 알림 센터 진입 |
| 주요 메뉴 | 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결 | 상위 화면 이동 |
| 보조 메뉴 | 스크랩, 캘린더, 할 일, 파일 | 관련 관리 화면 이동. 현재 `할 일` 활성 |
| 하단 | 설정, 도움말 | 전역 설정과 도움말 이동 |
| 계정 카드 | `Minho`, `프로 플랜`, 드롭다운 | 계정, 플랜, 사용량 메뉴 표시 |

허브가 바뀌면 task, topic, dependency, source, file, run, saved view 범위를 해당 허브 기준으로 재조회한다.

### 4.3 중앙 헤더

| 요소 | 기능 |
| --- | --- |
| 제목 `할 일 맵` | 현재 view가 할 일의 시각화 모드임을 표시 |
| 설명 | 작업 구조, 우선순위, 의존성을 보는 화면임을 안내 |
| `목록` | 같은 task 데이터를 목록 view로 전환 |
| `보드` | 같은 task 데이터를 칸반 보드 view로 전환 |
| `맵` | 현재 view. 활성 상태는 파란색 강조 |
| 공유/내보내기 | 현재 saved view 또는 현재 캔버스 상태 공유, 이미지/PDF/JSON 내보내기 |
| 더보기 | 표시 설정, 완료 노드 숨김, 의존성만 보기, 단축키 도움말, 삭제된 노드 보기 |

view 전환은 같은 필터와 선택 task를 가능한 한 유지한다. 선택 task가 전환한 view의 결과에 없으면 선택을 해제하고 첫 visible item을 선택한다.

### 4.4 좌측 필터 패널

필터 패널은 캔버스의 노드 표시 범위를 줄이거나 특정 그룹을 강조한다.

| 섹션 | 구성 | 동작 |
| --- | --- | --- |
| 필터 헤더 | `필터`, `초기화` | 현재 view의 필터를 기본값으로 되돌림 |
| 주제 | 전체 주제 드롭다운, topic 목록, 카운트, `+ 주제 추가` | topic별 노드 필터. 색상 dot은 맵 branch 색상과 연결 |
| 우선순위 | 높음, 중간, 낮음 카운트 | priority별 노드 필터. 다중 선택 가능 |
| 상태 | 진행 중, 예정, 완료, 보류 체크박스 | status별 노드 표시/숨김. 이미지에서는 진행 중/예정 선택 |
| 저장된 뷰 | saved view 목록, `+ 뷰 저장` | 필터, 정렬, 레이아웃, 줌, 중심 노드 저장/복원 |

필터는 기본적으로 노드를 숨긴다. 단, 선택 노드의 조상 노드는 맥락 유지를 위해 흐리게 표시할 수 있다. 의존성 edge의 양 끝 중 하나가 필터로 숨겨지면 edge는 숨김 처리하고, 선택 노드 상세의 의존성 탭에는 “필터로 숨겨진 의존 노드”를 표시한다.

### 4.5 맵 캔버스

캔버스는 task 계층과 dependency를 시각화하는 핵심 영역이다.

| 요소 | 기능 |
| --- | --- |
| root 노드 | 목표 또는 saved view의 중심 task. 예: `AI 허브 만들기` |
| task 노드 | 큰 작업 단위. 제목, 진행률, 상태, 마감일, 우선순위, 연결 수, 자료 수 표시 |
| subtask 노드 | task 아래 실행 항목. 체크 상태, 진행률, 마감일 표시 |
| 계층 edge | parent-child 관계. branch 색상과 같은 실선으로 표시 |
| dependency edge | 선후행 관계. dashed curved arrow와 `의존` 배지로 표시 |
| 선택 상태 | 선택 노드는 두꺼운 테두리와 우측 상세 패널 연동 |
| hover 상태 | 연결 edge와 인접 노드 강조, 빠른 액션 표시 |
| 접기/펼치기 | 하위 노드가 많은 task는 접고 카운트 배지 표시 |
| drag pan | 빈 캔버스 드래그로 이동 |
| node drag | 편집 모드에서 노드 위치 조정 또는 parent 변경 후보 표시 |

계층 edge와 dependency edge는 의미가 다르다. 계층 edge는 “상위 목표의 구성 요소”이고, dependency edge는 “이 task가 끝나야 저 task가 가능함”이다. 둘을 같은 관계로 저장하지 않는다.

### 4.6 우측 상세 패널

우측 상세 패널은 선택 노드의 상세 정보와 실행 액션을 제공한다. 이미지에서는 `UX 기획` task가 선택되어 있다.

| 섹션 | 표시/기능 |
| --- | --- |
| 헤더 | 색상 dot, 제목, 상태 배지, 즐겨찾기, 더보기 |
| 요약 메타 | 진행률, 완료 문구, 마감일 |
| 탭 | 개요, 작업, 의존성, 활동 기록 |
| 개요 | 설명, 연결 주제, 담당자 |
| 체크리스트 | 완료 수, progress bar, 항목 체크 |
| 연결된 대화 | 관련 conversation/message 목록 |
| 연결된 자료 | 관련 source/file/artifact 목록 |
| 일정 | deadline 또는 calendar_event 표시, 캘린더 이동 |
| CTA | `AI에게 맡기기`, 더보기 |

상세 패널은 캔버스 선택을 바꿔도 닫히지 않는다. 닫기 액션이 별도 제공되는 경우 중앙 캔버스 폭을 확장한다.

### 4.7 하단 도구막대와 미니맵

| 요소 | 기능 |
| --- | --- |
| 확대/축소 | 캔버스 scale 조정 |
| fit | visible node가 화면에 맞도록 viewport 조정 |
| 잠금 | 편집 잠금. 잠금 상태에서는 node drag, edge 추가, 삭제 비활성 |
| 미니맵 | 전체 맵과 현재 viewport 표시. 클릭/드래그로 빠른 이동 |
| `자동 정렬` | 현재 visible node를 선택 layout 기준으로 재배치 |
| `방사형` | root 중심으로 branch를 방사형 배치 |
| `트리형` | 좌에서 우 또는 상에서 하로 계층 배치 |
| `마인드맵` | root 좌우 또는 한쪽으로 가지를 뻗는 markmap형 배치 |
| 범례 | 빨강 높음, 주황 중간, 초록 낮음 등 priority 색상 설명 |

자동 정렬은 데이터 관계를 바꾸지 않는다. 노드 좌표와 layout metadata만 갱신한다.

## 5. 진입 / 종료 / 전환 동선

### 5.1 진입 동선

| 진입점 | 랜딩 상태 |
| --- | --- |
| 좌측 내비 `할 일` 클릭 후 `맵` 선택 | 마지막 map view 상태 복원. 없으면 최근 saved view 또는 전체 task root |
| `할 일` 보드/목록에서 view `맵` 클릭 | 기존 탭, 필터, 선택 task를 유지하고 map으로 전환 |
| 주제 화면의 작업/후속 액션에서 `맵으로 보기` | 해당 topic 필터 적용, topic root 또는 대표 목표 선택 |
| 채팅에서 “이 작업 구조를 맵으로 보여줘” | 대화 결과로 task/subtask 후보 생성 후 map preview 또는 화면 진입 |
| 맡긴 일 run 결과에서 후속 task 생성 | 생성된 task가 속한 root를 중심으로 map 진입 |
| 캘린더 일정에서 task 클릭 | deadline/scheduledAt 연결 task 선택, 일정 관련 edge 강조 |
| 저장된 뷰 딥링크 | saved view의 필터, 레이아웃, 줌, 중심 노드 복원 |
| 알림에서 dependency 지연 클릭 | 막힌 task와 선행 task edge를 강조한 상태로 진입 |

### 5.2 종료 동선

| 종료 액션 | 결과 |
| --- | --- |
| `목록` 또는 `보드` 전환 | 동일 task 데이터로 view만 변경. 선택 task와 필터 유지 |
| 다른 좌측 내비 클릭 | 현재 saved view가 아니어도 세션 범위의 viewport, 필터, 선택 노드 저장 |
| 상세 패널의 연결 대화 클릭 | 해당 conversation으로 이동하고 원본 message 강조 |
| 상세 패널의 연결 자료 클릭 | 파일/스크랩/기억 상세로 이동 |
| `캘린더에서 보기` 클릭 | 연결 calendar_event 또는 deadline 날짜로 캘린더 이동 |
| 연결 run 클릭 | 맡긴 일 상세로 이동 |
| 브라우저 뒤로가기 | 직전 view, 직전 선택 노드, 직전 saved view 상태 복원 |

### 5.3 화면 내 전환

| 전환 | 기대 동작 |
| --- | --- |
| topic 필터 변경 | visible node와 branch 카운트 재계산, 선택 노드가 숨겨지면 첫 visible node 선택 |
| priority/status 필터 변경 | 노드 표시/숨김, 범례와 필터 카운트 갱신 |
| saved view 선택 | 저장된 필터, 레이아웃, 중심 노드, 줌 복원 |
| `+ 뷰 저장` | 현재 조건을 이름, 설명, 공유 범위와 함께 저장 |
| 노드 클릭 | 우측 상세 패널에 선택 노드 표시 |
| 노드 더블클릭 | 하위 노드 접기/펼치기 |
| edge 클릭 | dependency 상세 또는 관계 편집 팝오버 표시 |
| 미니맵 클릭 | 해당 위치로 viewport 이동 |
| 자동 정렬 클릭 | 현재 layout mode 기준으로 재배치 |
| layout mode 변경 | 좌표 재계산. 수동 좌표가 있으면 덮어쓰기 확인 |
| 노드 상태 변경 | 진행률, 색상, 필터 카운트, 목록/보드 view 동시 갱신 |

## 6. 핵심 시나리오

### 6.1 프로젝트형 할 일을 구조로 파악

1. 사용자가 `할 일 맵`에 진입한다.
2. 기본 saved view `AI 허브 MVP 로드맵`이 열린다.
3. root `AI 허브 만들기` 아래 `UX 기획`, `데이터 모델`, `에이전트 빌더`, `스크랩 리포트`, `배포`, `검증` branch를 확인한다.
4. 사용자는 branch 색상과 진행률로 어느 영역이 늦는지 비교한다.
5. `UX 기획` 노드를 선택해 우측 상세 패널에서 체크리스트와 연결 자료를 확인한다.

### 6.2 선행 작업 때문에 막힌 후속 작업 확인

1. 사용자가 캔버스에서 dashed dependency edge와 `의존` 배지를 확인한다.
2. `와이어프레임 작성`이 `정보 구조 설계` 이후 가능하다는 관계를 본다.
3. 후행 노드를 클릭하면 의존성 탭에 선행 task 상태, 담당자, 마감일이 표시된다.
4. 선행 task가 완료되지 않았으면 후행 task의 시작 또는 `AI에게 맡기기`를 제한하거나 경고한다.
5. 선행 task가 완료되면 후행 task의 blocked 상태가 자동 해제되거나 해제 제안을 표시한다.

### 6.3 목록/보드/맵을 오가며 같은 task 관리

1. 사용자가 맵에서 `에이전트 UI 개발` 노드를 선택한다.
2. 상단에서 `보드`를 클릭한다.
3. 같은 task 카드가 보드에서 선택된 상태로 표시된다.
4. 보드에서 상태를 `진행 중`으로 바꾸면 맵의 노드 상태와 진행률이 갱신된다.
5. 다시 `맵`으로 돌아오면 기존 zoom과 중심 노드가 복원된다.

### 6.4 필터와 저장된 뷰로 집중 영역 만들기

1. 사용자가 주제를 `AI 허브 만들기`로 제한한다.
2. 상태는 `진행 중`, `예정`만 선택하고 완료/보류는 숨긴다.
3. 우선순위는 `높음`과 `중간`만 표시한다.
4. 자동 정렬 후 `+ 뷰 저장`을 눌러 `이번 주 집중 과제`로 저장한다.
5. 이후 saved view를 클릭하면 같은 필터와 레이아웃이 즉시 복원된다.

### 6.5 선택 노드를 AI에게 맡기기

1. 사용자가 `UX 기획` 노드를 선택한다.
2. 상세 패널에서 체크리스트, 연결 대화, PDF/Figma/Excel/ZIP 자료를 확인한다.
3. `AI에게 맡기기`를 클릭한다.
4. 시스템은 task 제목, 설명, 체크리스트, 연결 자료, 의존성 상태, 마감일을 run 입력값으로 변환한다.
5. 외부 파일 접근, 비용, 일정 등록, 쓰기 권한을 검사한다.
6. 승인 필요 조건이 없거나 승인 완료 시 run을 생성하고 task에 `delegatedRunId`를 연결한다.
7. run 진행률은 선택 노드 진행률 또는 별도 run 배지로 반영된다.

### 6.6 markmap에서 새 subtask 추가

1. 사용자가 `UX 기획` 노드의 빠른 액션에서 하위 task 추가를 선택한다.
2. 제목을 입력하고 기본 마감일, 우선순위, 담당자를 설정한다.
3. 새 subtask는 `UX 기획`의 child로 생성되고 현재 layout에 맞게 배치된다.
4. 목록/보드 view에도 같은 task가 나타난다.
5. 추가 이벤트는 활동 기록과 `task.dependency_changed` 또는 `task.updated` 이벤트로 남는다.

### 6.7 dependency edge 편집

1. 사용자가 편집 모드에서 `정보 구조 설계`에서 `와이어프레임 작성`으로 edge를 만든다.
2. 시스템은 순환 의존성 여부와 권한을 검사한다.
3. 문제가 없으면 dependency를 저장하고 dashed edge를 표시한다.
4. 문제가 있으면 저장을 막고 순환 경로를 강조한다.
5. 의존성 탭과 관련 task 활동 기록에 변경 이력이 남는다.

## 7. 컴포넌트별 상세 기능

### 7.1 View 전환 컨트롤

| 기능 | 상세 |
| --- | --- |
| 표시 | `목록`, `보드`, `맵` 3개 segmented control |
| 활성 상태 | 현재 `맵`은 파란색 배경과 흰색 텍스트로 표시 |
| 데이터 유지 | view만 바꾸고 task/filter/selection은 유지 |
| URL 반영 | `view=map` 같은 query 또는 route state로 deep link 가능 |
| 접근성 | 각 버튼은 현재 선택 상태를 screen reader에 제공 |

### 7.2 필터 패널

| 기능 | 상세 |
| --- | --- |
| 접기/펼치기 | 넓은 캔버스가 필요하면 필터 패널을 접을 수 있음 |
| 초기화 | topic, priority, status, search, saved view override를 기본값으로 초기화 |
| topic 추가 | `+ 주제 추가`로 새 topic 생성 후 현재 root에 연결 가능 |
| 카운트 | 필터 적용 전 전체 카운트와 적용 후 visible 카운트 정책을 명확히 표시 |
| 상태 체크 | 체크박스 변경 시 즉시 캔버스 재계산 |
| 저장된 뷰 | 현재 사용자 또는 허브 범위 saved view 표시 |

### 7.3 Node 카드

| 요소 | 표시/동작 |
| --- | --- |
| 제목 | task 제목. 길면 1줄 말줄임, hover 또는 상세에서 전체 표시 |
| 진행률 | percent와 progress bar 또는 텍스트 표시 |
| 상태 | 진행 중, 예정, 완료, 보류, 막힘, 승인 대기 배지 |
| 마감일 | deadlineAt 기준. 날짜만 있으면 날짜, 시간이 있으면 시간 포함 |
| priority | 빨강/주황/초록 dot 또는 border 색상 |
| 연결 수 | 관련 대화, 자료, run, 일정의 합산 또는 별도 count |
| 자료 수 | source/file/artifact count |
| 완료 체크 | subtask 노드에서 원형 체크로 표시 |
| 선택 | 파란 테두리, edge 강조, 상세 패널 변경 |
| 빠른 메뉴 | 상태 변경, 하위 task 추가, dependency 연결, 보관, 삭제 |

노드 크기는 고정 폭을 기본으로 하고, 정보가 많으면 상세 패널로 넘긴다. 캔버스에서 노드 높이가 과도하게 커져 레이아웃이 밀리지 않게 한다.

### 7.4 Edge

| 유형 | 표시 | 데이터 관계 |
| --- | --- | --- |
| parent-child | branch 색상 실선 | `task.parentTaskId` 또는 `task_link.relationType=child_of` |
| dependency | 회색 dashed arrow, `의존` 배지 | `dependency` 또는 `task_link.relationType=depends_on` |
| related | 선택 시만 얇은 점선 후보 | `task_link.relationType=related_to` |
| blocked by | 빨간/주황 강조 edge | 선행 task 미완료로 후행 task가 blocked |

dependency 방향은 선행 task에서 후행 task로 향한다. 이미지의 dashed arrow는 후행 작업이 어느 선행 작업을 기다리는지 보여주는 용도다.

### 7.5 캔버스 컨트롤

| 기능 | 상세 |
| --- | --- |
| 확대/축소 | 버튼, 트랙패드 pinch, 단축키 지원 |
| fit to screen | visible node와 edge를 기준으로 화면 맞춤 |
| 잠금 | 편집 잠금. 실수로 위치나 edge를 바꾸지 않게 함 |
| pan | 빈 영역 드래그 |
| 선택 해제 | 빈 영역 클릭 또는 Esc |
| keyboard 이동 | 방향키로 인접 노드 탐색, Enter로 상세 focus |

### 7.6 미니맵

| 기능 | 상세 |
| --- | --- |
| 전체 구조 표시 | 현재 필터에 보이는 노드만 표시 |
| viewport 표시 | 현재 화면 영역을 사각형으로 표시 |
| 빠른 이동 | 미니맵 클릭/드래그로 viewport 이동 |
| 축소 상태 | 캔버스가 작거나 모바일이면 접힌 버튼으로 표시 |
| 색상 | branch 또는 priority 색상을 간략히 반영 |

### 7.7 하단 레이아웃 도구막대

| 기능 | 상세 |
| --- | --- |
| 자동 정렬 | 현재 layout mode 기준 좌표 재계산 |
| 방사형 | root 중심으로 가지를 원형/반원형 배치 |
| 트리형 | 계층 깊이를 좌우 또는 상하로 정렬 |
| 마인드맵 | root에서 branch가 오른쪽 또는 양쪽으로 뻗는 구조 |
| 범례 | priority 색상 의미 표시. 이미지 기준 높음 빨강, 중간 주황, 낮음 초록 |
| 접기 버튼 | 하단 도구막대 또는 범례 접기 |

### 7.8 우측 상세 탭

| 탭 | 기능 |
| --- | --- |
| 개요 | 설명, 연결 주제, 담당자, 체크리스트, 연결 대화/자료, 일정, 주요 CTA |
| 작업 | task 필드 편집, checklist/subtask 관리, 상태/마감/우선순위 변경 |
| 의존성 | 선행 task, 후행 task, blocked 상태, 의존성 추가/삭제 |
| 활동 기록 | 생성, 수정, 체크, dependency 변경, view 저장, run 생성, 자료 연결 이력 |

탭 전환은 선택 노드를 유지한다. `의존성` 탭명 옆 숫자는 현재 노드와 직접 연결된 dependency count다.

## 8. task / subtask / dependency markmap

### 8.1 이미지 기준 markmap 구조

```text
AI 허브 만들기
├── UX 기획
│   ├── 사용자 리서치
│   ├── 정보 구조 설계
│   ├── 와이어프레임 작성
│   └── 디자인 시스템 정의
├── 데이터 모델
│   ├── 엔티티 정의
│   ├── 스키마 설계
│   └── 마이그레이션 계획
├── 에이전트 빌더
│   ├── 에이전트 UI 개발
│   ├── 권한 & 안전 설계
│   └── 테스트 케이스 작성
├── 스크랩 리포트
│   ├── 스크랩 수집기
│   ├── 요약 엔진 개발
│   └── 리포트 템플릿
├── 배포
│   ├── CI/CD 파이프라인
│   ├── 스테이징 배포
│   └── 프로덕션 배포
└── 검증
    ├── E2E 테스트
    ├── 사용성 테스트
    └── 버그 수정
```

### 8.2 dependency 관계 예시

| 선행 task | 후행 task | 관계 의미 | 화면 표시 |
| --- | --- | --- | --- |
| 정보 구조 설계 | 와이어프레임 작성 | IA 확정 후 wireframe 작성 가능 | dashed arrow, `의존` |
| 디자인 시스템 정의 | 에이전트 UI 개발 | 디자인 토큰/컴포넌트 기준 필요 | dashed arrow |
| 엔티티 정의 | 스키마 설계 | 도메인 엔티티 확정 후 DB 스키마 설계 | dashed arrow |
| 스키마 설계 | 마이그레이션 계획 | 스키마 확정 후 migration 작성 | dashed arrow |
| 스테이징 배포 | E2E 테스트 | 배포 환경 준비 후 테스트 가능 | dashed arrow, `의존` |
| E2E 테스트 | 프로덕션 배포 | 검증 완료 후 production 배포 가능 | dashed arrow |

### 8.3 계층과 의존성의 저장 규칙

| 관계 | 저장 방식 | 변경 방식 |
| --- | --- | --- |
| root-task | `parentTaskId=null`, `rootTaskId` 또는 saved view root | root 선택, topic 목표 생성 |
| task-subtask | `parentTaskId` 또는 `task_link.child_of` | 하위 task 추가, drag로 parent 변경 |
| checklist | `checklist_item.taskId` | 상세 패널에서 관리. 맵에서는 필요 시 leaf로 표시 |
| dependency | `dependency.fromTaskId`, `dependency.toTaskId` | edge 생성/삭제. 순환 검사 필수 |
| related | `task_link.related_to` | 상세 패널에서 연결. 캔버스에는 선택 시만 표시 |

체크리스트와 subtask는 구분한다. 체크리스트는 한 task 내부의 완료 항목이고, subtask는 별도 task ID와 상태/마감/담당자를 가진다. 맵에서는 체크리스트를 leaf처럼 보여줄 수 있지만, 데이터 모델은 분리한다.

## 9. 목록 / 보드 / 맵 전환 규칙

### 9.1 공통 원칙

목록, 보드, 맵은 같은 `task`와 `dependency` 데이터를 view 방식만 다르게 표현한다.

| 원칙 | 설명 |
| --- | --- |
| 동일 데이터 | task 제목, 상태, 우선순위, 마감, 담당자, 체크리스트, 연결 정보는 공통 |
| 동일 선택 | 가능한 경우 선택 task를 view 전환 후에도 유지 |
| 동일 필터 | topic, priority, status, assignee, deadline 필터는 view 간 유지 |
| view 전용 상태 분리 | zoom, pan, layout mode, node position은 map view 전용 |
| 변경 즉시 반영 | 맵에서 상태 변경 시 목록/보드에도 반영. 보드 drag 변경도 맵 노드에 반영 |
| 충돌 방지 | view 전환 중 저장되지 않은 edge/position 변경이 있으면 저장/취소 확인 |

### 9.2 목록 view로 전환

| 항목 | 동작 |
| --- | --- |
| 정렬 | 목록 정렬 기준은 기존 목록 view의 sort를 우선. 없으면 map의 우선순위/마감 기준 사용 |
| parent-child | `상위 task` 컬럼 또는 indent로 표시 |
| dependency | 의존성 count와 blocked 배지로 표시 |
| 선택 | 선택 노드에 해당하는 row focus |
| map 전용 상태 | zoom/pan/layout은 보존하되 목록에는 표시하지 않음 |

### 9.3 보드 view로 전환

| 항목 | 동작 |
| --- | --- |
| 컬럼 | status 기준 컬럼에 task 배치 |
| parent-child | 카드 안에 상위 task 또는 root 배지 표시 |
| dependency | blocked 배지, 선행 task tooltip, 상세 패널 의존성 탭에서 표시 |
| 선택 | 선택 노드에 해당하는 카드 선택 |
| 완료 노드 | 보드의 완료 컬럼에 표시되거나 완료 숨김 설정을 따른다 |

### 9.4 맵 view로 전환

| 항목 | 동작 |
| --- | --- |
| root 결정 | saved view root, 선택 task의 root, topic root, 전체 root 순으로 결정 |
| layout 결정 | 마지막 map layout, saved view layout, 기본 `마인드맵` 순으로 적용 |
| node position | 저장된 좌표가 있으면 사용. 없으면 자동 layout 계산 |
| edge 표시 | parent-child는 항상 표시, dependency는 설정에 따라 항상/선택 시 표시 |
| 큰 데이터 | 노드 수가 많으면 root 주변 N depth만 펼치고 나머지는 접힘 처리 |

## 10. 필터 / 저장 뷰 / 미니맵 / 자동 정렬 / 레이아웃

### 10.1 필터

| 필터 | 옵션 | 기본값 |
| --- | --- | --- |
| topic | 전체 주제, 특정 topic, topic 다중 선택 | 전체 주제 |
| priority | 높음, 중간, 낮음, 없음 | 전체 |
| status | 진행 중, 예정, 완료, 보류, 막힘, 승인 대기, 보관 | 진행 중, 예정 |
| assignee | 나, 특정 담당자, 미지정 | 전체 |
| deadline | 오늘, 이번 주, 지남, 없음, 사용자 지정 | 전체 |
| dependency | 의존성 있음, 막힌 task, 후행 task 있음 | 전체 |
| source | 자료 있음, 자료 없음, 권한 문제 있음 | 전체 |

필터 결과가 0개면 캔버스 빈 상태에 현재 적용된 필터와 `필터 초기화` CTA를 표시한다.

### 10.2 저장된 뷰

`saved_view`는 단순 필터 프리셋이 아니라 맵을 보는 방식을 저장한다.

| 저장 항목 | 설명 |
| --- | --- |
| 이름 | 예: `AI 허브 MVP 로드맵` |
| scope | 개인, 허브, topic 공유 범위 |
| filters | topic, priority, status, assignee, deadline 등 |
| rootTaskId | 중심 root 또는 topic |
| selectedTaskId | 마지막 선택 노드 |
| layoutMode | radial, tree, mindmap |
| viewport | zoom, pan x/y |
| collapsedNodeIds | 접힌 branch |
| showDependencyEdges | dependency edge 표시 여부 |
| showCompleted | 완료 노드 표시 여부 |

저장된 뷰가 삭제되어도 task 데이터는 삭제하지 않는다. saved view는 표시 상태만 저장한다.

### 10.3 미니맵

| 상태 | 처리 |
| --- | --- |
| 전체 노드 20개 이하 | 노드 색상과 viewport를 단순 표시 |
| 전체 노드 많음 | node cluster 또는 branch 단위로 요약 |
| 필터 적용 | visible node 기준으로 미니맵 재계산 |
| 노드 선택 | 선택 노드 위치를 미니맵에도 강조 |
| 접근성 | 미니맵 없이도 키보드 탐색과 fit 기능으로 같은 이동 가능 |

### 10.4 자동 정렬

자동 정렬은 다음 상황에서 필요하다.

| 상황 | 동작 |
| --- | --- |
| 새 node 추가 | 현재 branch 주변에 배치하고 겹치면 부분 정렬 |
| edge 추가 | dependency line이 지나치게 꼬이면 관련 branch만 재배치 제안 |
| layout mode 변경 | 전체 visible node 좌표 재계산 |
| 수동 좌표 존재 | `수동 배치를 덮어쓸까요?` 확인 후 적용 |
| 필터 변경 | visible node 기준으로 필요 시 fit만 수행. 자동 정렬은 사용자가 명시할 때 실행 |

자동 정렬은 task 순서, 상태, 의존성 자체를 바꾸지 않는다.

### 10.5 레이아웃 모드

| 모드 | 용도 | 특징 |
| --- | --- | --- |
| 방사형 | root 중심으로 모든 branch 균형 비교 | 넓은 화면, 전체 개요에 적합 |
| 트리형 | 선후행과 계층 깊이를 엄격히 보기 | 의존성 검토, 일정 계획에 적합 |
| 마인드맵 | 목표에서 작업 가지가 뻗는 기획형 구조 | 이미지 기본 느낌, 브레인스토밍에 적합 |

레이아웃은 view preference다. task의 parent-child, dependency 데이터와 분리한다.

## 11. 선택 노드 상세

### 11.1 상세 헤더

이미지의 `UX 기획` 선택 상태를 기준으로 다음 정보를 표시한다.

| 요소 | 기능 |
| --- | --- |
| branch color dot | 캔버스 branch 색상과 일치 |
| 제목 | inline 수정 가능 |
| 상태 배지 | 진행 중, 예정, 완료, 보류, 막힘, 승인 대기 |
| 즐겨찾기 | saved view나 개인 즐겨찾기 고정 |
| 더보기 | 복제, 보관, 삭제, 링크 복사, 표시 위치로 이동 |
| 진행률 요약 | `80% 완료` 같은 표시 |
| 마감일 | `마감일: 5월 28일 (수)` |

### 11.2 개요 탭

| 항목 | 기능 |
| --- | --- |
| 설명 | task 목적과 범위. 예: AI 허브 사용자 경험 설계와 핵심 흐름 정의 |
| 연결 주제 | 대표 topic 배지. 클릭 시 topic 필터 또는 topic 상세 이동 |
| 담당자 | owner/assignee 표시. 기본은 현재 사용자 |
| 체크리스트 요약 | 완료 수와 진행률 |
| 연결 대화 | 관련 conversation/message 카드 |
| 연결 자료 | file/source/artifact 카드 |
| 일정 | deadline/calendar_event 요약 |
| CTA | `AI에게 맡기기`, 더보기 |

### 11.3 작업 탭

| 기능 | 상세 |
| --- | --- |
| task 필드 편집 | 제목, 설명, 상태, 우선순위, 마감일, 예정일, 담당자 |
| checklist 관리 | 항목 추가, 체크, 삭제, 순서 변경 |
| subtask 관리 | 하위 task 추가, 상위 task 변경 |
| AI 제안 적용 | 체크리스트 생성, 마감일 제안, 자료 연결 제안 적용 |
| 완료 처리 | 미완료 checklist/subtask가 있으면 확인 모달 표시 |

### 11.4 의존성 탭

| 기능 | 상세 |
| --- | --- |
| 선행 task | 이 task가 시작되기 전에 완료되어야 하는 task 목록 |
| 후행 task | 이 task가 완료되면 시작 가능한 task 목록 |
| blocked 상태 | 선행 task 미완료, 권한, 연결 장애, 승인 대기 원인 표시 |
| edge 추가 | task 검색 후 dependency 추가 |
| edge 삭제 | 의존성 관계만 삭제. task는 삭제하지 않음 |
| 순환 검사 | 저장 전 순환 경로 검사와 차단 |

### 11.5 활동 기록 탭

| 이벤트 | 표시 |
| --- | --- |
| 생성 | 생성자, 생성 출처, 생성 시각 |
| 필드 수정 | 변경 필드, 이전/이후 값 요약 |
| 상태 변경 | 진행 중, 완료, 보류 등 상태 이동 |
| 체크리스트 변경 | 항목 추가/완료/삭제 |
| dependency 변경 | edge 추가/삭제, 순환 차단 실패 |
| 자료 연결 | source/file/artifact 연결/해제 |
| run 생성 | `AI에게 맡기기` 실행과 결과 |
| 일정 변경 | deadline, scheduledAt, calendar_event 변경 |

권한 변경, 외부 쓰기, run 생성, 비용 승인 관련 이벤트는 audit log와 연결한다.

## 12. 연결 대화 / 자료 / 일정 / run

### 12.1 연결 대화

| 기능 | 상세 |
| --- | --- |
| 카드 표시 | 제목, 작성자, 날짜, 썸네일 또는 앱 아이콘 |
| 예시 | `UX 리서치 결과 요약 및 인사이트`, `정보 구조 초안 리뷰 부탁드려요` |
| 모두 보기 | 선택 task에 연결된 conversation/message 전체 목록 |
| 클릭 | 해당 conversation으로 이동하고 관련 message 강조 |
| 연결 추가 | 기존 대화 검색 또는 현재 task에 대화 연결 |
| 연결 해제 | 관계만 해제. conversation 원문은 삭제하지 않음 |

대화 scope는 global, topic, run, agent test를 모두 허용한다. task가 topic에 연결되어 있으면 topic chat을 우선 제안한다.

### 12.2 연결 자료

| 자료 유형 | 예시 | 동작 |
| --- | --- | --- |
| PDF | `사용자 인터뷰 요약.pdf` | 파일 미리보기 또는 파일 상세 이동 |
| Figma | `IA 설계안 v1.fig` | 외부 연결 상태 확인 후 열기 |
| Excel | `경쟁 서비스 분석.xlsx` | 파일 상세 또는 외부 문서 열기 |
| ZIP | `와이어프레임 모음.zip` | 파일 상세, 압축 내용 요약 |
| source | 스크랩/기억 자료 | 기억/스크랩 상세 이동 |
| artifact | 생성 문서, 표, markmap | 작업면 또는 파일 상세 이동 |

자료 접근 권한이 없거나 외부 connection이 만료되면 `AI에게 맡기기`를 비활성화하거나 승인/연결 복구 플로우로 유도한다.

### 12.3 일정

| 필드/객체 | 의미 | 화면 동작 |
| --- | --- | --- |
| `deadlineAt` | 끝내야 하는 시점 | 상세 하단 일정 섹션과 노드에 표시 |
| `scheduledAt` | 시작하거나 알림 받을 시점 | 예정 status와 캘린더 표시 기준 |
| `calendar_event` | 캘린더에 노출되는 일정 객체 | `캘린더에서 보기`로 이동 |
| `remindAt` | 알림 시점 | 알림 센터와 toast |

마감일과 일정은 구분한다. 마감일은 task의 완료 목표고, calendar_event는 실제 시간 블록 또는 자동 작업 실행 시점이다.

### 12.4 run / schedule

| 기능 | 상세 |
| --- | --- |
| run 생성 | `AI에게 맡기기`로 task 기반 run 생성 |
| run 입력 | task 설명, checklist, dependency 상태, 연결 대화, 자료, 마감일 |
| run 상태 표시 | running, waiting_approval, paused, succeeded, failed 등을 task에 연결 |
| run 진행률 | task progressSource가 `run`이면 노드 진행률에 반영 |
| 결과 연결 | 생성 파일, 리포트, 로그, 후속 task를 task link로 연결 |
| schedule 생성 | 반복 모니터링이나 정기 요약 task는 schedule로 승격 가능 |
| 맡긴 일 이동 | 연결 run 클릭 시 맡긴 일 상세로 이동 |

task와 run의 책임은 분리한다. task는 사용자가 관리하는 목표/할 일이고, run은 AI/agent가 실제 수행한 실행 기록이다.

## 13. Edge Case

| 상황 | 처리 |
| --- | --- |
| task가 없는 첫 진입 | 빈 캔버스, `할 일 추가`, `채팅에서 구조 만들기`, `샘플 맵 보기` CTA 표시 |
| map으로 전환할 root가 없음 | 전체 task를 임시 root `내 할 일` 아래 그룹화 |
| 필터 결과가 없음 | 현재 필터 표시, `필터 초기화`, 저장된 뷰 변경 CTA 제공 |
| 선택 노드가 필터로 숨겨짐 | 선택 해제 후 첫 visible node 선택 또는 숨겨진 노드 보기 제안 |
| dependency가 필터로 일부 숨겨짐 | 캔버스 edge는 숨기고 상세 의존성 탭에 숨김 표시 |
| 순환 dependency 생성 | 저장 차단, 순환 경로 노드와 edge 강조 |
| parent를 자기 하위로 변경 | 저장 차단, 유효한 parent 후보만 허용 |
| checklist를 subtask처럼 표시 중 삭제 | checklist item만 삭제. task 삭제와 혼동하지 않게 확인 |
| 완료 노드 숨김 상태에서 root 진행률 계산 | 숨김 여부와 무관하게 전체 child 기준 계산하거나 설정에 정책 표시 |
| 선행 task 미완료인데 후행 task 시작 | blocked 경고, 강행 가능 여부는 권한/설정에 따름 |
| 선행 task가 삭제/보관됨 | dependency를 끊을지, 보관된 dependency로 유지할지 확인 |
| 연결 자료 권한 만료 | 상세 자료 카드에 잠금 표시, AI 실행 전 연결 복구 요구 |
| 외부 Figma/Drive 연결 장애 | 자료 열기와 run 생성 전 connection 복구 안내 |
| run 진행 중인 task를 삭제 | run 중지/분리/삭제 취소 선택지를 제공 |
| run 완료 후 task 미완료 | 완료 제안 표시. 자동 완료 여부는 설정에 따름 |
| 마감일 지난 노드 | 노드 테두리 또는 날짜 강조, 오늘로 이동/일정 재조정 제안 |
| 노드 수가 너무 많음 | depth 제한, branch 접기, 검색/필터 유도, 미니맵 cluster 표시 |
| 자동 정렬 후 수동 배치 손실 | 적용 전 확인, 되돌리기 제공 |
| 여러 사용자가 같은 맵 편집 | 위치/edge/task 필드 단위 충돌 표시와 최신화 |
| 네트워크 실패 중 edge 추가 | 낙관 업데이트 되돌림, 실패 toast와 재시도 |
| 저장된 뷰 삭제 | view만 삭제. task와 dependency는 유지 |
| 딥링크의 saved view 권한 없음 | 접근 불가 안내 후 기본 map view로 fallback |
| 모바일 좁은 화면 | 필터는 drawer, 상세는 bottom sheet, 미니맵은 접힘 상태 |
| 접근성 환경에서 캔버스 조작 어려움 | 목록형 outline과 키보드 node 탐색 제공 |

## 14. 데이터 필드 / API 힌트

### 14.1 주요 데이터 모델

`task`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | task ID |
| `hubId` | string | 허브 범위 |
| `rootTaskId` | string | 맵 root task ID |
| `parentTaskId` | string | 상위 task ID |
| `title` | string | 노드 제목 |
| `description` | string | 상세 설명 |
| `status` | enum | `backlog`, `today`, `scheduled`, `in_progress`, `blocked`, `waiting_approval`, `done`, `archived` |
| `priority` | enum | `high`, `medium`, `low`, `none` |
| `topicIds` | string[] | 연결 topic |
| `primaryTopicId` | string | 대표 topic |
| `ownerId` | string | 소유자 |
| `assigneeIds` | string[] | 담당자 |
| `deadlineAt` | datetime | 마감 시각 |
| `scheduledAt` | datetime | 예정 시각 |
| `completedAt` | datetime | 완료 시각 |
| `progressPercent` | number | 표시 진행률 |
| `progressSource` | enum | `run`, `checklist`, `subtask`, `manual`, `status` |
| `conversationCount` | number | 연결 대화 수 |
| `sourceCount` | number | 연결 source 수 |
| `fileCount` | number | 연결 file 수 |
| `dependencyCount` | number | 직접 dependency 수 |
| `delegatedRunId` | string | 연결 run |
| `scheduleId` | string | 연결 schedule |
| `createdBy` | enum | `user`, `ai`, `system`, `run` |
| `createdAt` | datetime | 생성 시각 |
| `updatedAt` | datetime | 수정 시각 |

`task_dependency`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | dependency ID |
| `hubId` | string | 허브 범위 |
| `fromTaskId` | string | 선행 task |
| `toTaskId` | string | 후행 task |
| `type` | enum | `finish_to_start`, `blocks`, `soft_dependency` |
| `status` | enum | `active`, `resolved`, `invalid`, `archived` |
| `createdBy` | enum | `user`, `ai`, `system` |
| `createdAt` | datetime | 생성 시각 |
| `resolvedAt` | datetime | 해소 시각 |

`task_map_view`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `id` | string | saved view ID |
| `hubId` | string | 허브 범위 |
| `name` | string | 저장된 뷰 이름 |
| `scope` | enum | `private`, `hub`, `topic` |
| `rootTaskId` | string | 중심 root task |
| `filters` | object | topic, priority, status, assignee, deadline 등 |
| `layoutMode` | enum | `radial`, `tree`, `mindmap` |
| `viewport` | object | zoom, x, y |
| `collapsedNodeIds` | string[] | 접힌 노드 |
| `selectedTaskId` | string | 마지막 선택 노드 |
| `showDependencyEdges` | boolean | dependency edge 표시 여부 |
| `showCompleted` | boolean | 완료 노드 표시 여부 |
| `createdAt` | datetime | 생성 시각 |
| `updatedAt` | datetime | 수정 시각 |

`task_map_node_position`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `taskId` | string | task ID |
| `viewId` | string | saved view ID |
| `x` | number | 캔버스 x 좌표 |
| `y` | number | 캔버스 y 좌표 |
| `isManual` | boolean | 수동 배치 여부 |
| `updatedAt` | datetime | 마지막 위치 변경 |

### 14.2 API 힌트

| 목적 | 메서드/경로 예시 | 비고 |
| --- | --- | --- |
| 맵 조회 | `GET /api/tasks/map` | `rootTaskId`, `topicId`, `viewId`, `status`, `priority`, `deadlineRange`, `depth` query |
| 맵 노드 상세 | `GET /api/tasks/{taskId}` | checklist, links, dependencies, activity 포함 |
| task 생성 | `POST /api/tasks` | parentTaskId, rootTaskId 포함 가능 |
| task 수정 | `PATCH /api/tasks/{taskId}` | 제목, 상태, 우선순위, 마감, parent 변경 |
| node 위치 저장 | `PATCH /api/tasks/map/views/{viewId}/positions` | 여러 node 좌표 일괄 저장 |
| 자동 정렬 저장 | `POST /api/tasks/map/layout` | layoutMode 기준 좌표 계산 또는 저장 |
| saved view 목록 | `GET /api/tasks/map/views` | 허브/사용자 범위 |
| saved view 생성 | `POST /api/tasks/map/views` | 현재 필터/viewport 저장 |
| saved view 수정 | `PATCH /api/tasks/map/views/{viewId}` | 이름, 필터, layout, 표시 옵션 |
| saved view 삭제 | `DELETE /api/tasks/map/views/{viewId}` | view만 삭제 |
| dependency 생성 | `POST /api/tasks/dependencies` | 순환 검사 필수 |
| dependency 삭제 | `DELETE /api/tasks/dependencies/{dependencyId}` | 관계만 삭제 |
| 순환 검사 | `POST /api/tasks/dependencies/validate` | edge 저장 전 preview |
| task 위임 | `POST /api/tasks/{taskId}/delegate` | run 또는 approval_request 생성 |
| link 추가 | `POST /api/tasks/{taskId}/links` | conversation/source/file/run/calendar 연결 |

맵 조회 응답은 캔버스 렌더링에 필요한 경량 노드와 edge를 먼저 반환한다. 선택 노드 상세는 별도 API로 지연 로딩한다.

### 14.3 맵 조회 응답 형태 예시

```json
{
  "view": {
    "id": "view_ai_hub_mvp",
    "name": "AI 허브 MVP 로드맵",
    "layoutMode": "mindmap",
    "viewport": { "zoom": 0.92, "x": 120, "y": 40 }
  },
  "nodes": [
    {
      "id": "task_root_ai_hub",
      "parentTaskId": null,
      "title": "AI 허브 만들기",
      "status": "in_progress",
      "priority": "high",
      "progressPercent": 55,
      "deadlineAt": "2024-06-30T23:59:00+09:00",
      "conversationCount": 28,
      "sourceCount": 14
    }
  ],
  "edges": [
    {
      "id": "dep_information_architecture_to_wireframe",
      "type": "dependency",
      "fromTaskId": "task_information_architecture",
      "toTaskId": "task_wireframe"
    }
  ]
}
```

### 14.4 상태 변경 이벤트

| 이벤트 | 발생 조건 |
| --- | --- |
| `task.map_view_opened` | saved view 또는 map view 진입 |
| `task.map_view_saved` | 현재 필터/레이아웃/viewport 저장 |
| `task.node_selected` | 캔버스에서 node 선택 |
| `task.node_moved` | 수동 좌표 변경 |
| `task.parent_changed` | parent-child 관계 변경 |
| `task.dependency_created` | dependency edge 생성 |
| `task.dependency_deleted` | dependency edge 삭제 |
| `task.dependency_validation_failed` | 순환 또는 권한 문제로 저장 실패 |
| `task.layout_applied` | 자동 정렬 또는 layout mode 변경 |
| `task.delegated` | 선택 task에서 run 생성 또는 approval 요청 |

이 이벤트는 활동 기록, audit log, 협업 충돌 처리, saved view 최신화에 사용한다.

## 15. 수용 기준

| 번호 | 기준 |
| --- | --- |
| AC-01 | `할 일` 화면에서 `맵` view를 선택하면 같은 task 데이터를 markmap 형태로 표시한다. |
| AC-02 | 상단 view 전환 `목록`, `보드`, `맵`은 선택 task와 필터를 가능한 한 유지한다. |
| AC-03 | root, task, subtask 노드는 제목, 진행률, 상태, 마감일, 우선순위, 연결 수 또는 자료 수를 조건에 맞게 표시한다. |
| AC-04 | parent-child edge와 dependency edge는 시각적으로 구분된다. dependency edge는 dashed arrow와 `의존` 배지로 표시할 수 있다. |
| AC-05 | 노드 클릭 시 우측 상세 패널이 열리고 선택 task의 개요, 작업, 의존성, 활동 기록 탭을 제공한다. |
| AC-06 | 우측 상세 패널은 체크리스트 완료 수, 연결 대화, 연결 자료, 일정, `AI에게 맡기기` CTA를 표시한다. |
| AC-07 | topic, priority, status 필터는 캔버스 노드와 카운트를 즉시 갱신한다. |
| AC-08 | `초기화`는 현재 필터를 기본값으로 되돌리고 캔버스를 재계산한다. |
| AC-09 | saved view는 필터, root, layout mode, viewport, 접힌 노드, dependency 표시 설정을 저장하고 복원한다. |
| AC-10 | 미니맵은 전체 visible map과 현재 viewport를 표시하고 클릭/드래그 이동을 지원한다. |
| AC-11 | 확대, 축소, fit, 잠금 컨트롤이 동작하며 잠금 상태에서는 편집 액션이 제한된다. |
| AC-12 | `자동 정렬`과 레이아웃 모드 변경은 노드 좌표만 바꾸고 task 관계 데이터는 변경하지 않는다. |
| AC-13 | dependency 생성 시 순환 의존성을 검사하고 순환이면 저장을 차단한다. |
| AC-14 | 맵에서 task 상태, 우선순위, 마감일, 체크리스트를 변경하면 목록/보드 view에도 반영된다. |
| AC-15 | 보드/목록에서 변경한 task 상태와 진행률은 맵 노드에 반영된다. |
| AC-16 | 선택 노드의 연결 대화/자료/일정/run 클릭 시 각 대상 화면으로 이동할 수 있다. |
| AC-17 | `AI에게 맡기기`는 task 기반 run 또는 approval_request를 생성하고 task에 연결한다. |
| AC-18 | run 생성 전 파일 권한, 외부 connection, 비용 한도, 선행 dependency 상태를 검사한다. |
| AC-19 | 노드 수가 많거나 필터 결과가 없거나 권한이 없거나 네트워크 실패가 발생해도 명확한 빈 상태/오류 상태를 제공한다. |
| AC-20 | task 생성/수정, dependency 변경, layout 저장, run 위임은 활동 기록 또는 audit log에 남는다. |

## 16. 자체 리뷰 및 엣지케이스 점검

서브에이전트 읽기 전용 검토를 시도했으나 결과 메시지가 생성되지 않았다. 래퍼는 `no agent_message found`를 반환했고, 생성된 로그 파일은 비어 있어 추가 판단 가능한 오류 메시지가 없었다. 외부 권한을 올린 재시도는 이 문서 작성 범위의 필수 조건이 아니므로 진행하지 않았고, 아래 자체 리뷰를 최종 점검으로 삼는다.

현재 자체 점검 결과는 다음이다.

| 점검 항목 | 결과 |
| --- | --- |
| 필수 섹션 반영 | 화면 목적, 정보 구조, 진입/종료/전환, 핵심 시나리오, 컴포넌트, markmap, view 전환, 필터/저장 뷰/미니맵/자동 정렬/레이아웃, 선택 상세, 연결 대화/자료/일정/run, edge case, 데이터/API, 수용 기준, 오픈 질문 포함 |
| 이미지 기능 추출 | 좌측 필터, saved view, 중앙 markmap, dependency edge, 캔버스 컨트롤, 미니맵, 하단 레이아웃 도구막대, 우측 상세 패널 반영 |
| PRD 객체 반영 | task, checklist, dependency, topic, conversation, source, file_asset, calendar_event, run, schedule, ai_suggestion, audit_log 반영 |
| view 경계 | 목록/보드/맵이 같은 데이터라는 원칙과 map 전용 상태 분리 반영 |
| edge case | 순환 의존성, 숨겨진 노드, 자료 권한, run 중 삭제, 노드 과다, 모바일, 접근성 포함 |

## 17. 오픈 질문

| 질문 | 후보/검토 포인트 |
| --- | --- |
| route를 `/todos?view=map`으로 둘지 `/todos/map`으로 분리할지 | 같은 데이터 view 전환이면 query가 단순하고, 고급 화면 독립성이 크면 별도 route가 적합 |
| root task를 반드시 둘지 topic을 root로 허용할지 | 프로젝트형 task는 root task, topic 기반 브라우징은 topic root 허용 후보 |
| checklist를 맵 leaf로 항상 표시할지 | 기본은 subtask만 node로 표시하고, checklist는 선택 노드 상세에서 표시. 옵션으로 checklist leaf 표시 가능 |
| 완료 노드를 기본으로 숨길지 | 이미지 필터는 완료 미선택. 기본은 진행 중/예정 중심, saved view에서 완료 포함 가능 |
| dependency edge를 항상 표시할지 선택 노드 주변만 표시할지 | 전체 표시 시 복잡해짐. 기본은 주요/blocked dependency만 표시하고 선택 시 전체 표시 후보 |
| 자동 정렬이 수동 위치를 언제 덮어쓸지 | 전체 정렬 전 확인, branch 부분 정렬은 자동 적용 가능 여부 결정 필요 |
| branch 색상 기준은 topic인지 root branch인지 | 이미지에서는 branch별 색상. topic 색상과 충돌하면 우선순위/범례 정책 필요 |
| root 진행률 계산 기준은 무엇인지 | child task 평균, weighted progress, checklist/run 기반 혼합 중 선택 필요 |
| blocked 상태를 task status로 둘지 dependency 파생 상태로 둘지 | PRD에는 `blocked` 상태가 있음. 선행 task 미완료 시 자동 파생 배지와 수동 status의 관계 결정 필요 |
| `AI에게 맡기기` 전 선행 task 미완료를 차단할지 | 기본은 경고, 외부 쓰기/배포성 task는 차단 후보 |
| saved view 공유를 MVP에 포함할지 | 개인 view만 먼저 제공하고 hub 공유는 협업 기능과 함께 검토 가능 |
| 모바일에서 map view를 제공할지 | read-only 미니맵 + 상세 중심으로 제공하거나 목록 view로 fallback 후보 |
| dependency 편집 권한을 누가 가질지 | 개인 허브는 소유자, 공유 허브는 owner/editor 권한 분리 필요 |
| 이미지/PDF 내보내기 범위는 현재 viewport인지 전체 맵인지 | 기본은 현재 saved view 전체, 옵션으로 현재 화면만 내보내기 |
