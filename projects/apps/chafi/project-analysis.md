# Chafi Reference Project Analysis

Created: 2026-05-18

Analyzed repositories:

- `firma`: https://github.com/evan-moon/firma
- `Vibe-Trading`: https://github.com/HKUDS/Vibe-Trading

Local copies:

- `./firma`
- `./Vibe-Trading`

## Executive Summary

Both projects are relevant, but they solve different halves of the Chafi idea.

`firma` is a local-first personal finance and portfolio intelligence tool. Its
strongest idea is not raw AI reasoning, but a deterministic data layer and
advisor layer that returns structured evidence, computed metrics, and ranked
recommendations through CLI and MCP. It is closer to a personal investment
operating system.

`Vibe-Trading` is a tool-heavy finance research agent. Its strongest idea is a
skill-driven research harness: the agent can load finance methodology docs,
retrieve market/web/document data, generate strategy code, run backtests, save
hypotheses, and preserve memory. It is closer to an AI research lab.

For Chafi, the better direction is a hybrid:

1. Use `firma`'s local-first, source-of-truth, deterministic brief model.
2. Use `Vibe-Trading`'s skills, hypothesis registry, artifacted backtest loop,
   and research memory model.
3. Add a stronger SSOT/evidence ledger than either project currently has.

## Firma

### Product Shape

`firma` lets a user import transaction, balance, and cash-flow data, then exposes
portfolio and research tools through both CLI and MCP. The intended workflow is
Claude + local SQLite:

- User gives trades or financial records.
- Claude calls MCP tools to insert and sync data.
- `firma` derives holdings, P&L, concentration, risk, macro context, and daily
  brief.
- Claude narrates from tool output rather than inventing numbers.

### Stack

- TypeScript monorepo
- Yarn 4 workspaces
- Turborepo
- Drizzle ORM + SQLite
- Commander / Clack for CLI
- `@modelcontextprotocol/sdk` for MCP
- Vitest tests
- Next.js docs app

### Important Modules

- `packages/shared/db/src/schema.ts`
  - SQLite tables for transactions, balances, flows, snapshots, profile,
    FX rates, and cached prices.
  - Transactions are the portfolio source of truth; holdings are derived.

- `packages/use-case/brief/src/assemble.ts`
  - Builds daily brief payload.
  - Combines holdings, movers, concentration, news, earnings, macro, world
    macro, disasters, commodities, dividend calendar, risk summary, tax
    outlook, and goal tracking.

- `packages/use-case/advisor/src/analyze.ts`
  - Runs deterministic advisor rules.
  - Rules include runway, derisk, deploy idle cash, contribution, tactical
    regime, and rebalance.

- `packages/domain/domain/src/macro/signals.ts`
  - Builds stress index and regime bias from FRED series.
  - Uses VIX, yield curve, financial stress, initial claims, HY spread,
    dollar trend, and inflation expectations.

- `apps/mcp/src/index.ts`
  - Registers portfolio, report, mutate, snapshot, stock, macro, admin tools,
    plus prompts.

### Data Sources

`firma` has a compact and pragmatic data source set:

- Finnhub
  - US prices
  - company profile
  - company news
  - insider transactions
  - SEC-reported financials
  - earnings calendar
  - dividends
  - economic calendar
  - peers

- FRED
  - macro series
  - FX history
  - commodities
  - stress/regime signals

- Yahoo Finance
  - non-US market snapshots without a key

- World Bank
  - annual GDP, inflation, unemployment by country

- GDACS
  - active disaster alerts

- Open Exchange Rates API
  - live FX fallback path

### Decision Logic

This is the strongest design feature in `firma`: decisions are not just LLM
prose. The advisor uses deterministic rules and returns structured
recommendations.

Examples:

- `runway`
  - warns when cash runway is under 6 months.

- `deploy`
  - flags idle cash above `$10,000` for at least 2 months.
  - estimates opportunity cost using a 4% reference return.

- `contribution`
  - flags monthly surplus above `$500` that is not being deployed.

- `tactical`
  - combines macro regime with cash share.
  - if risk-on and cash-heavy, suggests deploying.
  - if risk-off, suggests avoiding fresh risk.

- `derisk`
  - estimates a shock from realized volatility, with 50% fixed fallback.
  - checks whether drawdown would force selling or make goals infeasible.

- `rebalance`
  - tests whether top ticker or sector concentration creates material
    net-worth loss or goal delay under a shock.

This is very relevant for Chafi because it makes the AI assistant a narrator
and investigator, while the core recommendation logic remains inspectable.

