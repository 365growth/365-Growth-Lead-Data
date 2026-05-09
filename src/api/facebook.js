import { FB_AD_ACCT, FB_GRAPH } from "../config.js";

/**
 * Aggregate FB ad spend across a date window. When `campaignIds` is non-empty,
 * pulls per-campaign insights and sums only the selected ones; otherwise pulls
 * account-level totals.
 *
 * @param {string} fbToken
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string[]} [campaignIds] empty/undefined = include the whole account
 */
export async function fetchFBAdSpend(fbToken, startDate, endDate, campaignIds) {
  if (!fbToken) return null;
  try {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];
    const filtered = Array.isArray(campaignIds) && campaignIds.length > 0;

    const params = new URLSearchParams({
      access_token: fbToken,
      fields: "spend,impressions,clicks,actions,cpm,cpc,campaign_id,campaign_name",
      time_range: JSON.stringify({ since: start, until: end }),
      level: filtered ? "campaign" : "account",
      limit: "500",
    });
    if (filtered) {
      params.set("filtering", JSON.stringify([
        { field: "campaign.id", operator: "IN", value: campaignIds },
      ]));
    }

    const res = await fetch(`${FB_GRAPH}/${FB_AD_ACCT}/insights?${params}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("FB API error:", res.status, body.slice(0, 300));
      return null;
    }
    const data = await res.json();
    console.log("=== FACEBOOK AD INSIGHTS ===", { filtered, campaignCount: campaignIds?.length, rows: data.data?.length });

    if (!data.data || data.data.length === 0) {
      return { spend: 0, impressions: 0, clicks: 0, cpm: 0, cpc: 0, actions: [] };
    }

    if (!filtered) {
      const row = data.data[0];
      return {
        spend: parseFloat(row.spend || 0),
        impressions: parseInt(row.impressions || 0),
        clicks: parseInt(row.clicks || 0),
        cpm: parseFloat(row.cpm || 0),
        cpc: parseFloat(row.cpc || 0),
        actions: row.actions || [],
      };
    }

    const totals = data.data.reduce((acc, row) => {
      acc.spend += parseFloat(row.spend || 0);
      acc.impressions += parseInt(row.impressions || 0);
      acc.clicks += parseInt(row.clicks || 0);
      return acc;
    }, { spend: 0, impressions: 0, clicks: 0 });
    return {
      ...totals,
      cpm: totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      actions: [],
    };
  } catch (e) {
    console.warn("FB ad fetch failed:", e.message);
    return null;
  }
}

/**
 * List campaigns in the ad account so the operator can pick which ones count
 * as "this pipeline" for spend attribution.
 *
 * @param {string} fbToken
 * @returns {Promise<Array<{ id: string, name: string, status: string, objective?: string, lifetimeSpend?: number }>>}
 */
export async function fetchFBCampaigns(fbToken) {
  if (!fbToken) return [];
  try {
    const params = new URLSearchParams({
      access_token: fbToken,
      fields: "id,name,status,objective,start_time,stop_time,insights.date_preset(maximum){spend}",
      limit: "200",
    });
    const res = await fetch(`${FB_GRAPH}/${FB_AD_ACCT}/campaigns?${params}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn("FB campaigns fetch error:", res.status, body.slice(0, 300));
      return [];
    }
    const data = await res.json();
    return (data.data || []).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective,
      lifetimeSpend: parseFloat(c.insights?.data?.[0]?.spend || 0),
    }));
  } catch (e) {
    console.warn("FB campaigns fetch failed:", e.message);
    return [];
  }
}
