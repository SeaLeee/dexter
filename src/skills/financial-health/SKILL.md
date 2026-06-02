---
name: financial-health
description: Deep-dive financial statement analysis covering the income statement, balance sheet, and cash flow statement over 5 years, plus comprehensive ratio analysis. Triggers when user asks about financial health, financial analysis, ratio analysis, earnings quality, balance sheet strength, or "how healthy is X financially".
---

# Financial Health Analysis

## Workflow Checklist

```
Financial Health Progress:
- [ ] Step 1: Income statement analysis (5-year)
- [ ] Step 2: Balance sheet analysis (5-year)
- [ ] Step 3: Cash flow statement analysis (5-year)
- [ ] Step 4: Profitability ratios
- [ ] Step 5: Growth & momentum
- [ ] Step 6: Liquidity & solvency
- [ ] Step 7: Efficiency metrics
- [ ] Step 8: Earnings quality check
- [ ] Step 9: Red flags scan
- [ ] Step 10: Financial health scorecard
```

## Step 1: Income Statement (5-year)

Query: `"[TICKER] annual income statements 5 years"`

Extract and create a trend table:

| Metric | Y-4 | Y-3 | Y-2 | Y-1 | Current | CAGR |
|--------|-----|-----|-----|-----|---------|------|
| Revenue | | | | | | |
| COGS | | | | | | |
| Gross Profit | | | | | | |
| Gross Margin % | | | | | | |
| Operating Income | | | | | | |
| Op Margin % | | | | | | |
| Net Income | | | | | | |
| Net Margin % | | | | | | |
| Diluted EPS | | | | | | |
| Shares Outstanding | | | | | | |
| D&A | | | | | | |
| SBC (Stock-Based Comp) | | | | | | |

**Analysis points:**
- Revenue trend: consistent growth, cyclical, or stagnating?
- Margin trajectory: expanding (pricing power, scale) or contracting (competition, cost pressure)?
- EPS growth vs. revenue growth: is EPS growing faster due to buybacks or margin expansion?
- SBC as % of revenue: is it reasonable (<3%) or excessive (>8%)?

If any metric is missing, use `financial_search` with a specific query. If 5-year data is unavailable, work with available years and note gaps.

## Step 2: Balance Sheet (5-year)

Query: `"[TICKER] annual balance sheets 5 years"`

| Metric | Y-4 | Y-3 | Y-2 | Y-1 | Current | Trend |
|--------|-----|-----|-----|-----|---------|-------|
| Cash & Equivalents | | | | | | |
| Total Current Assets | | | | | | |
| Total Assets | | | | | | |
| Total Debt (ST + LT) | | | | | | |
| Total Liabilities | | | | | | |
| Shareholders' Equity | | | | | | |
| Tangible Book Value | | | | | | |
| Goodwill & Intangibles | | | | | | |
| Net Debt (Debt - Cash) | | | | | | |
| Working Capital | | | | | | |

**Analysis points:**
- Cash position: adequate for operations + debt service?
- Debt load: net debt / EBITDA trend. Is leverage rising or falling?
- Goodwill as % of assets: >30% signals acquisition-heavy strategy — check for impairment risk
- Tangible book value: negative tangible equity is a yellow flag
- Working capital: positive and stable is healthy; negative may signal liquidity stress (or strong bargaining power — know the difference)

## Step 3: Cash Flow Statement (5-year)

Query: `"[TICKER] annual cash flow statements 5 years"`

| Metric | Y-4 | Y-3 | Y-2 | Y-1 | Current |
|--------|-----|-----|-----|-----|---------|
| Operating Cash Flow | | | | | |
| Capital Expenditure | | | | | |
| Free Cash Flow (OCF - Capex) | | | | | |
| FCF / Share | | | | | |
| FCF Conversion (OCF / Net Income) | | | | | |
| Dividends Paid | | | | | |
| Share Buybacks | | | | | |
| Total Shareholder Return | | | | | |
| Payout Ratio (Return / FCF) | | | | | |

**Analysis points:**
- FCF generation: consistently positive and growing = strong
- FCF conversion: consistently >100% = high earnings quality; consistently <50% = watch accruals
- Payout sustainability: total shareholder return / FCF <80% is comfortable; >100% is unsustainable without debt
- Capex trend: rising capex can signal growth investment or maintenance catch-up — distinguish the two

## Step 4: Profitability Ratios

Query: `"[TICKER] financial metrics snapshot"`

