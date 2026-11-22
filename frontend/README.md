# Frontend

React + Vite. Reads static JSON from `public/data/`; there is no backend.

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Layout

```
src/
  styles/tokens.css   colours, fonts, global styles (colour = meaning, see top of file)
  lib/useJson.js      loads public/data/*.json with loading / error / retry
  lib/constants.js    app name (still an open question)
  components/         Layout, Header, Footer, Skeleton, ErrorState, Logo
  pages/              one file per screen
public/data/          mock JSON now, real files from the Python scripts later
```

## Screens

| Route | Screen | Status |
| --- | --- | --- |
| `/` | 1 Pick a company | Done |
| `/timeline/:ticker` | 2 Timeline | Done (mock data) |
| `/compare/:ticker` | 3 Compare two windows | Placeholder |
| `/prediction/:ticker` | 4 Prediction and why | Placeholder |

## Mock data

`public/data/weeks.json`, `week_details.json` and `earnings.json` are MOCK files made by
`node scripts/make-mock-data.mjs`. Replace them with the pipeline's real files; keep the field names.

## Data files

`companies.json`: one object per company.

```json
{
  "ticker": "LOGI",
  "name": "Logitech",
  "sells": "Mice, keyboards, webcams, headsets",
  "range": { "start": "2016-01-04", "end": "2017-12-29", "label": "Jan 2016 – Dec 2017" },
  "status": "live"
}
```

`status` is `"live"` or `"coming_soon"`; coming-soon companies have `"range": null`.

`weeks.json`: one row per trading week.

```json
{ "week": "2016-01-04", "start": "2016-01-04", "end": "2016-01-08",
  "close": 14.47, "pct_change": -0.88, "market_close": 4945.81, "market_pct_change": -0.89,
  "sentiment": 46.3, "avg_stars": 4.19, "review_count": 6, "low_data": true }
```

`week_details.json`: keyed by week id.

```json
{ "2016-01-04": {
    "summary": "Gemini summary...",
    "products": [{ "name": "MX Master wireless mouse", "reviews": 42, "sentiment": 31.5 }],
    "examples": [{ "product": "MX Master wireless mouse", "date": "2016-01-05", "stars": 4, "text": "..." }] } }
```

`earnings.json`: `[{ "date": "2016-01-26" }, ...]`
