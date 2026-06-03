# Chafi 참고 프로젝트 심층 분석

분석 대상:

- `firma`: 개인 포트폴리오 SSOT, CLI/MCP, 데일리 브리프, 자산 추적 중심
- `Vibe-Trading`: 스킬 기반 리서치 에이전트, 백테스트, 스웜, 알파 레지스트리, shadow account 중심

이 문서는 두 프로젝트를 그대로 따라 하기 위한 문서가 아니다. Chafi가 만들려는 “근거 중심 투자 AI”에 어떤 구조를 흡수하고, 어떤 부분은 경계해야 하는지 정리한 설계 분석이다.

## 1. 저장 위치와 커버리지

로컬 경로:

- `firma`: `/Users/seokh1213/project/web/fullstack/ai-chat-workspace/projects/apps/chafi/firma`
- `Vibe-Trading`: `/Users/seokh1213/project/web/fullstack/ai-chat-workspace/projects/apps/chafi/Vibe-Trading`

분석 시점의 clone 상태:

- `firma`: `a435494`
- `Vibe-Trading`: `76629e8`

파일 규모:

- `firma`: 약 370개 파일
- `Vibe-Trading`: 약 1,211개 파일

주요 파일 분포:

`firma`:

- `apps/cli/src`: CLI 명령 표면
- `apps/mcp/src`: MCP 서버, 도구, 프롬프트
- `packages/shared/db`: SQLite 스키마와 repository
- `packages/domain/domain`: 심볼, 시장, 거시 신호, 도메인 타입
- `packages/adapter/adapters`: Finnhub, FRED, World Bank, GDACS, Yahoo 등 외부 데이터 어댑터
- `packages/use-case/brief`: 데일리 브리프 조립
- `packages/use-case/advisor`: 포트폴리오 조언 rule engine
- `packages/use-case/portfolio`: 포트폴리오 집계, sync, risk
- `test`: CLI/MCP parity 테스트
- `docs/plans`: 설계 및 리팩토링 계획 기록

`Vibe-Trading`:

- `agent/src/skills`: 75개 내외의 투자/리서치 스킬
- `agent/src/factors`: 452개 알파 팩터 레지스트리
- `agent/src/tools`: MCP/agent 도구
- `agent/src/agent`: ReAct loop, tool registry, skill loading
- `agent/backtest`: 백테스트 runner, loader, engine, run card
- `agent/src/swarm`: multi-agent DAG orchestration
- `agent/src/hypotheses`: 가설 registry
- `agent/src/memory`: persistent memory
- `agent/src/shadow_account`: shadow account 기능
- `frontend/src`: React 기반 UI
- `agent/tests`: security, backtest, swarm, memory, factor, API 테스트

## 2. firma 분석

### 2.1 제품의 핵심

`firma`는 투자 리서치 플랫폼이라기보다 “개인 자산의 원장과 브리프 생성기”에 가깝다. 핵심은 사용자의 거래, 현금흐름, 잔고, 가격, FX, 프로필을 로컬 SQLite에 저장하고, CLI와 MCP를 통해 같은 기능을 제공하는 것이다.

가장 중요한 설계 선택은 “transaction이 source of truth”라는 점이다. 포트폴리오 현재 상태를 직접 입력받는 것이 아니라, 거래 내역에서 보유 수량과 원가를 계산한다.

Chafi에 주는 교훈:

- 투자 AI도 먼저 원장을 가져야 한다.
- 현재 포지션은 거래와 가격의 파생 결과여야 한다.
- AI 답변은 원장을 읽는 계층이지 원장을 임의로 고치는 계층이면 안 된다.

### 2.2 데이터 모델

핵심 파일:

- `packages/shared/db/src/schema.ts`
- `packages/shared/db/src/repositories.ts`
- `packages/shared/db/src/aggregate.ts`

주요 테이블:

- `transactions`
- `balance_entries`
- `flow_entries`
- `portfolio_snapshots`
- `profile`
- `fx_rates`
- `prices`

`transactions`는 ticker, asset type, market, date, type, shares, price, currency, reason을 가진다. `prices`는 시장별 원 가격뿐 아니라 USD 기준 값도 저장한다. 이는 다국가/다통화 포트폴리오를 다루려는 의도가 보인다.

