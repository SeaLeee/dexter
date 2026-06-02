---
name: business-analysis
description: Analyzes a company's business model, competitive position, and industry dynamics. Covers moat assessment, Porter's Five Forces, and revenue drivers. Triggers when user asks about business model, competitive advantage, moat, industry analysis, market position, or "how does X make money".
---

# Business & Competitive Analysis

## Workflow Checklist

```
Business Analysis Progress:
- [ ] Step 1: Business model breakdown
- [ ] Step 2: Revenue deep dive
- [ ] Step 3: Moat & competitive advantage assessment
- [ ] Step 4: Industry structure (Porter's Five Forces)
- [ ] Step 5: Competitor benchmarking
- [ ] Step 6: Growth drivers & catalysts
- [ ] Step 7: Synthesis & SWOT
```

## Step 1: Business Model Breakdown

Call `financial_search` to understand how the company creates, delivers, and captures value.

**1.1 Core Business**
Query: `"[TICKER] business model how they make money"`
Answer: What problem does the company solve? Who pays for it? How does revenue flow?

**1.2 Business Segments**
Query: `"[TICKER] business segments revenue breakdown by product service"`
Create a table: segment name → revenue contribution % → growth rate → margin profile → competitive position

**1.3 Customer & Supplier Analysis**
Query: `"[TICKER] customer concentration top customers supplier relationships"`
Identify: customer concentration risk (any customer >10% of revenue?), supplier dependency, bargaining power dynamics

**1.4 Geographic Exposure**
Query: `"[TICKER] revenue by geography international exposure"`
Create: revenue split by region, note currency exposure, regional growth differentials

## Step 2: Revenue Deep Dive

**2.1 Revenue Drivers**
Query: `"[TICKER] revenue drivers unit economics"`
Decompose revenue: price × volume for each segment. Identify which lever drives growth.

**2.2 Revenue Quality**
Assess: recurring vs. one-time, contracted vs. discretionary, subscription/bookings metrics if applicable. Revenue visibility (backlog, deferred revenue trend).

**2.3 Historical Growth**
Query: `"[TICKER] revenue growth history 5 years"`
Calculate: 3-year and 5-year revenue CAGR by segment. Is growth accelerating, steady, or decelerating?

## Step 3: Moat Assessment

Query: `"[TICKER] competitive advantage economic moat"`

Rate each moat source on a scale of 1–5 and explain why:

**Brand:** Pricing power, customer loyalty, brand recognition. Evidence: pricing relative to competitors, repeat purchase rates, NPS scores.

**Scale / Cost Advantage:** Economies of scale, vertical integration, proprietary technology. Evidence: operating margins vs. peers, unit cost trends, capacity utilization.

**Network Effects:** Does the product become more valuable as more users join? Evidence: user growth → engagement → monetization flywheel.

**Switching Costs:** How hard/expensive is it for customers to leave? Evidence: retention rates, contract duration, integration depth, data lock-in.

**Intangible Assets:** Patents, regulatory licenses, mineral rights, spectrum licenses, drug exclusivity. Evidence: IP portfolio size, patent expiration timeline, regulatory barriers to entry.

**Overall Moat Rating:** None / Narrow / Wide. Justify.

## Step 4: Industry Structure (Porter's Five Forces)

For each force, rate as Low / Medium / High and explain:

**Threat of New Entry:** Capital requirements, economies of scale, regulatory barriers, brand loyalty, access to distribution. Query: `"[TICKER] industry barriers to entry new competitors"`

**Bargaining Power of Suppliers:** Supplier concentration, switching costs, availability of substitutes, threat of forward integration. Query: `"[TICKER] supplier relationships supply chain dependencies"`

**Bargaining Power of Buyers:** Buyer concentration, price sensitivity, switching costs, threat of backward integration. Query: `"[TICKER] customer bargaining power buyer concentration"`

**Threat of Substitutes:** Availability of alternatives, relative price/performance, switching costs. Query: `"[TICKER] substitutes disruptive alternatives"`

**Industry Rivalry:** Number of competitors, industry growth rate, exit barriers, differentiation. Query: `"[TICKER] industry competition intensity market share"`

Conclude: Is this an attractive industry (high barriers, low rivalry, low supplier/buyer power)?

## Step 5: Competitor Benchmarking

**5.1 Identify Peers**
Query: `"[TICKER] main competitors closest peers"`
Select 3–5 most relevant comparable companies.

**5.2 Competitive Matrix**
For the company and each peer, collect:
- Market cap, revenue (LTM), revenue growth (YoY)
- Gross margin, operating margin, net margin
- P/E, EV/EBITDA, P/S

Present as a comparison table. Highlight where the company leads or lags.

**5.3 Strategic Positioning**
Query: `"[TICKER] vs [COMPETITOR] competitive comparison"`
For each major competitor: where does the company win? Where does it lose?

## Step 6: Growth Drivers & Catalysts

**6.1 Near-term Catalysts (0–12 months)**
Query: `"[TICKER] upcoming catalysts product launches events"`
Identify: new product launches, earnings reports, regulatory decisions, contract wins, management changes. Note dates where available.

**6.2 Medium-term Growth Drivers (1–3 years)**
Query: `"[TICKER] growth strategy expansion plans"`
Identify: market expansion, new segments, M&A strategy, pricing initiatives, margin expansion levers.

**6.3 Long-term Secular Trends (3–10 years)**
Query: `"[TICKER] industry megatrends long-term tailwinds"`
Assess: demographic shifts, technological adoption curves, regulatory tailwinds/headwinds, sustainability trends.

## Step 7: Synthesis

Compile into a structured summary:

```
# [TICKER] Business & Competitive Analysis

## Business Model Summary
[1 paragraph: what they do, how they make money, key segments]

## Revenue Quality Scorecard
| Metric | Value | Quality Assessment |
|--------|-------|-------------------|
| Recurring revenue % | X% | High/Medium/Low |
...

## Moat Assessment
| Source | Rating (1-5) | Evidence |
|--------|-------------|----------|
...

Overall Moat: [Wide/Narrow/None]

## Porter's Five Forces
| Force | Intensity | Key Driver |
|-------|----------|------------|
...

Industry Attractiveness: [High/Medium/Low]

## Competitive Positioning
[Comparison table + 1 paragraph on relative position]

## SWOT Analysis
**Strengths:** ...
**Weaknesses:** ...
**Opportunities:** ...
**Threats:** ...

## Key Catalysts
1. [Timeline] Catalyst → Expected Impact
2. ...
```
