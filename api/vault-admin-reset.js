/**
 * TEMPORARY admin endpoint: wipes the vault entry so a new password can be set.
 *
 * Guarded by VAULT_ADMIN_TOKEN env var. Remove this file (and the env var) once
 * the operator has reset their password.
 *
 *   curl -X POST https://<host>/api/vault-admin-reset \
 *     -H "x-admin-token: $VAULT_ADMIN_TOKEN"
 */
import { Redis } from "@upstash/redis";
import crypto from "node:crypto";

const KEY = "vault:api-creds";

function getRedisTcpUrl() {
  return process.env.REDIS_URL || process.env.STORAGE_URL || "";
}
function hasTcpEnv() {
  return Boolean(getRedisTcpUrl());
}
function hasRestEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return Boolean(url && token);
}

async function getRedisStore() {
  if (hasTcpEnv()) {
    const tcpUrl = getRedisTcpUrl();
    const { createClient } = await import("redis");
    const client = createClient({ url: tcpUrl });
    client.on("error", (err) => console.error("Redis (TCP):", err));
    await client.connect();
    return {
      del: async (k) => { await client.del(k); },
      quit: () => client.quit().catch(() => {}),
    };
  }
  if (hasRestEnv()) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
    const r = new Redis({ url, token });
    return {
      del: (k) => r.del(k),
      quit: () => Promise.resolve(),
    };
  }
  return null;
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const expected = process.env.VAULT_ADMIN_TOKEN || "";
  if (!expected) {
    return res.status(503).json({ error: "VAULT_ADMIN_TOKEN not configured" });
  }
  const provided = req.headers["x-admin-token"] || "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const store = await getRedisStore();
  if (!store) {
    return res.status(503).json({ error: "vault_unavailable" });
  }

  try {
    await store.del(KEY);
    return res.status(200).json({ ok: true, cleared: KEY });
  } catch (e) {
    console.error("vault-admin-reset error:", e);
    return res.status(500).json({ error: e.message || "server error" });
  } finally {
    await store.quit();
  }
}