`aggregateHoldings`는 거래를 시간순으로 읽어 보유 수량과 원가를 계산한다.

- `buy`: 수량과 원가 증가
- `sell`: 매도 비율에 따라 원가 차감
- `deposit`: 가격이 있으면 원가 반영

Chafi에 적용할 점:

- 거래/가격/FX/스냅샷을 분리한다.
- 파생 지표는 계산 가능하게 만들고, 원천 입력과 섞지 않는다.
- 가격과 FX는 “언제 관찰했는지”와 “어떤 원천인지”를 반드시 저장한다.

한계:

- 투자 thesis, evidence, counter-evidence를 저장하는 구조는 없다.
- macro/뉴스/공시 원문을 원장화하는 설계는 약하다.
- 개인 자산 관리에는 적합하지만, 리서치 신념 업데이트 시스템으로는 확장이 필요하다.

### 2.3 시장 심볼과 자산 타입

핵심 파일:

- `packages/domain/domain/src/market/symbol.ts`

지원 시장:

- `US`
- `KRX`
- `KOSDAQ`
- `JP`
- `HK`
- `LSE`
- `XETRA`
- `NSE`
- `TW`

지원 asset type:

- `stock`
- `crypto`
- `commodity`
- `real_estate`
- `other`

심볼은 주식이면 `market:code`, 비주식이면 `asset_type:code` 형태로 정규화한다.

Chafi에 적용할 점:

- entity id를 초기에 제대로 설계해야 한다.
- `AAPL` 같은 티커만 저장하면 시장, 통화, 거래소, instrument type을 잃는다.
- 한국/미국/홍콩/일본/암호화폐를 함께 다루려면 canonical symbol layer가 필수다.

### 2.4 외부 데이터 어댑터

핵심 파일:

- `packages/adapter/adapters/src/registry.ts`
- `packages/adapter/adapters/src/finnhub.ts`
- `packages/adapter/adapters/src/fred.ts`

Provider 구성:

- 시장 데이터: Finnhub key가 있으면 Finnhub, 없으면 Yahoo
- 거시 데이터: FRED key가 있으면 FRED, 이후 World Bank, OpenERAPI
- 이벤트 데이터: GDACS

Finnhub adapter 기능:

- quote
- snapshot
- candles
- company news
- insider
- financials
- earnings
- dividends
- economic calendar
- peers

FRED adapter 기능:

- series
- metadata
- search

Chafi에 적용할 점:

- provider registry는 반드시 필요하다.
- 같은 데이터라도 source별 권위, 지연, 결측, 라이선스를 기록해야 한다.
- 무료 fallback을 두되, SSOT 품질 등급을 낮게 표시해야 한다.

주의할 점:

- Yahoo, yfinance 계열 데이터는 편리하지만 “권위 있는 SSOT”로 보기 어렵다.
- provider fallback은 유용하지만, 출처가 바뀌면 숫자의 의미가 달라질 수 있다.
- Chafi는 fallback 결과를 같은 truth로 병합하지 말고 observation source를 분리해야 한다.

### 2.5 거시 신호와 레짐

핵심 파일:

- `packages/domain/domain/src/macro/signals.ts`

사용 지표:

- `T10Y2Y`
- `T10Y3M`
- `VIXCLS`
- `STLFSI4`
- `ICSA`

레짐 판단:

- VIX가 낮은가
- 수익률 곡선이 정상인가
- HY OAS가 낮은가
- 달러 30일 변화가 안정적인가
- 10Y breakeven이 적정 범위인가

결과는 Risk-on, Mixed, Risk-off로 단순화된다.

Chafi에 적용할 점:

- 거시 판단은 LLM 자유서술보다 규칙 기반 score와 함께 가야 한다.
- 각 지표가 왜 해당 레짐에 기여했는지 evidence row로 남겨야 한다.
- 신호는 최종 판단이 아니라 “시장 환경 feature”로 취급해야 한다.

한계:

- 지표 수가 적다.
- real-time revision과 발표 지연 관리가 부족하다.
- 국가별 레짐, 섹터 민감도, 통화 영향을 정교하게 나누지는 않는다.

### 2.6 데일리 브리프

핵심 파일:

- `packages/use-case/brief/src/assemble.ts`
- `apps/mcp/src/tools/portfolio.ts`

