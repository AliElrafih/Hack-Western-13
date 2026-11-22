# Hack Western 13: UI Build List

_Last updated: 2026-11-21_

## What we're building

A research tool for everyday investors. It reads thousands of Amazon product reviews with Gemini and shows how customer sentiment lines up with a company's stock price. Logitech (LOGI) is the demo company, covering January 2016 to December 2017, week by week. The pitch is that it works for any company that sells physical products (Logitech, Crocs and similar).

The user flow has four steps, and each one is a screen below:

1. **Pick a company**
2. **See the timeline**: stock price and customer sentiment on one chart
3. **Select comparison windows**: drag over two periods and compare them
4. **See the prediction and why**: what the model expected, what happened, and what customers were saying

The two things the demo needs most: one clear "wow" moment on the timeline, and nothing that breaks or waits on a live API call.

## Screen 1: Pick a company

The landing screen. It explains the idea in one line and lets the user choose a company.

- [ ] One-line explanation of the tool (headline + short subline)
- [ ] Company selector: Logitech is live; 2–3 others (e.g. Crocs) shown as "coming soon" to back up the "any product company" pitch
- [ ] Each company option shows its ticker, what it sells, and the date range we have data for
- [ ] Clicking a company goes straight to the timeline (no extra confirm step)
- [ ] Small "not financial advice" line in the footer

## Screen 2: The timeline

The main screen and the demo's "wow" moment. It shows stock price and customer sentiment on the same weekly timeline, January 2016 to December 2017.

**Main chart**

- [ ] Stock price line (weekly, from Adj Close)
- [ ] Sentiment line on a second axis (weekly average, −100 to +100)
- [ ] Optional star-rating line (weekly average), to compare against Gemini sentiment
- [ ] Toggle: show Logitech alone, or Logitech vs the NASDAQ market line
- [ ] Earnings report dates marked as vertical lines (about 8 in this range)
- [ ] Hover a week: tooltip with the date range, stock price and % change, sentiment score, and number of reviews
- [ ] Low-data weeks (few reviews) drawn faded or dashed, so users know that score is less reliable

**Clicking a week opens a detail panel**

- [ ] Gemini's short summary of what customers were saying that week
- [ ] Most-reviewed products that week, each with its average sentiment
- [ ] 3–5 real example reviews, with product name and date
- [ ] Review count for that week

**Controls**

- [ ] Delay selector: 1 week / 2 weeks / 1 month (how far ahead of the stock the sentiment line is shifted)
- [ ] Button or drag action that starts a comparison (goes to Screen 3)

## Screen 3: Compare two windows

The user picks two periods (e.g. a week in March 2016 and a week in May 2016) and sees them side by side. This can be a panel over the timeline rather than a separate page.

- [ ] Pick window A and window B by dragging across the timeline, with date pickers as a fallback
- [ ] Both windows highlighted on the timeline in two distinct colours
- [ ] Side-by-side cards, one per window, each showing: dates, sentiment score, review count, most-reviewed products, and the stock move in the period after it (based on the selected delay)
- [ ] A clear "what changed" line between the cards, e.g. sentiment −25, stock −3.5%
- [ ] Gemini's one-paragraph explanation of the difference between the two windows
- [ ] Swap and reset buttons
- [ ] Warning when a window has too few reviews to trust

## Screen 4: Prediction and why

This screen shows what the model predicted, what actually happened, and how much to trust it. The model is built on January 2016 to June 2017 and tested on July to December 2017.

**Delay chart** ("how long before reviews show up in the stock?")

- [ ] Horizontal bars for 1 week, 2 weeks and 1 month, each showing how strongly sentiment matched the stock at that delay
- [ ] Strongest delay highlighted with a short label
- [ ] Clicking a bar sets that delay across the whole app (timeline, comparison, prediction)

**Prediction vs reality**

