# 365 Growth — Roofing Lead Pipeline

React + Vite dashboard for **365 Growth** that shows roofing leads in a sales pipeline, syncs **GoHighLevel (Lead Connector)** opportunities and calendars, and optionally pulls **Facebook Ads** account spend for cost metrics.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

- **First visit:** set a dashboard password (stored locally as a hash). This is screen-lock style protection, not a server login.
- **GHL:** open **GHL Settings**, paste your private app token (`pit-…`), then **Sync Now**. Keys are saved in browser storage (`localStorage` or Cursor’s `window.storage` shim) so you do not re-enter them every time you unlock.
- **Facebook (optional):** add a Marketing API user token to pull ad spend for the same rolling window used in sync.

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Dev server with HMR            |
| `npm run build`| Production build → `dist/`     |
| `npm run preview` | Serve `dist/` locally      |
| `npm run test` | Vitest (metrics / funnel math)|
| `npm run lint` | ESLint                         |

## Configuration (GHL / Facebook IDs)

Pipeline location, pipeline ID, default calendar, and Facebook ad account are read from **environment variables** at build time. Copy [`.env.example`](.env.example) to `.env` and set any overrides:

- `VITE_GHL_LOCATION_ID`
- `VITE_GHL_PIPELINE_ID`
- `VITE_GHL_CALENDAR_ID`
- `VITE_FB_AD_ACCOUNT_ID`
- `VITE_FB_GRAPH_VERSION` (optional, default `v19.0` path segment)

Rebuild after changing `.env`.

## Data storage

- **Pipeline data** (leads, last sync time, API tokens, ad snapshot, date-window prefs): key `365g-pipe-v2` via [`src/lib/storage.js`](src/lib/storage.js) — uses `window.storage` when present (e.g. Cursor), otherwise `localStorage`.
- **Password session:** `365g-auth-expires` and `365g-pw-hash` in `localStorage`.

## Optional backend (BFF)

Tokens today live in the browser by design for a single-operator workflow. If you ever need secrets **only on a server**, see [`docs/OPTIONAL_BFF.md`](docs/OPTIONAL_BFF.md).

## Tech stack

React 19, Vite 8, Vitest. UI is inline styles in [`src/App.jsx`](src/App.jsx); GHL/Facebook clients live under [`src/api/`](src/api/).