`get_brief`가 사실상 MCP에서 가장 중요한 entry point다. 오늘 스냅샷을 보장하고, 캐시된 brief를 읽거나 생성하며, insights, moves, watchlist, freshness를 모아 내러티브를 만들도록 한다.

브리프에 포함되는 주요 요소:

- 포트폴리오 스냅샷 비교
- 주간 성과
- HHI concentration
- 목표 추적
- 리스크 요약
- 세금 관련 전망
- earnings calendar
- economic calendar
- macro stress/regime
- World Bank 노출
- GDACS 이벤트
- dividend
- advisor moves
- freshness

중요한 설계:

- 숫자를 나열하지 않고 `insights[]`를 중심으로 말하게 한다.
- MCP 도구 설명에 “숫자는 근거이고 헤드라인은 아니다”라는 지침이 있다.

Chafi에 적용할 점:

- 최종 답변은 raw data dump가 아니라 insight object를 조립한 결과여야 한다.
- insight에는 반드시 source, confidence, counter-evidence를 붙여야 한다.
- brief는 사용자 포트폴리오와 시장 SSOT를 연결하는 좋은 인터페이스다.

한계:

- insight가 thesis ledger와 연결되지는 않는다.
- 과거 브리프 대비 신념 변화가 구조적으로 저장되지는 않는다.
- 뉴스/공시 원문 근거 연결이 약하다.

### 2.7 Advisor rule engine

핵심 파일:

- `packages/use-case/advisor/src/analyze.ts`
- `packages/use-case/advisor/src/rules/runway.ts`
- `packages/use-case/advisor/src/rules/deploy.ts`
- `packages/use-case/advisor/src/rules/contribution.ts`
- `packages/use-case/advisor/src/rules/tactical.ts`
- `packages/use-case/advisor/src/rules/derisk.ts`
- `packages/use-case/advisor/src/rules/rebalance.ts`

Rule 목록:

- runway
- derisk
- deploy
- contribution
- tactical
- rebalance

특징:

- LLM이 판단하는 것이 아니라 deterministic rule이 recommendation 후보를 만든다.
- 이후 stance, moves, watchlist를 만든다.
- runway, forced seller risk, idle cash, concentration, shock 시나리오 같은 구체적인 재무 조건을 본다.

Chafi에 적용할 점:

- 중요한 투자 안전장치는 rule engine으로 먼저 만든다.
- LLM은 rule 결과를 설명하고 반증을 찾는 역할이 더 적합하다.
- risk tolerance, runway, concentration, liquidity 같은 사용자 상태를 판단에 넣어야 한다.

한계:

- 종목 thesis나 산업/기업 경쟁력 평가는 거의 없다.
- 룰이 개인 재무 안전성 중심이다.
- 계량 결과의 원천 근거를 audit trail로 강하게 남기는 구조는 부족하다.

### 2.8 CLI/MCP parity

핵심 파일:

- `apps/cli/src/index.ts`
- `apps/mcp/src/index.ts`
- `test/parity.test.ts`

CLI와 MCP가 같은 기능을 노출한다. 테스트는 CLI 결과와 MCP 결과가 동일한지 강하게 검증한다.

검증 범위:

- portfolio
- concentration
- transactions
- balance
- flow
- snapshot
- reports
- dividend
- macro
- brief
- FX
- add transaction

Chafi에 적용할 점:

- 사람용 UI, CLI, agent tool이 같은 application service를 써야 한다.
- MCP만 따로 구현하면 drift가 생긴다.
- parity test는 초기에 넣어야 한다.

### 2.9 MCP 프롬프트

핵심 파일:

- `apps/mcp/src/prompts.ts`

제공 프롬프트:

- `import-trades`
- `import-balance`
- `import-flow`
- `month-end`
- `morning`
- `projection`
- `analyst`
- `setup-profile`
- `pre-mortem`
- `rebalance`

좋은 점:

- “거래 import 전 컬럼 매핑을 확인하라” 같은 운영 절차가 명시되어 있다.
- morning brief, projection, pre-mortem처럼 사용자의 실제 흐름에 맞춘 prompt가 있다.

Chafi에 적용할 점:

