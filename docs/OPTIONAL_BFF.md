# Optional backend-for-frontend (BFF)

This dashboard is **static-first**: the browser calls GoHighLevel and Facebook APIs directly using tokens you store locally.

## When a BFF might be worth it

- You want **API tokens only on a server** (not in `localStorage`), e.g. shared machine or stricter token policy.
- You need **server-side rate limiting**, webhooks, or scheduled jobs instead of the built-in 3-hour client auto-sync.

## What you would add

1. A small HTTP API (Node, Cloudflare Worker, etc.) that holds `GHL_PRIVATE_TOKEN` and `FB_ACCESS_TOKEN` as secrets.
2. Endpoints such as `POST /api/sync` that proxy to Lead Connector and return normalized leads JSON.
3. Frontend changes: remove raw token fields from persisted storage; call your API with session/cookie auth instead.

This repository **does not** ship a BFF. Treat this file as a roadmap if requirements change.
