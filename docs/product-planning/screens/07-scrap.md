# 스크랩 / Scrap Inbox 화면 상세 기획

## 1. 화면 목적

`스크랩` 화면은 웹 URL, 메모, 파일, 영상, 기사, 블로그, PDF처럼 나중에 참고할 원자료를 빠르게 수집하고 AI가 읽을 수 있는 자료로 정리하는 inbox다. PRD 기준으로 스크랩은 `기억`으로 승격되기 전 단계이며, 원문·스크립트·요약·태그·연결 주제·후속 작업을 함께 보관한다.

이 화면의 핵심은 “저장”이 아니라 “나중에 쓸 수 있는 재료로 정리”다. 사용자는 자료를 붙여넣고, 처리 상태를 확인하고, 요약을 검수한 뒤 주제·기억·할 일·리포트 빌더로 넘긴다.

| 사용자 문제 | 화면에서의 해결 방식 |
| --- | --- |
| 참고할 URL과 파일이 여러 곳에 흩어짐 | 단일 입력창과 새 스크랩 CTA로 URL, 메모, 파일, 영상, PDF를 한 곳에 저장 |
| 저장한 자료를 나중에 왜 저장했는지 잊음 | AI 요약, 핵심 포인트, 태그, 사용자 메모, 연결 주제를 카드와 상세에 표시 |
| 영상·기사·PDF를 매번 다시 열어 읽기 어려움 | 원문, 스크립트, 추출 텍스트, 메타데이터를 탭으로 제공 |
| 어떤 자료가 처리 완료됐는지 알기 어려움 | 유형 탭과 `대기 중` 필터, 카드 상태, 상세 처리 상태를 표시 |
| 스크랩을 실제 작업으로 연결하기 번거로움 | `주제에 연결`, `기억으로 저장`, `할 일 만들기`, 관련 소스 추천을 제공 |

첨부 화면 기준으로 보이는 주요 기능은 다음이다.

| 화면 요소 | 이미지에서 확인된 내용 | 요구사항 반영 |
| --- | --- | --- |
| 좌측 내비게이션 | 오늘, 주제, 맡긴 일, 기억, 에이전트, 연결, 스크랩, 캘린더, 할 일, 파일, 설정, 도움말 | `스크랩` 활성 상태와 전역 이동 유지 |
| 헤더 | 제목 `스크랩`, 설명, `새로 스크랩`, 더보기 | 새 스크랩 생성과 일괄/설정 액션 |
| 빠른 입력 | `URL, 메모, 파일을 붙여넣기`, 링크/첨부 아이콘, `추가` 버튼 | 붙여넣기, 파일 첨부, URL 추가, 메모 저장 |
| 유형 탭 | 전체 48, 유튜브 12, 기사 15, 블로그 8, PDF 7, 대기 중 6 | source type과 processing status 카운트 |
| 정렬/보기/필터 | `최신순`, 그리드/리스트 토글, 필터 버튼 | 목록 탐색 공통 패턴 |
| 카드 목록 | 유튜브, 기사, 블로그, PDF 카드와 점선 새 스크랩 카드 | source 카드, 상태/요약/핵심 포인트/태그/주제 연결 |
| 상세 패널 | YouTube 상세, 썸네일, 재생 오버레이, 원본 열기, 북마크, 닫기 | 선택 source의 원문 접근과 빠른 액션 |
| 상세 탭 | 요약, 스크립트, 메모, 정보 | 자료 타입별 상세 콘텐츠 |
| 상세 액션 | 주제에 연결, 기억으로 저장, 할 일 만들기 | 주제, 기억, 할 일 연계 |
| 관련 소스 | 관련 자료 2개와 `모두 보기` | 유사 source 추천과 리포트 재료 탐색 |

## 2. 정보 구조

### 전체 레이아웃

PC 기준 3열 구조다.

| 영역 | 구성 | 목적 |
| --- | --- | --- |
| 좌측 사이드바 | 허브 선택, 전역 메뉴, 설정/도움말, 사용자 플랜 | 제품 전체 화면 간 이동 |
| 중앙 메인 | 화면 제목, 빠른 입력, 유형 탭, 정렬/필터/보기 전환, 스크랩 카드 목록 | 스크랩 수집, 탐색, 선택 |
| 우측 상세 패널 | 선택 스크랩 미리보기, 원본 액션, 탭, 태그, 연결 주제, 작업, 관련 소스 | 요약 검수와 후속 연결 |

좌측 사이드바는 공통 내비게이션을 따른다. `스크랩` 메뉴가 파란색 활성 상태이며, 화면 전환 시 목록의 검색·필터·선택 상태는 URL query로 복원 가능해야 한다.

### 중앙 메인 영역

상단에는 제목 `스크랩`과 보조 문구 `웹, 영상, 문서 등 나중에 참고할 자료를 모아두고, AI가 정리해 드립니다.`를 표시한다. 우측 상단에는 `새로 스크랩` 버튼과 더보기 메뉴가 있다.

빠른 입력 영역은 단일 행 입력창이다.

| 요소 | 화면 표시 | 기능 |
| --- | --- | --- |
| 입력창 | `URL, 메모, 파일을 붙여넣기` | URL, 일반 텍스트 메모, 로컬 파일 paste/drop을 수용 |
| 링크 아이콘 | 체인 아이콘 | URL 입력 모드로 포커스, 클립보드 URL 자동 감지 |
| 첨부 아이콘 | 클립 아이콘 | 파일 선택 또는 drag & drop |
| `추가` 버튼 | 우측 파란 테두리 버튼 | 입력값 검증 후 source 생성 |

유형 탭과 목록 제어는 다음 순서로 구성한다.

| 요소 | 화면 표시 | 기능 |
| --- | --- | --- |
| 유형 탭 | `전체 48`, `유튜브 12`, `기사 15`, `블로그 8`, `PDF 7`, `대기 중 6` | source type 또는 처리 상태 기준 빠른 필터 |
| 정렬 | `최신순` | 최신순, 오래된순, 최근 열람순, 처리 상태순, 관련도순, 제목순 |
| 보기 전환 | 그리드/리스트 아이콘 | 카드형 그리드와 밀도 높은 리스트 전환 |
| 필터 | `필터` 버튼 | 유형, 처리 상태, 연결 주제, 태그, 출처, 날짜, 권한, 실패 여부 |

기본 목록은 3열 카드 그리드다. 선택된 카드는 파란색 테두리로 강조된다. 목록 마지막에는 점선 테두리의 `새로운 스크랩 추가` 카드가 있으며, 클릭하면 빠른 입력 또는 새 스크랩 모달을 연다.

### 우측 상세 패널

우측 상세 패널은 선택된 스크랩의 검수·연계 작업 공간이다. 첨부 화면의 선택 항목은 YouTube 스크랩 `생산성을 2배 높이는 아침 루틴 5가지`다.