- skill만 만들지 말고 workflow prompt를 같이 만들어야 한다.
- 데이터 쓰기 전 확인 절차를 prompt와 tool schema 양쪽에서 강제해야 한다.
- pre-mortem과 rebalance는 투자 AI에 매우 중요한 기본 workflow다.

## 3. Vibe-Trading 분석

### 3.1 제품의 핵심

`Vibe-Trading`은 자연어 기반 금융 리서치 agent다. `firma`가 원장과 포트폴리오 브리프에 강하다면, `Vibe-Trading`은 스킬, 도구, 백테스트, 가설, 스웜, 알파 탐색에 강하다.

주요 특징:

- 75개 스킬
- 452개 알파 팩터
- 29개 swarm preset
- 22개 MCP tool
- backtest runner
- shadow account
- React frontend
- FastAPI server

README는 live trading이 아니라 research/backtest 중심임을 분명히 한다. 이 점은 Chafi에도 중요하다. 초기에는 매매 실행보다 리서치 품질, 검증 가능성, 의사결정 로그가 우선이어야 한다.

### 3.2 스킬 시스템

핵심 파일:

- `agent/SKILL.md`
- `agent/src/agent/skills.py`
- `agent/src/tools/load_skill_tool.py`
- `agent/src/tools/skill_writer_tool.py`
- `agent/src/skills/*/SKILL.md`

구조:

- 스킬 목록은 prompt에 요약으로 노출된다.
- 전체 스킬 문서는 `load_skill` tool로 필요할 때 불러온다.
- user skill이 bundled skill을 override할 수 있다.
- user skill은 `~/.vibe-trading/skills/user/<skill>/` 아래 references/templates/examples/assets를 가질 수 있다.

주요 스킬 예시:

- `macro-analysis`
- `edgar-sec-filings`
- `financial-statement`
- `earnings-forecast`
- `valuation-model`
- `risk-analysis`
- `event-driven`
- `geopolitical-risk`
- `sentiment-analysis`
- `technical-basic`
- `factor-research`
- `alpha-zoo`
- `shadow-account`
- `report-generate`

Chafi에 적용할 점:

- 스킬은 prompt 조각이 아니라 versioned artifact여야 한다.
- 스킬은 입력, 출력, 금지사항, evidence requirement를 가져야 한다.
- 사용자별 스킬 override는 유용하지만, 투자 판단에서는 audit trail이 필요하다.
- 스킬 변경이 과거 판단을 바꾸지 않도록 skill version을 decision에 저장해야 한다.

주의할 점:

- 스킬이 많다고 품질이 높은 것은 아니다.
- 스킬 간 기준이 충돌할 수 있다.
- 스킬 문서가 근거 논문/책과 연결되지 않으면 “그럴듯한 체크리스트”가 된다.

### 3.3 ReAct loop와 tool registry

핵심 파일:

- `agent/src/agent/loop.py`
- `agent/src/agent/tools.py`
- `agent/src/tools/__init__.py`

`Vibe-Trading`의 loop는 일반적인 ReAct agent보다 운영 장치가 많다.

주요 설계:

- tool registry는 JSON schema를 가진다.
- read-only tool과 write tool을 구분한다.
- 연속된 read-only tool은 병렬 실행한다.
- write tool은 serial하게 실행한다.
- 중복 tool call을 막는다.
- tool result를 truncation한다.
- 실행 trace를 run directory에 저장한다.
- context가 길어지면 microcompact, context collapse, auto compact를 수행한다.

Chafi에 적용할 점:

- 투자 AI는 tool call audit trail이 필수다.
- read-only와 write tool은 강하게 분리해야 한다.
- 같은 질문에서 어떤 데이터를 읽었는지 남겨야 한다.
- 긴 리서치 세션을 compact할 때 “근거와 결론”이 분리되어 보존되어야 한다.

한계:

- compact 과정에서 중요한 근거가 요약 손실될 수 있다.
- agent loop가 복잡해지면 재현성이 떨어질 수 있다.
- Chafi는 “최종 답변”보다 “근거 ledger”를 더 우선해야 한다.

### 3.4 백테스트와 run card

핵심 파일:

- `agent/src/tools/backtest_tool.py`
- `agent/backtest/runner.py`
- `agent/backtest/loaders/registry.py`
- `agent/backtest/run_card.py`

