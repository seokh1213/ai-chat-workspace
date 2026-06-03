# 투자 AI SSOT 구축 조사 메모

이 문서는 Chafi의 투자 판단 AI를 만들 때 “무엇을 믿을 것인가”를 먼저 정하기 위한 초기 조사 메모다. 핵심 결론은 간단하다. 뉴스는 빠른 트리거가 될 수 있지만, 장기적으로 판단 품질을 좌우하는 SSOT는 가격, 공시, 공식 통계, 정책 원문, 그리고 그 위에 쌓이는 검증 가능한 해석 기록이어야 한다.

투자 조언이 아니라 시스템 설계 메모다. 실제 매매 판단에는 데이터 라이선스, 지연 시간, 시장별 규제, 사용자 위험 성향, 세금, 거래 비용을 별도로 반영해야 한다.

## 1. 기본 관점

뉴스만으로 투자 AI를 만들면 대개 늦다. 중요한 사건은 이미 가격, 옵션 시장, 신용 스프레드, 환율, 금리, 섹터 상대강도에 먼저 반영되는 경우가 많다. 따라서 뉴스는 “진실의 원천”이라기보다 “관찰할 사건 후보”로 다루는 편이 안전하다.

Chafi의 SSOT는 다음 순서로 설계하는 것이 좋다.

1. 시장이 실제로 반응한 데이터
2. 원문에 가까운 공식 데이터
3. 기업이 직접 제출한 공시와 발표
4. 정책, 규제, 지정학 이벤트의 공식 문서
5. 빠른 뉴스와 분석 리포트
6. 모델이 만든 해석, 가설, 반증 기록

이 순서를 지키면 “뉴스를 읽고 그럴듯한 말로 결론을 내는 AI”가 아니라 “원천 데이터와 가설의 변화 과정을 추적하는 AI”에 가까워진다.

## 2. 출처 계층

### Tier 0: 시장 상태 데이터

가장 먼저 봐야 할 것은 가격 그 자체다. 특정 뉴스가 중요했는지 여부는 대개 시장 반응에서 검증된다.

포함할 데이터:

- 주식, ETF, 지수 가격과 거래량
- 국채 금리, 수익률 곡선, 실질금리
- 달러 인덱스, 주요 환율
- 원자재 가격
- 회사채 스프레드, 하이일드 스프레드
- VIX 등 변동성 지표
- 섹터, 스타일, 팩터 상대강도
- 옵션 시장의 내재 변동성, skew, put/call

용도:

- 뉴스가 이미 반영되었는지 확인
- 거시 레짐 판단
- 리스크 온/오프 상태 감지
- 개별 종목 이벤트의 상대적 중요도 판단

주의:

- 무료 API는 지연, 결측, 보정 방식 차이가 있다.
- 일봉만으로는 이벤트 반응을 놓칠 수 있다.
- 거래량과 호가 데이터가 없으면 유동성 리스크를 과소평가할 수 있다.

### Tier 1: 공식 거시 통계

거시 판단의 기준점은 공식 통계여야 한다. 다만 거시 데이터는 발표 후 수정되는 경우가 많으므로, 현재값만 저장하면 안 된다.

주요 출처:

- FRED: 미국 금리, 물가, 고용, 신용, 금융 스트레스 지표
- BLS: CPI, 고용, 임금, 생산성
- BEA: GDP, 개인소비지출, 기업이익
- Federal Reserve Data Download Program: 연준 통계 원문
- U.S. Treasury Fiscal Data: 재정, 국채, 현금 잔고
- EIA Open Data: 원유, 가스, 재고, 에너지 수급
- CFTC COT: 선물 포지션, 투기적 순포지션
- IMF Data API: 국가별 거시 및 금융 안정성 데이터
- World Bank API: 국가별 장기 구조 데이터
- OECD API: 선진국 경기, 선행지표, 생산성
- BIS Data Portal: 국제 은행, 신용, 유동성, 파생상품

저장 원칙:

- `release_date`: 발표일
- `period`: 통계가 가리키는 기간
- `value_initial`: 최초 발표값
- `value_revised`: 수정값
- `revision_count`: 수정 횟수
- `source_url`: 원문 링크
- `ingested_at`: 수집 시각

거시 데이터는 “현재 최신값”만 보지 말고, 당시 투자자가 볼 수 있었던 값을 별도로 보관해야 한다. 백테스트와 의사결정 로그에서 look-ahead bias를 막기 위해 필요하다.

### Tier 2: 기업 원천 자료

기업 단위 판단에서 가장 중요한 것은 공시다. 뉴스보다 느릴 수 있지만, 근거 품질은 훨씬 높다.

