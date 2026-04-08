/** POST /api/vault — sync GHL + FB tokens across browsers (Vercel KV). */

async function postVault(body) {
  const r = await fetch("/api/vault", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r;
}

/**
 * @returns {Promise<{
 *   unavailable?: boolean,
 *   unauthorized?: boolean,
 *   vaultExists?: boolean,
 *   ghl?: string|null,
 *   fb?: string|null,
 * }>}
 */
export async function vaultLoad(passwordHash) {
  try {
    const r = await postVault({ op: "load", passwordHash });
    if (r.status === 503) return { unavailable: true };
    if (r.status === 401) return { unauthorized: true };
    if (!r.ok) return { unavailable: true };
    return await r.json();
  } catch {
    return { unavailable: true };
  }
}

export async function vaultSave(passwordHash, ghl, fb) {
  try {
    const r = await postVault({ op: "save", passwordHash, ghl, fb });
    if (r.status === 503) return false;
    return r.ok;
  } catch {
    return false;
  }
}

export async function vaultClearTokens(passwordHash) {
  try {
    const r = await postVault({ op: "clear_tokens", passwordHash });
    if (r.status === 503) return false;
    return r.ok;
  } catch {
    return false;
  }
}