백테스트 runner는 사용자가 만든 strategy code를 `signal_engine.py`로 받아 실행한다. 안전을 위해 AST 검사를 수행한다.

검사 내용:

- import-time 실행 방지
- top-level statement 제한
- decorator 제한
- literal default 제한
- unsafe class body 제한

loader fallback:

- A-share: Tushare, AKShare
- US equity: yfinance, AKShare
- HK equity: yfinance, Futu, AKShare
- crypto: OKX, CCXT
- futures: Tushare, AKShare
- fund: Tushare, AKShare
- macro: AKShare, Tushare
- forex: AKShare, yfinance

`run_card`는 매우 중요하다. 백테스트 결과를 단순 숫자로 끝내지 않고, 설정 hash, strategy hash, 데이터 출처, metric, warning, artifact hash를 함께 저장한다.

Chafi에 적용할 점:

- 모든 분석 결과에 run card 개념을 넣어야 한다.
- “어떤 데이터, 어떤 코드, 어떤 스킬 버전, 어떤 모델”로 나온 결과인지 저장해야 한다.
- 백테스트뿐 아니라 리서치 리포트, thesis update, 브리프에도 run card를 붙여야 한다.

주의할 점:

- yfinance/AKShare는 리서치 편의용이지 최상위 SSOT로 두기 어렵다.
- generated strategy code는 sandbox와 검증이 필요하다.
- 백테스트 결과는 survivorship bias, look-ahead bias, 거래비용, 슬리피지를 별도로 표시해야 한다.

### 3.5 가설 registry

핵심 파일:

- `agent/src/hypotheses/registry.py`
- `agent/src/tools/hypothesis_tool.py`

가설 상태:

- `exploring`
- `testing`
- `validated`
- `rejected`
- `monitoring`

가설 필드:

- title
- thesis
- universe
- signal_definition
- data_sources
- skills
- run_cards
- invalidation_notes
- timestamps

Chafi에 적용할 점:

- thesis ledger의 초기 모델로 참고할 만하다.
- 가설은 상태, 근거, 백테스트 연결, 무효화 조건을 가져야 한다.
- rejected thesis도 지우지 말고 남겨야 한다.

한계:

- JSON 파일 기반이라 다중 사용자/동시성/권한 관리에는 약하다.
- evidence graph가 충분히 정교하지 않다.
- counter-evidence와 confidence update가 별도 구조로 강하게 모델링되어 있지는 않다.

### 3.6 persistent memory

핵심 파일:

- `agent/src/memory/persistent.py`

구조:

- `~/.vibe-trading/memory`
- `MEMORY.md` index
- frontmatter 기반 entry
- type: user, feedback, project, reference
- metadata weight가 검색 점수에 반영된다.
- CJK 등 다양한 문자권 tokenization을 고려한다.

Chafi에 적용할 점:

- 사용자 선호, 리스크 성향, 반복 피드백은 memory에 저장할 수 있다.
- 하지만 투자 근거와 memory는 분리해야 한다.
- memory는 “사용자 맥락”이고 SSOT는 “검증 가능한 외부 사실”이다.

### 3.7 swarm 시스템

핵심 파일:

- `agent/src/swarm/runtime.py`
- `agent/src/swarm/grounding.py`
- `agent/src/swarm/presets/*.yaml`

swarm은 YAML preset으로 여러 agent 역할을 DAG 형태로 실행한다. 각 layer 안의 task는 병렬로 실행하고, dependency가 있는 task는 순서대로 실행한다.

제공 preset 예시:

- `risk_committee`
- `equity_research_team`
- `investment_committee`
- `portfolio_review_board`
- `macro_rates_fx_desk`
- `geopolitical_war_room`
- `earnings_research_desk`
- `factor_research_committee`
- `crypto_trading_desk`
- `global_allocation_committee`

`grounding.py`는 특히 중요하다. 사용자 입력에서 `NVDA.US`, `700.HK`, `600519.SH`, `BTC-USDT` 같은 심볼을 추출하고 최근 30일 OHLCV를 가져와 worker prompt에 “Ground Truth — Recent Market Data” 블록으로 넣는다. worker가 학습 시점의 오래된 가격을 인용하지 못하게 하기 위한 장치다.

Chafi에 적용할 점:

