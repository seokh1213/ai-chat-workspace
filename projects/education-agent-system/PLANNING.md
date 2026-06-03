# Education Agent System Planning

작성일: 2026-06-03

## 1. 핵심 관점

이 프로젝트는 LLM을 특별한 교육 서비스로 포장하는 것이 아니라, 장시간 실행 가능한 에이전트가 학습 운영을 맡는 시스템으로 접근한다.

Codex를 단순한 코딩 도구로 보지 않는다. Codex는 파일, 저장소, 브라우저, 외부 API, 로컬 명령, 장기 작업에 접근할 수 있는 에이전트 런타임이다. 이 능력을 교육 도메인에 적용하면 다음 역할을 수행할 수 있다.

- 진단 평가 생성
- 학습자 답안 채점
- 오답 원인 분석
- 약점 기록 갱신
- 다음 세션 설계
- 학습 자료 검색 및 요약
- 장기 리포트 작성
- 학습 저장소 정리

따라서 목표는 "ChatGPT에서 대화로 공부하기"가 아니라, ChatGPT 밖에서 동작하는 개인 교육 운영체제를 만드는 것이다.

## 2. 문제 정의

사용자는 논리적으로 말하거나 쓰는 능력을 다시 훈련하고 싶다. 고등학교 시절에는 국어 비문학/문학 시험을 풀 수 있었지만, 현재는 별도 문제집을 사서 지속적으로 공부할 의지와 시간이 부족하다.

필요한 것은 일반적인 강의 플랫폼이 아니다. 매일 짧은 시간 안에 다음을 반복시키는 시스템이 필요하다.

- 읽기
- 핵심 주장 찾기
- 근거와 전제 분리하기
- 반론 만들기
- 짧게 말하거나 쓰기
- 피드백 받기
- 약점이 누적된 다음 문제 풀기

영역은 우선 국어 논리 독해와 영어 writing/speaking을 중심으로 둔다.

## 3. 제품 목표

### 3.1 단기 목표

- Codex 기반 학습 세션을 저장소 단위로 운영한다.
- 매일 20분짜리 국어/영어 훈련 세션을 생성한다.
- 사용자의 답안을 Markdown 또는 JSON으로 저장한다.
- AI가 루브릭에 따라 채점하고 약점 파일을 갱신한다.
- 다음 학습 세션이 이전 약점을 반영하도록 한다.

### 3.2 중기 목표

- 웹 UI에서 학습 세션을 열고 답안을 제출한다.
- 채점 결과와 약점 변화를 시각화한다.
- 문제 생성, 채점, 복습 스케줄링을 에이전트 작업으로 분리한다.
- 외부 저장소를 통해 대화가 끊겨도 학습 상태가 이어지게 한다.

### 3.3 장기 목표

- Codex App, Codex CLI, codex-app-server, OpenAI API 중 상황에 맞는 런타임을 선택할 수 있게 한다.
- 개인용 학습 저장소에서 제품형 교육 플랫폼으로 확장한다.
- 국어/영어 외에도 사고 정리, 기술 글쓰기, 면접 답변, 발표 스크립트까지 같은 구조로 확장한다.

## 4. 비목표

- 기존 수능/문제집 문항을 그대로 복제하지 않는다.
- 단순 챗봇형 Q&A 앱을 목표로 하지 않는다.
- 모든 기억을 LLM 컨텍스트에만 맡기지 않는다.
- 초기에 완전한 LMS, 결제, 다중 사용자 관리까지 만들지 않는다.

## 5. 시스템 가설

LLM 자체는 점점 보편화된다. 차별점은 모델이 아니라 다음 네 가지에 있다.

- 어떤 학습 기록을 남기는가
- 어떤 루브릭으로 평가하는가
- 약점을 어떤 체계로 분류하는가
- 에이전트가 다음 행동을 어떻게 선택하는가

이 시스템은 모델보다 운영 구조를 중심에 둔다. 즉, "좋은 답변을 해주는 AI"가 아니라 "학습자의 장기 상태를 읽고 다음 수업을 운영하는 에이전트"가 핵심이다.

## 6. 권장 초기 구조

초기에는 웹앱보다 학습 저장소를 먼저 만든다. 저장소는 Codex가 읽고 쓰는 장기 기억 역할을 한다.

