# 무료 원자재·선물·환율 데이터 API 조사

조사 기준일: 2026-07-19

이 문서는 Chafi 투자 조사 에이전트가 원자재 수급, 시장 포지션, 가격, 환율을 조회할 때 사용할 수 있는 무료 API를 다시 선별한 메모다. 주문 API는 범위에서 제외하고 조회 기능만 다룬다.

여기서 무료란 개인 또는 내부 조사 용도로 사용할 때 정기적인 데이터 구독료가 필수가 아닌 경우를 뜻한다. 무료 API라도 계정이나 API 키가 필요할 수 있고, 상업적 이용·재배포에는 별도 약관이나 라이선스가 적용될 수 있다.

## 1. 결론

무료 API만으로도 중장기 투자 조사 에이전트는 충분히 만들 수 있다. 추천 코어 조합은 다음과 같다.

```text
실제 수급
├─ 에너지: EIA Open Data
├─ 농산물: USDA FAS PSD·ESR
└─ 국가 간 원자재 이동: UN Comtrade

시장 포지션
└─ 원자재 선물 포지션·미결제약정: CFTC COT

가격과 환율
├─ 원화 환율: 한국은행 ECOS
├─ 국제 기준환율: ECB Data API
├─ 거시·환율·원자재 기준가격: FRED
└─ 편의용 보조 가격: Alpha Vantage 무료 티어
```

다만 무료 공식 API만으로는 다음 항목을 안정적으로 얻기 어렵다.

- CME·ICE·LME 등의 실시간 선물 호가
- 원자재별 전체 만기 선물곡선
- LME·CME·SHFE의 정교한 거래소 창고 재고
- 틱·호가 단위의 준실시간 거래 데이터

따라서 무료 버전은 자동매매가 아니라 `수급 변화 감지 → 포지션 확인 → 기준가격과 환율 확인 → 기존 투자 가설 갱신`에 맞춰야 한다.

## 2. 최종 선별표

| 우선순위 | API | 무료 조건 | 핵심 데이터 | 갱신 성격 | 역할 |
|---|---|---|---|---|---|
| A | EIA Open Data | 무료 키 필요 | 원유·가스 생산, 재고, 수출입, 정제, 소비, 가격 | 시간·주·월·연 | 에너지 수급 SSOT |
| A | USDA FAS API | 무료 `api.data.gov` 키 필요 | 농산물 생산, 소비, 재고, 수출, 전망 | 주·월 중심 | 농산물 수급 SSOT |
| A | CFTC COT API | 공개 조회 가능 | 선물 미결제약정, 생산자·스왑딜러·Managed Money 포지션 | 주간 | 포지셔닝 SSOT |
| A | 한국은행 ECOS | 무료 키, 샘플 키 제공 | 원/달러 등 대원화 환율과 국내 거시통계 | 일·월 등 | 원화 기준환율 SSOT |
| A | ECB Data API | 키 불필요 | 유로 기준 주요 통화 참조환율 | 영업일 일간 | 국제 기준환율 |
| A- | FRED API | 무료 키 필요 | 환율, 금리, 달러지수, 원자재 기준가격, 거시통계 | 일·주·월 등 | 통합 보조 허브 |
| B | UN Comtrade API | 무료 계정·키 | 국가별 품목 수출입 물량·금액 | 월·연 중심 | 공급망·무역 흐름 |
| B | Alpha Vantage | 무료 키, 일 25회 | WTI, Brent, 가스, 금속, 농산물, FX | 일·주·월 중심 | 편의용 보조 가격 |

`A`는 처음부터 연결할 소스, `B`는 코어가 안정된 뒤 추가할 소스다.

## 3. API별 상세

### 3.1 EIA Open Data