- multi-agent는 role play가 아니라 evidence 분업이어야 한다.
- 각 agent가 같은 최신 market grounding을 공유해야 한다.
- 투자위원회 형식은 유용하지만, 최종 결론은 evidence ledger에 병합되어야 한다.

주의할 점:

- agent가 많아지면 그럴듯한 합의가 생길 위험이 있다.
- 같은 잘못된 데이터가 grounding되면 모든 agent가 같은 오류를 공유한다.
- swarm 결과에도 run card와 source coverage가 필요하다.

### 3.8 Alpha Zoo와 factor registry

핵심 파일:

- `agent/src/factors/registry.py`
- `agent/src/tools/alpha_bench_tool.py`
- `agent/src/factors/*`

구성:

- 452개 alpha
- qlib158
- alpha101
- gtja191
- academic

registry 특징:

- `AlphaMeta` pydantic schema
- Python import 없이 AST로 `__alpha_meta__` literal 추출
- ID, column, universe, theme 검증
- `_meta.yaml`은 외부 소비자를 위한 생성물
- source of truth는 Python literal metadata

테스트:

- AST purity
- lookahead sentinel
- factor loading
- alpha bench

Chafi에 적용할 점:

- 스킬과 factor도 registry화해야 한다.
- metadata를 코드와 분리하거나, 코드 안에 두더라도 검증 가능해야 한다.
- factor는 이름이 아니라 universe, horizon, input columns, lookahead risk, known failure mode를 가져야 한다.

주의할 점:

- alpha 수가 많아도 실제 투자 가능성은 별개다.
- cross-sectional IC가 좋은 factor라도 거래비용과 capacity에서 무너질 수 있다.
- Chafi는 factor discovery보다 evidence governance를 먼저 구축하는 편이 좋다.

### 3.9 Shadow account

핵심 파일:

- `agent/src/tools/shadow_account_tool.py`
- `agent/src/shadow_account/*`

기능:

- journal에서 사용자의 전략을 추출한다.
- shadow strategy profile을 저장한다.
- 여러 시장에서 shadow backtest를 수행한다.
- 실제 거래와 shadow strategy의 차이를 delta-PnL로 비교한다.
- HTML/PDF report를 생성한다.
- 신호 scan을 수행한다.

Chafi에 적용할 점:

- 사용자의 실제 판단과 AI/규칙 기반 판단을 분리해서 비교할 수 있다.
- “내가 실제로 한 결정”과 “그 시점에 룰이 제안한 결정”을 비교하면 학습 가치가 크다.
- thesis tracker와 결합하면 사용자의 반복 오류를 찾을 수 있다.

주의할 점:

- shadow strategy가 과거 journal을 과도하게 해석할 수 있다.
- 사용자의 암묵적 제약 조건이 빠지면 비교가 불공정해진다.
- 결과는 피드백 도구이지 자동매매 근거가 아니다.

### 3.10 Frontend와 API

핵심 파일:

- `agent/api_server.py`
- `agent/src/session/service.py`
- `frontend/src/pages/Agent.tsx`
- `frontend/src/lib/api.ts`

API server:

- FastAPI
- runs, sessions, settings, upload, swarm, alpha 관련 API
- CORS origin 설정
- API key auth
- 50MB upload chunk 제한
- startup preflight

Session service:

- session store
- event bus
- run directory
- ThreadPoolExecutor
- cancellation
- SSE events
- session search indexing

Frontend:

- SSE 기반 chat
- tool call 표시
- file upload
- swarm preset 선택
- session loading
- run complete card
- shadow report 감지

Chafi에 적용할 점:

- 투자 AI UI는 tool call과 evidence를 숨기면 안 된다.
- 사용자는 “어떤 근거를 읽었는지” 볼 수 있어야 한다.
- session과 run artifact를 분리해서 저장해야 한다.

한계:

- UI는 기능 확인용 성격이 강하고, investment workstation 수준으로 정교하지는 않다.
- Chafi는 처음부터 evidence inspection, thesis timeline, source freshness를 UI 1급 요소로 두는 것이 좋다.

## 4. 두 프로젝트 비교

