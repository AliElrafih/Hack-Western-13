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
| `/timeline/:ticker` | 2 Timeline | Placeholder |
| `/compare/:ticker` | 3 Compare two windows | Placeholder |
| `/prediction/:ticker` | 4 Prediction and why | Placeholder |

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
