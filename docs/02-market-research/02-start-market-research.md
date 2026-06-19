First read and apply all rules from `_shared/preamble.md`.

Inputs: `01-idea/idea.md`
Output: `02-market-research/market-research.md` (+ raw files in `02-market-research/raw/`)

---

## Phase 1 — Raw research (run in 2–4 separate AIs)

Save each AI's output as:
- `02-market-research/raw/chatgpt.md`
- `02-market-research/raw/claude.md`
- `02-market-research/raw/gemini.md`
- `02-market-research/raw/perplexity.md`

Phase 1 prompt (paste with `01-idea/idea.md`):

Research this product idea using real sources: WordPress.org reviews, Reddit, Shopify App Store, Product Hunt, YouTube reviews, X/Twitter, blog comparisons.

Focus on:
- repeated user complaints
- onboarding friction and UX problems
- missing features and performance issues
- weak competitor areas
- product opportunities

Do NOT generate generic business advice. Cite specific complaints, reviews, or threads where you can.

Generate the file with this structure:

# Competitor Summary
# Feature Comparison
# User Pain Points
# UX Problems
# Most Requested Features
# Market Gaps
# MVP Recommendations
# Positioning Opportunities
# Final Recommendations

---

## Phase 2 — Distill

Send all raw files to one AI with this prompt:

I have multiple AI-generated market research files for the same product. Combine them into ONE distilled doc.

Prioritize insights that appear in multiple files. Drop AI fluff, speculation, and repetition. Actionable conclusions only.

Generate the final file as `02-market-research/market-research.md` with this structure:

# Executive Summary
# Main Competitors
# Common User Complaints
# Important Missing Features
# Best MVP Features
# UX & Onboarding Insights
# Market Opportunities
# Product Positioning Opportunities
# Recommended V1 Scope
# Things To Avoid
# Final Strategic Advice
