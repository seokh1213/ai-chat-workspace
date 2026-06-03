# Investment AI SSOT Research Notes

Created: 2026-05-18

## Premise

For an investment AI, the model is less important than the quality, latency,
traceability, and revision history of the source data. A useful system should
not be a generic news summarizer. It should behave more like an evidence ledger
and thesis engine:

1. Capture high-quality primary sources.
2. Track what changed.
3. Compare new evidence against existing beliefs.
4. Separate facts from interpretation.
5. Record confidence, counter-evidence, and market reaction.

## Source Tiers

### Tier 0: Market State

Use this layer to understand what the market has already priced in.

- Equities and sector ETFs
- Treasury yields and yield curve
- FX, especially DXY and USD/KRW
- Commodities: oil, gas, copper, gold
- Credit spreads
- Volatility indexes
- Volume, breadth, and relative strength

This layer should rarely be treated as a fundamental source by itself. It is
context for market expectations and reaction.

### Tier 1: Official Macro Data

Primary sources for macro regime detection and nowcasting.

- FRED: https://fred.stlouisfed.org/
- BLS: https://www.bls.gov/data/home.htm
- BEA: https://www.bea.gov/data
- Federal Reserve Data Download Program: https://www.federalreserve.gov/datadownload/help/
- U.S. Treasury Fiscal Data: https://fiscaldata.treasury.gov/
- EIA Open Data: https://www.eia.gov/opendata/index.php
- CFTC Commitments of Traders: https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm
- IMF Data API: https://data.imf.org/en/Resource-Pages/IMF-API
- World Bank Indicators API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
- OECD Data API: https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html
- BIS Data Portal: https://data.bis.org/help

Important implementation note: macro data is revised. Store initial releases,
revision timestamps, and final values separately.

### Tier 2: Company Primary Data

Use these as the foundation for company-specific analysis.

- SEC EDGAR search: https://www.sec.gov/search-filings
- 10-K, 10-Q, 8-K, S-1
- Form 3, 4, 5 insider transactions
- 13F institutional holdings
- Earnings call transcripts
- Investor presentations
- Company press releases

SEC filings are often better than news because they are primary, attributable,
and structured enough to preserve evidence.

### Tier 3: Policy, Regulation, and Geopolitics

Useful for sectors exposed to rates, tariffs, sanctions, export controls, trade,
energy, defense, semiconductors, and supply chains.

- FOMC calendar and statements: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- Federal Register: https://www.archives.gov/federal-register/the-federal-register
- OFAC Sanctions List Service: https://ofac.treasury.gov/sanctions-list-service
- USTR: https://ustr.gov/
- CBP tariff announcements: https://www.cbp.gov/newsroom/announcements/official-cbp-statement-tariffs
- BIS press releases: https://media.bis.gov/news-updates

For policy-sensitive equities, original government text should be preferred over
secondary news summaries.

### Tier 4: Fast Financial News

Fast news is useful as a trigger, not as the core source of truth. High-quality
real-time financial news usually requires licensing.

- Reuters / LSEG real-time machine-readable news:
  https://www.lseg.com/en/data-analytics/financial-data/financial-news-coverage/political-news-feeds-analysis/real-time-news
- Bloomberg
- Dow Jones / Factiva
- FactSet StreetAccount:
  https://insight.factset.com/resources/factset-document-distributor-xml-streetaccount-news
- AlphaSense
- RavenPack

News should trigger follow-up retrieval of primary sources whenever possible.

## SSOT Schema Ideas

Each ingested item should carry enough metadata to support later review.

- `source_type`: official_data, filing, transcript, policy, market_price, news,
  analyst, social
- `authority_score`: source reliability and proximity to primary evidence
- `published_at`: when the source was published
- `observed_at`: when the event or datapoint applies
- `ingested_at`: when the system captured it
- `latency_class`: realtime, intraday, daily, weekly, monthly, revised
- `revision_policy`: immutable, periodically_revised, restated, corrected
- `entity_ids`: tickers, CIKs, ISINs, countries, sectors
- `claim`: normalized factual assertion
- `evidence_url`: original source URL
- `evidence_excerpt`: short cited excerpt or structured data pointer
- `market_context`: price, rates, FX, sector, and volume around release
- `confidence_fact`: confidence that the source fact is correct
- `confidence_inference`: confidence in the investment interpretation

## Judgment Skills To Build

The AI should not jump directly from evidence to trade. It should use explicit
skills that force a consistent reasoning workflow.

- `macro_regime_skill`: rates, inflation, labor, growth, liquidity, credit
- `earnings_quality_skill`: revenue, margin, cash flow, inventory, SBC,
  guidance, restatements
- `valuation_skill`: multiples, FCF yield, growth, duration, rate sensitivity
- `event_risk_skill`: regulation, tariffs, sanctions, litigation, export control
- `market_reaction_skill`: price behavior before and after the evidence
- `thesis_tracker_skill`: whether evidence strengthens, weakens, or breaks a
  thesis
- `anti_hallucination_skill`: forbid claims without attributable evidence

## Suggested Reasoning Output

Every material analysis should produce:

1. Newly observed facts
2. Link to original evidence
3. Relationship to existing thesis
4. Counter-evidence
5. Probability that the market already priced it in
6. What primary source must be checked next
7. Decision state: defer, strengthen, weaken, invalidate

## Research Foundations

Potential foundations for the initial skills and evaluation rubric:

- Eugene Fama, efficient market hypothesis and market efficiency papers
- Fama-French factor research
- Aswath Damodaran, valuation frameworks
- Stephen Penman, financial statement analysis
- Loughran-McDonald financial sentiment dictionary and textual analysis papers
- Behavioral finance: Kahneman, Shiller
- Macro nowcasting literature: Giannone, Reichlin, Small
- AQR and related factor investing research

## Initial Direction

The right product shape is not "news AI." It is closer to:

- Evidence ledger
- Source-ranked retrieval system
- Thesis tracker
- Event monitor
- Primary-source-first investment research assistant
