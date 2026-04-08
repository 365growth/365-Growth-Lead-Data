/**
 * Server-side credential vault (Vercel KV).
 * Keys are tied to the same SHA-256 hash the client uses for the lock-screen password.
 * Requires: Vercel project + KV store linked (sets KV_REST_API_URL, KV_REST_API_TOKEN).
 */
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(503).json({ error: "vault_unavailable", message: "KV not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }

  const { op, passwordHash, ghl, fb } = body || {};
  if (!passwordHash || typeof passwordHash !== "string") {
    return res.status(400).json({ error: "passwordHash required" });
  }

  const KEY = "vault:api-creds";

  try {
    const { kv } = await import("@vercel/kv");
    const raw = await kv.get(KEY);

    if (op === "load") {
      if (!raw) {
        return res.status(200).json({ vaultExists: false, ghl: null, fb: null });
      }
      const data = JSON.parse(raw);
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
      if (raw) {
        const data = JSON.parse(raw);
        if (data.passwordHash !== passwordHash) {
          return res.status(401).json({ error: "wrong_password" });
        }
      }
      const next = {
        passwordHash,
        ghl: ghl ?? "",
        fb: fb ?? "",
      };
      await kv.set(KEY, JSON.stringify(next));
      return res.status(200).json({ ok: true });
    }

    if (op === "clear_tokens") {
      if (!raw) return res.status(200).json({ ok: true });
      const data = JSON.parse(raw);
      if (data.passwordHash !== passwordHash) {
        return res.status(401).json({ error: "wrong_password" });
      }
      await kv.set(
        KEY,
        JSON.stringify({ passwordHash, ghl: "", fb: "" }),
      );
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "unknown op" });
  } catch (e) {
    console.error("vault error:", e);
    return res.status(500).json({ error: e.message || "server error" });
  }
}