```text
education-agent-system/
  AGENTS.md
  README.md
  learner/
    profile.md
    weaknesses.json
    progress.md
  curriculum/
    korean-logic.md
    english-writing.md
    english-speaking.md
  rubrics/
    korean-argument.json
    english-writing.json
    english-speaking.json
  sessions/
    2026-06-03.md
  attempts/
    2026-06-03-korean-001.md
    2026-06-03-english-001.md
  reports/
    weekly-2026-W23.md
```

이 구조에서는 Codex에게 다음처럼 지시할 수 있다.

```text
최근 attempts와 weaknesses를 읽고 오늘 학습 세션을 만들어줘.
국어 논리 2문제, 영어 writing 1문제, 이전 약점 복습 1문제를 포함해.
내 답안을 채점한 뒤 attempts에 저장하고 weaknesses를 갱신해줘.
```

## 7. Codex와 codex-app-server의 위치

### 7.1 Codex CLI

개인 학습 저장소를 운영하는 가장 단순한 런타임이다.

- 파일 읽기/쓰기
- 세션 문서 생성
- 답안 채점 결과 저장
- 약점 JSON 갱신
- Git으로 학습 이력 추적

초기 검증에는 CLI만으로 충분하다.

### 7.2 Codex App

여러 학습 작업을 병렬로 굴리고, diff를 확인하고, 브라우저 UI까지 함께 볼 때 적합하다.

- 오늘 세션 생성
- 답안 채점
- 주간 리포트 생성
- 웹앱 수정
- 테스트 및 브라우저 확인

학습 운영자 겸 개발 에이전트 콘솔로 볼 수 있다.

### 7.3 codex-app-server

codex-app-server는 교육 도메인 서버 그 자체라기보다, Codex 에이전트를 별도 클라이언트나 앱에 붙이는 계층으로 본다.

가능한 사용 방식:

- 웹 학습 UI에서 Codex 세션을 호출한다.
- 학습 저장소의 파일 변경을 Codex가 수행한다.
- 사용자는 브라우저 UI에서 답안을 제출하고, Codex는 채점/기록 갱신을 맡는다.
- 장시간 작업, approval, streaming event, conversation history를 앱 표면으로 끌어올린다.

단, 학습자의 장기 상태는 codex-app-server가 아니라 외부 저장소에 명시적으로 보관한다.

## 8. 외부 저장소 설계

초기에는 Markdown과 JSON 파일을 우선 사용한다. 이후 제품화 단계에서 DB로 옮긴다.

### 8.1 파일 기반

장점:

- Codex가 직접 읽고 쓰기 쉽다.
- Git으로 변화 추적이 가능하다.
- 사람이 검토하기 쉽다.
- 초기 실험 비용이 낮다.

단점:

- 동시성 관리가 약하다.
- 검색/통계/대시보드에는 DB보다 불리하다.

### 8.2 DB 기반

후보:

- SQLite: 개인용 로컬 앱
- Supabase Postgres: 웹앱 및 다중 사용자
- Vector store: 유사 오답 검색, 장기 기억 검색

초기에는 파일 기반으로 학습 모델을 검증한 뒤, 테이블 스키마로 승격한다.

## 9. 핵심 데이터

### 9.1 Learner Profile

```json
{
  "name": "personal",
  "primaryGoals": ["korean_logic", "english_writing"],
  "availableMinutesPerDay": 20,
  "preferredFeedbackStyle": "direct",
  "currentLevel": {
    "korean_logic": "unknown",
    "english_writing": "unknown"
  }
}
```

### 9.2 Weaknesses

```json
{
  "korean_logic": [
    {
      "id": "claim-evidence-gap",
      "label": "주장과 근거 연결이 약함",
      "severity": 3,
      "lastSeen": "2026-06-03",
      "evidence": ["반론 문항에서 근거 없이 결론만 제시함"]
    }
  ],
  "english_writing": [
    {
      "id": "sentence-structure-simple",
      "label": "문장 구조가 단조로움",
      "severity": 2,
      "lastSeen": "2026-06-03",
      "evidence": ["because 반복, concession 부족"]
    }
  ]
}
```

### 9.3 Attempt

```yaml
id: 2026-06-03-korean-001
date: 2026-06-03
area: korean_logic
problemType: argument_analysis
score: 68
tags:
  - claim
  - evidence
  - counterargument
```