- [ ] Chart of the test period (Jul–Dec 2017): predicted move vs actual move, week by week
- [ ] Each week marked as a hit or a miss on direction (up or down)
- [ ] Clear divider between "training" and "test" periods so judges can see we tested honestly

**Results panel**

- [ ] Hit rate (% of weeks where the direction was right) next to the "always guess up" baseline
- [ ] Gemini sentiment vs star ratings: which one predicted better
- [ ] The model's formula in plain English, e.g. "when sentiment improves by 10 points, the stock tends to move X% the following period"
- [ ] One honest sentence on confidence (strong / weak / no clear signal), written once we have results

**Why panel**

- [ ] Gemini's explanation for a selected week: what customers were saying and how it connects to the prediction
- [ ] Links back to the matching week on the timeline

## Shared pieces and states

These show up across screens and are easy to forget until demo day.

- [ ] Header with the company name, ticker, date range, and current delay setting
- [ ] Loading states (skeletons, not spinners) for charts and Gemini text
- [ ] Empty state for a window or week with no reviews
- [ ] Low-data badge wherever a score is based on few reviews
- [ ] Error state if the backend is unreachable, with a retry
- [ ] "Not financial advice" disclaimer, small, always visible in the footer
- [ ] Consistent colours: one colour for stock, one for sentiment, one for the market line, used the same way everywhere
- [ ] Works on a laptop screen at the demo table (projector-friendly text size and contrast)

## Data the UI will receive

There is no backend for the hackathon. Python scripts compute everything ahead of time (including all Gemini text) and write static JSON files that the React app loads directly. The demo never waits on an API call.

| File (draft) | Contains | Used on |
| --- | --- | --- |
| `companies.json` | Name, ticker, what it sells, date range, live or coming soon | Screen 1 |
| `weeks.json` | One row per trading week (Mon–Fri; weekend reviews count toward the following week): dates, stock price, % change, market % change, sentiment (−100 to +100), avg stars, review count, low-data flag | Screen 2, and Screen 3 stats (computed in the browser) |
| `week_details.json` | Per week: Gemini summary, most-reviewed products with their sentiment, 3–5 example reviews | Screen 2 detail panel |
| `comparisons.json` | Gemini explanations for a few preset demo comparisons | Screen 3 |
| `delays.json` | Match strength for 1 week, 2 weeks, 1 month | Screen 4 delay chart |
| `prediction.json` | Test-period weeks: predicted vs actual move, hit or miss, plus hit rate, baselines (always-up, stars) and plain-English formula | Screen 4 |
| `earnings.json` | Earnings report dates in range | Timeline markers |

Because there's no backend, Gemini can't run live in the app (the API key would be exposed in the browser). Comparison stats work for any two windows, but Gemini's written explanation only exists for the preset demo comparisons. All reviews are used, verified purchase or not. The UI can be built against mock versions of these files now. The real stock data (LOGI and NASDAQ, daily, 2016–2017) is already in the repo under `data/`.

## Design direction and tech

**Stack:** React frontend with Recharts for all charts, reading static JSON. Python scripts produce the data. A backend comes later, only if this becomes a live tool.

**Design:** follow the design-system Claude skill (shared separately). The main points for this app:

- Snappy, instant feedback on everything used repeatedly: the timeline, the delay selector, the comparison controls
- Only one "cinematic" moment on the whole app, ideally the timeline loading in on Screen 2
- No purple-blue gradients, no generic SaaS card grids, no emoji icons, no fade-in-on-scroll everywhere
- Colour carries meaning: stock, sentiment and market each keep one colour throughout

## Priorities and open questions

Build in this order, so there's always a working demo:

| Priority | What |
| --- | --- |
| Must have | Screen 2 timeline with hover and the week detail panel; Screen 4 results panel and prediction vs reality |
| Should have | Delay chart; Screen 3 comparison; market line toggle; earnings markers |
| Nice to have | Screen 1 polish with "coming soon" companies; Gemini "why" for any selected week; animations |

**Open questions**

- What should the app be called?
