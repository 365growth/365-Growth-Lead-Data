# 365 Growth — Roofing Lead Pipeline

React + Vite dashboard for **365 Growth** that shows roofing leads in a sales pipeline, syncs **GoHighLevel (Lead Connector)** opportunities and calendars, and optionally pulls **Facebook Ads** account spend for cost metrics.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

- **First visit:** set a dashboard password (stored locally as a hash). This is screen-lock style protection, not a server login. **Use the same password on every browser** so the server vault (below) can recognize you.
- **GHL:** open **GHL Settings**, paste your private app token (`pit-…`), then **Sync Now**. Keys are saved locally **and** (on Vercel) to a **server vault** so you do not re-enter them on each device.
- **Facebook (optional):** add a Marketing API user token to pull ad spend for the same rolling window used in sync.

### Cross-browser sync (production on Vercel)

`localStorage` is **per browser**. To reuse GHL + Facebook keys on **another browser or computer**, the app posts them to **`/api/vault`** (see [`api/vault.js`](api/vault.js)), which stores them in **Vercel KV / Redis** keyed by your **password hash** (not the plain password).

1. In [Vercel](https://vercel.com) → your project → **Storage** → add **Redis** (e.g. Upstash from the Marketplace) or use an existing KV/Redis store linked to the project.
2. Link the store to the project so **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`** appear under **Settings → Environment Variables** (Production).
3. **Redeploy** after linking.

If those variables are missing, `/api/vault` returns 503 and credentials stay **local-only** (same behavior as before).

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

- **Pipeline data** (leads, last sync, ad snapshot, date-window prefs): key `365g-pipe-v2` — **no API secrets** in this blob.
- **GHL + Facebook tokens:** key `365g-creds-v1` — stored separately so saving leads never overwrites your keys.

Both use [`src/lib/storage.js`](src/lib/storage.js) (`window.storage` when present, e.g. Cursor, otherwise `localStorage`).
- **Password session:** `365g-auth-expires` and `365g-pw-hash` in `localStorage`.

## Optional full BFF

The **vault** above only syncs API keys across browsers. If you ever need **all** GHL/FB traffic to go through a server (no tokens in the browser at all), see [`docs/OPTIONAL_BFF.md`](docs/OPTIONAL_BFF.md).

## Tech stack

React 19, Vite 8, Vitest. UI is inline styles in [`src/App.jsx`](src/App.jsx); GHL/Facebook clients live under [`src/api/`](src/api/).