| 항목 | firma | Vibe-Trading | Chafi에 대한 판단 |
| --- | --- | --- | --- |
| 핵심 방향 | 개인 포트폴리오 원장과 브리프 | 리서치 agent와 백테스트 | 둘 다 필요하지만 SSOT는 firma식 원장이 먼저 |
| 데이터 저장 | SQLite schema가 명확함 | 파일/JSON/run artifact 혼합 | Chafi는 DB 중심 evidence ledger 필요 |
| 스킬 | prompt/workflow 중심 | 대량 SKILL.md 구조 | Vibe식 skill loader를 차용하되 versioning 강화 |
| MCP | CLI와 parity가 강함 | 도구 수와 범위가 넓음 | 핵심 tool은 firma처럼 작고 검증 가능하게 |
| 백테스트 | 제한적 | runner, loader, run card 강함 | Vibe의 run card 개념 채택 |
| 거시 | FRED 기반 간단한 stress/regime | macro skill과 data routing | 공식 통계+revision 관리 필요 |
| 뉴스 | 보조적 | web reader/search 있음 | 뉴스는 trigger로만 저장 |
| 가설 관리 | 약함 | hypothesis registry 있음 | 별도 thesis ledger로 강화 |
| 다중 agent | 없음 | swarm DAG 있음 | 나중 단계에서만 도입 |
| 테스트 | CLI/MCP parity 우수 | security/backtest/factor 폭넓음 | 두 방식 모두 필요 |

## 5. Chafi에 가져올 구조

### 5.1 Evidence Ledger

Chafi의 중심은 아래 ledger여야 한다.

- `sources`
- `documents`
- `observations`
- `claims`
- `evidence_links`
- `market_reactions`
- `theses`
- `thesis_events`
- `counter_evidence`
- `decisions`
- `run_cards`

`firma`의 transaction 원장 설계와 `Vibe-Trading`의 hypothesis/run card 개념을 합치는 방향이 좋다.

### 5.2 Source Registry

Provider registry는 다음 정보를 가져야 한다.

- source id
- source type
- authority score
- latency class
- license class
- revision policy
- markets covered
- instruments covered
- failure mode
- fallback priority

무료 provider fallback은 “대체 데이터”이지 “동일한 진실”이 아니다.

### 5.3 Skill Registry

스킬은 다음 메타데이터를 가져야 한다.

- skill id
- version
- domain
- required inputs
- output schema
- evidence requirements
- forbidden conclusions
- primary references
- known failure modes

초기 스킬:

- `macro_regime`
- `earnings_quality`
- `valuation`
- `event_risk`
- `market_reaction`
- `thesis_tracker`
- `anti_hallucination`

### 5.4 Run Card

모든 중요한 결과는 run card를 가져야 한다.

- input hash
- source ids
- document ids
- skill versions
- model name
- prompt version
- tool calls
- output artifact hash
- warnings
- freshness status

이 구조는 Vibe-Trading의 `run_card.py`에서 배울 수 있다.

### 5.5 CLI/MCP/UI parity

`firma`의 parity test는 Chafi에도 매우 중요하다.

원칙:

- 핵심 기능은 application service에 둔다.
- CLI, MCP, UI는 같은 service를 호출한다.
- 같은 입력이면 같은 JSON을 반환해야 한다.
- parity test로 drift를 막는다.

### 5.6 Grounding

`Vibe-Trading`의 swarm grounding은 Chafi에도 필요하다.

모든 리서치 세션은 시작 시점에 다음을 고정해야 한다.

- 현재 가격
- 최근 수익률
- 거래량
- 섹터 상대수익률
- 금리/환율/VIX
- source freshness

그 후 AI가 오래된 지식으로 가격을 말하지 못하게 해야 한다.

## 6. Chafi에서 피해야 할 것

- 뉴스 headline을 SSOT로 삼는 것
- yfinance 같은 편의 데이터와 공식 데이터를 같은 신뢰도로 병합하는 것
- LLM 요약을 원문처럼 저장하는 것
- 스킬을 많이 만들고 versioning을 하지 않는 것
- multi-agent 합의를 근거 검증으로 착각하는 것
- 백테스트 결과를 run card 없이 저장하는 것
- 사용자 memory와 외부 evidence를 같은 저장소에 섞는 것
- UI에서 tool call과 source freshness를 숨기는 것

## 7. 추천 구현 순서

1. Chafi 프로젝트 skeleton