상세 패널 구성은 다음이다.

| 영역 | 요소 | 기능 |
| --- | --- | --- |
| 상단 | source type 배지, 재생 시간, 닫기 | 유형과 미디어 길이 표시, 상세 패널 닫기 |
| 미리보기 | 썸네일, 재생 오버레이 | 영상은 플레이어 또는 원본 열기, 기사/PDF는 대표 이미지나 문서 미리보기 |
| 제목/메타 | 제목, 출처명, 날짜, 파일 크기 | 원자료 식별 정보 표시 |
| 빠른 액션 | `원본 열기`, 북마크 | 외부 원본 열기, 즐겨찾기 저장 |
| 탭 | 요약, 스크립트, 메모, 정보 | 콘텐츠 유형별 상세 전환 |
| 태그 | 태그 칩, 추가 버튼 | AI 태그와 사용자 태그 관리 |
| 연결된 주제 | 주제 칩, 추가 버튼 | topic 연결/해제 |
| 작업 | 주제에 연결, 기억으로 저장, 할 일 만들기 | 후속 객체 생성 |
| 관련 소스 | 추천 자료 목록, 모두 보기 | 유사 자료 탐색 |

## 3. 진입/종료/전환 동선

### 진입

| 진입 경로 | 처리 |
| --- | --- |
| 사이드바 `스크랩` 클릭 | 기본 목록으로 진입하고 최신순 전체 스크랩 조회 |
| 오늘 화면 추천 도구 `자료 스크랩` 클릭 | 스크랩 화면으로 이동하고 빠른 입력창에 포커스 |
| 채팅에서 URL/파일 첨부 후 `스크랩에 저장` | source 생성 후 해당 스크랩을 선택한 상태로 진입 |
| 기억 상세의 출처 클릭 | 연결된 스크랩 상세를 우측 패널에 선택 |
| 주제 자료 탭에서 스크랩 클릭 | 해당 주제 필터가 적용된 상태로 스크랩 상세 진입 |
| 파일 화면에서 `스크랩 출처 보기` | file_asset과 연결된 source를 선택 |
| 리포트 빌더에서 소스 선택 | 다중 선택 모드로 진입하고 선택된 source를 유지 |

### 종료

| 종료 동작 | 처리 |
| --- | --- |
| 사이드바 다른 메뉴 클릭 | 해당 화면으로 전환, 미저장 메모 draft가 있으면 확인 |
| 상세 패널 닫기 | 선택 상태 해제 또는 패널 접힘, 목록 필터와 스크롤 유지 |
| 원본 열기 | 외부 URL은 새 탭, 내부 파일/PDF는 파일 상세 또는 미리보기로 이동 |
| 기억으로 저장 완료 | 현재 스크랩 상세 유지, memory 연결 상태와 액션 라벨 갱신 |
| 할 일 만들기 완료 | 현재 스크랩 상세 유지, 생성된 task 링크 표시 |
| 주제에 연결 완료 | 현재 스크랩 상세 유지, 연결 주제 칩과 카드 하단 주제 정보 갱신 |

### 화면 내 전환

유형 탭, 정렬, 필터, 보기 전환은 같은 source 목록 데이터를 기준으로 작동한다. 사용자가 탭을 전환해도 선택된 source가 결과에 포함되면 상세 패널 선택 상태를 유지한다. 결과에서 빠지면 상세 패널은 닫지 않고 “현재 필터 밖 항목” 상태를 표시하거나 선택 해제한다.

상세 탭 전환은 우측 패널 내부에서만 일어난다. `요약` 탭은 AI 요약과 핵심 포인트, `스크립트` 탭은 영상 자막/오디오 전사/본문 추출 텍스트, `메모` 탭은 사용자 노트, `정보` 탭은 원본 메타데이터와 처리 로그를 보여준다.

## 4. 핵심 시나리오

### 시나리오 A. YouTube URL을 저장하고 요약 확인

1. 사용자가 빠른 입력창에 YouTube URL을 붙여넣는다.
2. 시스템은 URL을 검증하고 provider를 `youtube`로 감지한다.
3. 사용자가 `추가`를 누르면 source를 `pending` 상태로 생성한다.
4. 시스템은 metadata read, transcript fetch, 요약 생성, 태그 추천을 순서대로 실행한다.
5. 목록 카드에는 `대기 중` 또는 `처리 중` 상태가 표시된다.
6. 처리가 끝나면 상태가 `summarized`가 되고 카드에 썸네일, 제목, 채널명, 날짜, AI 요약, 핵심 포인트, 태그가 표시된다.
7. 사용자가 카드를 선택하면 우측 상세 패널의 `요약` 탭에서 요약과 핵심 포인트를 검수한다.
8. 사용자가 `스크립트` 탭을 열면 영상 자막 또는 전사 텍스트를 확인한다.

### 시나리오 B. 기사와 블로그를 주제에 연결

1. 사용자가 기사 URL을 추가한다.
2. 시스템은 제목, 발행처, 발행일, 대표 이미지, 본문을 추출한다.
3. AI는 요약, 핵심 포인트, 태그를 생성하고 기존 주제 후보를 추천한다.
4. 사용자가 상세 패널의 `주제에 연결`을 누른다.
5. 주제 선택 모달에서 `AI 서비스 기획` 또는 새 주제를 선택한다.
6. 저장 후 카드 하단과 상세 패널의 연결 주제 칩이 갱신된다.
7. 해당 주제 화면의 자료 탭과 최근 활동에도 스크랩 연결 이벤트가 표시된다.

### 시나리오 C. PDF를 업로드하고 리포트 재료로 사용

1. 사용자가 PDF 파일을 첨부하거나 drag & drop한다.
2. 시스템은 file_asset을 생성하고 source와 연결한다.
3. PDF 텍스트 추출, 페이지별 인덱싱, 요약, 핵심 포인트 생성이 실행된다.
4. 카드에는 파일 크기, 제목, 출처 또는 파일명, PDF 배지가 표시된다.
5. 사용자가 상세에서 핵심 포인트를 검수하고 태그를 조정한다.
6. 사용자가 리포트 빌더에서 이 PDF source를 선택한다.
7. 리포트 빌더는 sourceId, extractedText, citations, page anchors를 기반으로 개요와 초안을 생성한다.

### 시나리오 D. 메모만 빠르게 저장

1. 사용자가 빠른 입력창에 짧은 메모를 입력한다.
2. 시스템은 URL이 아니라고 판단해 `memo` source 생성 후보로 처리한다.
3. 사용자가 `추가`를 누르면 원문은 사용자 메모로 저장된다.
4. AI 요약은 짧은 메모에서는 생략하거나 제목/태그만 생성한다.
5. 사용자는 나중에 메모 탭에서 내용을 수정하고 주제 또는 할 일로 연결한다.