주요 출처:

- SEC EDGAR
- 10-K, 10-Q, 8-K
- S-1, F-1
- Form 4
- 13F
- DEF 14A
- 기업 IR 페이지
- 실적 발표 자료
- earnings call transcript
- press release

용도:

- 매출, 마진, 현금흐름, 부채 변화
- 리스크 팩터 변화
- 경영진 발언의 변화
- 내부자 매수/매도
- 기관 보유 변화
- 가이던스 변화
- 회계 품질과 일회성 항목 검토

저장 원칙:

- filing accession number 같은 원문 식별자를 저장한다.
- 같은 회사의 같은 항목이라도 “공시 시점”과 “대상 기간”을 분리한다.
- LLM 요약은 원문을 대체하지 않고 파생 데이터로 저장한다.
- 공시 문장 인용은 위치, 섹션, 원문 링크를 함께 저장한다.

### Tier 3: 정책, 규제, 지정학 원문

정책과 규제는 뉴스보다 원문이 중요하다. 특히 관세, 제재, 수출통제, 금리, 중앙은행 발언은 요약 과정에서 뉘앙스가 크게 바뀔 수 있다.

주요 출처:

- FOMC calendar, statement, minutes, SEP
- Federal Register
- OFAC Sanctions List Service
- USTR
- CBP tariff announcements
- BIS press release
- Treasury press release
- White House fact sheet
- WTO, IMF, World Bank 주요 발표

용도:

- 정책 변화의 원문 확인
- 특정 기업, 국가, 산업 노출도 매핑
- 규제 리스크 트리거 관리
- 지정학 이벤트와 공급망 리스크 추적

주의:

- 헤드라인만 보면 방향을 오해할 수 있다.
- 정책 발표는 실제 시행일, 유예 기간, 적용 대상이 중요하다.
- 이벤트 자체보다 시장이 가격에 반영한 정도를 같이 봐야 한다.

### Tier 4: 빠른 금융 뉴스와 분석

뉴스는 버리면 안 된다. 다만 SSOT 최상위에 두면 안 된다. 뉴스는 “조사할 사건 후보”와 “시장 참여자들이 어떤 프레임으로 보고 있는지”를 파악하는 데 유용하다.

우선순위가 높은 출처:

- Reuters / LSEG
- Bloomberg
- Dow Jones / Factiva
- FactSet StreetAccount
- AlphaSense
- RavenPack
- 주요 거래소 공지
- 기업 공식 press release

일반 웹 뉴스:

- CNBC, WSJ, FT, Barron's, MarketWatch, Nikkei, The Information 등
- 한국 시장은 한국거래소, DART, 금융감독원, 한국은행, 기획재정부, 산업통상자원부 원문을 우선한다.

뉴스 처리 원칙:

- 뉴스는 `trigger`로 저장하고, 사실 확정은 원문 자료로 검증한다.
- 같은 사건을 여러 매체가 반복 보도해도 근거 수가 늘어난 것으로 보지 않는다.
- “소식통에 따르면” 유형은 별도 신뢰도 등급을 둔다.
- 가격 반응, 옵션 반응, 섹터 반응을 함께 저장한다.

## 3. SSOT 데이터 모델 초안

Chafi는 “문서 저장소”가 아니라 “주장과 근거의 원장”을 가져야 한다.

핵심 엔티티:

- `Source`: 출처 자체
- `Document`: 원문 문서, 공시, 통계 발표, 뉴스 기사
- `Observation`: 원문에서 추출한 관찰 사실
- `Claim`: AI 또는 사람이 만든 판단 문장
- `EvidenceLink`: claim과 observation의 연결
- `Entity`: 기업, 국가, 산업, 상품, 통화, 지표
- `MarketReaction`: 가격과 시장 반응
- `Thesis`: 투자 가설
- `CounterEvidence`: 반증 근거
- `Decision`: 매수, 보유, 축소, 관망 같은 의사결정 상태
- `Revision`: 데이터나 판단의 변경 이력

`Observation` 필드 예시:

```text
id
source_type
authority_score
document_id
entity_ids
observed_at
published_at
ingested_at
latency_class
revision_policy
claim_text
numeric_value
unit
period
evidence_url
evidence_excerpt
confidence_fact
```

`Claim` 필드 예시:

```text
id
thesis_id
claim_text
claim_type
inference_method
supporting_evidence_ids
counter_evidence_ids
market_context_ids
confidence_inference
created_by
created_at
expires_at
status
```

