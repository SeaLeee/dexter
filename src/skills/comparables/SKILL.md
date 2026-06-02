---
name: comparables
description: Performs comparable company analysis (CCA) to estimate fair value using relative valuation multiples. Complements DCF valuation. Triggers when user asks for comparable analysis, peer comparison, relative valuation, comps, trading multiples, or "what are similar companies trading at".
---

# Comparable Company Analysis

## Workflow Checklist

```
Comparables Analysis Progress:
- [ ] Step 1: Identify comparable companies
- [ ] Step 2: Gather financial data for each peer
- [ ] Step 3: Collect current valuation multiples
- [ ] Step 4: Calculate median/harmonic mean multiples
- [ ] Step 5: Apply multiples to target company
- [ ] Step 6: Benchmark operational metrics
- [ ] Step 7: Adjust for quality differences (premium/discount)
- [ ] Step 8: Present valuation range with sensitivity
```

## Step 1: Identify Comparable Companies

**1.1 Direct Competitors**
Query: `"[TICKER] direct competitors closest peers same industry"`
Select companies that are similar across these dimensions (in order of importance):
1. Industry & sub-industry (same SIC/NAICS where possible)
2. Business model (same revenue model, similar customer base)
3. Size (market cap within 0.3x–3x of target, unless it's a mega-cap)
4. Geography (similar revenue exposure by region)
5. Growth profile (similar revenue growth rate)
6. Margin profile (similar gross/operating margins)

Select 4–8 peers for a meaningful set. Fewer than 4 = limited reliability; more than 8 = diminishing returns.

**1.2 Confirm Comparability**
Query: `"[PEER_TICKER] business description"`
Verify each peer actually competes in the same market. Remove any that are fundamentally different businesses.

## Step 2: Gather Financial Data

For each comparable company AND the target, collect:

**From `financial_search`:**
Query: `"[TICKER] financial metrics snapshot"`

For each, extract:

| Metric | Target | Peer1 | Peer2 | Peer3 | Peer4 | ... |
|--------|--------|-------|-------|-------|-------|-----|
| Market Cap | | | | | | |
| Enterprise Value | | | | | | |
| Revenue (LTM) | | | | | | |
| EBITDA (LTM) | | | | | | |
| Net Income (LTM) | | | | | | |
| FCF (LTM) | | | | | | |
| Book Value | | | | | | |
| Revenue Growth (YoY) | | | | | | |
| Gross Margin | | | | | | |
| Operating Margin | | | | | | |
| Net Margin | | | | | | |
| Debt / Equity | | | | | | |

If some metrics are missing for a peer, leave blank — don't fabricate. Use `web_search` for hard-to-find metrics on well-known companies.

## Step 3: Collect Valuation Multiples

For each peer, calculate or query these multiples. Always use **enterprise value multiples** for the primary analysis (they're capital-structure neutral) and **equity multiples** as cross-checks.

**Primary (EV-based):**
- EV/Revenue
- EV/EBITDA
- EV/EBIT
- EV/FCF

**Secondary (Equity-based):**
- P/E (use diluted EPS from continuing operations)
- P/B
- P/S
- P/FCF

**Growth-adjusted:**
- PEG Ratio = P/E ÷ EPS Growth Rate (%)
- EV/EBITDA ÷ EBITDA Growth Rate (%)

Call `financial_search`: `"[TICKER] current P/E EV/EBITDA P/S P/B P/FCF"` for any missing multiples.

## Step 4: Calculate Composite Multiples

For the peer group, calculate:

1. **Mean** (simple average) — useful for symmetrical distribution
2. **Median** — preferred metric, robust to outliers
3. **Harmonic Mean** — useful when there are extreme outliers
4. **25th and 75th percentile** — to define the range

Exclude outliers: any peer with a multiple >2 standard deviations from the mean. Note which peers were excluded and why.

**The median is the primary valuation anchor.** Mean provides context. The 25th–75th percentile range defines the reasonable valuation band.

## Step 5: Apply Multiples to Target

For each multiple type, compute the implied valuation:

| Multiple | Peer Median | Target Metric | Implied EV / Share Price |
|----------|-------------|---------------|--------------------------|
| EV/Revenue | X.Xx | $X | $X |
| EV/EBITDA | X.Xx | $X | $X |
| EV/EBIT | X.Xx | $X | $X |
| EV/FCF | X.Xx | $X | $X |
| P/E | X.Xx | $X | $X |
| P/B | X.Xx | $X | $X |
| P/S | X.Xx | $X | $X |

**Primary weight: EV/EBITDA** (most commonly used, least distortion from capital structure)
**Secondary: P/E** (widely understood, but affected by leverage and one-time items)

Calculate:
- Implied enterprise value per multiple → subtract net debt → divide by shares outstanding = implied share price
- For equity multiples (P/E, P/B): implied share price directly

## Step 6: Benchmark Operational Metrics

Create an operational benchmarking table to understand WHY the target might deserve a premium or discount:

| Metric | Target | Peer Median | Peer Range | Target vs. Median |
|--------|--------|-------------|------------|-------------------|
| Revenue Growth | | | | |
| Gross Margin | | | | |
| EBITDA Margin | | | | |
| Net Margin | | | | |
| ROE | | | | |
| ROIC | | | | |
| FCF Conversion | | | | |
| Debt/EBITDA | | | | |

## Step 7: Quality Adjustment

Based on the operational benchmarking, determine if the target deserves a premium or discount to peer median multiples:

**Premium factors** (target deserves higher multiples):
- Superior revenue growth (>peer median by 3+ percentage points)
- Higher margins (>peer median by 2+ percentage points)
- Higher ROIC
- Stronger competitive position (see business-analysis skill)
- Cleaner balance sheet (lower leverage)

**Discount factors** (target deserves lower multiples):
- Inferior growth
- Lower margins
- Higher leverage
- Weaker competitive position
- Corporate governance concerns

Quantify: for each premium factor, add 5-10% to the multiple; for each discount factor, subtract 5-10%. This is an art, not a science — be explicit about your adjustments.

## Step 8: Valuation Summary

Present the final output:

```
# Comparable Company Analysis: [TICKER]

## Peer Group
| Company | Ticker | Market Cap | Why Included |
|---------|--------|------------|-------------|
| Target | [TICKER] | $X.XB | — |
| Peer 1 | | | |
| ... | | | |

## Valuation Multiples Summary
| Multiple | Peer Mean | Peer Median | 25th–75th Range |
|----------|-----------|-------------|------------------|
| EV/Revenue | | | |
| EV/EBITDA | | | |
| EV/EBIT | | | |
| P/E | | | |
| ... | | | |

## Implied Valuation
| Multiple | Implied Share Price | Weight | Contribution |
|----------|---------------------|--------|-------------|
| EV/EBITDA | $X | 30% | $X |
| P/E | $X | 25% | $X |
| EV/Revenue | $X | 20% | $X |
| EV/FCF | $X | 15% | $X |
| P/B | $X | 10% | $X |
| **Weighted Fair Value** | | | **$X** |

## Quality-Adjusted Range
- Base (median): $X
- Quality adjustment: +/- X% → $X
- Reasonable range (25th–75th percentile): $X – $X

## Current Price vs. Fair Value
- Current price: $X
- Upside/Downside to fair value: +/- X%
- Rating: Undervalued / Fairly Valued / Overvalued

## Key Sensitivities
[1–2 paragraphs: what moves the needle most for this valuation]
```

**Important caveats to mention:**
1. Comparables analysis assumes the market is pricing peers correctly — it may not be
2. No two companies are perfectly comparable — qualitative differences matter
3. Multiples are a snapshot — they don't capture growth trajectory differences
4. This should be used alongside DCF (absolute valuation) for a complete picture
