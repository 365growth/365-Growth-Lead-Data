import { FB_AD_ACCT, FB_GRAPH } from "../config.js";

export async function fetchFBAdSpend(fbToken, startDate, endDate) {
  if (!fbToken) return null;
  try {
    const start = startDate.toISOString().split("T")[0];
    const end   = endDate.toISOString().split("T")[0];
    const params = new URLSearchParams({
      access_token: fbToken,
      fields: "spend,impressions,clicks,actions,cost_per_action_type,cpm,cpc",
      time_range: JSON.stringify({ since: start, until: end }),
      level: "account",
    });
    const res = await fetch(`${FB_GRAPH}/${FB_AD_ACCT}/insights?${params}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("FB API error:", res.status, body.slice(0, 300));
      return null;
    }
    const data = await res.json();
    console.log("=== FACEBOOK AD INSIGHTS ===", data);
    if (data.data && data.data.length > 0) {
      const row = data.data[0];
      return {
        spend:       parseFloat(row.spend || 0),
        impressions: parseInt(row.impressions || 0),
        clicks:      parseInt(row.clicks || 0),
        cpm:         parseFloat(row.cpm || 0),
        cpc:         parseFloat(row.cpc || 0),
        actions:     row.actions || [],
      };
    }
    return { spend: 0, impressions: 0, clicks: 0, cpm: 0, cpc: 0, actions: [] };
  } catch (e) {
    console.warn("FB ad fetch failed:", e.message);
    return null;
  }
}
