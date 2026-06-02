---
name: full-report
description: Produces a comprehensive equity research report covering business analysis, financial health, valuation, and risk assessment. Triggers when user asks for a full research report, stock deep dive, comprehensive analysis, investment memo, or "analyze X stock". This is the master workflow that orchestrates all analytical modules.
---

# Full Equity Research Report

## Workflow Checklist

```
Full Report Progress:
- [ ] Step 1: Company overview & business profile
- [ ] Step 2: Industry & competitive analysis
- [ ] Step 3: Financial statement analysis (3 statements, 5-year)
- [ ] Step 4: Key ratios & financial health
- [ ] Step 5: Management, governance & insider activity
- [ ] Step 6: Valuation (DCF + comparables)
- [ ] Step 7: Risk analysis
- [ ] Step 8: Bull/bear cases & investment thesis
- [ ] Step 9: Assemble final report
```

## Step 1: Company Overview

Call `financial_search` to gather basic company information:

**1.1 Company Profile**
Query: `"[TICKER] company facts"`
Extract: `company_name`, `sector`, `industry`, `market_cap`, `employees`, `founded`, `headquarters`, `exchange`, `sic_code`

**1.2 Business Description**
Query: `"[TICKER] business model revenue segments"`
Extract: revenue breakdown by segment, key products/services, customer base

**1.3 Recent News & Developments**
Query: `"[TICKER] latest news developments"`
Extract: 3–5 most significant recent events that may impact the investment case

**1.4 Latest Filings Overview**
Call `read_filings` tool on the latest 10-K and 10-Q. Extract: core business narrative, management discussion, risk factors summary, segment performance.

## Step 2: Industry & Competitive Analysis

**2.1 Industry Overview**
Query: `"[TICKER] industry overview market size growth trends"`
Extract: TAM/SAM, industry growth rate, key trends, regulatory environment

**2.2 Competitive Landscape**
Query: `"[TICKER] competitors market share comparison"`
Extract: top 3–5 competitors, market share, competitive positioning

**2.3 Moat Assessment**
Query: `"[TICKER] competitive advantage moat analysis"`
Evaluate across 5 dimensions: brand, scale/cost advantage, network effects, switching costs, intangible assets (patents/IP, regulatory licenses)

## Step 3: Financial Statement Analysis

For each of the 3 statements, request 5 years of annual data.

**3.1 Income Statement (5-year)**
Query: `"[TICKER] annual income statement 5 years"`
Analyze: revenue CAGR, gross profit trend, operating margin trend, net income trajectory, EPS growth, share count change. Note any one-time items or accounting changes.

**3.2 Balance Sheet (5-year)**
Query: `"[TICKER] annual balance sheet 5 years"`
Analyze: cash & equivalents trend, total debt trend, goodwill & intangibles, current ratio trend, debt-to-equity trend, tangible book value per share.

**3.3 Cash Flow Statement (5-year)**
Query: `"[TICKER] annual cash flow statement 5 years"`
Analyze: operating cash flow vs. net income (quality of earnings), free cash flow trend, capex trend, FCF conversion rate, dividend + buyback vs. FCF (payout sustainability).

## Step 4: Key Ratios & Financial Health

Call `financial_metrics` tool to get current snapshot.

Query: `"[TICKER] financial metrics snapshot"`

Analyze these categories:

**Profitability:** Gross margin, operating margin, net margin, ROE, ROA, ROIC. Compare each to 5-year average and industry median.

**Growth:** Revenue growth (YoY), EPS growth, FCF growth. Are growth rates accelerating or decelerating?

**Liquidity & Solvency:** Current ratio, quick ratio, debt/equity, interest coverage (EBIT / interest expense), net debt / EBITDA.

**Efficiency:** Asset turnover, inventory turnover, receivables turnover, days sales outstanding.

**Valuation multiples (current):** P/E, EV/EBITDA, P/S, P/B, P/FCF, dividend yield.

For each ratio, note: (a) absolute level, (b) 5-year trend, (c) industry comparison.

## Step 5: Management, Governance & Insider Activity

**5.1 Management Quality**
Query: `"[TICKER] management team CEO CFO background"`
Assess: tenure, track record, capital allocation history, alignment with shareholders

**5.2 Insider Trading**
Query: `"[TICKER] insider trades last 12 months"`
Note: significant buying (bullish signal) or selling (potential concern). Distinguish between planned (10b5-1) sales and opportunistic trades.

**5.3 Ownership Structure**
Query: `"[TICKER] institutional ownership major shareholders"`
Note: institutional ownership %, insider ownership %, activist presence

## Step 6: Valuation

**6.1 DCF Valuation**
Invoke the `dcf-valuation` skill for intrinsic value estimate.

**6.2 Comparable Company Analysis**
Invoke the `comparables` skill for relative valuation.

**6.3 Historical Valuation Context**
Query: `"[TICKER] historical P/E EV/EBITDA 5 years"`
Compare current multiples to 5-year historical range. Is the stock trading at a premium or discount to its own history?

## Step 7: Risk Analysis

**7.1 Business Risks**
Query: `"[TICKER] business risks challenges"`
Categorize: demand cyclicality, technological disruption, customer concentration, supplier dependence, product concentration

**7.2 Financial Risks**
Assess from financial data: high leverage, refinancing risk, currency exposure, pension obligations, off-balance-sheet items

**7.3 Regulatory & Legal Risks**
Query: `"[TICKER] regulatory issues litigation legal risks"`
Note: pending lawsuits, regulatory investigations, antitrust concerns, environmental liabilities

**7.4 Macro & Geopolitical Risks**
Query: `"[TICKER] exposure to tariffs trade policy geopolitical risk"`
Note: supply chain geography, revenue by region, tariff sensitivity

## Step 8: Investment Thesis

**8.1 Bull Case**
Construct: what must go right? Catalysts, upside scenarios, target price under optimistic assumptions.

**8.2 Bear Case**
Construct: what could go wrong? Key risks materializing, downside scenarios, target price under pessimistic assumptions.

**8.3 Base Case**
Weight the evidence. What's the most likely 2–3 year outcome? Assign probability weighting.

## Step 9: Final Report Structure

Assemble all findings into this format:

```
# [TICKER] Equity Research Report | [Date]

## Executive Summary (1 paragraph)
- Ticker, price, market cap, rating (Buy/Hold/Sell), target price range
- 3 most important takeaways

## 1. Business Overview
- Company description, revenue breakdown, key products
- Competitive position & moat assessment

## 2. Industry Dynamics
- Market size, growth, trends
- Competitive landscape table

## 3. Financial Analysis
- Revenue & earnings summary table (5 years)
- Key ratios dashboard
- Cash flow quality assessment

## 4. Valuation
- DCF fair value range
- Comparables implied range
- Historical valuation context
- Combined valuation framework (weighted average or scenario-based)

## 5. Management & Governance
- Key leaders, track record, insider activity summary

## 6. Risk Factors
- Risk matrix: likelihood × impact
- Top 3 risks to monitor

## 7. Investment Thesis
- Bull case (probability: X%) — target: $Y
- Base case (probability: X%) — target: $Y
- Bear case (probability: X%) — target: $Y
- Recommendation: Buy / Hold / Sell

## 8. Appendix
- Data tables, methodology notes, disclaimers
```

**Important:** Present numbers in context — always compare to history (5-year trend) and peers (industry median). Never present a data point without a benchmark. Use tables for quantitative comparisons. Clearly separate facts from opinions and assumptions.