- DB schema
- provider registry
- run card schema
- CLI/MCP 공통 service 구조

2. 시장/공식 데이터 ingestion

- price
- FX
- FRED
- SEC EDGAR
- Treasury/EIA/BLS/BEA 중 우선순위 선택

3. Evidence ledger

- document ingest
- observation extraction
- claim/evidence linking
- source freshness

4. Thesis tracker

- thesis 생성
- supporting/counter evidence
- invalidation criteria
- decision state

5. Skill registry

- macro_regime
- market_reaction
- earnings_quality
- valuation
- event_risk
- anti_hallucination

6. Brief/report

- daily brief
- thesis change summary
- source freshness summary
- counter-evidence alert

7. Backtest/run card

- simple deterministic strategy runner
- run card generation
- source/time validity checks

8. Swarm

- 투자위원회식 multi-agent는 마지막 단계
- 먼저 단일 agent가 근거 원장을 정확히 다루게 만든다.

## 8. 참고할 핵심 파일 목록

`firma`:

- `README.md`
- `package.json`
- `packages/shared/db/src/schema.ts`
- `packages/shared/db/src/repositories.ts`
- `packages/shared/db/src/aggregate.ts`
- `packages/domain/domain/src/market/symbol.ts`
- `packages/domain/domain/src/macro/signals.ts`
- `packages/adapter/adapters/src/registry.ts`
- `packages/adapter/adapters/src/finnhub.ts`
- `packages/adapter/adapters/src/fred.ts`
- `packages/use-case/brief/src/assemble.ts`
- `packages/use-case/advisor/src/analyze.ts`
- `packages/use-case/advisor/src/rules/*.ts`
- `packages/use-case/portfolio/src/sync.ts`
- `packages/use-case/portfolio/src/risk.ts`
- `apps/cli/src/index.ts`
- `apps/mcp/src/index.ts`
- `apps/mcp/src/tools/portfolio.ts`
- `apps/mcp/src/prompts.ts`
- `test/parity.test.ts`
- `docs/plans/*`

`Vibe-Trading`:

- `README.md`
- `pyproject.toml`
- `agent/SKILL.md`
- `agent/src/agent/skills.py`
- `agent/src/agent/tools.py`
- `agent/src/agent/loop.py`
- `agent/src/tools/__init__.py`
- `agent/src/tools/load_skill_tool.py`
- `agent/src/tools/skill_writer_tool.py`
- `agent/src/tools/backtest_tool.py`
- `agent/backtest/runner.py`
- `agent/backtest/loaders/registry.py`
- `agent/backtest/run_card.py`
- `agent/src/hypotheses/registry.py`
- `agent/src/tools/hypothesis_tool.py`
- `agent/src/memory/persistent.py`
- `agent/src/swarm/runtime.py`
- `agent/src/swarm/grounding.py`
- `agent/src/swarm/presets/*.yaml`
- `agent/src/factors/registry.py`
- `agent/src/tools/alpha_bench_tool.py`
- `agent/src/tools/shadow_account_tool.py`
- `agent/mcp_server.py`
- `agent/api_server.py`
- `agent/src/session/service.py`
- `frontend/src/pages/Agent.tsx`
- `frontend/src/lib/api.ts`
- `agent/tests/*`

## 9. 최종 판단

`firma`는 Chafi의 “원장, 포트폴리오, CLI/MCP parity, 브리프” 설계에 가깝다. 반면 `Vibe-Trading`은 “스킬, 도구, 백테스트, run card, swarm, 가설 관리”에 가깝다.

Chafi의 올바른 방향은 둘 중 하나를 고르는 것이 아니라, 아래처럼 결합하는 것이다.

- SSOT와 원장은 `firma`처럼 단순하고 검증 가능하게 만든다.
- 리서치 실행과 스킬은 `Vibe-Trading`처럼 확장 가능하게 만든다.
- 하지만 최종 신뢰 기준은 agent의 말이 아니라 evidence ledger와 run card로 둔다.

초기 구현에서 가장 중요한 것은 “AI가 얼마나 똑똑하게 말하는가”가 아니다. 어떤 원천을 읽었고, 어떤 근거에서 어떤 가설이 강화되거나 약화되었는지를 나중에 다시 검증할 수 있어야 한다.