### 시나리오 E. 처리 실패한 스크랩을 재시도

1. 사용자가 블로그 URL을 추가했지만 본문 추출이 실패한다.
2. 카드와 상세 패널에는 `failed` 상태, 실패 사유, 재시도 CTA가 표시된다.
3. 사용자는 `원본 열기`로 URL이 살아 있는지 확인한다.
4. `재시도`를 누르면 extraction job이 새로 생성되고 상태가 `retrying` 또는 `processing`으로 바뀐다.
5. 재시도 후에도 실패하면 사용자가 수동으로 원문을 붙여넣거나 메모 source로 저장할 수 있다.

### 시나리오 F. 스크랩을 기억과 할 일로 승격

1. 사용자가 요약을 검수한 뒤 `기억으로 저장`을 클릭한다.
2. 시스템은 summary, keyPoints, tags, sourceId를 기반으로 memory 후보를 생성한다.
3. 사용자는 기억 유형과 참조 범위를 확인하고 저장한다.
4. 상세 패널에는 연결된 memoryId가 표시되고 버튼은 `기억 보기`로 바뀐다.
5. 사용자가 `할 일 만들기`를 클릭하면 source 요약을 기반으로 task 제목과 체크리스트 후보가 생성된다.
6. task 생성 후 할 일 화면과 주제 작업면에서 해당 source를 근거로 볼 수 있다.

## 5. 컴포넌트별 상세 기능

### 화면 헤더

| 요소 | 기능 |
| --- | --- |
| 제목 `스크랩` | 현재 화면 표시 |
| 보조 문구 | 스크랩의 목적과 AI 정리 역할 설명 |
| `새로 스크랩` | 새 스크랩 모달 열기. URL, 메모, 파일 업로드, 외부 가져오기 지원 |
| 더보기 메뉴 | 일괄 선택, 보관함 보기, 실패 항목만 보기, 중복 스크랩 정리, 내보내기, 스크랩 설정 |

더보기 메뉴의 일괄 작업은 선택된 source의 권한과 상태를 확인해야 한다. 처리 중인 source는 삭제나 보관 전 job 취소 가능 여부를 확인한다.

### 빠른 입력

| 입력 유형 | 감지 기준 | 생성 결과 |
| --- | --- | --- |
| URL | `http`, `https`, provider별 URL 패턴 | source 생성 후 metadata/extraction job 시작 |
| YouTube URL | youtube.com, youtu.be | media source, transcript job, video metadata |
| 기사/블로그 URL | 일반 웹 URL, OpenGraph, 본문 추출 가능 | article/blog source, readable text extraction |
| PDF URL | URL path 또는 content-type이 PDF | pdf source, remote file_asset 생성 |
| 파일 첨부 | file picker, drag & drop, paste file | file_asset 생성 후 source 연결 |
| 일반 메모 | URL이 아닌 텍스트 | memo source 또는 note source 생성 |

입력창은 여러 URL을 붙여넣으면 다중 생성 후보를 보여준다. 파일과 URL을 동시에 넣으면 각각 별도 source로 만들되, 사용자가 같은 주제나 같은 태그를 일괄 적용할 수 있어야 한다.

### 유형 탭

| 탭 | 기준 | 카운트 포함 |
| --- | --- | --- |
| 전체 | archived가 아닌 모든 source | pending, processing, summarized, failed 포함 |
| 유튜브 | `sourceType=video`, `provider=youtube` | 처리 실패와 대기 상태 포함 |
| 기사 | `sourceType=article` | 기사 URL, 뉴스, 매체 페이지 |
| 블로그 | `sourceType=blog` | 개인/기업 블로그, 긴 글 |
| PDF | `sourceType=pdf` | 업로드 PDF와 원격 PDF |
| 대기 중 | `status in (pending, processing, retrying)` | 유형과 무관하게 처리 중인 항목 |

카운트 기준은 현재 검색어와 권한 필터를 반영할지 전체 hub 기준으로 둘지 오픈 질문으로 남긴다. 기본 제안은 현재 필터를 반영하되 유형 탭 자체의 의미가 사라지지 않도록 전체 카운트를 tooltip에 함께 제공하는 방식이다.

### 정렬, 보기 전환, 필터

필터는 다음 조건을 지원한다.

| 필터 | 값 |
| --- | --- |
| 유형 | URL, 메모, 파일, 영상, 기사, 블로그, PDF |
| 처리 상태 | pending, processing, summarized, failed, archived, retrying |
| 연결 상태 | 주제 연결 있음, 기억 저장됨, 할 일 있음, 리포트에 사용됨, 연결 없음 |
| 태그 | AI 태그, 사용자 태그, 태그 없음 |
| 출처 | YouTube, 웹, 업로드, Google Drive, 수동 메모 |
| 날짜 | 생성일, 원본 발행일, 마지막 처리일, 마지막 열람일 |
| 권한 | 읽기 가능, 권한 만료, 로그인 필요, 일부 텍스트만 추출 |
| 품질 | 원문 추출 성공, 스크립트 있음, 요약 검수됨, 충돌 소스 있음 |

그리드/리스트 전환은 선택된 sourceId, 필터, 정렬, 스크롤 위치를 유지한다. 리스트 뷰는 다중 선택과 일괄 태그/주제 연결 작업에 적합해야 한다.

### 스크랩 카드

카드는 목록에서 자료의 처리 결과와 후속 사용 가능성을 빠르게 판단하게 한다.

| 요소 | 기능 |
| --- | --- |
| 유형 배지 | YouTube, 기사, 블로그, PDF, 메모, 파일 표시 |
| 썸네일/대표 이미지 | 영상 썸네일, 기사 이미지, PDF 표지, 파일 아이콘 |
| 재생 시간/파일 크기 | 영상 길이, PDF 용량, 파일 크기 표시 |
| 제목 | 원본 제목 또는 사용자가 입력한 제목 |
| 출처 메타 | 채널/발행처/파일명, 원본 날짜, 생성일 |
| AI 요약 | 2~3줄 카드 요약 |
| 핵심 포인트 | 2~4개 bullet. 너무 길면 접힘 |
| 태그 | 최대 3개 노출, 더 있으면 `+N` |
| 연결 주제 | 연결 주제 칩, 없으면 `연결된 주제` CTA |
| overflow 메뉴 | 원본 열기, 주제 연결, 기억 저장, 할 일 만들기, 재요약, 보관, 삭제 |
| 선택 상태 | 파란 테두리와 상세 패널 동기화 |

카드 내 리스트 항목은 sourceId, keyPointId, tagId, topicId처럼 안정적인 ID를 key로 사용해야 한다. 임시 생성 중인 항목은 clientGeneratedId를 가진다.

### 새 스크랩 추가 카드

