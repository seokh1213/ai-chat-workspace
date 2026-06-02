# AI 냄새 제거 하네스

## 목적

AI를 쓰지 말자는 문서가 아님. LLM이 만든 기본값을 그대로 받아들였을 때 반복되는 문체, 화면 패턴, 상태 표현을 잡아내고 Ulsabio만의 제품 질감으로 다시 바꾸기 위한 검수 하네스임.

GeekNews의 `LLM이 만들어낸 "AI 냄새들"` 정리는 글쓰기에서 짧은 명언식 문장, 연속 단문, 고정 은유 문형이 반복되고, 웹사이트에서는 비슷한 mono font, step/list layout, card/button, blinking badge가 반복된다는 관찰에 가깝다. Ulsabio에서는 이 관찰을 디자인 금지령이 아니라 리뷰 규칙으로 사용한다.

참고: https://news.hada.io/topic?id=29997

## 적용 범위

- 제품 카피: empty state, loading, error, onboarding, 버튼 라벨, 도움말.
- 채팅 응답: assistant message, tool result, workspace 전환 안내, 승인 요청.
- 화면 구성: dashboard, workspace, agent builder, todo map, report builder, settings.
- 디자인 샘플: 생성 이미지 기반 mockup, refined production mockup, 실제 React 구현.
- 문서: PRD, task spec, AI에게 넘길 구현 지시서.

## 핵심 원칙

1. 제품 고유 명사와 실제 객체를 먼저 보여줌.
2. 의미 없는 멋진 문장을 줄이고 사용자가 다음에 할 수 있는 행동을 보여줌.
3. 자동화 상태는 연극처럼 과장하지 않고 실제 실행 단위, 로그, 승인 지점을 보여줌.
4. 카드는 반복 항목에만 쓰고, 화면 전체를 카드 더미로 만들지 않음.
5. mono font는 코드, 토큰, 로그, 시간, ID에만 사용함.
6. blinking dot, glass panel, purple gradient, vague AI badge는 기본값에서 제외함.
7. 화면마다 정보 밀도와 상호작용 밀도를 다르게 둠.

## 문체 검수

| 냄새 | 증상 | 대체 기준 |
|---|---|---|
| 한 줄 명언식 문장 | 짧고 강한 문장이 실제 기능 설명을 대신함 | 현재 상태와 다음 행동을 말함 |
| 연속 단문 | 문장이 끊겨서 리듬만 있고 정보가 적음 | 원인, 대상, 결과를 한 문장 안에 연결함 |
| 고정 은유 | `X는 Y의 Z다` 식으로 의미를 부풀림 | 도메인 객체 이름을 직접 사용함 |
| 대비 문형 남용 | `단순히 X가 아니라 Y`가 반복됨 | 실제 차이를 표나 상태값으로 보여줌 |
| 과한 메타 설명 | `AI가 분석 중`, `에이전트가 생각 중`이 남발됨 | 어떤 tool, workspace, artifact를 다루는지 표시함 |

## 화면 검수

| 냄새 | 증상 | 대체 기준 |
|---|---|---|
| 카드 과밀 | 모든 섹션이 떠 있는 카드로 구성됨 | shell, panel, list, table, timeline을 역할별로 분리함 |
| 장식 badge | 의미 없는 `Live`, `AI`, `Beta`와 점멸 dot | 실제 run 상태, queue, approval, error count를 사용함 |
| mono font 남용 | 제목과 본문까지 mono로 처리됨 | 인터페이스 본문은 sans, technical value만 mono |
| step layout 반복 | 1-2-3 단계가 화면마다 동일하게 배치됨 | 작업 성격별로 timeline, map, table, canvas를 선택함 |
| 버튼 복제 | 같은 radius, 같은 glow, 같은 gradient CTA | 명령의 위험도와 빈도에 따라 primary, secondary, ghost를 구분함 |
| 가짜 활동 | 애니메이션이 실제 상태와 연결되지 않음 | SSE event, job state, tool call state에만 움직임 부여 |

## 점수 기준

각 산출물은 20점 만점으로 검수한다.

| 항목 | 배점 | 통과 기준 |
|---|---:|---|
| 도메인 구체성 | 4 | workspace, tool, agent, artifact 같은 실제 객체가 보임 |
| 행동 명확성 | 4 | 사용자가 다음 액션을 알 수 있음 |
| 상태 신뢰성 | 4 | 자동화 상태가 실제 event model과 연결됨 |
| 시각 절제 | 4 | 장식보다 구조가 먼저 읽힘 |
| 문체 자연도 | 4 | 명언식/은유식 문장이 화면 기능을 대체하지 않음 |

판정:

- 18-20: 그대로 구현 가능.
- 15-17: minor copy/style 수정 후 구현.
- 11-14: IA 또는 component composition 재검토.
- 10 이하: AI 기본값에 가까움. 다시 생성.

## 리뷰 절차

1. 화면 목적을 한 문장으로 적음.
2. 화면의 실제 데이터 객체를 5개 이하로 적음.
3. 사용자의 주요 행동을 3개 이하로 적음.
4. 생성된 copy에서 명언식 문장, 연속 단문, 은유식 정의를 표시함.
5. 생성된 UI에서 반복 카드, mono 남용, 의미 없는 badge, step layout을 표시함.
6. 점수표를 채움.
7. 15점 미만이면 prompt가 아니라 정보 구조부터 수정함.

## Prompt 하네스

```text
Ulsabio는 개인형 agent platform이다.
화면은 실제 작업 도구처럼 보여야 한다.
AI 서비스처럼 보이는 장식, purple gradient, glass panel, blinking dot, 의미 없는 AI badge, 과한 hero copy를 쓰지 않는다.
copy는 짧되 상태와 다음 행동이 명확해야 한다.
도메인 객체는 workspace, agent, run, tool, artifact, approval, schedule, memory를 우선 사용한다.
반복 항목은 card/list/table/timeline 중 역할에 맞는 패턴을 사용한다.
mono font는 ID, log, timestamp, token, code에만 쓴다.
```

## 구현 전 체크리스트

- 화면 제목이 제품 기능을 직접 말하는가.
- 첫 viewport에서 사용자가 다룰 실제 객체가 보이는가.
- empty/loading/error 상태가 다음 행동을 포함하는가.
- 자동 실행 UI가 run id, agent id, tool name, status 중 하나 이상과 연결되는가.
- 같은 카드가 6개 이상 반복되면 table/list/timeline으로 바꿀 수 있는가.
- mono font가 본문 문장에 쓰이지 않았는가.
- badge가 status enum과 연결되는가.
- 애니메이션이 실제 state transition에 반응하는가.
- AI generated text는 raw text가 아니라 markdown renderer를 통과하는가.
- 이미지 기반 mockup과 refined mockup의 차이가 토큰과 컴포넌트 규칙으로 설명되는가.