핵심은 `confidence_fact`와 `confidence_inference`를 분리하는 것이다. 사실 자체의 신뢰도와, 그 사실에서 투자 결론으로 가는 추론의 신뢰도는 다르다.

## 4. 판단 스킬 설계

사용자가 말한 “skills(가이드)”는 매우 중요하다. LLM에게 단순히 “분석해줘”라고 하면 매번 다른 기준으로 말한다. 스킬은 판단의 규칙, 금지사항, 출력 포맷, 반증 기준을 고정하는 역할을 해야 한다.

### macro_regime_skill

목적:

- 경기, 물가, 금리, 유동성, 달러, 신용을 결합해 레짐을 판단한다.

입력:

- 금리 곡선
- 실질금리
- CPI/PCE
- 고용
- 신용 스프레드
- 달러
- VIX
- 원자재

출력:

- Risk-on, Mixed, Risk-off
- 성장/물가 방향
- 금리 압력
- 유동성 조건
- 가장 강한 반증 지표

금지:

- 한 지표만으로 레짐 확정
- 발표된 최신값만 사용하고 수정 이력 무시
- 중앙은행 발언을 가격 반응 없이 해석

### earnings_quality_skill

목적:

- 실적의 질을 평가한다.

입력:

- 매출 성장
- 매출총이익률, 영업이익률
- 현금흐름
- 재고, 매출채권
- 일회성 비용
- 가이던스
- 컨센서스 대비 차이

출력:

- headline beat/miss
- quality beat/miss
- 지속 가능성
- 회계상 주의점
- 다음 분기 확인 항목

금지:

- EPS beat만 보고 긍정 결론
- 일회성 항목을 반복 수익처럼 취급
- 가이던스와 시장 기대치 분리 없이 판단

### valuation_skill

목적:

- 가격이 어느 정도의 기대를 이미 반영하는지 추정한다.

입력:

- 멀티플
- 성장률
- 마진
- 할인율
- 동종 기업
- 역사적 범위
- 시나리오별 현금흐름

출력:

- base/bull/bear 시나리오
- 현재 가격에 내재된 성장률
- 핵심 민감도
- 안전마진

금지:

- DCF 숫자를 정답처럼 제시
- 동종 기업 멀티플을 맥락 없이 적용
- 금리와 자본비용 변화 무시

### event_risk_skill

목적:

- 규제, 소송, 지정학, 실적, 제품 출시, M&A 같은 이벤트를 체계화한다.

입력:

- 이벤트 일정
- 관련 원문
- 시장 반응
- 과거 유사 이벤트
- 포지션 노출도

출력:

- 이벤트 확률
- 손익 비대칭
- 이미 반영된 정도
- 확인해야 할 원문
- 대응 상태

금지:

- 이벤트 발생 여부만 보고 기대값 무시
- 소문을 확정 사실로 저장
- 시행일, 적용 대상, 예외 조항 누락

### market_reaction_skill

목적:

- 어떤 정보가 실제로 가격에 반영되었는지 확인한다.

입력:

- 종목 수익률
- 섹터 상대수익률
- 거래량
- 옵션 내재 변동성
- 크레딧
- 환율
- 금리

출력:

- 정보 반영 강도
- 시장이 놀란 지점
- 반응의 지속성
- 과잉반응 가능성

금지:

- 뉴스의 논조와 가격 반응을 같은 것으로 취급
- 하루 수익률만 보고 추세 판단
- 시장 전체 요인과 종목 고유 요인 분리 실패

### thesis_tracker_skill

목적:

- 투자 가설을 시간이 지나도 검증 가능한 형태로 관리한다.

입력:

- 초기 thesis
- supporting evidence
- counter evidence
- expected milestones
- invalidation criteria

출력:

- thesis 상태
- 강화된 근거
- 약화된 근거
- 반증 이벤트
- 다음 확인 일정

금지:

- 결론을 바꾸고도 과거 근거를 수정하지 않기
- 손실 중인 포지션에 유리한 근거만 추가
- 반증 기준 없이 가설 유지

### anti_hallucination_skill

목적:

- LLM이 근거 없는 사실을 만들지 못하게 한다.

규칙:

- 숫자는 반드시 출처와 시각을 가진다.
- 원문 링크 없는 사실은 `unverified`로 표기한다.
- 추론과 사실을 문장 단위로 분리한다.
- “아마”, “일반적으로” 같은 표현은 근거 등급을 낮춘다.
- 가격, 일정, CEO, 규제 상태처럼 변동 가능한 정보는 최신 확인이 필요하다.

## 5. 판단 출력 포맷

투자 AI의 응답은 반드시 아래 구조를 따라야 한다.