목록 마지막의 점선 카드는 빈 상태가 아니어도 항상 노출한다. 클릭 시 빠른 입력창에 포커스를 주거나 새 스크랩 모달을 연다. 다중 선택 모드에서는 이 카드를 숨긴다.

### 상세 패널 헤더와 미리보기

| source 유형 | 미리보기 | 원본 액션 |
| --- | --- | --- |
| YouTube/영상 | 썸네일, 재생 버튼, 재생 시간 | 원본 열기, 스크립트 보기 |
| 기사/블로그 | 대표 이미지, 제목, 발행처 | 원본 열기, 읽기 모드 |
| PDF | 표지 또는 첫 페이지, 파일명, 크기 | 파일 열기, 다운로드, 페이지 이동 |
| 메모 | 메모 첫 문단 또는 노트 아이콘 | 메모 편집 |
| 파일 | 파일 타입별 미리보기 | 파일 상세 열기 |

영상 재생은 상세 패널 안에서 inline preview를 제공하되, provider 정책이나 권한 문제로 불가능하면 원본 열기로 대체한다.

### 상세 탭

| 탭 | 내용 | 액션 |
| --- | --- | --- |
| 요약 | AI 요약, 핵심 포인트, 요약 생성 시각, 사용 모델, 검수 상태 | 재요약, 요약 편집, 핵심 포인트 편집 |
| 스크립트 | 영상 자막, 오디오 전사, 기사 본문 추출, PDF 추출 텍스트 | 검색, 복사, 원문 위치 열기 |
| 메모 | 사용자 메모, 저장 이유, 읽은 뒤 남긴 생각 | 편집, autosave, 마지막 편집자 표시 |
| 정보 | 원본 URL, source type, provider, 처리 상태, 권한, 파일 크기, token estimate, 처리 로그 | 재처리, 권한 갱신, 삭제 |

`스크립트` 탭 이름은 영상에 자연스럽지만 기사/PDF에서는 `원문` 또는 `추출 텍스트`가 더 정확하다. UI는 탭 라벨을 source type별로 바꿀지, 공통 탭명을 유지할지 오픈 질문으로 둔다. 개발상으로는 같은 필드를 `extractedText` 또는 `transcriptText` 계열로 분리해 처리한다.

### 태그

태그는 AI 추천 태그와 사용자 태그를 구분해 저장한다.

| 태그 유형 | 설명 |
| --- | --- |
| AI 태그 | 요약 처리 중 자동 생성. 사용자가 삭제하면 숨김 상태로 기록 |
| 사용자 태그 | 사용자가 직접 추가. AI 재요약으로 덮어쓰지 않음 |
| 시스템 태그 | 유형, provider, 처리 상태 같은 필터용 태그. 일반 태그 목록에는 기본 숨김 |

태그 추가 버튼은 중복 태그를 막고, 같은 hub 안의 기존 태그를 자동완성한다.

### 연결된 주제

연결된 주제 섹션은 source와 topic의 관계를 관리한다.

| 동작 | 처리 |
| --- | --- |
| 주제 추가 | topic 검색/생성 모달 표시, 관계 생성 |
| 주제 제거 | 해당 주제의 자료 탭과 최근 활동에서 제거, source 자체는 유지 |
| 주제 칩 클릭 | 주제 상세 또는 작업실로 이동 |
| 추천 주제 표시 | 태그, 제목, 최근 대화, 기존 자료 유사도 기반 추천 |

주제 연결은 source를 기억으로 승격하지 않는다. 원자료를 특정 작업 맥락에 붙이는 관계이며, 기억 저장은 별도 액션이다.

### 작업 액션

| 액션 | 결과 |
| --- | --- |
| 주제에 연결 | topic-source relation 생성 |
| 기억으로 저장 | source summary 기반 memory 후보 생성 |
| 할 일 만들기 | source 기반 task 생성, 필요 시 체크리스트 후보 생성 |
| 원본 열기 | 외부 URL 또는 내부 파일 미리보기 열기 |
| 북마크 | favorite 플래그 갱신 |
| 재요약 | 요약 job 재생성, 기존 요약은 history 보관 |
| 보관 | source status를 archived로 변경 |
| 삭제 | source 삭제 또는 휴지통 이동. 연결 memory/task/report 영향 안내 |

쓰기 액션은 권한과 연결 상태를 먼저 확인한다. 외부 원본에는 쓰지 않으므로 대부분 read 권한이지만, 파일 삭제나 외부 drive 동기화 삭제가 포함되면 승인 카드가 필요하다.

### 관련 소스

관련 소스는 선택된 source와 함께 읽으면 좋은 자료 추천이다.

| 추천 기준 | 예시 |
| --- | --- |
| 태그 유사도 | `루틴`, `생산성`, `아침습관` |
| 같은 주제 | `주간 리뷰`에 연결된 다른 자료 |
| 본문 임베딩 유사도 | 아침 루틴 관련 기사, 성공한 사람들의 습관 |
| 같은 provider/발행처 | 동일 채널의 다른 영상 |
| 리포트 빌더 후보 | 같은 리포트에 쓰기 좋은 근거 자료 |

관련 소스 항목은 썸네일, 제목, 출처, 날짜를 표시한다. `모두 보기`는 관련 소스 전체 목록 또는 리포트 빌더 소스 선택 화면으로 이어질 수 있다.

## 6. URL/메모/파일/영상/기사/PDF 처리 상태

### 공통 상태 모델

PRD의 `source` 상태를 기준으로 사용한다.

| 상태 | 의미 | UI 표시 | 가능한 액션 |
| --- | --- | --- | --- |
| pending | source 생성 후 처리 대기 | `대기 중`, skeleton 카드 | 취소, 보관, 삭제 |
| processing | 메타데이터/원문/요약 처리 중 | 진행 배지, 부분 skeleton | 원본 열기, 취소 |
| summarized | 요약 완료 | 정상 카드와 상세 표시 | 주제 연결, 기억 저장, 할 일 만들기, 재요약 |
| failed | 처리 실패 | 실패 배지, 실패 사유 | 재시도, 원문 수동 입력, 삭제 |
| archived | 보관됨 | 기본 목록 제외 | 복원, 삭제 |
| retrying | 재시도 중 | 재시도 배지 | 취소, 원본 열기 |

`retrying`은 PRD 공통 상태에는 없지만 run 상태와 사용성상 필요하다. API에서는 `processing`에 `retryCount`를 둘 수도 있고, UI 편의를 위해 확장 상태로 둘 수도 있다.

### 유형별 처리 흐름