### Strengths

- Local-first storage.
- Good CLI/MCP parity discipline.
- Transactions as source of truth.
- Daily brief as canonical entry point.
- Deterministic advisor rules.
- Useful combination of portfolio, personal cash flow, and macro context.
- Good practical source choices for a personal investor.
- Strong framing: data sections are evidence, not the headline.

### Weaknesses For Chafi

- Evidence ledger is not explicit enough. It stores data, but does not preserve
  claim-level provenance, source authority, publication timestamps, or revision
  lineage as first-class concepts.

- News is still mostly headline-level via Finnhub. It does not force a
  primary-source follow-up loop.

- SEC support is mediated through Finnhub rather than direct EDGAR ingestion.
  Useful, but less ideal for a primary-source-first SSOT.

- Macro regime logic is simple and threshold-based. It is inspectable, which is
  good, but should be treated as a starting rubric rather than a final model.

- No explicit thesis lifecycle. It has profile/goals and recommendations, but
  not a durable "investment thesis -> evidence -> update -> invalidation" model.

## Vibe-Trading

### Product Shape

`Vibe-Trading` is a natural-language finance research agent with tools,
backtests, skills, memory, swarms, and a frontend. It is designed for research,
simulation, and backtesting, not live trade execution.

The workflow is:

- User asks a finance/trading question.
- Agent loads relevant skills.
- Agent uses tools for market data, web, documents, files, strategy generation,
  and backtesting.
- Backtests emit metrics and artifacts.
- Hypotheses, memory, and sessions make research reusable.

### Stack

- Python 3.11+
- LangChain / LangGraph
- FastAPI backend
- FastMCP server
- React 19 + Vite frontend
- pandas, numpy, scipy, scikit-learn
- yfinance, Tushare, AKShare, CCXT, OKX, Futu
- DuckDB
- Rich / prompt_toolkit CLI

### Important Modules

- `agent/SKILL.md`
  - MCP-facing skill manifest and product overview.

- `agent/src/agent/skills.py`
  - Loads bundled and user-created skills.
  - Uses progressive disclosure: one-line skill descriptions in prompt, full
    docs loaded only on demand.

- `agent/src/tools/__init__.py`
  - Auto-discovers tools from `src/tools`.
  - Can include or exclude shell-capable tools.
  - Can wrap external MCP tools into the agent.

- `agent/mcp_server.py`
  - Exposes finance tools to MCP clients.

- `agent/src/hypotheses/registry.py`
  - Local JSON hypothesis registry.
  - Tracks title, thesis, status, universe, signal definition, data sources,
    skills, run cards, and invalidation notes.

- `agent/src/tools/hypothesis_tool.py`
  - Tool wrappers for create/update/link/search hypotheses.

- `agent/backtest/runner.py`
  - Validates config and generated strategy code.
  - Selects data loaders and market engines.
  - Runs backtests and emits artifacts.

- `agent/backtest/loaders/registry.py`
  - Market-level fallback chains.

- `agent/src/memory/persistent.py`
  - File-backed cross-session memory.

- `agent/src/tools/skill_writer_tool.py`
  - Saves, patches, deletes, and manages user-created skills.

### Data Sources

The project supports a wider trading-oriented data surface:

- yfinance
  - US/HK equities.

- OKX
  - crypto.

- CCXT
  - crypto across many exchanges.

- Tushare
  - China A-share data, fundamentals, futures, funds, macro.
  - Optional token.

- AKShare
  - free fallback for A-shares, US, HK, futures, forex, macro.

- Futu
  - HK/A-share broker-linked data.

- DuckDuckGo search
  - web search.

- Jina Reader
  - web page to Markdown reader.

- Local document readers
  - PDF, Word, Excel, PowerPoint, images, and text formats.

### Skills

The bundled skill system is directly relevant to Chafi. It includes around 75
finance skills across categories:

- Data sources: `data-routing`, `tushare`, `yfinance`, `okx-market`,
  `akshare`, `ccxt`
- Strategy: `strategy-generate`, `cross-market-strategy`, `technical-basic`,
  `multi-factor`, `ml-strategy`, and many others
- Analysis: `macro-analysis`, `global-macro`, `valuation-model`,
  `earnings-forecast`, `credit-analysis`, `behavioral-finance`
- Flow: `edgar-sec-filings`, `financial-statement`, `us-etf-flow`,
  `hk-connect-flow`, `adr-hshare`