```text
1. 관찰 사실
2. 원천 근거
3. 시장 반응
4. 기존 thesis와의 관계
5. 반대 근거
6. 이미 가격에 반영되었을 가능성
7. 다음에 확인할 1차 출처
8. 의사결정 상태
```

이 포맷은 답변을 길게 만들기 위한 것이 아니라, 근거 없는 확신을 줄이기 위한 장치다.

## 6. 논문과 책 기반의 초기 기준

초기 스킬은 아래 지적 기반을 참고해 만들 수 있다.

시장 효율성과 팩터:

- Eugene Fama의 효율적 시장 가설
- Fama-French factor model
- AQR의 팩터 투자 연구

가치평가:

- Aswath Damodaran의 valuation 프레임워크
- Stephen Penman의 재무제표 분석

텍스트와 공시 분석:

- Loughran-McDonald 금융 텍스트 사전
- SEC filing 기반 회계/리스크 팩터 변화 연구

행동재무:

- Daniel Kahneman
- Robert Shiller
- 과잉반응, 과소반응, 내러티브 경제학

거시 nowcasting:

- Giannone, Reichlin, Small의 nowcasting 접근
- 실시간 데이터, 발표 지연, 수정 이력 관리

이벤트와 뉴스:

- 이벤트 스터디 방법론
- 뉴스 sentiment와 시장 반응의 시간차 연구
- earnings surprise와 drift 연구

중요한 점은 책과 논문을 “AI가 인용할 장식”으로 쓰지 않는 것이다. 각 연구는 스킬의 체크리스트, 금지사항, 백테스트 검증 기준으로 변환되어야 한다.

## 7. Chafi 초기 구축 순서

1단계: 시장 데이터 원장

- 가격, 거래량, 금리, 환율, VIX, 신용 스프레드부터 저장한다.
- 모든 데이터에 `observed_at`, `published_at`, `ingested_at`을 둔다.
- 원천별 결측과 지연을 기록한다.

2단계: 공시와 공식 통계 원장

- SEC EDGAR, FRED, BLS, BEA, Treasury, EIA를 우선한다.
- 공시 원문과 LLM 요약을 분리한다.
- macro series는 수정 이력을 저장한다.

3단계: thesis ledger

- 투자 가설, 근거, 반증, 변경 이력을 저장한다.
- 가설은 반드시 무효화 조건을 가진다.
- 결론이 바뀌면 과거 판단 로그를 보존한다.

4단계: 스킬 기반 분석

- macro, earnings, valuation, event, market reaction, thesis tracker를 독립 스킬로 만든다.
- 각 스킬은 입력 스키마, 출력 스키마, 금지사항을 가진다.
- LLM은 스킬을 고르고, 결과는 구조화 JSON으로 남긴다.

5단계: 뉴스 통합

- 뉴스는 마지막에 붙인다.
- 뉴스는 claim의 원천이 아니라 investigation trigger로 저장한다.
- 중요한 뉴스는 반드시 공시, 공식 문서, 가격 반응으로 재검증한다.

## 8. 운영 원칙

- 무료 데이터와 유료 데이터의 라이선스를 분리한다.
- 백테스트에는 당시 사용 가능했던 데이터만 넣는다.
- AI가 만든 판단은 원천 데이터와 같은 테이블에 넣지 않는다.
- 같은 숫자라도 출처가 다르면 별도 observation으로 저장한다.
- 사용자 포트폴리오와 시장 데이터는 분리하되, decision layer에서 연결한다.
- “추천”보다 “가설 상태 변화”를 먼저 보여준다.
- 모델의 확신보다 반증 가능성을 더 중요하게 다룬다.

## 9. 참고 URL

- FRED: https://fred.stlouisfed.org/
- BLS: https://www.bls.gov/developers/
- BEA: https://www.bea.gov/data
- Federal Reserve Data Download Program: https://www.federalreserve.gov/datadownload/
- U.S. Treasury Fiscal Data: https://fiscaldata.treasury.gov/
- EIA Open Data: https://www.eia.gov/opendata/
- CFTC COT: https://www.cftc.gov/MarketReports/CommitmentsofTraders/
- IMF Data: https://data.imf.org/
- World Bank API: https://datahelpdesk.worldbank.org/knowledgebase/topics/125589-developer-information
- OECD Data API: https://data-explorer.oecd.org/
- BIS Data Portal: https://data.bis.org/
- SEC EDGAR: https://www.sec.gov/edgar
- Federal Register: https://www.federalregister.gov/
- OFAC Sanctions List Service: https://ofac.treasury.gov/sanctions-list-service