| 유형 | 처리 단계 | 완료 시 생성 필드 | 실패 가능 지점 |
| --- | --- | --- | --- |
| URL | URL 검증 → OpenGraph/metadata fetch → 본문 추출 → 요약/태그 | title, canonicalUrl, provider, extractedText, summary, tags | dead link, robots 제한, 로그인 필요, 중복 URL |
| 메모 | 텍스트 저장 → 제목/태그 추천 → 선택적 요약 | rawNote, title, tags, summary | 빈 입력, 너무 긴 메모, 민감 정보 |
| 파일 | upload/file_asset 생성 → 타입 감지 → 텍스트/OCR 추출 → 요약 | fileAssetId, mimeType, size, extractedText, summary | 용량 초과, 지원하지 않는 타입, 바이러스 검사 실패 |
| 영상 | provider metadata → transcript fetch 또는 전사 → 요약/챕터/태그 | duration, thumbnail, transcript, chapters, summary | 자막 없음, 비공개 영상, provider quota, embedding 실패 |
| 기사 | metadata → readable text extraction → 날짜/저자 추출 → 요약 | publisher, author, publishedAt, extractedText, summary | paywall, 동적 렌더링, 본문 누락 |
| 블로그 | metadata → 본문 추출 → 코드/이미지/링크 정리 → 요약 | author, publishedAt, extractedText, outboundLinks, summary | SPA 렌더링, 광고/댓글 혼입, 언어 감지 실패 |
| PDF | 파일 또는 원격 PDF 확보 → 페이지 텍스트 추출 → 페이지 anchor → 요약 | pageCount, fileSize, pageTexts, citations, summary | 암호화 PDF, 스캔본 OCR 실패, 페이지 수 초과 |

### 상태 갱신 규칙

| 이벤트 | 갱신 대상 |
| --- | --- |
| source 생성 | 목록 카운트, `대기 중` 탭 카운트, 새 카드 |
| metadata 완료 | 카드 제목, 썸네일, 출처 메타 |
| 원문 추출 완료 | 상세 `스크립트/원문` 탭, token estimate |
| 요약 완료 | 카드 요약, 핵심 포인트, 태그, 상태 |
| 주제 연결 변경 | 카드 하단, 상세 연결 주제, 주제 화면 자료 탭 |
| 기억 저장 | 상세 작업 버튼, memory link, 기억 화면 출처 |
| 할 일 생성 | task link, 할 일 화면 sourceCount |
| 보관/삭제 | 목록, 카운트, 관련 주제/기억/문서 영향 |

## 7. 원문/스크립트/태그/메모/관련 소스

### 원문과 스크립트

원문은 source의 근거 데이터다. 요약보다 우선되는 검증 대상이며, 리포트 빌더와 기억 생성의 citation 근거로 사용된다.

| source 유형 | 원문 데이터 |
| --- | --- |
| YouTube/영상 | transcript, transcript language, timecode, chapter |
| 기사/블로그 | extracted readable text, 원본 URL, 발행일, author |
| PDF | page text, page number, bounding box 또는 page anchor |
| 메모 | raw note, edit history |
| 파일 | extracted text, OCR text, file metadata |

원문이 부분 추출된 경우 UI에 “일부만 추출됨”을 표시하고, AI 요약에도 낮은 신뢰도 또는 검수 필요 상태를 붙인다.

### 태그

태그는 검색, 필터, 주제 추천, 관련 소스 추천, 리포트 빌더 소스 그룹핑에 쓰인다. AI 태그와 사용자 태그는 별도 필드로 저장해 재요약 시 사용자 태그가 사라지지 않게 한다.

### 메모

메모 탭은 사용자가 이 자료를 저장한 이유와 읽은 뒤 남긴 생각을 기록하는 영역이다.

| 기능 | 요구사항 |
| --- | --- |
| autosave | 입력 후 일정 시간 뒤 저장, 저장 상태 표시 |
| markdown-lite | 링크, bullet, 간단한 강조 정도 지원 검토 |
| source 인용 | 메모 안에서 원문 일부를 quote로 연결 가능 |
| 변경 이력 | 중요한 수정은 history에 남김 |
| AI 참조 | 기본은 AI 참조 가능. 민감 메모는 참조 제외 토글 필요 |

### 관련 소스

관련 소스는 사용자가 단일 자료에 갇히지 않고 근거를 확장하게 하는 장치다. 추천은 관련도 점수, 같은 주제, 같은 태그, 같은 리포트 사용 여부를 기준으로 정렬한다.

관련 소스가 삭제되거나 권한 제한되면 목록에서 잠금/삭제됨 상태로 표시한다. 리포트 빌더에서 이미 사용된 source가 삭제되면 citation 깨짐 상태로 전환한다.

## 8. 기억/주제/할 일/리포트 빌더 연계

### 기억 연계

스크랩은 원자료이고 기억은 검수된 장기 지식이다. `기억으로 저장`을 누르면 source 요약과 원문을 근거로 memory 후보를 만든다.

| 스크랩 상태 | 기억 액션 |
| --- | --- |
| pending/processing | 비활성. 처리 완료 후 가능 |
| summarized | memory 후보 생성 가능 |
| failed | 원문이 없으면 비활성, 사용자 메모만으로 기억 생성 가능 여부 확인 |
| archived | 복원 후 가능 또는 보관 상태에서 생성 허용 여부 결정 필요 |

기억 생성 후 memory는 sourceId를 출처로 가진다. source가 삭제되면 연결 기억의 출처 수와 신뢰도 재계산이 필요하다.

### 주제 연계

주제 연결은 source를 특정 작업 맥락에서 쓰게 하는 관계다. 같은 source는 여러 topic에 연결될 수 있다.

| 동작 | 결과 |
| --- | --- |
| 스크랩에서 주제 연결 | topic-source relation 생성, 주제 자료 탭에 노출 |
| 주제에서 스크랩 추가 | 해당 topicId가 기본 연결된 source 생성 |
| 주제 삭제/보관 | source는 유지하고 relation만 비활성 또는 숨김 |
| 주제 작업면에서 source 사용 | 사용 이력과 citation relation 기록 |

### 할 일 연계

`할 일 만들기`는 source에서 실행 항목을 뽑아 task를 생성한다.

| source 예시 | task 후보 |
| --- | --- |
| 아침 루틴 영상 | “7일간 아침 루틴 실험하기”, 체크리스트 5개 |
| 시장 전망 PDF | “하반기 리스크 요약 리포트 작성” |
| 배터리 기사 | “전고체 배터리 동향 조사 보강” |
| 여행 블로그 | “도쿄 3박 4일 코스에 후보 장소 반영” |

task는 sourceId를 근거로 보관하고, 할 일 상세에서 원문/요약으로 돌아갈 수 있어야 한다.

### 리포트 빌더 연계

리포트 빌더는 여러 source를 선택해 문서형 artifact를 만드는 화면이다. 스크랩 화면에서는 다음 진입을 지원한다.