- Risk: `risk-analysis`, plus specialized strategy/risk skills
- Tool workflows: `backtest-diagnose`, `report-generate`, `web-reader`,
  `doc-reader`, `alpha-zoo`

Two skills were especially relevant:

- `macro-analysis`
  - Provides a macro cycle framework: growth, inflation, policy direction,
    Merrill Lynch clock, central-bank interpretation, asset allocation tilts.

- `edgar-sec-filings`
  - Provides a practical filing analysis rubric for 10-K, 10-Q, 8-K,
    DEF 14A, Form 4, 13F, SC 13D/G.
  - Includes risk factor comparison, MD&A extraction, insider transaction
    scoring, and event classification.

### Backtest And Research Artifacts

The backtest loop is mature:

- Validates `config.json` with Pydantic.
- Restricts generated `signal_engine.py` top-level executable statements.
- Routes data by market/source.
- Supports fallback chains.
- Selects market engines for equities, crypto, futures, forex, options, and
  cross-market composite runs.
- Emits artifacts like equity curve, metrics, trades, positions, and run cards.

This is valuable for Chafi if Chafi eventually evaluates quantitative signals.
For thesis-driven investing, the same idea should become "research run cards":

- What hypothesis was tested?
- What data was used?
- What time range was valid?
- What would invalidate the conclusion?
- Which source versions were used?
- Which assumptions were hard-coded?

### Strengths

- Strong tool/skill architecture.
- Skills are reusable and user-extensible.
- Hypothesis registry is close to the thesis-tracking concept Chafi needs.
- Backtests are artifacted and reproducible.
- Good market coverage for trading and quant research.
- Memory and session search support long research workflows.
- Explicit security hardening around file paths, shell tools, URL reading, and
  generated strategy import.

### Weaknesses For Chafi

- It is trading/backtest-first, not primary-source investing-first.

- Source quality is mixed. yfinance, AKShare, web search, and Jina Reader are
  useful but should not be Chafi's SSOT core for serious equity analysis.

- Many skills are methodology documents. That is useful, but they can become
  "plausible analyst prose" unless every claim is tied to source evidence.

- Hypothesis registry is good, but too light:
  - no evidence object
  - no claim-level provenance
  - no source authority score
  - no data revision tracking
  - no structured belief update history

- Web reader sends URLs to a third-party reader service. That may be acceptable
  for public pages, but primary-source ingestion should be direct where possible.

## Comparison

| Dimension | firma | Vibe-Trading | Chafi Implication |
|---|---|---|---|
| Core user | Personal investor | Research/trading user | Chafi should start with personal investor/researcher |
| Storage | Local SQLite | Files/JSON/artifacts | Use SQLite/Postgres-style evidence store |
| AI interface | MCP + prompts | CLI/API/MCP/frontend | MCP-first is enough initially |
| Source design | Compact, pragmatic | Broad, trading-oriented | Use primary-source tiers, not broad scraping first |
| Skills | Prompts/personas | Full skill library + user skills | Adopt skill docs, but require evidence outputs |
| Judgment | Deterministic advisor rules | Agent-generated research + backtests | Combine deterministic checks with thesis updates |
| Thesis tracking | Weak | Hypothesis registry MVP | Build first-class thesis/evidence ledger |
| Backtesting | Portfolio history/risk | Full strategy backtesting | Later phase for quant validation |
| News | Finnhub headlines | web search/read | News should trigger primary-source retrieval |
| Best idea | `get_brief` as canonical entry point | skill + hypothesis + run-card loop | Chafi should have `daily_research_brief` + `thesis_update` |

## Recommended Chafi Architecture

### 1. Evidence Ledger First

Create a first-class evidence model before building chat UI.

Minimum entities:

- `Source`
  - provider, URL/API, authority tier, license, latency, revision policy

- `Document`
  - source ID, raw content pointer, published_at, observed_at, ingested_at,
    checksum, language, entity links

- `Claim`
  - normalized factual assertion, document pointer, evidence span/table cell,
    confidence_fact

- `Signal`
  - derived from claims or time series, with code/rule provenance

- `Thesis`
  - title, asset/universe, current belief, status, invalidation criteria,
    confidence_inference

- `ThesisUpdate`
  - evidence added, belief delta, counter-evidence, market-pricing check,
    decision state

### 2. Source Tiers

Use the SSOT memo as the source ranking:

- Tier 1: official macro and policy APIs
  - FRED, BLS, BEA, Fed, Treasury, EIA, CFTC, IMF, World Bank, OECD, BIS

