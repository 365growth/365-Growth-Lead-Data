/** GHL / Facebook IDs — override via `.env` (Vite `VITE_*`). */

const env = import.meta.env;

export const GHL_BASE = env.VITE_GHL_BASE || "https://services.leadconnectorhq.com";
export const GHL_LOC = env.VITE_GHL_LOCATION_ID || "jFwvm4vjOUak5dQfrUKx";
export const GHL_PIPE = env.VITE_GHL_PIPELINE_ID || "oEXGoLDxJJM3zEmRpZZB";
export const GHL_CAL = env.VITE_GHL_CALENDAR_ID || "slf8l47okBHHCgldN4Mx";

export const FB_GRAPH = env.VITE_FB_GRAPH_VERSION
  ? `https://graph.facebook.com/${env.VITE_FB_GRAPH_VERSION}`
  : "https://graph.facebook.com/v19.0";
export const FB_AD_ACCT = env.VITE_FB_AD_ACCOUNT_ID || "act_928072827998809";