| 진입 | 처리 |
| --- | --- |
| 단일 source에서 `리포트에 사용` | 리포트 빌더를 열고 해당 source를 선택 |
| 다중 선택 후 `리포트 만들기` | 선택한 sourceIds로 개요 생성 단계 진입 |
| 관련 소스 `모두 보기` | 관련 source를 추가 선택한 뒤 리포트 빌더로 이동 |
| PDF/기사 source | citation과 page/paragraph anchor를 리포트 근거로 전달 |

리포트 빌더는 source 요약만 사용하지 않고 원문 anchor와 citation을 함께 받아야 한다. 요약만 기반으로 문서를 만들면 근거 검증과 인용 커버리지가 약해진다.

### 파일 연계

파일 화면은 파일 자산 자체를 관리하고, 스크랩 화면은 파일을 읽을 수 있는 source로 정리한다. PDF 업로드 시 file_asset과 source가 모두 생길 수 있다.

| 파일 이벤트 | 스크랩 영향 |
| --- | --- |
| 파일 업로드 | file_asset 생성 후 source 처리 시작 |
| 파일 권한 변경 | source 접근 가능 상태와 요약 재사용 가능 여부 갱신 |
| 파일 삭제 | 연결 source 삭제 또는 원본 없음 상태 전환 |
| 파일 재처리 | source summary, extractedText, processing log 갱신 |

## 9. 상태/빈 상태/로딩/에러/권한 edge case

### 빈 상태

| 상황 | UI |
| --- | --- |
| 전체 스크랩 없음 | 중앙에 `새로운 스크랩 추가`, URL/파일 drag & drop 영역, 예시 입력 표시 |
| 검색 결과 없음 | 검색어와 필터 요약, `필터 초기화`, `새 스크랩 추가` |
| 특정 유형 없음 | 해당 유형 설명과 추가 CTA. 예: PDF 탭은 PDF 업로드 CTA |
| 대기 중 없음 | “처리 중인 스크랩이 없습니다”와 전체 보기 CTA |

### 로딩 상태

| 영역 | 로딩 방식 |
| --- | --- |
| 초기 목록 | 카드 skeleton 6개, 탭 카운트 skeleton |
| 상세 패널 | 선택 즉시 header skeleton, 요약/원문은 탭별 지연 로딩 |
| 처리 중 카드 | metadata가 있으면 제목/썸네일 표시, 요약 영역만 skeleton |
| 태그/관련 소스 | 요약 완료 후 별도 skeleton 또는 lazy load |
| 원문 탭 | 긴 transcript/PDF는 chunk 단위 로딩과 검색 skeleton |

### 에러 상태

| 에러 | 처리 |
| --- | --- |
| URL 접근 실패 | 실패 사유, 원본 열기, 재시도, 수동 원문 붙여넣기 |
| 중복 URL | 기존 source 카드로 이동하거나 새 메모만 추가할지 선택 |
| 파일 용량 초과 | 제한 용량 표시, 압축/분할 안내, 파일 화면으로 이동 |
| 지원하지 않는 파일 | 지원 타입 안내, 메모 source로 저장 옵션 |
| transcript 없음 | 자막 없음 표시, 오디오 전사 시 비용/시간 안내 후 실행 |
| PDF 암호화 | 비밀번호 입력 또는 처리 불가 표시 |
| 요약 실패 | 원문은 유지하고 `재요약` CTA 제공 |
| 태그 생성 실패 | 태그 없이 저장하고 수동 태그 추가 가능 |
| 관련 소스 실패 | 해당 섹션만 에러 처리, 핵심 상세는 유지 |

### 권한과 보안 edge case

| 상황 | 처리 |
| --- | --- |
| 외부 서비스 연결 만료 | source는 유지, 원본/스크립트 재처리 비활성, 연결 화면 재인증 CTA |
| YouTube 비공개/삭제 영상 | 기존 저장 metadata와 transcript는 정책에 따라 보존, 원본 열기 실패 표시 |
| paywall 기사 | 추출 가능한 preview만 저장, 전체 원문 필요 시 사용자 입력 유도 |
| robots 또는 약관 제한 | 추출 제한 표시, 원본 링크와 사용자 메모 중심 저장 |
| 공유 주제에 연결 | 사용자의 source 열람 권한과 주제 멤버 권한을 분리 검증 |
| 민감 정보 감지 | 기본 `검수 필요`, 기억 저장 전 경고, AI 참조 제외 옵션 |
| 삭제 권한 없음 | 삭제/보관 비활성, 소유자 또는 관리자에게 요청 CTA |
| 파일 바이러스 검사 대기 | source 처리 시작 전 `검사 중`, 원문 접근 차단 |
| 임베딩 생성 실패 | 검색/관련 소스 품질 저하 표시, 요약은 유지 |
| 비용 한도 초과 | 요약/전사/재처리 실행 전 승인 카드 또는 비용 설정 이동 |

### 동시성과 일관성

| 상황 | 처리 |
| --- | --- |
| 처리 중 사용자가 삭제 | job 취소 요청 후 source를 deleting 또는 archived로 전환 |
| 재요약 중 태그 수정 | 사용자 태그는 유지, AI 태그만 갱신 |
| 주제 연결 직후 필터 변경 | relation 저장 결과를 먼저 반영하고 목록 필터 재계산 |
| 기억 저장 중 source 삭제 | memory 생성 요청 취소 또는 source 삭제 대기 |
| 같은 URL 동시 추가 | canonicalUrl 기준 dedupe, clientGeneratedId로 임시 카드 병합 |
| 오프라인 상태 | 로컬 draft만 유지, source 생성은 재연결 후 실행 |

## 10. 데이터 필드/API 힌트

### 주요 타입

```ts
type SourceType = 'url' | 'memo' | 'file' | 'video' | 'article' | 'blog' | 'pdf';
type SourceStatus = 'pending' | 'processing' | 'summarized' | 'failed' | 'archived' | 'retrying';
type SourceProvider = 'youtube' | 'web' | 'upload' | 'google_drive' | 'manual';
type SourcePermissionState = 'readable' | 'partial' | 'login_required' | 'expired' | 'blocked';
type SourceExtractionState = 'not_started' | 'metadata_done' | 'text_done' | 'summary_done' | 'failed';
type SourceLinkType = 'topic' | 'memory' | 'task' | 'document' | 'file_asset';
```