- Tier 2: company primary data
  - SEC EDGAR direct ingestion
  - earnings transcripts
  - investor presentations
  - company IR press releases

- Tier 3: policy/regulation
  - FOMC, Federal Register, OFAC, USTR, CBP, BIS export controls

- Tier 4: market/news triggers
  - licensed news if available
  - otherwise headlines are only triggers, not final evidence

### 3. Skills As Methodology, Not Authority

Adopt `Vibe-Trading`'s skill format, but make outputs structured.

Every Chafi skill should return:

- facts used
- evidence IDs
- assumptions
- counter-evidence
- confidence
- invalidation condition
- suggested next source to check

Initial Chafi skills:

- `macro-regime`
- `sec-filing-analysis`
- `earnings-quality`
- `valuation`
- `policy-risk`
- `market-reaction`
- `thesis-update`
- `anti-hallucination`

### 4. Deterministic Guardrails

Adopt `firma`'s pattern of deterministic rules for parts that should not be
left to free-form LLM judgment.

Examples:

- concentration thresholds
- liquidity/runway checks
- valuation sanity bounds
- financial statement quality flags
- insider transaction scoring
- macro stress scoring
- data staleness checks
- missing evidence checks

The LLM should explain and investigate, not silently redefine the scoring rules.

### 5. Canonical Entry Points

Like `firma`'s `get_brief`, Chafi should have a few canonical tools:

- `daily_research_brief`
  - market state, macro changes, watched thesis changes, new primary sources,
    high-priority events, stale data warnings

- `update_thesis`
  - applies new evidence to an existing thesis

- `inspect_evidence`
  - shows source chain behind a conclusion

- `find_primary_source`
  - given a headline or claim, locate the primary document/API source

- `create_hypothesis`
  - similar to Vibe-Trading, but tied to evidence and invalidation

- `run_research_card`
  - reproducible analysis artifact, inspired by Vibe-Trading run cards

## Concrete Reuse Ideas

### From Firma

- Local-first financial database.
- MCP-first assistant surface.
- `brief` as the main tool for daily interaction.
- CLI/MCP parity discipline.
- Deterministic recommendation rules.
- Macro stress/regime scoring as a simple first pass.
- Portfolio + cash-flow + macro in one context.
- Freshness metadata in tool outputs.

### From Vibe-Trading

- Progressive skill loading.
- User-created skill save/patch flow.
- Hypothesis registry.
- Run cards and artifacted research.
- Tool auto-discovery.
- Backtest validation patterns.
- Document/web reading tools, with stricter source policy for Chafi.
- Swarm/preset concept, later, for bull/bear/risk committee workflows.

## What Not To Copy Blindly

- Do not make yfinance/AKShare/news/search the SSOT core.
- Do not allow skills to produce unsupported investment claims.
- Do not prioritize backtesting before source provenance.
- Do not expose too many MCP tools early; `firma` already shows the need to
  consolidate MCP surfaces.
- Do not rely on generated code execution without strict sandboxing and
  artifact validation.
- Do not treat "latest news" as equivalent to "new evidence."

## Suggested Build Order

### Phase 1: Evidence And Sources

1. Define evidence ledger schema.
2. Implement direct FRED ingestion.
3. Implement direct SEC EDGAR ingestion.
4. Store documents, claims, source metadata, and timestamps.
5. Add source authority and staleness checks.

### Phase 2: Thesis Engine

1. Implement hypothesis/thesis registry.
2. Add evidence links and belief update history.
3. Add invalidation criteria.
4. Add anti-hallucination checks.

### Phase 3: Skills

1. Add skill loader.
2. Add `macro-regime`, `sec-filing-analysis`, `earnings-quality`,
   `valuation`, and `market-reaction`.
3. Require every skill to emit evidence IDs.

### Phase 4: MCP Brief

1. Add `daily_research_brief`.
2. Add `inspect_evidence`.
3. Add `update_thesis`.
4. Add `find_primary_source`.

### Phase 5: Research Cards And Backtests

1. Add reproducible research run cards.
2. Add market reaction studies.
3. Add factor/backtest support only after provenance is solid.

## Final Recommendation

Start Chafi closer to `firma` than to `Vibe-Trading`: small, local-first,
evidence-driven, and deterministic where possible. Then selectively import
`Vibe-Trading`'s research-agent machinery: skills, hypothesis lifecycle,
memory, and run cards.

The product should not be "AI that predicts stocks." It should be "AI that
keeps an evidence-backed investment thesis honest."