| Ratio | Value | 5yr Avg | Industry | Assessment |
|-------|-------|---------|----------|------------|
| Gross Margin | | | | |
| Operating Margin | | | | |
| Net Margin | | | | |
| ROE | | | | |
| ROA | | | | |
| ROIC | | | | |
| EBITDA Margin | | | | |

**Key insight:** ROIC vs. WACC. If ROIC > WACC, the company creates value. If ROIC < WACC, growth destroys value. The existing `dcf-valuation` skill will estimate WACC — cross-reference it.

If industry data is unavailable from direct queries, use the `web_search` tool to find industry average margins for the sector.

## Step 5: Growth & Momentum

| Metric | YoY | 3yr CAGR | 5yr CAGR | Direction |
|--------|-----|----------|----------|-----------|
| Revenue | | | | |
| Operating Income | | | | |
| EPS | | | | |
| FCF / Share | | | | |
| Book Value / Share | | | | |
| Dividend / Share | | | | |

Note: accelerating growth = positive momentum; decelerating = investigate why.

## Step 6: Liquidity & Solvency

| Ratio | Value | Safe Threshold | Assessment |
|-------|-------|---------------|------------|
| Current Ratio | | >1.5 | |
| Quick Ratio | | >1.0 | |
| Debt / Equity | | <2.0 (varies by sector) | |
| Net Debt / EBITDA | | <3.0 | |
| Interest Coverage (EBIT / Interest) | | >3.0 | |
| Altman Z-Score (if calculable) | | >3.0 safe, <1.8 distress | |

**Refinancing risk:** Check debt maturity schedule. Query: `"[TICKER] debt maturity schedule near-term obligations"`

## Step 7: Efficiency Metrics

| Ratio | Value | Industry | Assessment |
|-------|-------|----------|------------|
| Asset Turnover | | | |
| Inventory Turnover | | | |
| Days Sales Outstanding | | | |
| Days Payable Outstanding | | | |
| Cash Conversion Cycle | | | |

**Interpretation:** Shorter cash conversion cycle = more efficient. But too-short DPO may mean the company isn't taking advantage of trade credit. Trends matter more than absolute levels.

## Step 8: Earnings Quality

**8.1 Accruals Check**
Compare OCF to Net Income over 5 years. Persistent gap (OCF < NI) suggests aggressive revenue recognition or expense capitalization.

**8.2 One-Time Items**
Query: `"[TICKER] one-time items restructuring impairment non-recurring charges"`
Identify adjustments. Recalculate "adjusted" operating income excluding noise.

**8.3 Revenue Recognition**
Query: `"[TICKER] revenue recognition policy deferred revenue"`
Check: deferred revenue trend. Growing deferred revenue = healthy future revenue visibility. Declining deferred revenue = potential pull-forward.

**8.4 Share Count**
Calculate diluted share count trend. Rising share count (>2%/year) from SBC dilutes existing shareholders.

## Step 9: Red Flags Scan

Query: `"[TICKER] accounting issues restatements SEC investigation"`

Scan for these red flags:
1. **Revenue-quality red flags**: unbilled receivables growing faster than revenue, DSO rising significantly, customer advances declining
2. **Expense manipulation**: sudden margin expansion without explanation, capitalization of what peers expense, declining D&A relative to gross PP&E
3. **Balance sheet concerns**: goodwill >50% of assets without impairment testing, pension underfunding, off-balance-sheet entities (VIEs), related-party transactions
4. **Governance red flags**: auditor resignation/change, CFO departure (especially without explanation), late filings
5. **Insider selling clusters**: multiple insiders selling simultaneously, especially at lows

## Step 10: Financial Health Scorecard

Score each dimension 1–5 and compile:

```
# Financial Health Scorecard: [TICKER]

| Dimension | Score (1-5) | Weight | Weighted Score |
|-----------|-------------|--------|----------------|
| Revenue Growth | | 15% | |
| Margin Quality | | 15% | |
| Earnings Quality | | 15% | |
| Cash Flow Generation | | 20% | |
| Balance Sheet Strength | | 15% | |
| Capital Allocation | | 10% | |
| Red Flags (inverse) | | 10% | |
| **TOTAL** | | | **X.XX / 5.00** |

**Rating Scale:** >4.0 = Excellent | 3.0–4.0 = Good | 2.0–3.0 = Fair | <2.0 = Poor

## Key Findings
1. [Most important positive finding]
2. [Most important negative finding]
3. [Metric most at odds with consensus perception]

## Areas Requiring Further Investigation
1. ...
2. ...
```