### source 필드

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| id | string | source ID |
| hubId | string | 허브/워크스페이스 범위 |
| sourceType | SourceType | URL, 메모, 파일, 영상, 기사, 블로그, PDF |
| status | SourceStatus | 처리 상태 |
| provider | SourceProvider | 원본 provider |
| title | string | 카드/상세 제목 |
| description | string \| null | 원본 설명 또는 카드 보조 설명 |
| originalUrl | string \| null | 입력 URL |
| canonicalUrl | string \| null | dedupe 기준 URL |
| thumbnailUrl | string \| null | 썸네일/대표 이미지 |
| publisher | string \| null | 매체, 채널, 파일 제공자 |
| author | string \| null | 작성자 |
| publishedAt | string \| null | 원본 발행일 |
| capturedAt | string | 스크랩 생성일 |
| lastProcessedAt | string \| null | 마지막 처리일 |
| durationSeconds | number \| null | 영상 길이 |
| fileAssetId | string \| null | 연결 file_asset ID |
| fileName | string \| null | 파일명 |
| fileSizeBytes | number \| null | 파일 크기 |
| pageCount | number \| null | PDF 페이지 수 |
| language | string \| null | 감지 언어 |
| summary | string \| null | AI 요약 |
| keyPoints | SourceKeyPoint[] | 핵심 포인트 |
| aiTags | SourceTag[] | AI 생성 태그 |
| userTags | SourceTag[] | 사용자 태그 |
| topicLinks | SourceTopicLink[] | 연결 주제 |
| memoryLinks | SourceMemoryLink[] | 생성된 기억 |
| taskLinks | SourceTaskLink[] | 생성된 할 일 |
| documentLinks | SourceDocumentLink[] | 사용된 리포트/문서 |
| permissionState | SourcePermissionState | 원본/파일 접근 권한 |
| extractionState | SourceExtractionState | 처리 단계 |
| failureReason | string \| null | 실패 사유 |
| retryCount | number | 재시도 횟수 |
| favorite | boolean | 북마크 여부 |
| archivedAt | string \| null | 보관일 |
| createdBy | string | 생성자 |
| updatedAt | string | 수정일 |

### 상세 콘텐츠 필드

| 객체 | 필드 | 설명 |
| --- | --- | --- |
| SourceContent | sourceId, rawText, extractedText, transcriptText, noteText, textChunks | 원문/스크립트/메모 본문 |
| SourceTranscriptSegment | id, sourceId, startSeconds, endSeconds, text | 영상 스크립트 timecode |
| SourcePdfPage | id, sourceId, pageNumber, text, thumbnailUrl | PDF 페이지별 텍스트 |
| SourceKeyPoint | id, sourceId, text, order, citationAnchor | 핵심 포인트 |
| SourceTag | id, sourceId, label, tagType, hidden | 태그 |
| SourceProcessingLog | id, sourceId, step, status, message, createdAt | 처리 로그 |
| SourceRelation | id, sourceId, targetType, targetId, createdAt, createdBy | topic/memory/task/document/file 연결 |
| RelatedSource | sourceId, relatedSourceId, score, reason | 관련 소스 추천 |

### API 힌트

| API | 설명 |
| --- | --- |
| `GET /api/sources` | 목록 조회. 검색, 유형, 상태, 태그, 주제, 권한, 정렬, 페이지네이션 지원 |
| `POST /api/sources` | URL 또는 메모 source 생성 |
| `POST /api/sources/batch` | 여러 URL/메모 일괄 생성 |
| `POST /api/sources/upload` | 파일 업로드와 source 생성 |
| `GET /api/sources/{sourceId}` | 상세 조회. 메타, 요약, 태그, relation 포함 |
| `GET /api/sources/{sourceId}/content` | 원문, 스크립트, PDF text chunk 조회 |
| `PATCH /api/sources/{sourceId}` | 제목, 메모, 태그, favorite, 보관 상태 수정 |
| `POST /api/sources/{sourceId}/process` | 처리 또는 재처리 job 시작 |
| `POST /api/sources/{sourceId}/retry` | 실패한 처리 재시도 |
| `POST /api/sources/{sourceId}/topics` | 주제 연결 |
| `DELETE /api/sources/{sourceId}/topics/{topicId}` | 주제 연결 해제 |
| `POST /api/sources/{sourceId}/memories` | 기억 후보 생성/저장 |
| `POST /api/sources/{sourceId}/tasks` | 할 일 생성 |
| `GET /api/sources/{sourceId}/related` | 관련 소스 조회 |
| `DELETE /api/sources/{sourceId}` | 삭제 또는 휴지통 이동 |

목록 API는 카드 렌더링에 필요한 요약 필드만 반환한다. 긴 원문, transcript, PDF page text는 선택된 source의 상세 탭에서 별도 호출한다.

### 라우팅과 URL 상태

| URL 예시 | 의미 |
| --- | --- |
| `/scrap` | 전체 최신순 목록 |
| `/scrap?type=video&provider=youtube` | YouTube 탭 또는 영상 필터 |
| `/scrap?status=pending` | 대기 중/처리 중 목록 |
| `/scrap?topicId=topic_123` | 특정 주제에 연결된 스크랩 |
| `/scrap/{sourceId}` | 특정 스크랩 상세 선택 |
| `/scrap/{sourceId}?tab=script` | 스크립트 탭 선택 |
| `/scrap?mode=select&target=report` | 리포트 빌더용 다중 선택 |

### BE-FE prop 이름 제안

목록과 상세에서 같은 의미의 prop 이름을 다르게 쓰지 않는다.

| 의미 | 권장 prop |
| --- | --- |
| 처리 상태 | `status` |
| 유형 | `sourceType` |
| 원본 서비스 | `provider` |
| 연결 주제 | `topicLinks` |
| 생성 기억 | `memoryLinks` |
| 핵심 포인트 | `keyPoints` |
| 사용자 메모 | `noteText` |
| 추출 원문 | `extractedText` |
| 영상 스크립트 | `transcriptText`, `transcriptSegments` |
| 권한 상태 | `permissionState` |
| 처리 단계 | `extractionState` |

## 11. 수용 기준

### 목록과 입력

| 기준 | 수용 조건 |
| --- | --- |
| 빠른 입력 | URL, 일반 메모, 파일 첨부를 같은 입력 영역에서 추가할 수 있다 |
| URL 감지 | YouTube, 일반 기사/블로그, PDF URL을 자동 분류한다 |
| 유형 탭 | 전체/유튜브/기사/블로그/PDF/대기 중 탭과 카운트가 표시된다 |
| 정렬 | 최신순 기본이며 정렬 변경 후 선택 상태가 유지된다 |
| 보기 전환 | 그리드와 리스트 전환 후 필터, 선택 source, 스크롤 상태가 유지된다 |
| 필터 | 유형, 상태, 태그, 연결 주제, 권한, 날짜 필터를 조합할 수 있다 |
| 새 스크랩 카드 | 목록 마지막에서 새 스크랩 추가 동선을 제공한다 |

### 카드와 상세