시도 문서에는 문제, 사용자 답안, 루브릭 채점, 피드백, 다음 액션을 함께 기록한다.

## 10. 학습 세션 흐름

```text
1. Codex가 learner/profile.md, weaknesses.json, 최근 attempts를 읽는다.
2. 오늘 세션 목표를 정한다.
3. 문제를 생성한다.
4. 사용자가 답한다.
5. Codex가 루브릭으로 채점한다.
6. Codex가 weakness를 갱신한다.
7. Codex가 짧은 재시도 문제 또는 다음 세션 예고를 만든다.
8. 결과를 sessions, attempts, reports에 저장한다.
```

## 11. 교육 방식

### 11.1 국어

훈련 유형:

- 핵심 주장 찾기
- 숨은 전제 찾기
- 근거와 예시 구분
- 반론 만들기
- 글 구조 요약
- 4문장 입장문 작성

기본 문제 형식:

```text
다음 글을 읽고 답하라.

1. 핵심 주장을 한 문장으로 쓰기
2. 글쓴이가 암묵적으로 전제하는 내용을 쓰기
3. 가능한 반론 쓰기
4. 본인 입장을 4문장으로 쓰기
```

### 11.2 영어

훈련 유형:

- 5 sentence opinion writing
- claim-reason-example-counterpoint-conclusion 구조
- 짧은 speaking script 작성
- 한국어 생각을 영어 논리 구조로 재배열
- 문장 단조로움 개선

기본 문제 형식:

```text
Write 5 sentences.

1. Claim
2. Reason
3. Example
4. Limitation or counterpoint
5. Conclusion
```

## 12. 에이전트 역할

### 12.1 Session Designer

최근 기록을 읽고 오늘의 문제 구성을 정한다.

### 12.2 Problem Generator

학습 목표와 약점에 맞는 문제를 생성한다.

### 12.3 Evaluator

루브릭에 따라 답안을 채점한다. 점수보다 중요한 것은 오답 원인의 구조화다.

### 12.4 Memory Curator

weaknesses, progress, reports를 갱신한다. 장기 기억을 너무 길게 만들지 않고 압축한다.

### 12.5 Coach

사용자에게 다음 행동을 제안한다. 설명보다 재시도와 짧은 반복을 우선한다.

## 13. MVP 범위

### 13.1 MVP 0: 저장소 기반 수업

- 학습 저장소 생성
- AGENTS.md 작성
- 진단 세션 1개 작성
- 국어/영어 루브릭 작성
- 사용자가 답하면 Codex가 채점하고 기록 갱신

### 13.2 MVP 1: 로컬 웹 UI

- 오늘 세션 보기
- 답안 입력
- 채점 결과 보기
- 약점 목록 보기
- Markdown/JSON 저장소와 동기화

### 13.3 MVP 2: 에이전트 서버 연결

- codex-app-server 또는 별도 agent backend 연결
- streaming 진행 상황 표시
- 장시간 채점/리포트 생성 작업 실행
- 승인 필요한 변경은 사용자에게 확인

### 13.4 MVP 3: 제품화

- 사용자 계정
- DB 저장
- 주간 리포트
- 음성 답변
- 문제 품질 평가
- 커리큘럼 버전 관리

## 14. 성공 기준

초기 성공 기준:

- 7일 연속 20분 세션을 운영할 수 있다.
- 매 세션 후 weakness가 갱신된다.
- 다음 세션 문제가 이전 약점을 반영한다.
- 사용자가 자신의 사고 습관 변화를 문서로 확인할 수 있다.

제품 성공 기준:

- 사용자가 ChatGPT 대화창을 열지 않고도 학습을 계속할 수 있다.
- 학습 기록이 플랫폼 안에 명시적으로 남는다.
- 모델을 바꿔도 루브릭, 기록, 커리큘럼은 유지된다.
- 에이전트가 단순 답변자가 아니라 학습 운영자로 동작한다.

## 15. 다음 액션

1. `education-agent-system` 샘플 저장소 구조를 실제로 만든다.
2. `AGENTS.md`에 학습 운영 규칙을 작성한다.
3. 국어 논리와 영어 writing 진단 문제를 만든다.
4. 첫 답안 저장 포맷과 채점 루브릭을 확정한다.
5. 3일치 수동 운영 후 반복되는 흐름을 자동화 대상으로 분리한다.

