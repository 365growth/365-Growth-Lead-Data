/**
 * Server-side credential vault (Redis).
 * Keys are tied to the same SHA-256 hash the client uses for the lock-screen password.
 *
 * Vercel “Storage → Redis” injects a TCP URL. Default name is **`REDIS_URL`**; if you set a
 * custom prefix in the connect dialog (e.g. `STORAGE`), the var is **`STORAGE_URL`**.
 * Upstash / legacy KV REST:
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *   KV_REST_API_URL + KV_REST_API_TOKEN
 */
import { Redis } from "@upstash/redis";

const KEY = "vault:api-creds";

/** @returns {boolean} */
function hasRestEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
  return Boolean(url && token);
}

/** Vercel default vs custom prefix in “Connect” dialog → different env names, same value. */
function getRedisTcpUrl() {
  return (
    process.env.REDIS_URL ||
    process.env.STORAGE_URL ||
    ""
  );
}

function hasTcpEnv() {
  return Boolean(getRedisTcpUrl());
}

/**
 * @returns {Promise<{ get: (k: string) => Promise<string|null>, set: (k: string, v: string) => Promise<unknown> } | null>}
 */
async function getRedisStore() {
  if (hasTcpEnv()) {
    const tcpUrl = getRedisTcpUrl();
    const { createClient } = await import("redis");
    if (!globalThis.__vaultRedisTcp || globalThis.__vaultRedisTcpUrl !== tcpUrl) {
      if (globalThis.__vaultRedisTcp?.isOpen) {
        await globalThis.__vaultRedisTcp.quit().catch(() => {});
      }
      const client = createClient({ url: tcpUrl });
      client.on("error", (err) => console.error("Redis (TCP):", err));
      await client.connect();
      globalThis.__vaultRedisTcp = client;
      globalThis.__vaultRedisTcpUrl = tcpUrl;
    }
    const c = globalThis.__vaultRedisTcp;
    return {
      get: (k) => c.get(k),
      set: (k, v) => c.set(k, v),
    };
  }

  if (hasRestEnv()) {
    const url =
      process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
    const token =
      process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
    const r = new Redis({ url, token });
    return {
      get: (k) => r.get(k),
      set: (k, v) => r.set(k, v),
    };
  }

  return null;
}

function isRedisConfigured() {
  return hasTcpEnv() || hasRestEnv();
}

/** Vercel Node handlers often omit req.body for JSON POSTs — read the stream when needed. */
async function readJsonBody(req) {
  if (req.body != null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = chunks.length ? Buffer.concat(chunks).toString("utf8") : "";
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      redisConfigured: isRedisConfigured(),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const store = await getRedisStore();
  if (!store) {
    return res.status(503).json({
      error: "vault_unavailable",
      message:
        "Redis not configured (set REDIS_URL or STORAGE_URL from Vercel Storage, or UPSTASH_REDIS_* / KV_REST_* for REST)",
    });
  }

  const body = await readJsonBody(req);
  const { op, passwordHash, ghl, fb } = body || {};
  if (!passwordHash || typeof passwordHash !== "string") {
    return res.status(400).json({ error: "passwordHash required" });
  }

  try {
    const raw = await store.get(KEY);

    if (op === "load") {
      if (raw == null || raw === "") {
        return res.status(200).json({ vaultExists: false, ghl: null, fb: null });
      }
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (data.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "wrong_password" });
      }
      return res.status(200).json({
        vaultExists: true,
        ghl: data.ghl || null,
        fb: data.fb || null,
      });
    }

    if (op === "save") {
      if (raw != null && raw !== "") {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (data.passwordHash !== passwordHash) {
          return res.status(401).json({ error: "wrong_password" });
        }
      }
      const next = {
        passwordHash,
        ghl: ghl ?? "",
        fb: fb ?? "",
      };
      await store.set(KEY, JSON.stringify(next));
      return res.status(200).json({ ok: true });
    }

    if (op === "clear_tokens") {
      if (raw == null || raw === "") return res.status(200).json({ ok: true });
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (data.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "wrong_password" });
      }
      await store.set(KEY, JSON.stringify({ passwordHash, ghl: "", fb: "" }));
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "unknown op" });
  } catch (e) {
    console.error("vault error:", e);
    return res.status(500).json({ error: e.message || "server error" });
  }
}