| 기준 | 수용 조건 |
| --- | --- |
| 카드 정보 | 유형 배지, 썸네일/아이콘, 제목, 출처, 날짜, 요약, 핵심 포인트, 태그, 연결 주제가 표시된다 |
| 선택 상태 | 카드 선택 시 파란 테두리와 우측 상세 패널이 동기화된다 |
| 상세 헤더 | 유형, 재생 시간/파일 크기, 제목, 출처, 날짜, 원본 열기, 북마크가 표시된다 |
| 상세 탭 | 요약, 스크립트/원문, 메모, 정보 탭을 제공한다 |
| 태그 편집 | AI 태그와 사용자 태그를 구분하고 사용자가 추가/삭제할 수 있다 |
| 관련 소스 | 관련 소스 목록과 모두 보기 액션을 제공한다 |

### 처리 상태

| 기준 | 수용 조건 |
| --- | --- |
| pending/processing | 대기/처리 중 카드가 목록에 표시되고 대기 중 탭 카운트에 포함된다 |
| summarized | 처리 완료 후 요약, 핵심 포인트, 태그, 원문 탭이 표시된다 |
| failed | 실패 사유, 재시도, 원문 수동 입력 또는 삭제 액션이 표시된다 |
| archived | 보관 항목은 기본 목록에서 제외되고 보관함에서 복원 가능하다 |
| 재요약 | 기존 사용자 태그와 메모는 유지하고 AI 요약/AI 태그만 갱신한다 |

### 연계

| 기준 | 수용 조건 |
| --- | --- |
| 주제 | source를 하나 이상의 topic에 연결/해제할 수 있고 주제 자료 탭에 반영된다 |
| 기억 | summarized source에서 memory 후보를 만들고 memory 출처로 sourceId를 연결한다 |
| 할 일 | source 기반 task를 생성하고 task 상세에서 source로 돌아갈 수 있다 |
| 파일 | 파일/PDF source는 file_asset과 연결되고 파일 권한 변경을 반영한다 |
| 리포트 빌더 | 단일/다중 source를 리포트 빌더 소스 선택에 전달하고 citation anchor를 보존한다 |

### 권한과 에러

| 기준 | 수용 조건 |
| --- | --- |
| 외부 권한 만료 | 재처리/스크립트 fetch가 비활성되고 연결 화면 재인증 CTA가 표시된다 |
| 중복 URL | 기존 source 이동 또는 새 메모 추가 중 선택할 수 있다 |
| 파일 제한 | 용량 초과, 타입 미지원, 바이러스 검사 대기 상태를 표시한다 |
| 민감 정보 | 민감 가능 source는 검수 필요 상태와 AI 참조 제외 옵션을 가진다 |
| 비용 한도 | 전사, OCR, 재요약 등 비용 발생 작업 전 승인 또는 차단 상태를 표시한다 |
| 삭제 영향 | 삭제 전 연결된 주제, 기억, 할 일, 문서 citation 영향을 표시한다 |

## 12. 엣지케이스 자체 리뷰

개발 착수 전 아래 항목을 별도 점검한다.

| 점검 항목 | 확인 내용 |
| --- | --- |
| 값 변경 후 읽는 곳 | `status`, `summary`, `keyPoints`, `tags`, `topicLinks`, `memoryLinks`, `taskLinks`, `favorite` 변경 시 목록 카드, 상세 패널, 탭 카운트, 주제/기억/할 일 화면이 갱신되는지 확인 |
| 이름 충돌 | PRD의 `source`는 원자료 객체이고 기억의 출처 relation과 혼동될 수 있으므로 relation은 `SourceRelation`, `memorySourceLink`처럼 분리 |
| BE-FE prop 이름 | `sourceType`, `provider`, `permissionState`, `extractionState`, `topicLinks`, `keyPoints`, `noteText`를 목록/상세/연계 API에서 동일하게 사용 |
| 리스트 key | source 카드, keyPoint, tag, topic chip, related source, transcript segment, PDF page는 모두 안정적인 ID를 key로 사용 |
| BE-FE prop 불일치 | 상세 탭 라벨이 `스크립트`여도 API는 `transcriptText`와 `extractedText`를 구분해 전달 |
| 처리 동시성 | 삭제/보관/재요약/태그 편집이 동시에 발생할 때 사용자 입력이 AI 재처리 결과에 덮이지 않는지 확인 |
| 트랜잭션 경계 | source 생성, file_asset 생성, processing job enqueue는 RDB 저장과 비동기 작업을 분리하고 job 실패 시 source 상태를 갱신 |
| 권한 전파 | 파일 권한 만료, 외부 연결 만료, 공유 주제 권한 변경이 source 상세와 연계 화면에 반영되는지 확인 |
| 삭제 영향 | source 삭제 시 memory 출처, topic relation, task 근거, document citation, embedding index 제거 범위를 분리 |
| 중복 처리 | canonicalUrl dedupe와 사용자가 같은 URL을 다른 목적 메모로 저장하는 케이스를 구분 |
| 모바일 전환 | 3열 구조가 모바일에서 목록 우선, 상세는 bottom sheet 또는 별도 route로 전환되는지 확인 |

## 13. 오픈 질문

| 질문 | 후보/검토 방향 |
| --- | --- |
| 탭 카운트 기준 | 전체 hub 기준인지 현재 검색/필터 기준인지 결정 필요. 기본은 현재 필터 반영 + tooltip에 전체 표시 |
| `스크립트` 탭 라벨 | 영상은 스크립트, 기사/PDF는 원문이 자연스러움. source type별 라벨 변경 여부 결정 |
| `retrying` 상태 | PRD 공통 `source` 상태에 추가할지, `processing + retryCount`로 표현할지 결정 |
| 메모 source와 사용자 메모 탭 | 순수 메모 source의 본문과 일반 source의 사용자 메모를 같은 필드로 둘지 분리할지 결정 |
| 스크랩 삭제 정책 | 즉시 삭제, 휴지통, archive 중 기본 정책 결정. memory/task/document relation 영향 큼 |
| paywall/robots 제한 | 저장 가능한 preview 범위와 사용자 수동 원문 입력 허용 범위 결정 |
| 영상 전사 비용 승인 | 자막 없는 영상에서 자동 전사를 바로 실행할지, 비용 확인 후 실행할지 결정 |
| PDF OCR 범위 | 스캔본 OCR을 MVP에 포함할지, 텍스트 PDF만 우선 지원할지 결정 |
| 관련 소스 추천 기준 | 임베딩 유사도, 태그, 같은 주제 중 어떤 기준을 우선할지 결정 |
| 리포트 빌더 진입 위치 | 상세 액션에 `리포트에 사용`을 바로 둘지, 다중 선택 모드에서만 제공할지 결정 |
| 기억 저장 자동화 | 요약 완료 즉시 기억 후보를 자동 생성할지, 사용자가 `기억으로 저장`을 눌렀을 때만 생성할지 결정 |
| 공유 허브 권한 | 개인 스크랩을 공유 주제에 연결할 때 원문/메모/요약 중 무엇이 공유되는지 정책 필요 |