[EIA Open Data](https://www.eia.gov/opendata/index.php/api)는 에너지 분야에서 가장 먼저 연결할 무료 공식 API다.

획득 가능한 정보:

- 원유·콘덴세이트 생산과 매장량
- 원유 및 석유제품 재고
- 원유·제품 수출입
- 정유시설 투입량, 생산량, 가동률과 처리능력
- 석유제품 공급량과 소비
- 천연가스 생산, 저장, 주입·인출, 수급
- 석탄과 전력 생산·소비
- 일부 현물·선물 기준가격
- 단기 에너지 전망인 STEO 데이터

운영 조건:

- 비용: 무료
- 인증: 이메일로 발급받는 API 키 필수
- 형식: REST, JSON 또는 XML
- 응답 최대치: JSON 5,000행, XML 300행
- 권장 호출량: 지속 호출 약 9,000회/시간 미만, 순간 호출 5회/초 미만
- 초과 시: 일시적인 throttling 또는 키 차단
- 민감한 주간 석유·가스 보고서는 발표 후 API 반영까지 최대 약 2시간 걸릴 수 있음

공식 문서:

- [API 기술 문서](https://www.eia.gov/opendata/documentation.php)
- [호출 제한 FAQ](https://www.eia.gov/opendata/faqs.php)
- [API 키 발급](https://www.eia.gov/opendata/register.php)

판단:

에너지의 물리적 공급과 재고를 확인하는 핵심 SSOT다. WTI 가격만 보는 것보다 EIA 재고·생산·수출입을 먼저 보는 것이 낫다.

### 3.2 USDA FAS PSD·ESR·GATS API

[USDA FAS Open Data API](https://apps.fas.usda.gov/opendatawebV2/)는 농산물의 생산·공급·유통과 수출을 제공한다.

주요 데이터셋:

- `PSD`: 국가별 농산물 생산, 소비, 수입, 수출, 기초·기말 재고와 전망
- `ESR`: 미국의 주간 농산물 수출 판매
- `GATS`: 미국 및 UN Comtrade 기반 농산물 수출입

대표 품목:

- 옥수수, 밀, 쌀
- 대두와 유지종자
- 면화, 설탕
- 축산물과 일부 가공품

운영 조건:

- 비용: 무료
- 인증: 무료 `api.data.gov` 키 필요
- 기본 호출 제한: `api.data.gov` 기본값은 키당 1,000회/시간
- `DEMO_KEY`: IP당 30회/시간, 50회/일
- 실제 USDA 서비스가 별도 제한을 설정할 수 있으므로 응답의 `X-RateLimit-*` 헤더 확인 필요
- PSD는 여러 과거 연도의 전망값도 수정될 수 있으므로 release date와 revision을 함께 저장해야 함

공식 문서:

- [FAS API Swagger](https://apps.fas.usda.gov/opendatawebV2/)
- [PSD Online](https://apps.fas.usda.gov/psdonline/app/index.html)
- [`api.data.gov` 호출 제한](https://api.data.gov/docs/developer-manual/)

판단:

농산물에서는 EIA에 대응하는 핵심 수급 SSOT다. 특히 `기말 재고 / 소비량`으로 stock-to-use 비율을 만들 수 있다.

### 3.3 CFTC Commitments of Traders API

[CFTC COT](https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm)는 공급량이 아니라 선물시장 포지션을 제공한다.

획득 가능한 정보:

- 전체 미결제약정
- Producer/Merchant/Processor/User 포지션
- Swap Dealer 포지션
- Managed Money 포지션
- Other Reportables와 Non-reportables
- 농산물, 석유, 천연가스, 전력, 금속 계약

운영 조건:

- 비용: 무료
- 갱신: 일반적으로 화요일 기준 포지션을 금요일 공개
- 인증: 공개 데이터는 토큰 없이도 조회 가능
- App Token: 필수는 아니지만 무료 토큰을 사용하면 무인증 호출보다 안정적인 요청 풀을 받을 수 있음
- 정확한 숫자 제한은 CFTC가 공개하지 않으므로 주 1회 증분 수집과 캐시를 권장
- 대량 호출보다 보고일과 상품을 필터링하는 방식이 적합

추천 데이터셋:

- Disaggregated Futures Only
- 데이터셋 ID: `72hh-3qpy`
- [데이터셋과 필드 문서](https://publicreporting.cftc.gov/Commitments-of-Traders/Disaggregated-Futures-Only/72hh-3qpy)
- [COT Public Reporting 안내](https://publicreporting.cftc.gov/stories/s/r4w3-av2u)

판단:

`생산자 숏 증가`, `Managed Money 롱 쏠림`, `미결제약정 급증` 등을 탐지할 수 있다. 다만 포지션의 목적까지 확정할 수 없으므로 물리적 수급 근거로 취급하면 안 된다.

### 3.4 한국은행 ECOS Open API

[한국은행 ECOS Open API](https://ecos.bok.or.kr/api/)는 원화 기준 환율과 국내 거시통계의 핵심 소스다.

획득 가능한 정보:

- 원/미국달러 매매기준율
- 원/엔, 원/유로 등 주요국 통화의 대원화 환율
- 금리, 통화량, 물가, 국제수지 등 한국은행 경제통계
- 일·월·분기·연 단위 시계열

공식 샘플 호출:

```text
https://ecos.bok.or.kr/api/StatisticSearch/sample/json/kr/1/5/731Y001/D/20260701/20260719/0000001
```

위 예시는 통계코드 `731Y001`, 항목코드 `0000001`인 원/미국달러 매매기준율을 조회한다. `sample` 키는 테스트용이고 운영 환경에서는 발급받은 키를 사용한다.

운영 조건:

- 비용: 무료
- 인증: 운영용 인증키 필요, 샘플 요청은 `sample` 키 사용 가능
- 형식: JSON 또는 XML
- 공개 문서에서 안정적으로 확인 가능한 숫자형 초당 제한은 없음
- 일간 환율은 하루 한 번 증분 수집하고 캐시하는 것으로 충분

판단:

원화 투자자의 수익률 환산과 환노출 분석에는 ECOS를 기준값으로 삼는 것이 적합하다. 실시간 거래 호가는 아니다.

### 3.5 ECB Data API

[ECB Data API](https://data.ecb.europa.eu/help/api/overview)는 계정이나 키 없이 호출할 수 있는 SDMX REST API다.

획득 가능한 정보:

- 유로 대비 USD, JPY, GBP 등 주요 통화 참조환율
- 일·월 단위 환율
- 유효환율과 ECB의 다양한 거시·금융 통계
- 수정된 값과 과거 버전

예시:

```text
https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?format=csvdata&lastNObservations=30
```

운영 조건:

- 비용: 무료
- 인증: 불필요
- 참조환율 발표: 영업일 약 16:00 CET
- 형식: CSV, JSON, SDMX-ML
- 숫자형 호출 제한은 공식 문서에 명시되어 있지 않음
- `startPeriod`, `endPeriod`, `lastNObservations`, `updatedAfter`로 범위를 줄이는 방식 권장

공식 문서:

- [데이터 조회 규격](https://data.ecb.europa.eu/help/api/data)
- [호출 예제](https://data.ecb.europa.eu/help/api/data-examples)

판단:

유로 기준 교차환율과 국제 비교에 좋다. 원/달러는 ECOS를 우선하고 ECB는 교차검증에 사용한다.

### 3.6 FRED API

[FRED API](https://fred.stlouisfed.org/docs/api/fred/overview.html)는 다양한 기관의 거시·시장 시계열을 한 인터페이스로 제공한다.

유용한 데이터:

- `DEXKOUS`: 원/달러 일별 환율
- `DTWEXBGS`: 미국 달러의 광의 명목지수
- `DCOILWTICO`: WTI 원유 현물 기준가격
- `DCOILBRENTEU`: Brent 원유 현물 기준가격
- `DHHNGSP`: Henry Hub 천연가스 현물가격
- 금리, 물가, 신용스프레드와 금융여건
- ALFRED를 통한 당시 발표값과 수정 이력

운영 조건:

- 비용: 무료 API 제공
- 인증: 무료 계정의 API 키 필요
- FRED API v2 제한: 최대 2회/초, 초과 시 HTTP 429와 임시 차단 가능
- 기존 series API는 공식 문서에 동일한 숫자 제한이 명시되지 않아 1~2회/초 이하로 보수적으로 운영 권장
- FRED에 모인 각 시계열은 원 제공자의 저작권·재사용 조건을 별도로 확인해야 함
- 외부 사용자용 앱에는 FRED API를 사용하지만 연은의 보증을 받지 않았다는 고지가 필요함

공식 문서:

- [시계열 관측값 조회](https://fred.stlouisfed.org/docs/api/fred/series_observations.html)
- [v2 호출 제한과 오류](https://fred.stlouisfed.org/docs/api/fred/v2/errors.html)
- [이용 조건](https://fred.stlouisfed.org/legal/terms/)

판단:

여러 소스를 빠르게 묶는 데 유용하지만, EIA·ECOS 같은 원 제공기관 API가 있으면 원본을 SSOT로 두고 FRED는 교차검증과 결측 보완에 사용한다.

### 3.7 UN Comtrade API

[UN Comtrade](https://comtrade.un.org/)는 국가가 보고한 품목별 국제무역 통계를 제공한다.

획득 가능한 정보:

- 보고국·상대국별 수출입
- HS 품목코드별 거래액과 물량
- 월간·연간 데이터
- 원유, 가스, 구리광, 철광석, 곡물 등 원자재의 국가 간 이동

운영 조건:

- 비용: 무료 티어 제공
- 인증: 무료 계정과 API 키
- 무료 한도: 최대 500 API 호출/일
- 무료 호출당 다운로드: 최대 100,000레코드
- 국가별 보고 지연과 수정 시점이 다름

공식 자료:

- [UN Comtrade 데이터 포털](https://comtradeplus.un.org/TradeFlow/)
- [UNSD 무역통계 안내](https://unstats.un.org/unsd/trade/imts/)

판단:

생산량이나 재고가 아니라 실제 무역 흐름을 보여준다. 특정 국가의 수출 급감이나 주요 수입국의 사재기성 증가를 월 단위로 탐지하는 데 유용하다.

### 3.8 Alpha Vantage 무료 티어

[Alpha Vantage](https://www.alphavantage.co/documentation/#commodities)는 여러 원자재 가격과 FX를 간단한 REST API로 제공한다.

지원 원자재:

- WTI, Brent, 천연가스
- 금, 은, 구리, 알루미늄
- 밀, 옥수수, 면화, 설탕, 커피
- 종합 원자재 가격지수

운영 조건:

- 비용: 무료 티어
- 인증: 무료 API 키
- 무료 한도: 대부분의 데이터셋 합계 25회/일
- 데이터: 주로 일·주·월 단위 기준가격
- 실시간·일부 고급 데이터는 유료

공식 자료:

- [API 문서](https://www.alphavantage.co/documentation/)
- [무료 호출 한도](https://www.alphavantage.co/support/)

판단:

구현이 간단하지만 2차 제공자이고 무료 호출량이 적다. SSOT로 삼지 말고, 대시보드용 보조 가격이나 원본 API 장애 시의 fallback으로만 사용한다.

## 4. 무료 코어에서 제외한 후보

### 한국투자 Open API

한국투자 API 자체는 기본적으로 무료이고 해외선물 현재가·호가·차트·미결제약정 API를 제공한다. 그러나 [공식 FAQ](https://apiportal.koreainvestment.com/faq)에 CME·SGX 해외선물옵션 API 유료시세 신청 안내가 별도로 존재한다.

또한 시세정보는 계좌를 가진 개인이 자기 자산 투자 목적으로만 이용할 수 있고 제3자 제공은 금지된다. [Open API 서비스 소개](https://apiportal.koreainvestment.com/about-open-api)

따라서 다음 이유로 완전 무료 코어에서는 제외한다.

- 한국투자 계좌와 서비스 신청 필요
- 해외선물 거래소 시세에 별도 비용이 발생할 수 있음
- 제3자 대상 서비스로 시세를 표출하거나 재배포할 수 없음

개인 전용 에이전트에서 계좌·포지션을 읽는 용도는 여전히 유용하므로 나중에 `조건부 무료 계좌 어댑터`로 추가할 수 있다.

### IBKR·CME·OANDA

- IBKR: 계좌와 상품별 시장 데이터 구독이 필요하며 선물 시세는 대체로 유료
- CME 직접 API: 정확한 실시간·과거 선물 데이터지만 라이선스와 구독 필요
- OANDA: FX 조회에는 유용하지만 계좌·지역 조건이 있고 공식 기준환율 SSOT가 아님

### USGS와 거래소 재고

USGS의 광물 자료는 무료이고 품질이 높지만, 현재 무료 MVP에서 바로 사용할 수 있는 일관된 원자재 시계열 API보다는 보고서와 다운로드 파일 중심이다. LME·CME·SHFE 창고 재고도 안정적인 무료 공식 API를 기대하기 어렵다.

금속은 초기에는 다음 조합을 사용한다.

```text
UN Comtrade 수출입
+ CFTC 금속 포지션
+ FRED 또는 Alpha Vantage 기준가격
+ 필요 시 USGS 정기 보고서 수동 수집
```

## 5. 무료 구성으로 가능한 판단

### 원유 공급 타이트 여부

1. EIA 원유·제품 재고 변화
2. EIA 생산량, 수입, 수출, 정제 가동률
3. CFTC Producer/Merchant와 Managed Money 포지션
4. FRED 또는 EIA의 WTI·Brent 기준가격
5. ECOS 원/달러 환율

재고 감소와 수출 증가, 생산 정체가 동시에 나타나면 물리적 타이트 가능성을 높인다. 가격 상승만으로는 공급 부족으로 단정하지 않는다.

### 농산물 공급 위험

1. USDA PSD 생산·소비·기말 재고 전망
2. USDA ESR 주간 수출 판매
3. UN Comtrade 국가별 수출입
4. CFTC 생산자와 Managed Money 포지션
5. Alpha Vantage 또는 FRED의 기준가격

핵심 파생지표는 `기말 재고 / 연간 소비`인 stock-to-use 비율이다.

### 금속 공급 위험

1. UN Comtrade 광석·정광·정련금속 수출입
2. CFTC 금속 선물 포지션과 미결제약정
3. FRED 또는 Alpha Vantage의 구리·알루미늄 기준가격
4. USGS 월간·연간 보고서로 생산능력 교차검증

거래소 창고 재고가 빠져 있으므로 에너지·농산물보다 판단 신뢰도를 낮게 표시해야 한다.

## 6. 수집 주기 권장안

| 주기 | API | 수집 방식 |
|---|---|---|
| 매일 1회 | ECOS, ECB, FRED | 최신 관측값 증분 수집 |
| 매일 1회 이하 | Alpha Vantage | 25회/일 한도 내 관심 품목만 조회 |
| 발표 후 | EIA | 주간 석유·가스 발표 시각 기준 수집 |
| 매주 | CFTC COT | 금요일 공개 후 1회 수집 |
| 매주 | USDA ESR | 새 release date 확인 후 증분 수집 |
| 매월 | USDA PSD | 수정된 전망과 이전 값을 함께 저장 |
| 매월 | UN Comtrade | 관심 국가·HS 코드만 증분 수집 |

모든 API에는 캐시, 지수 백오프, HTTP 429 처리, 요청 시간 제한을 둔다. 정기 통계는 폴링 빈도를 높여도 새 정보가 생기지 않으므로 발표 일정 중심으로 호출한다.

## 7. SSOT 저장 원칙

같은 숫자라도 관측 대상 기간, 발표일, 수집일을 분리해야 한다.

```text
source_id
dataset_id
series_or_contract_id
entity_ids
period
published_at
retrieved_at
value
unit
frequency
revision_number
is_initial_release
source_url
license_scope
```

추가 원칙:

- EIA·USDA·ECOS 같은 원 제공기관을 SSOT로 지정한다.
- FRED와 Alpha Vantage에서 같은 값을 받더라도 별도의 observation으로 저장한다.
- 최초 발표값을 덮어쓰지 않고 수정 이력을 append한다.
- `물리적 수급`, `시장 포지션`, `가격`, `환율`을 서로 다른 evidence type으로 구분한다.
- 선물 포지션이나 가격을 실제 공급량으로 표현하지 않는다.
- API 응답 원문과 수집 시각을 함께 보존한다.

## 8. 구현 우선순위

### 1단계

- EIA
- CFTC COT
- 한국은행 ECOS
- FRED 또는 ECB

에너지와 원화 환율을 먼저 연결해 데이터 모델과 수정 이력 저장 방식을 검증한다.

### 2단계

- USDA PSD·ESR
- UN Comtrade

농산물과 공급망 분석을 추가한다.

### 3단계

- Alpha Vantage fallback
- USGS 보고서 수집
- 필요할 때만 한국투자 계좌·시세 어댑터

무료 MVP의 최종 형태는 준실시간 트레이딩 시스템이 아니라, 공식 수급과 포지션을 근거로 투자 가설을 강화·약화·무효화하는 조사 에이전트다.
