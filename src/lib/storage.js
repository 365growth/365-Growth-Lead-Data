/** Persist pipeline data (no API secrets — avoids accidental overwrites when saving leads). */
export const PIPE_KEY = "365g-pipe-v2";
/** GHL + Facebook tokens only (separate from PIPE_KEY so lead saves never wipe keys). */
export const CRED_KEY = "365g-creds-v1";

function hasWindowStorage() {
  return (
    typeof window !== "undefined" &&
    window.storage &&
    typeof window.storage.get === "function" &&
    typeof window.storage.set === "function"
  );
}

/**
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function storageGet(key) {
  try {
    if (hasWindowStorage()) {
      const r = await window.storage.get(key);
      if (r != null && r.value != null && r.value !== "") return r.value;
    }
  } catch {
    /* fall through */
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export async function storageSet(key, value) {
  try {
    if (hasWindowStorage()) {
      await window.storage.set(key, value);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Remove key from both storage backends when possible. */
export async function storageRemove(key) {
  try {
    if (hasWindowStorage() && typeof window.storage.remove === "function") {
      await window.storage.remove(key);
    }
  } catch { /* ignore */ }
  try {
    localStorage.removeItem(key);
  } catch { /* ignore */ }
}

/** Install `window.storage` shim (localStorage) before React mounts. */
export function installStorageShim() {
  if (typeof window === "undefined") return;
  if (hasWindowStorage()) return;
  window.storage = {
    get: (key) => Promise.resolve({ value: localStorage.getItem(key) }),
    set: (key, val) => {
      localStorage.setItem(key, val);
      return Promise.resolve();
    },
  };
}
