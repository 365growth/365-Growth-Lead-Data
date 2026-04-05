import { useState, useEffect, Fragment } from "react";

const STAGE = {
  "a83aba03-5543-466c-8d0e-55374489800e": { name: "New Lead",         color: "#3b82f6", dot: "●", cat: "funnel", order: 0 },
  "c63d162e-3cfe-4c3b-9325-b509852e2610": { name: "Appt. Booked",    color: "#818cf8", dot: "●", cat: "funnel", order: 1 },
  "6ed45350-b188-470a-a53e-651a4716ca32": { name: "Appt. Attended",  color: "#06b6d4", dot: "●", cat: "funnel", order: 2 },
  "b3b07c71-be88-4fd5-804b-930b7efe83ac": { name: "Cancelled",       color: "#f97316", dot: "●", cat: "side"   },
  "1e1c7893-e529-45eb-a9dc-13427b6d4b92": { name: "No Show",         color: "#ef4444", dot: "●", cat: "side"   },
  "d6535484-6b2b-4d51-8f4e-4892b936b78a": { name: "Disqualified",    color: "#6b7280", dot: "●", cat: "side"   },
  "e4cff952-ece4-4415-9dc6-66ad7366958c": { name: "Trial Started",   color: "#f59e0b", dot: "●", cat: "funnel", order: 3 },
  "f7a2c1d0-paid-4a1b-b2c3-closedpaid001": { name: "Closed Paid",    color: "#10b981", dot: "●", cat: "funnel", order: 4 },
  "492cae24-83d0-47cd-930e-7da0e9af3764": { name: "Closed Won",      color: "#22c55e", dot: "●", cat: "funnel", order: 5 },
  "1122f2d1-45da-493c-ad18-cf7490d5864f": { name: "Closed Lost",     color: "#ef4444", dot: "●", cat: "side"   },
  "e5b3a2f1-resc-4c2d-a1b0-rescheduled01": { name: "Rescheduled",    color: "#f59e0b", dot: "●", cat: "side"   },
};

const FUNNEL  = ["a83aba03-5543-466c-8d0e-55374489800e","c63d162e-3cfe-4c3b-9325-b509852e2610","6ed45350-b188-470a-a53e-651a4716ca32","e4cff952-ece4-4415-9dc6-66ad7366958c","f7a2c1d0-paid-4a1b-b2c3-closedpaid001","492cae24-83d0-47cd-930e-7da0e9af3764"];
const SIDES   = ["b3b07c71-be88-4fd5-804b-930b7efe83ac","1e1c7893-e529-45eb-a9dc-13427b6d4b92","e5b3a2f1-resc-4c2d-a1b0-rescheduled01","d6535484-6b2b-4d51-8f4e-4892b936b78a","1122f2d1-45da-493c-ad18-cf7490d5864f"];
const ALL_SID = [...FUNNEL, ...SIDES];

const SAMPLE = [
  { id:"1",  name:"Tyrone Carrington", company:"Game Time Construction",    market:"Dallas, TX",      phone:"(214) 555-0182", email:"tyrone@gametimeroofing.com",   stageId:"492cae24-83d0-47cd-930e-7da0e9af3764", jobsPerMonth:15, avgJobValue:12000, crewSize:12, yearsInBiz:8,  website:"gametimeroofing.com",   dateAdded:"2026-01-15", source:"Facebook Ad", value:1500, notes:"Strong results in DFW", businessDescription:"We compete on quality", marketingBudget:"$2,500 - $5,000/month", marketingChannels:"Google Ads", comfortableWith2500:true, hasCRM:"Yes", isOwner:"Yes", readyToInvest:"Yes", isDecisionMaker:"Yes, I decide", salesStructure:"Dedicated salesperson", googleReviews:"25 - 49 reviews", serviceRadius:"50+ miles", insuranceClaims:"Yes, we handle insurance claims", financing:"Yes, we have financing", dqReason:"" },
  { id:"2",  name:"Mike Snow",          company:"RGB General Contracting",   market:"Mohawk, NY",      phone:"(315) 555-0234", email:"mike@rgbcontracting.com",      stageId:"e4cff952-ece4-4415-9dc6-66ad7366958c", jobsPerMonth:8,  avgJobValue:9500,  crewSize:6,  yearsInBiz:5,  website:"rgbcontracting.com",    dateAdded:"2026-02-03", source:"Facebook Ad", value:1500, notes:"Active trial, good engagement" },
  { id:"3",  name:"Daniel McAvoy",      company:"R&RJ Roofing",              market:"Kansas City, MO", phone:"(816) 555-0156", email:"daniel@rrjroofing.com",        stageId:"e4cff952-ece4-4415-9dc6-66ad7366958c", jobsPerMonth:10, avgJobValue:11000, crewSize:8,  yearsInBiz:6,  website:"rrjroofing.com",        dateAdded:"2026-02-18", source:"Facebook Ad", value:1500, notes:"On trial, following up weekly" },
  { id:"4",  name:"Greg Paulsen",       company:"Epic Home Solutions",       market:"Detroit, MI",     phone:"(313) 555-0298", email:"greg@epichomesolutions.com",   stageId:"6ed45350-b188-470a-a53e-651a4716ca32", jobsPerMonth:12, avgJobValue:10500, crewSize:9,  yearsInBiz:7,  website:"epichomesolutions.com", dateAdded:"2026-03-05", source:"Facebook Ad", value:1500, notes:"Attended call, very interested", apptDate:"2026-03-04T14:00:00", apptStatus:"showed" },
  { id:"5",  name:"Marcus Webb",        company:"Peak Roofing Solutions",    market:"Nashville, TN",   phone:"(615) 555-0341", email:"marcus@peakroofing.com",       stageId:"c63d162e-3cfe-4c3b-9325-b509852e2610", jobsPerMonth:18, avgJobValue:13500, crewSize:14, yearsInBiz:11, website:"peakroofing.com",       dateAdded:"2026-03-12", source:"Facebook Ad", value:1500, notes:"Booked for next week", apptDate:"2026-04-07T10:00:00", apptStatus:"confirmed" },
  { id:"6",  name:"Carlos Rivera",      company:"Best Coast Roofing",        market:"Naples, FL",      phone:"(239) 555-0167", email:"carlos@bestcoastroofing.com",  stageId:"a83aba03-5543-466c-8d0e-55374489800e", jobsPerMonth:7,  avgJobValue:8000,  crewSize:5,  yearsInBiz:3,  website:"bestcoastroofing.com",  dateAdded:"2026-03-28", source:"Facebook Ad", value:1500, notes:"New lead, needs qualification call" },
  { id:"7",  name:"James Holloway",     company:"Summit Roofing Co.",        market:"Clarksville, TN", phone:"(931) 555-0212", email:"james@summitroofingco.com",    stageId:"a83aba03-5543-466c-8d0e-55374489800e", jobsPerMonth:9,  avgJobValue:9000,  crewSize:7,  yearsInBiz:4,  website:"summitroofingco.com",   dateAdded:"2026-04-01", source:"Facebook Ad", value:1500, notes:"Just came in" },
  { id:"8",  name:"Devon Harris",       company:"Harris Home Exteriors",     market:"Austin, TX",      phone:"(512) 555-0378", email:"devon@harrishome.com",         stageId:"d6535484-6b2b-4d51-8f4e-4892b936b78a", jobsPerMonth:4,  avgJobValue:5500,  crewSize:3,  yearsInBiz:1,  website:"harrishome.com",        dateAdded:"2026-03-20", source:"Facebook Ad", value:0,    notes:"DQ — under 5 jobs/month", dqReason:"Under 5 jobs/month" },
  { id:"9",  name:"Brett Calloway",     company:"Calloway Roofing LLC",      market:"Charlotte, NC",   phone:"(704) 555-0289", email:"brett@callowayroofing.com",    stageId:"1e1c7893-e529-45eb-a9dc-13427b6d4b92", jobsPerMonth:11, avgJobValue:10000, crewSize:8,  yearsInBiz:5,  website:"callowayroofing.com",   dateAdded:"2026-03-08", source:"Facebook Ad", value:1500, notes:"No show — attempting reschedule", apptDate:"2026-03-10T11:00:00", apptStatus:"no_show" },
  { id:"10", name:"Anthony Powell",     company:"Powell Pro Roofing",        market:"Phoenix, AZ",     phone:"(602) 555-0145", email:"anthony@powellproroofing.com", stageId:"1122f2d1-45da-493c-ad18-cf7490d5864f", jobsPerMonth:6,  avgJobValue:7500,  crewSize:4,  yearsInBiz:2,  website:"powellproroofing.com",  dateAdded:"2026-02-25", source:"Facebook Ad", value:0,    notes:"Not ready — revisit in 6 months" },
];

const BLANK = { name:"", company:"", market:"", phone:"", email:"", stageId:"a83aba03-5543-466c-8d0e-55374489800e", jobsPerMonth:"", avgJobValue:"", crewSize:"", yearsInBiz:"", website:"", source:"Facebook Ad", value:1500, notes:"", businessDescription:"", marketingBudget:"", marketingChannels:"", comfortableWith2500:"", hasCRM:"", isOwner:"", readyToInvest:"", isDecisionMaker:"", salesStructure:"", googleReviews:"", serviceRadius:"", insuranceClaims:"", financing:"", dqReason:"" };
const SOURCES = ["Facebook Ad","Instagram Ad","Referral","Cold Outreach","Inbound","Other"];

/* ── GHL API CONFIG ── */
const GHL_BASE    = "https://services.leadconnectorhq.com";
const GHL_LOC     = "jFwvm4vjOUak5dQfrUKx";
const GHL_PIPE    = "oEXGoLDxJJM3zEmRpZZB";
const GHL_CAL     = "slf8l47okBHHCgldN4Mx";

/* ── Facebook Ads API CONFIG ── */
const FB_GRAPH    = "https://graph.facebook.com/v19.0";
const FB_AD_ACCT  = "act_928072827998809";

async function fetchFBAdSpend(fbToken, startDate, endDate) {
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

/* Map GHL pipeline stage IDs → app stage IDs.
   Update these after your first sync — the keys are your actual GHL stage UUIDs. */
const GHL_STAGE_MAP = {
  "new_lead_stage_id":        "a83aba03-5543-466c-8d0e-55374489800e",
  "appt_booked_stage_id":     "c63d162e-3cfe-4c3b-9325-b509852e2610",
  "appt_attended_stage_id":   "6ed45350-b188-470a-a53e-651a4716ca32",
  "cancelled_stage_id":       "b3b07c71-be88-4fd5-804b-930b7efe83ac",
  "no_show_stage_id":         "1e1c7893-e529-45eb-a9dc-13427b6d4b92",
  "disqualified_stage_id":    "d6535484-6b2b-4d51-8f4e-4892b936b78a",
  "trial_started_stage_id":   "e4cff952-ece4-4415-9dc6-66ad7366958c",
  "closed_paid_stage_id":     "f7a2c1d0-paid-4a1b-b2c3-closedpaid001",
  "closed_won_stage_id":      "492cae24-83d0-47cd-930e-7da0e9af3764",
  "closed_lost_stage_id":     "1122f2d1-45da-493c-ad18-cf7490d5864f",
  "rescheduled_stage_id":     "e5b3a2f1-resc-4c2d-a1b0-rescheduled01",
};

const STAGE_NAME_MAP = {};
Object.entries(STAGE).forEach(([id, s]) => {
  STAGE_NAME_MAP[s.name.toLowerCase().replace(/[^a-z]/g, "")] = id;
});

/* Dynamic mapping built from GHL pipeline stages (populated during sync) */
let _ghlStageMap = {};

async function fetchPipelineStages(apiKey) {
  const endpoints = [
    `${GHL_BASE}/opportunities/pipelines/${GHL_PIPE}?locationId=${GHL_LOC}`,
    `${GHL_BASE}/opportunities/pipelines?locationId=${GHL_LOC}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      /* Handle both single pipeline and list responses */
      let stages = data.pipeline?.stages || data.stages || [];
      if (!stages.length && data.pipelines) {
        const pipe = data.pipelines.find(p => p.id === GHL_PIPE);
        if (pipe) stages = pipe.stages || [];
      }
      if (!stages.length) continue;
      console.log("=== GHL PIPELINE STAGES ===");
      stages.forEach(s => {
        console.log(`  GHL stage: "${s.name}" → id: ${s.id}`);
        const normalized = s.name.toLowerCase().replace(/[^a-z]/g, "");
        if (STAGE_NAME_MAP[normalized]) {
          _ghlStageMap[s.id] = STAGE_NAME_MAP[normalized];
        } else {
          for (const [appName, appId] of Object.entries(STAGE_NAME_MAP)) {
            if (normalized.includes(appName) || appName.includes(normalized)) {
              _ghlStageMap[s.id] = appId;
              break;
            }
          }
        }
      });
      console.log("=== DYNAMIC STAGE MAP ===", _ghlStageMap);
      return;
    } catch {}
  }
  console.warn("Could not fetch pipeline stages from any endpoint");
}

/* Build stage map from the opportunities themselves (fallback) */
function buildStageMapFromOpps(opps) {
  const stageIds = [...new Set(opps.map(o => o.pipelineStageId).filter(Boolean))];
  console.log("=== UNIQUE STAGE IDs FROM OPPORTUNITIES ===");
  stageIds.forEach(sid => {
    const count = opps.filter(o => o.pipelineStageId === sid).length;
    const sampleName = opps.find(o => o.pipelineStageId === sid)?.stageName;
    console.log(`  ${sid} → name: "${sampleName}", count: ${count}`);
    /* If this stage ID is already in our app stages, it maps to itself */
    if (STAGE[sid]) {
      _ghlStageMap[sid] = sid;
    }
  });
}

function mapGHLStage(ghlStageId, ghlStageName) {
  /* Check dynamic map first (built from actual GHL pipeline) */
  if (_ghlStageMap[ghlStageId]) return _ghlStageMap[ghlStageId];
  /* Then static map */
  if (GHL_STAGE_MAP[ghlStageId]) return GHL_STAGE_MAP[ghlStageId];
  /* Then name-based fallback */
  if (ghlStageName) {
    const key = ghlStageName.toLowerCase().replace(/[^a-z]/g, "");
    if (STAGE_NAME_MAP[key]) return STAGE_NAME_MAP[key];
  }
  return "a83aba03-5543-466c-8d0e-55374489800e";
}

/* ── Appointment status styling ── */
const APPT_STATUS = {
  confirmed:   { label: "Confirmed",   color: "#818cf8", bg: "#818cf820" },
  showed:      { label: "Showed",      color: "#22c55e", bg: "#22c55e20" },
  no_show:     { label: "No Show",     color: "#ef4444", bg: "#ef444420" },
  cancelled:   { label: "Cancelled",   color: "#f97316", bg: "#f9731620" },
  rescheduled: { label: "Rescheduled", color: "#f59e0b", bg: "#f59e0b20" },
};

/* ── Custom Field ID → Name mapping (fetched from GHL once per sync) ── */
let _cfDefs = {}; // { fieldId: "field_name_normalized" }

async function fetchCustomFieldDefs(apiKey) {
  try {
    const res = await fetch(`${GHL_BASE}/locations/${GHL_LOC}/customFields`, {
      headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const defs = {};
    (data.customFields || []).forEach(f => {
      const name = (f.name || f.fieldKey || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      defs[f.id] = name;
    });
    console.log("=== GHL CUSTOM FIELD DEFINITIONS (" + (data.customFields||[]).length + " fields) ===");
    (data.customFields || []).forEach(f => console.log(`  CF: "${f.name}" → id:${f.id}, key:${f.fieldKey}`));
    console.log("=== FIELD ID → NAME MAP ===", defs);
    return defs;
  } catch (e) {
    console.warn("Could not fetch custom field defs:", e.message);
    return {};
  }
}

/* Treat null, undefined, and the string "undefined" as empty */
function nullSafe(v) { return (v && v !== "undefined" && v !== "null") ? v : ""; }

/* Build a lead from an opportunity + its full contact record */
function parseGHLOpportunity(opp, fullContact) {
  const contact = fullContact || opp.contact || {};

  /* Build custom field map using the field definitions to get real names */
  const cf = {};
  (contact.customFields || contact.customField || []).forEach(f => {
    const val = f.value || f.fieldValue || "";
    if (!val) return;
    /* Use the definition name if available, otherwise fall back to the raw ID */
    const name = _cfDefs[f.id] || (f.key || f.fieldKey || f.id || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    cf[name] = val;
  });

  /* Log first contact for debugging */
  if (fullContact && !parseGHLOpportunity._logged) {
    console.log("=== CONTACT CUSTOM FIELDS (first contact, mapped) ===");
    Object.entries(cf).forEach(([k, v]) => console.log(`  "${k}" = "${v}"`));
    console.log("=== CONTACT STANDARD FIELDS ===");
    console.log(`  name: "${contact.name}", firstName: "${contact.firstName}", lastName: "${contact.lastName}"`);
    console.log(`  companyName: "${contact.companyName}", website: "${contact.website}"`);
    console.log(`  city: "${contact.city}", state: "${contact.state}"`);
    parseGHLOpportunity._logged = true;
  }

  /* Helper: find a custom field value by partial key match */
  function findCF(...partials) {
    for (const p of partials) {
      const pl = p.toLowerCase();
      for (const [k, v] of Object.entries(cf)) {
        if (v && k.includes(pl)) return v;
      }
    }
    return "";
  }

  return {
    id:            opp.id,
    contactId:     opp.contactId || contact.id || "",
    name:          contact.firstName ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() : (contact.name || opp.name || ""),
    company:       nullSafe(contact.companyName) || findCF("business_name") || "",
    market:        [nullSafe(contact.city), nullSafe(contact.state)].filter(Boolean).join(", ") || findCF("which_city_and_state", "city_do_you_serve"),
    phone:         nullSafe(contact.phone) || "",
    email:         nullSafe(contact.email) || "",
    stageId:       mapGHLStage(opp.pipelineStageId, opp.stageName),
    jobsPerMonth:  findCF("how_many_roofing_jobs", "roofing_jobs_does"),
    avgJobValue:   findCF("avg_job", "average_job"),
    crewSize:      findCF("crew_size"),
    yearsInBiz:    findCF("how_long_have_you_been_in_business"),
    website:       nullSafe(contact.website) || findCF("do_you_have_a_website", "website") || "",
    dateAdded:     opp.createdAt ? opp.createdAt.split("T")[0] : new Date().toISOString().split("T")[0],
    source:        opp.source || contact.source || "Facebook Ad",
    value:         opp.monetaryValue ?? 1500,
    notes:         opp.notes || "",
    tags:          contact.tags || [],
    /* Qualification fields — matched to actual GHL custom field names */
    businessDescription:  findCF("what_best_describes_your_roofing_business"),
    marketingBudget:      findCF("how_much_are_you_investing_in_marketing_each_month"),
    marketingChannels:    findCF("where_are_you_currently_spending_your_marketing_dollars"),
    comfortableWith2500:  findCF("comfortable_with_a__2_500", "comfortable_with_a_2500"),
    hasCRM:               findCF("do_you_currently_have_a_crm"),
    isOwner:              findCF("are_you_the_owner_of_your_roofing_company"),
    readyToInvest:        findCF("are_you_ready_to_invest_into_growing"),
    isDecisionMaker:      findCF("are_you_the_decision_maker_for_marketing"),
    salesStructure:       findCF("do_you_have_a_dedicated_salesperson"),
    googleReviews:        findCF("how_many_google_reviews"),
    serviceRadius:        findCF("how_many_miles_are_you_willing_to_travel"),
    insuranceClaims:      findCF("do_you_offer_insurance_claim"),
    financing:            findCF("do_you_offer_financing"),
    dqReason:             findCF("dq_reason"),
    /* Appointment fields (enriched later) */
    apptDate:   null,
    apptStatus: null,
  };
}

/* Fetch a single contact's full record (includes custom fields) */
async function fetchGHLContact(apiKey, contactId) {
  const res = await fetch(`${GHL_BASE}/contacts/${contactId}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: "2021-07-28",
      Accept: "application/json",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.contact || data;
}

async function fetchGHLLeads(apiKey) {
  /* Step 0: Fetch pipeline stages + custom field definitions */
  await Promise.all([
    fetchPipelineStages(apiKey),
    fetchCustomFieldDefs(apiKey).then(defs => { _cfDefs = defs; }),
  ]);

  /* Step 1: Fetch all opportunities */
  const allOpps = [];
  let hasMore = true;
  let startAfterId = "";
  let page = 0;
  const limit = 100;

  while (hasMore && page < 10) {
    const params = new URLSearchParams({
      location_id: GHL_LOC,
      pipeline_id: GHL_PIPE,
      limit: String(limit),
    });
    if (startAfterId) params.set("startAfterId", startAfterId);

    const res = await fetch(`${GHL_BASE}/opportunities/search?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`GHL API ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const opps = data.opportunities || [];
    allOpps.push(...opps);

    if (opps.length < limit) {
      hasMore = false;
    } else {
      startAfterId = opps[opps.length - 1]?.id || "";
      page++;
    }
  }

  /* Step 1.5: Build stage map from actual opportunity data (fallback if pipeline fetch failed) */
  if (Object.keys(_ghlStageMap).length === 0) {
    buildStageMapFromOpps(allOpps);
  }

  /* Step 2: Fetch full contact records (batched, 3 at a time with delay to avoid 429 rate limits) */
  parseGHLOpportunity._logged = false;
  const contactCache = {};
  const contactIds = [...new Set(allOpps.map(o => o.contactId).filter(Boolean))];

  for (let i = 0; i < contactIds.length; i += 3) {
    const batch = contactIds.slice(i, i + 3);
    const results = await Promise.all(batch.map(cid => fetchGHLContact(apiKey, cid).catch(() => null)));
    results.forEach((c, idx) => { if (c) contactCache[batch[idx]] = c; });
    /* Small delay between batches to respect rate limits */
    if (i + 3 < contactIds.length) await new Promise(r => setTimeout(r, 350));
  }

  /* Step 3: Merge opportunity + contact into lead */
  return allOpps.map(opp => parseGHLOpportunity(opp, contactCache[opp.contactId] || null));
}

/* ── Fetch appointments from ALL GHL Calendars ── */
async function fetchGHLAppointments(apiKey) {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 15);

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Version: "2021-07-28",
    Accept: "application/json",
  };

  const allEvents = [];

  /* Step 1: Fetch all calendars in the location */
  let calendarIds = [];
  try {
    const cRes = await fetch(`${GHL_BASE}/calendars/?locationId=${GHL_LOC}`, { headers });
    if (cRes.ok) {
      const cData = await cRes.json();
      calendarIds = (cData.calendars || []).map(c => c.id);
      console.log("=== ALL CALENDARS ===");
      (cData.calendars || []).forEach(c => console.log(`  ${c.id} → "${c.name}"`));
    }
  } catch {}

  /* Fallback: use the known calendar ID if listing fails */
  if (!calendarIds.length) calendarIds = [GHL_CAL];

  /* Step 2: Fetch events from each calendar (try both date formats) */
  for (const calId of calendarIds) {
    try {
      /* Try epoch milliseconds first (what GHL v2 often expects) */
      const params = new URLSearchParams({
        locationId: GHL_LOC,
        calendarId: calId,
        startTime: String(startDate.getTime()),
        endTime: String(endDate.getTime()),
      });
      let res = await fetch(`${GHL_BASE}/calendars/events?${params}`, { headers });
      let data = res.ok ? await res.json() : {};
      let events = data.events || [];

      /* Fallback: try ISO string format */
      if (!events.length) {
        const p2 = new URLSearchParams({
          locationId: GHL_LOC,
          calendarId: calId,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        });
        res = await fetch(`${GHL_BASE}/calendars/events?${p2}`, { headers });
        data = res.ok ? await res.json() : {};
        events = data.events || [];
      }

      if (events.length) {
        console.log(`Calendar ${calId}: found ${events.length} events`);
        allEvents.push(...events);
      }
    } catch {}
  }

  /* Step 3: If still no events, try fetching appointments directly */
  if (!allEvents.length) {
    for (const calId of calendarIds) {
      try {
        /* Try GET /calendars/{calendarId}/events with different param names */
        const p3 = new URLSearchParams({
          locationId: GHL_LOC,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        const r3 = await fetch(`${GHL_BASE}/calendars/${calId}/events?${p3}`, { headers });
        if (r3.ok) {
          const d3 = await r3.json();
          console.log(`calendars/${calId}/events:`, d3);
          const evts = d3.events || d3.appointments || d3.data || [];
          if (evts.length) { allEvents.push(...evts); break; }
        }
      } catch {}
    }
  }

  /* Step 4: If still nothing, try the v1-style appointments search */
  if (!allEvents.length) {
    try {
      const p4 = new URLSearchParams({
        locationId: GHL_LOC,
        startDate: String(startDate.getTime()),
        endDate: String(endDate.getTime()),
      });
      const r4 = await fetch(`${GHL_BASE}/appointments/?${p4}`, { headers });
      if (r4.ok) {
        const d4 = await r4.json();
        console.log("appointments/ response:", d4);
        const evts = d4.appointments || d4.events || [];
        if (evts.length) allEvents.push(...evts);
      }
    } catch {}
  }

  console.log(`Total appointments found across ${calendarIds.length} calendar(s): ${allEvents.length}`);
  return allEvents;
}

function enrichLeadsWithAppointments(leads, events) {
  /* Build a map of contactId → most recent appointment */
  const contactAppts = {};
  for (const evt of events) {
    const cid = evt.contactId;
    if (!cid) continue;
    const existing = contactAppts[cid];
    if (!existing || new Date(evt.startTime) > new Date(existing.startTime)) {
      contactAppts[cid] = evt;
    }
  }

  return leads.map(lead => {
    /* Match by contactId on the opportunity, or by email/phone */
    let appt = contactAppts[lead.contactId] || null;
    if (!appt) {
      for (const evt of events) {
        const ec = evt.contact || {};
        if ((lead.email && ec.email === lead.email) || (lead.phone && ec.phone === lead.phone)) {
          if (!appt || new Date(evt.startTime) > new Date(appt.startTime)) appt = evt;
        }
      }
    }

    if (appt) {
      let apptStatus = "confirmed";
      const s = (appt.appointmentStatus || appt.status || "").toLowerCase();
      if (s.includes("show") && !s.includes("no"))   apptStatus = "showed";
      else if (s.includes("no_show") || s.includes("noshow") || s.includes("no show")) apptStatus = "no_show";
      else if (s.includes("cancel"))                  apptStatus = "cancelled";
      else if (s.includes("reschedule"))              apptStatus = "rescheduled";
      else if (s.includes("confirm"))                 apptStatus = "confirmed";

      return {
        ...lead,
        apptDate: appt.startTime || appt.start,
        apptStatus,
        apptTitle: appt.title || appt.name || "",
        apptEndDate: appt.endTime || appt.end || null,
      };
    }
    return lead;
  });
}

export default function App() {
  const [leads, setLeads]         = useState(SAMPLE);
  const [sel, setSel]             = useState(null);
  const [stgFilter, setStgFilter] = useState("all");
  const [q, setQ]                 = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [showSync, setShowSync]   = useState(false);
  const [form, setForm]           = useState(BLANK);
  const [importTxt, setImportTxt] = useState("");
  const [toast, setToast]         = useState(null);
  const [ready, setReady]         = useState(false);
  const [lastSync, setLastSync]   = useState(null);
  const [apiKey, setApiKey]       = useState("");
  const [fbToken, setFbToken]     = useState("");
  const [adSpend, setAdSpend]     = useState(null);
  const [syncing, setSyncing]     = useState(false);
  const [authed, setAuthed]       = useState(false);
  const [pw, setPw]               = useState("");
  const [lockError, setLockError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("365g-auth-expires");
    if (saved && Date.now() < Number(saved)) setAuthed(true);
    else localStorage.removeItem("365g-auth-expires");
  }, []);

  useEffect(() => { if (authed) load(); }, [authed]);
  useEffect(() => { if (ready && authed) save(); }, [leads, ready]);

  /* Auto-sync every 3 hours */
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => {
      console.log("Auto-sync triggered (3h interval)");
      autoSync(apiKey, fbToken);
    }, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, fbToken]);

  async function load() {
    try {
      const r = await window.storage.get("365g-pipe-v2");
      if (r?.value) {
        const d = JSON.parse(r.value);
        if (d.leads?.length) setLeads(d.leads);
        if (d.lastSync)      setLastSync(d.lastSync);
        if (d.fbToken)       setFbToken(d.fbToken);
        if (d.adSpend)       setAdSpend(d.adSpend);
        if (d.apiKey)        { setApiKey(d.apiKey); autoSync(d.apiKey, d.fbToken); }
      }
    } catch {}
    setReady(true);
  }

  async function save() {
    try { await window.storage.set("365g-pipe-v2", JSON.stringify({ leads, lastSync, apiKey, fbToken, adSpend })); } catch {}
  }

  /* ── Live GHL sync (leads + appointments) ── */
  async function autoSync(key, fbTok) {
    if (!key) return;
    try {
      setSyncing(true);
      const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(); windowEnd.setDate(windowEnd.getDate() + 15);
      const [fetched, events, fbData] = await Promise.all([
        fetchGHLLeads(key),
        fetchGHLAppointments(key).catch(() => []),
        (fbTok || fbToken) ? fetchFBAdSpend(fbTok || fbToken, windowStart, windowEnd) : Promise.resolve(null),
      ]);
      if (fetched.length) {
        const enriched = enrichLeadsWithAppointments(fetched, events);
        setLeads(enriched);
        const now = new Date().toISOString();
        setLastSync(now);
      }
      if (fbData) setAdSpend(fbData);
    } catch (err) {
      console.warn("Auto-sync failed:", err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function doSync() {
    if (!apiKey.trim()) { flash("Enter your GHL API key first", true); return; }
    try {
      setSyncing(true);
      const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(); windowEnd.setDate(windowEnd.getDate() + 15);
      const [fetched, events, fbData] = await Promise.all([
        fetchGHLLeads(apiKey.trim()),
        fetchGHLAppointments(apiKey.trim()).catch((e) => { console.warn("Calendar fetch failed:", e.message); return []; }),
        fbToken ? fetchFBAdSpend(fbToken, windowStart, windowEnd) : Promise.resolve(null),
      ]);
      if (!fetched.length) { flash("No opportunities found in this pipeline", true); return; }
      const enriched = enrichLeadsWithAppointments(fetched, events);
      setLeads(enriched);
      const now = new Date().toISOString();
      setLastSync(now);
      if (fbData) setAdSpend(fbData);
      setShowSync(false);
      const fbMsg = fbData ? ` · $${fbData.spend.toFixed(0)} ad spend` : "";
      flash(`Synced ${enriched.length} leads + ${events.length} appointments${fbMsg}`);
    } catch (err) {
      flash(`Sync failed: ${err.message}`, true);
    } finally {
      setSyncing(false);
    }
  }

  async function debugGHL() {
    if (!apiKey.trim()) { flash("Enter API key first", true); return; }
    try {
      flash("Fetching raw data — check browser console (Cmd+Option+I)...");
      /* Fetch first page of raw opportunities */
      const params = new URLSearchParams({ location_id: GHL_LOC, pipeline_id: GHL_PIPE, limit: "5" });
      const res = await fetch(`${GHL_BASE}/opportunities/search?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      const data = await res.json();
      console.log("=== RAW GHL OPPORTUNITIES (first 5) ===");
      console.log(JSON.stringify(data, null, 2));
      if (data.opportunities?.[0]) {
        const opp = data.opportunities[0];
        console.log("=== FIRST OPPORTUNITY DETAIL ===");
        console.log("pipelineStageId:", opp.pipelineStageId);
        console.log("stageName:", opp.stageName);
        console.log("contactId:", opp.contactId);
        console.log("contact (on opp):", JSON.stringify(opp.contact, null, 2));
        console.log("customFields (on opp):", JSON.stringify(opp.customFields, null, 2));
        console.log("All opp keys:", Object.keys(opp));

        /* Fetch the FULL contact record to see custom fields */
        if (opp.contactId) {
          const cRes = await fetch(`${GHL_BASE}/contacts/${opp.contactId}`, {
            headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
          });
          const cData = await cRes.json();
          console.log("=== FULL CONTACT RECORD ===");
          console.log(JSON.stringify(cData, null, 2));
          const c = cData.contact || cData;
          if (c.customFields || c.customField) {
            console.log("=== CONTACT CUSTOM FIELDS ===");
            console.log(JSON.stringify(c.customFields || c.customField, null, 2));
          }
        }
      }
      /* Fetch custom field definitions */
      console.log("=== FETCHING CUSTOM FIELD DEFINITIONS ===");
      const cfRes = await fetch(`${GHL_BASE}/locations/${GHL_LOC}/customFields`, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      if (cfRes.ok) {
        const cfData = await cfRes.json();
        console.log("=== CUSTOM FIELD DEFINITIONS ===");
        (cfData.customFields || []).forEach(f => console.log(`  ${f.id} → "${f.name}" (key: ${f.fieldKey})`));
      }

      /* Fetch raw calendar events */
      const now = new Date();
      const start = new Date(now); start.setDate(start.getDate() - 30);
      const end = new Date(now); end.setDate(end.getDate() + 15);
      console.log(`=== CALENDAR: searching ${start.toISOString()} → ${end.toISOString()} ===`);

      const calParams = new URLSearchParams({ locationId: GHL_LOC, calendarId: GHL_CAL, startTime: start.toISOString(), endTime: end.toISOString() });
      const calRes2 = await fetch(`${GHL_BASE}/calendars/events?${calParams}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      const calData = await calRes2.json();
      console.log("=== calendars/events ===", JSON.stringify(calData, null, 2));

      /* Also try listing all calendars to verify the calendar ID */
      const calsRes = await fetch(`${GHL_BASE}/calendars/?locationId=${GHL_LOC}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      if (calsRes.ok) {
        const calsData = await calsRes.json();
        console.log("=== ALL CALENDARS IN LOCATION ===");
        (calsData.calendars || []).forEach(c => console.log(`  ${c.id} → "${c.name}" (type: ${c.calendarType})`));
      }
      flash("Raw data logged to console — press Cmd+Option+I to view");
    } catch (err) {
      console.error("Debug fetch failed:", err);
      flash(`Debug failed: ${err.message}`, true);
    }
  }

  function flash(msg, err) {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3200);
  }

  /* ── 45-day window: 30 days back, 15 days ahead ── */
  const now = new Date();
  const windowStart = new Date(now); windowStart.setDate(windowStart.getDate() - 30);
  const windowEnd   = new Date(now); windowEnd.setDate(windowEnd.getDate() + 15);

  const windowLeads = leads.filter(l => {
    const d = new Date(l.dateAdded || 0);
    return d >= windowStart && d <= windowEnd;
  });

  /* ── computed (scoped to 45-day window) ── */
  const counts = {};
  ALL_SID.forEach(id => { counts[id] = windowLeads.filter(l => l.stageId === id).length; });

  /* Stage IDs for reference */
  const SID_NEW      = "a83aba03-5543-466c-8d0e-55374489800e";
  const SID_BOOKED   = "c63d162e-3cfe-4c3b-9325-b509852e2610";
  const SID_ATTENDED = "6ed45350-b188-470a-a53e-651a4716ca32";
  const SID_TRIAL    = "e4cff952-ece4-4415-9dc6-66ad7366958c";
  const SID_PAID     = "f7a2c1d0-paid-4a1b-b2c3-closedpaid001";
  const SID_WON      = "492cae24-83d0-47cd-930e-7da0e9af3764";
  const SID_CANCEL   = "b3b07c71-be88-4fd5-804b-930b7efe83ac";
  const SID_NOSHOW   = "1e1c7893-e529-45eb-a9dc-13427b6d4b92";
  const SID_RESCHED  = "e5b3a2f1-resc-4c2d-a1b0-rescheduled01";
  const SID_DQ       = "d6535484-6b2b-4d51-8f4e-4892b936b78a";
  const SID_LOST     = "1122f2d1-45da-493c-ad18-cf7490d5864f";

  /* Stages that are "at or beyond" each funnel step */
  const beyondNew      = [SID_BOOKED, SID_ATTENDED, SID_TRIAL, SID_PAID, SID_WON, SID_CANCEL, SID_NOSHOW, SID_RESCHED, SID_DQ, SID_LOST];
  const beyondBooked   = [SID_ATTENDED, SID_TRIAL, SID_PAID, SID_WON, SID_LOST];
  const beyondAttended = [SID_TRIAL, SID_PAID, SID_WON];

  const total = windowLeads.length;

  /* Cumulative funnel: how many reached each stage (current stage or beyond) */
  const funnelNew      = total;
  const funnelBooked   = windowLeads.filter(l => l.apptDate || beyondNew.includes(l.stageId)).length;
  const funnelAttended = windowLeads.filter(l => beyondBooked.includes(l.stageId) || (l.apptStatus === "showed")).length;
  const funnelTrial    = windowLeads.filter(l => beyondAttended.includes(l.stageId)).length;
  const funnelWon      = windowLeads.filter(l => [SID_PAID, SID_WON].includes(l.stageId)).length;

  const won        = counts[SID_WON] || 0;
  const closedPaid = counts[SID_PAID] || 0;
  const trials     = counts[SID_TRIAL] || 0;
  const mrr        = windowLeads.filter(l => [SID_WON, SID_PAID].includes(l.stageId)).reduce((s,l) => s + (l.value||0), 0);

  /* Appointment metrics */
  const leadsWithAppt   = windowLeads.filter(l => l.apptDate).length;

  /* Show Up Rate: leads who actually attended / leads who booked */
  const leadsAttended   = windowLeads.filter(l => beyondBooked.includes(l.stageId) || l.apptStatus === "showed").length;
  const showUpRate      = funnelBooked > 0 ? Math.round((leadsAttended / funnelBooked) * 100) : 0;

  /* Stage-based counts */
  const stageNoShow      = counts[SID_NOSHOW] || 0;
  const stageCancelled   = counts[SID_CANCEL] || 0;
  const stageRescheduled = counts[SID_RESCHED] || 0;
  const stageDQ          = counts[SID_DQ] || 0;
  const stageLost        = counts[SID_LOST] || 0;

  /* Combined counts (stage OR appointment status) */
  const totalNoShow      = stageNoShow      + windowLeads.filter(l => l.apptStatus === "no_show"     && l.stageId !== SID_NOSHOW).length;
  const totalCancelled   = stageCancelled   + windowLeads.filter(l => l.apptStatus === "cancelled"   && l.stageId !== SID_CANCEL).length;
  const totalRescheduled = stageRescheduled + windowLeads.filter(l => l.apptStatus === "rescheduled" && l.stageId !== SID_RESCHED).length;

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
  const apptPct = (n) => leadsWithAppt > 0 ? Math.round((n / leadsWithAppt) * 100) : 0;

  const apptRate    = pct(leadsWithAppt);
  const closeRate   = pct(won + closedPaid);
  const noShowRate  = apptPct(totalNoShow);
  const cancelRate  = apptPct(totalCancelled);
  const reschedRate = apptPct(totalRescheduled);
  const dqRate      = pct(stageDQ);

  /* Facebook Ad Spend metrics */
  const totalSpend  = adSpend?.spend || 0;
  const costPerLead = total > 0 && totalSpend > 0 ? (totalSpend / total) : 0;
  const costPerAppt = leadsWithAppt > 0 && totalSpend > 0 ? (totalSpend / leadsWithAppt) : 0;

  const filtered = windowLeads
    .filter(l => {
      if (stgFilter !== "all" && l.stageId !== stgFilter) return false;
      if (q) { const lq = q.toLowerCase(); return l.name?.toLowerCase().includes(lq) || l.company?.toLowerCase().includes(lq) || l.market?.toLowerCase().includes(lq); }
      return true;
    })
    .sort((a, b) => new Date(b.dateAdded||0) - new Date(a.dateAdded||0));

  /* Upcoming appointments (within the 15-day lookahead) */
  const upcoming = windowLeads
    .filter(l => l.apptDate && new Date(l.apptDate) >= now && new Date(l.apptDate) <= windowEnd && l.apptStatus !== "cancelled")
    .sort((a, b) => new Date(a.apptDate) - new Date(b.apptDate))
    .slice(0, 5);

  /* ── actions ── */
  function openAdd()       { setForm(BLANK);        setShowAdd(true); }
  function openEdit(lead, e) { e?.stopPropagation(); setForm({...lead}); setShowAdd(true); }

  function saveLead() {
    if (!form.company?.trim() || !form.name?.trim()) { flash("Company and owner name required", true); return; }
    if (form.id) {
      const u = {...form};
      setLeads(p => p.map(l => l.id === form.id ? u : l));
      if (sel?.id === form.id) setSel(u);
      flash("Lead updated");
    } else {
      const n = {...form, id: Date.now().toString(), dateAdded: new Date().toISOString().split("T")[0]};
      setLeads(p => [...p, n]);
      flash("Lead added");
    }
    setShowAdd(false);
  }

  function delLead(id, e) {
    e?.stopPropagation();
    if (!confirm("Delete this lead?")) return;
    setLeads(p => p.filter(l => l.id !== id));
    if (sel?.id === id) setSel(null);
    flash("Lead deleted");
  }

  function moveStage(leadId, sid) {
    setLeads(p => p.map(l => l.id === leadId ? {...l, stageId: sid} : l));
    if (sel?.id === leadId) setSel(p => ({...p, stageId: sid}));
    flash(`→ ${STAGE[sid].name}`);
  }

  function doImport() {
    try {
      let d = JSON.parse(importTxt);
      if (!Array.isArray(d)) d = d.leads || [];
      if (!d.length) throw 0;
      setLeads(d);
      const now = new Date().toISOString();
      setLastSync(now);
      setShowSync(false);
      setImportTxt("");
      flash(`Imported ${d.length} leads`);
    } catch { flash("Invalid JSON format", true); }
  }

  function disconnectGHL() {
    setApiKey("");
    flash("API key removed");
  }

  /* ── Authentication ── */
  async function handleLogin() {
    /* Load the stored password hash, or set one if first time */
    const stored = localStorage.getItem("365g-pw-hash");
    const hash = await hashPassword(pw);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (!stored) {
      /* First time — set the password */
      localStorage.setItem("365g-pw-hash", hash);
      localStorage.setItem("365g-auth-expires", String(Date.now() + sevenDays));
      setAuthed(true);
      setPw("");
    } else if (hash === stored) {
      localStorage.setItem("365g-auth-expires", String(Date.now() + sevenDays));
      setAuthed(true);
      setPw("");
      setLockError(false);
    } else {
      setLockError(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem("365g-auth-expires");
    setAuthed(false);
  }

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "365growth-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function fmtApptDate(d) {
    if (!d) return "—";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { month:"short", day:"numeric" }) + " " + dt.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
  }

  /* ── styles ── */
  const BG   = "#060d1a";
  const SRF  = "#0c1a2e";
  const BRD  = "#1a2f4a";
  const TXT  = "#e2e8f0";
  const MUT  = "#64748b";
  const BLUE = "#3b82f6";
  const GRN  = "#22c55e";

  const inp  = { padding:"8px 10px", background:"#0a1628", border:`1px solid ${BRD}`, borderRadius:6, color:TXT, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
  const btn  = (bg,col,brd) => ({ padding:"7px 14px", background:bg||"transparent", color:col||TXT, border:`1px solid ${brd||"transparent"}`, borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" });

  /* ── LOGIN SCREEN ── */
  if (!authed) {
    return (
      <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:BG, minHeight:"100vh", color:TXT, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
        <div style={{ background:SRF, border:`1px solid ${BRD}`, borderRadius:12, padding:40, width:360, textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:22, letterSpacing:1.2, color:BLUE, marginBottom:4 }}>
            365<span style={{ color:"#fff" }}>GROWTH</span>
          </div>
          <div style={{ fontSize:12, color:MUT, marginBottom:28 }}>Roofing Lead Pipeline</div>
          <div style={{ marginBottom:16 }}>
            <input
              style={{ ...inp, textAlign:"center", fontSize:15, padding:"12px 16px", letterSpacing:2 }}
              type="password"
              placeholder={localStorage.getItem("365g-pw-hash") ? "Enter password" : "Set your password"}
              value={pw}
              onChange={e => { setPw(e.target.value); setLockError(false); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoFocus
            />
          </div>
          {lockError && <div style={{ fontSize:12, color:"#ef4444", marginBottom:12 }}>Incorrect password</div>}
          <button className="hov" style={{ ...btn(BLUE,"#fff"), width:"100%", padding:"11px 14px", fontSize:14 }} onClick={handleLogin}>
            {localStorage.getItem("365g-pw-hash") ? "Unlock" : "Set Password & Enter"}
          </button>
          <div style={{ fontSize:10, color:"#2a3f5a", marginTop:16 }}>
            {localStorage.getItem("365g-pw-hash") ? "Password required to access dashboard" : "First time? Choose a password to secure your dashboard"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", background:BG, minHeight:"100vh", color:TXT, fontSize:14, lineHeight:1.4 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:#1a2f4a;border-radius:2px}
        input::placeholder,textarea::placeholder{color:#475569}
        select option{background:#0c1a2e}
        .tr-row:hover{background:#0d1e35!important}
        .hov:hover{opacity:.82}
        .sbtn:hover{opacity:.75}
        @keyframes slideR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 20px", height:52, borderBottom:`1px solid ${BRD}`, background:"#080e1c", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontWeight:800, fontSize:15, letterSpacing:1.2, color:BLUE }}>
            365<span style={{ color:"#fff" }}>GROWTH</span>
          </div>
          <div style={{ width:1, height:20, background:BRD }}/>
          <div style={{ fontSize:13, color:MUT }}>Roofing Lead Pipeline</div>
          <div style={{ fontSize:10, color:"#2a3f5a" }}>{windowStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} &ndash; {windowEnd.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          {lastSync && <div style={{ fontSize:11, color:"#2a3f5a" }}>synced {new Date(lastSync).toLocaleDateString()}</div>}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {syncing && <div style={{ fontSize:11, color:"#f59e0b", marginRight:4 }}>Syncing...</div>}
          {apiKey && <button className="hov" style={btn("#14532d","#22c55e","#22c55e40")} onClick={doSync} disabled={syncing}>Refresh</button>}
          <button className="hov" style={btn("#1a2f4a","#60a5fa","#3b82f640")} onClick={() => setShowSync(true)}>{apiKey ? "GHL Settings" : "Connect GHL"}</button>
          <button className="hov" style={btn(BLUE,"#fff")} onClick={openAdd}>+ Add Lead</button>
          <button className="hov" style={{ ...btn("transparent",MUT,BRD), padding:"7px 10px", fontSize:11 }} onClick={handleLogout}>Lock</button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1, background:BRD }}>
        {[
          { label:"Leads (45d)",  val: total,                      color: BLUE     },
          { label:"Appt. Rate",   val: apptRate + "%",             color: "#818cf8"},
          { label:"Show Up Rate", val: showUpRate + "%",           color: "#06b6d4"},
          { label:"Close Rate",   val: closeRate + "%",            color: GRN      },
        ].map(k => (
          <div key={k.label} style={{ background:SRF, padding:"14px 20px", textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:700, fontFamily:"'DM Mono',monospace", color:k.color, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:10, color:MUT, marginTop:5, letterSpacing:1.5, textTransform:"uppercase" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── AD SPEND + REVENUE ROW ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:1, background:BRD }}>
        {[
          { label:"Ad Spend",     val: totalSpend > 0 ? "$"+totalSpend.toLocaleString(undefined,{maximumFractionDigits:0}) : "$0", color: "#f87171" },
          { label:"Cost / Lead",  val: costPerLead > 0 ? "$"+costPerLead.toFixed(2) : "\u2014", color: "#fb923c" },
          { label:"Cost / Appt",  val: costPerAppt > 0 ? "$"+costPerAppt.toFixed(2) : "\u2014", color: "#fbbf24" },
          { label:"Active Trials",val: trials,                     color: "#f59e0b"},
          { label:"Won MRR",      val: "$"+mrr.toLocaleString(),   color: "#a78bfa"},
        ].map(k => (
          <div key={k.label} style={{ background:SRF, padding:"12px 16px", textAlign:"center" }}>
            <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:k.color, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:9, color:MUT, marginTop:5, letterSpacing:1.5, textTransform:"uppercase" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── PIPELINE OUTCOMES ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:1, background:BRD, borderBottom:`1px solid ${BRD}` }}>
        {[
          { label:"Booked",       count: leadsWithAppt, rate: apptRate + "%",    color: "#818cf8" },
          { label:"No Show",      count: totalNoShow,   rate: noShowRate + "%",  color: "#ef4444" },
          { label:"Cancelled",    count: totalCancelled, rate: cancelRate + "%", color: "#f97316" },
          { label:"Rescheduled",  count: totalRescheduled, rate: reschedRate + "%", color: "#f59e0b" },
          { label:"Disqualified", count: stageDQ,        rate: dqRate + "%",     color: "#6b7280" },
          { label:"Closed Won",   count: won + closedPaid, rate: closeRate + "%", color: "#22c55e" },
        ].map(k => (
          <div key={k.label} style={{ background:SRF, padding:"10px 12px", textAlign:"center" }}>
            <div style={{ display:"flex", alignItems:"baseline", justifyContent:"center", gap:6 }}>
              <span style={{ fontSize:20, fontWeight:700, fontFamily:"'DM Mono',monospace", color:k.color, lineHeight:1 }}>{k.count}</span>
              <span style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:k.color+"90" }}>{k.rate}</span>
            </div>
            <div style={{ fontSize:9, color:MUT, marginTop:4, letterSpacing:1.5, textTransform:"uppercase" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── UPCOMING APPOINTMENTS ── */}
      {upcoming.length > 0 && (
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${BRD}` }}>
          <div style={{ fontSize:10, color:MUT, letterSpacing:2, fontWeight:700, marginBottom:10 }}>UPCOMING APPOINTMENTS</div>
          <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
            {upcoming.map(lead => {
              const st = APPT_STATUS[lead.apptStatus] || APPT_STATUS.confirmed;
              return (
                <div key={lead.id} onClick={() => setSel(lead)}
                  style={{ minWidth:200, padding:"10px 14px", background:SRF, border:`1px solid ${BRD}`, borderRadius:8, cursor:"pointer", flexShrink:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:TXT }}>{lead.company || lead.name}</div>
                    <span style={{ fontSize:10, padding:"2px 6px", borderRadius:3, background:st.bg, color:st.color, fontWeight:600 }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#94a3b8", fontFamily:"'DM Mono',monospace" }}>{fmtApptDate(lead.apptDate)}</div>
                  <div style={{ fontSize:11, color:MUT, marginTop:2 }}>{lead.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FUNNEL (cumulative — how many reached each stage) ── */}
      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${BRD}` }}>
        <div style={{ fontSize:10, color:MUT, letterSpacing:2, fontWeight:700, marginBottom:12 }}>CONVERSION FUNNEL</div>
        <div style={{ display:"flex", alignItems:"stretch", overflowX:"auto", gap:0 }}>
          {[
            { name:"New Lead",       count: funnelNew,      color:"#3b82f6", sid: SID_NEW },
            { name:"Appt. Booked",   count: funnelBooked,   color:"#818cf8", sid: SID_BOOKED },
            { name:"Showed Up",      count: leadsAttended,  color:"#06b6d4", sid: SID_ATTENDED },
            { name:"Trial Started",  count: funnelTrial,    color:"#f59e0b", sid: SID_TRIAL },
            { name:"Closed Won",     count: funnelWon,      color:"#22c55e", sid: SID_WON },
          ].map((step, i, arr) => {
            const prev = i > 0 ? arr[i-1].count : null;
            const rate = prev !== null && prev > 0 ? Math.round((step.count / prev) * 100) : null;
            const active = stgFilter === step.sid;
            return (
              <Fragment key={step.name}>
                {i > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 6px", minWidth:44 }}>
                    <div style={{ fontSize:10, color:rate !== null ? (rate >= 70 ? GRN : rate >= 40 ? "#f59e0b" : "#ef4444") : MUT, fontFamily:"'DM Mono',monospace", marginBottom:2, fontWeight:600 }}>
                      {rate !== null ? rate+"%" : "\u2014"}
                    </div>
                    <div style={{ color:"#1e3a5f", fontSize:18, lineHeight:1 }}>&rsaquo;</div>
                  </div>
                )}
                <div onClick={() => setStgFilter(active ? "all" : step.sid)}
                  style={{ flex:1, minWidth:100, padding:"12px 8px", textAlign:"center", borderRadius:8, border:`1px solid ${active ? step.color+"90" : step.color+"28"}`, background: active ? step.color+"18" : SRF, cursor:"pointer", transition:"all .15s" }}>
                  <div style={{ fontSize:22, fontWeight:700, fontFamily:"'DM Mono',monospace", color:step.color, lineHeight:1 }}>{step.count}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", marginTop:5, fontWeight:500 }}>{step.name}</div>
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* Side stages */}
        <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
          {SIDES.map(sid => {
            const s = STAGE[sid], cnt = counts[sid]||0, active = stgFilter === sid;
            return (
              <div key={sid} onClick={() => setStgFilter(active ? "all" : sid)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, border:`1px solid ${s.color}30`, background: active ? s.color+"18" : "transparent", cursor:"pointer", fontSize:12 }}>
                <span style={{ fontFamily:"'DM Mono',monospace", color:s.color, fontWeight:700 }}>{cnt}</span>
                <span style={{ color:MUT }}>{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            <button className="sbtn" onClick={() => setStgFilter("all")}
              style={{ padding:"5px 10px", background: stgFilter==="all" ? "#1a2f4a" : "transparent", color: stgFilter==="all" ? TXT : MUT, border:`1px solid ${stgFilter==="all" ? BRD : "transparent"}`, borderRadius:5, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              All ({windowLeads.length})
            </button>
            {ALL_SID.filter(sid => counts[sid] > 0).map(sid => {
              const s = STAGE[sid], active = stgFilter === sid;
              return (
                <button key={sid} className="sbtn" onClick={() => setStgFilter(active ? "all" : sid)}
                  style={{ padding:"5px 10px", background: active ? s.color+"18" : "transparent", color: active ? s.color : MUT, border:`1px solid ${active ? s.color+"60" : "transparent"}`, borderRadius:5, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  {s.name} ({counts[sid]})
                </button>
              );
            })}
          </div>
          <input style={{ ...inp, width:240, padding:"7px 12px" }} placeholder="Search company, owner, market..." value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div style={{ background:SRF, border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#080e1c" }}>
                  {["Company","Owner","Market","Stage","Appointment","Jobs/Mo","Date Added",""].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, color:MUT, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", borderBottom:`1px solid ${BRD}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const s = STAGE[lead.stageId];
                  const isSel = sel?.id === lead.id;
                  const apptSt = lead.apptStatus ? (APPT_STATUS[lead.apptStatus] || APPT_STATUS.confirmed) : null;
                  return (
                    <tr key={lead.id} className="tr-row"
                      style={{ borderBottom:`1px solid #0e1e31`, background: isSel ? "#0f2040" : "transparent", cursor:"pointer" }}
                      onClick={() => setSel(isSel ? null : lead)}>
                      <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                        <div style={{ fontWeight:600, color:"#e2e8f0" }}>{lead.company || lead.name}</div>
                        {lead.website && <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{lead.website}</div>}
                      </td>
                      <td style={{ padding:"10px 14px", color:"#cbd5e1", whiteSpace:"nowrap" }}>{lead.name}</td>
                      <td style={{ padding:"10px 14px", color:"#94a3b8", whiteSpace:"nowrap" }}>{lead.market}</td>
                      <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:s.color+"18", color:s.color, border:`1px solid ${s.color}28` }}>
                          <span style={{ fontSize:7 }}>&#9679;</span>{s.name}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                        {lead.apptDate ? (
                          <div>
                            <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:"#94a3b8" }}>{fmtApptDate(lead.apptDate)}</div>
                            {apptSt && <span style={{ fontSize:10, padding:"1px 5px", borderRadius:3, background:apptSt.bg, color:apptSt.color, fontWeight:600 }}>{apptSt.label}</span>}
                          </div>
                        ) : (
                          <span style={{ fontSize:11, color:"#2a3f5a" }}>No appt</span>
                        )}
                      </td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Mono',monospace", color:"#94a3b8", fontSize:13 }}>{lead.jobsPerMonth||"\u2014"}</td>
                      <td style={{ padding:"10px 14px", fontFamily:"'DM Mono',monospace", color:"#475569", fontSize:12 }}>{lead.dateAdded}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <button className="hov" onClick={e => openEdit(lead,e)}
                          style={{ padding:"3px 10px", background:"transparent", color:"#60a5fa", border:"1px solid #3b82f628", borderRadius:4, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ padding:48, textAlign:"center", color:MUT }}>No leads match this filter</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── DETAIL PANEL ── */}
      {sel && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:150, background:"rgba(0,0,0,0.45)" }} onClick={() => setSel(null)} />
          <div style={{ position:"fixed", right:0, top:0, bottom:0, width:420, background:"#080e1c", borderLeft:`1px solid ${BRD}`, overflowY:"auto", zIndex:200, padding:20, animation:"slideR .2s ease" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${BRD}` }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700 }}>{sel.company}</div>
                <div style={{ fontSize:13, color:MUT, marginTop:2 }}>{sel.name}</div>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:4, fontSize:11, fontWeight:600, background:STAGE[sel.stageId].color+"20", color:STAGE[sel.stageId].color, border:`1px solid ${STAGE[sel.stageId].color}35`, marginTop:8 }}>
                  <span style={{ fontSize:7 }}>&#9679;</span>{STAGE[sel.stageId].name}
                </span>
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button className="hov" style={btn(BLUE,"#fff")} onClick={e => openEdit(sel,e)}>Edit</button>
                <button style={{ background:"none", border:"none", color:MUT, cursor:"pointer", fontSize:18, padding:"4px 6px" }} onClick={() => setSel(null)}>&#10005;</button>
              </div>
            </div>

            {/* Appointment Info */}
            <PanelSection title="APPOINTMENT" border={BRD}>
              {sel.apptDate ? (
                <div style={{ background:"#0a1628", border:`1px solid ${BRD}`, borderRadius:8, padding:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:"'DM Mono',monospace", color:TXT }}>{fmtApptDate(sel.apptDate)}</div>
                    {sel.apptStatus && (() => { const st = APPT_STATUS[sel.apptStatus] || APPT_STATUS.confirmed; return (
                      <span style={{ fontSize:11, padding:"3px 8px", borderRadius:4, background:st.bg, color:st.color, fontWeight:600, border:`1px solid ${st.color}30` }}>{st.label}</span>
                    ); })()}
                  </div>
                  {sel.apptTitle && <div style={{ fontSize:12, color:MUT }}>{sel.apptTitle}</div>}
                </div>
              ) : (
                <div style={{ fontSize:13, color:"#2a3f5a", fontStyle:"italic" }}>No appointment scheduled</div>
              )}
            </PanelSection>

            {/* Move stage */}
            <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${BRD}` }}>
              <div style={{ fontSize:10, color:MUT, letterSpacing:2, fontWeight:700, marginBottom:8 }}>MOVE TO STAGE</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {ALL_SID.map(sid => {
                  const s = STAGE[sid], active = sel.stageId === sid;
                  return (
                    <button key={sid} className="sbtn" onClick={() => moveStage(sel.id, sid)}
                      style={{ padding:"4px 9px", borderRadius:4, border:`1px solid ${s.color}40`, background: active ? s.color+"25" : "transparent", color: active ? s.color : MUT, fontSize:11, cursor:"pointer", fontFamily:"inherit", fontWeight: active ? 600 : 400 }}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <PanelSection title="CONTACT" border={BRD}>
              <Grid2>
                <Fld label="Phone"   val={sel.phone}   />
                <Fld label="Market"  val={sel.market}  />
                <Fld label="Email"   val={sel.email}   span />
                <Fld label="Website" val={sel.website} span />
              </Grid2>
            </PanelSection>

            {/* Business Info */}
            <PanelSection title="BUSINESS INFO" border={BRD}>
              <Grid2>
                <Fld label="Jobs / Month"      val={sel.jobsPerMonth} />
                <Fld label="Avg Job Value"     val={sel.avgJobValue ? "$"+Number(sel.avgJobValue).toLocaleString() : null} />
                <Fld label="Crew Size"         val={sel.crewSize} />
                <Fld label="Years in Business" val={sel.yearsInBiz} />
                <Fld label="Service Radius"    val={sel.serviceRadius} />
                <Fld label="Google Reviews"    val={sel.googleReviews} />
                <Fld label="Insurance Claims"  val={sel.insuranceClaims} />
                <Fld label="Financing"         val={sel.financing} />
              </Grid2>
            </PanelSection>

            {/* Qualification */}
            <PanelSection title="QUALIFICATION" border={BRD}>
              <Grid2>
                <Fld label="Business Type"         val={sel.businessDescription} span />
                <Fld label="Is Owner"              val={sel.isOwner} />
                <Fld label="Decision Maker"        val={sel.isDecisionMaker} />
                <Fld label="Ready to Invest"       val={sel.readyToInvest} span />
                <Fld label="Marketing Budget"      val={sel.marketingBudget} />
                <Fld label="OK with $2,500/mo"     val={sel.comfortableWith2500} />
                <Fld label="Current Channels"      val={sel.marketingChannels} />
                <Fld label="Has CRM"               val={sel.hasCRM} />
                <Fld label="Sales Structure"       val={sel.salesStructure} span />
              </Grid2>
              {sel.dqReason && (
                <div style={{ marginTop:10, padding:"8px 10px", background:"#ef444415", border:"1px solid #ef444430", borderRadius:6 }}>
                  <div style={{ fontSize:10, color:"#ef4444", letterSpacing:1, fontWeight:700, marginBottom:3 }}>DQ REASON</div>
                  <div style={{ fontSize:13, color:"#f87171" }}>{sel.dqReason}</div>
                </div>
              )}
            </PanelSection>

            {/* Deal */}
            <PanelSection title="DEAL" border={BRD}>
              <Grid2>
                <Fld label="Monthly Retainer" val={sel.value ? "$"+Number(sel.value).toLocaleString()+"/mo" : "$0"} color={GRN} />
                <Fld label="Source"           val={sel.source} />
                <Fld label="Date Added"       val={sel.dateAdded} />
              </Grid2>
            </PanelSection>

            {sel.notes && (
              <PanelSection title="NOTES" border={BRD}>
                <div style={{ color:"#94a3b8", fontSize:13, lineHeight:1.7 }}>{sel.notes}</div>
              </PanelSection>
            )}

            <button className="hov" onClick={e => delLead(sel.id, e)}
              style={{ ...btn("transparent","#ef4444","#ef444430"), width:"100%", marginTop:4, fontSize:12 }}>
              Delete Lead
            </button>
          </div>
        </>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showAdd && (
        <Modal onClose={() => setShowAdd(false)} title={form.id ? "Edit Lead" : "Add New Lead"}>
          <div style={{ padding:20, overflowY:"auto", maxHeight:"65vh", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            {[
              { k:"company",       label:"Company Name *" },
              { k:"name",          label:"Owner Name *"   },
              { k:"phone",         label:"Phone"          },
              { k:"email",         label:"Email"          },
              { k:"market",        label:"Market (City, State)" },
              { k:"website",       label:"Website"        },
              { k:"jobsPerMonth",  label:"Jobs / Month",  num:true },
              { k:"avgJobValue",   label:"Avg Job Value ($)", num:true },
              { k:"crewSize",      label:"Crew Size",     num:true },
              { k:"yearsInBiz",    label:"Years in Biz",  num:true },
              { k:"value",         label:"Monthly Retainer ($)", num:true },
            ].map(f => (
              <div key={f.k}>
                <div style={{ fontSize:11, color:MUT, marginBottom:4, letterSpacing:.5 }}>{f.label}</div>
                <input style={inp} type={f.num?"number":"text"} value={form[f.k]||""} onChange={e => setForm(p => ({ ...p, [f.k]: f.num ? Number(e.target.value) : e.target.value }))} />
              </div>
            ))}
            <div>
              <div style={{ fontSize:11, color:MUT, marginBottom:4 }}>Stage</div>
              <select style={inp} value={form.stageId} onChange={e => setForm(p => ({...p, stageId:e.target.value}))}>
                {ALL_SID.map(sid => <option key={sid} value={sid}>{STAGE[sid].name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:MUT, marginBottom:4 }}>Source</div>
              <select style={inp} value={form.source||"Facebook Ad"} onChange={e => setForm(p => ({...p, source:e.target.value}))}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ fontSize:11, color:MUT, marginBottom:4 }}>Notes</div>
              <textarea style={{ ...inp, height:72, resize:"vertical" }} value={form.notes||""} onChange={e => setForm(p => ({...p, notes:e.target.value}))} />
            </div>
          </div>
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${BRD}`, display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="hov" style={btn("#1a2f4a",MUT,BRD)} onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="hov" style={btn(BLUE,"#fff")} onClick={saveLead}>{form.id ? "Update" : "Add Lead"}</button>
          </div>
        </Modal>
      )}

      {/* ── SYNC MODAL ── */}
      {showSync && (
        <Modal onClose={() => setShowSync(false)} title="GoHighLevel Connection" maxW={480}>
          <div style={{ padding:20 }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:MUT, marginBottom:6, letterSpacing:.5 }}>GHL API Key (Private App Token)</div>
              <input
                style={{ ...inp, fontFamily:"'DM Mono',monospace", fontSize:12 }}
                type="password"
                placeholder="pit-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <div style={{ fontSize:11, color:"#475569", marginTop:6, lineHeight:1.6 }}>
                Get this from GHL &rarr; Settings &rarr; Business Profile &rarr; API Keys, or create a Private App at marketplace.gohighlevel.com
              </div>
            </div>

            {apiKey && lastSync && (
              <div style={{ background:"#0a1628", border:`1px solid #22c55e30`, borderRadius:8, padding:12, marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:GRN, fontSize:18 }}>&#9679;</span>
                <div>
                  <div style={{ fontSize:13, color:GRN, fontWeight:600 }}>Connected</div>
                  <div style={{ fontSize:11, color:MUT }}>Last sync: {new Date(lastSync).toLocaleString()} &middot; Calendar: {GHL_CAL.slice(0,8)}...</div>
                </div>
              </div>
            )}

            {/* Facebook Ads Section */}
            <div style={{ marginBottom:16, paddingTop:14, borderTop:`1px solid ${BRD}` }}>
              <div style={{ fontSize:11, color:MUT, marginBottom:6, letterSpacing:.5 }}>Facebook Ads Access Token</div>
              <input
                style={{ ...inp, fontFamily:"'DM Mono',monospace", fontSize:11 }}
                type="password"
                placeholder="EAAxxxxxxx..."
                value={fbToken}
                onChange={e => setFbToken(e.target.value)}
              />
              <div style={{ fontSize:11, color:"#475569", marginTop:6, lineHeight:1.6 }}>
                Ad Account: {FB_AD_ACCT} &middot; Pulls spend data for Cost/Lead and Cost/Appt
              </div>
              {adSpend && adSpend.spend > 0 && (
                <div style={{ background:"#0a1628", border:`1px solid #f5920b30`, borderRadius:8, padding:10, marginTop:8, fontSize:12, color:"#fbbf24" }}>
                  Ad Spend (45d): <strong>${adSpend.spend.toLocaleString(undefined,{maximumFractionDigits:2})}</strong>
                  {adSpend.clicks > 0 && <span style={{ color:MUT }}> &middot; {adSpend.clicks.toLocaleString()} clicks &middot; {adSpend.impressions.toLocaleString()} impressions</span>}
                </div>
              )}
            </div>

            <button className="hov" style={{ ...btn(BLUE,"#fff"), width:"100%", marginBottom:16, opacity: syncing?.45:1 }} onClick={doSync} disabled={syncing || !apiKey.trim()}>
              {syncing ? "Syncing..." : apiKey ? "Sync Now (Leads + Appointments + Ad Spend)" : "Enter API Key to Connect"}
            </button>

            {apiKey && (
              <button className="hov" style={{ ...btn("transparent","#ef4444","#ef444430"), width:"100%", fontSize:12, marginBottom:16 }} onClick={disconnectGHL}>
                Disconnect API Key
              </button>
            )}

            {apiKey && (
              <button className="hov" style={{ ...btn("#1a2f4a","#f59e0b","#f59e0b30"), width:"100%", fontSize:12, marginBottom:16 }} onClick={debugGHL}>
                Debug: Log Raw GHL Data to Console
              </button>
            )}

            <details style={{ borderTop:`1px solid ${BRD}`, paddingTop:14 }}>
              <summary style={{ fontSize:12, color:MUT, cursor:"pointer", marginBottom:10 }}>Manual JSON Import (fallback)</summary>
              <textarea style={{ ...inp, height:100, fontSize:12, fontFamily:"'DM Mono',monospace", resize:"vertical" }} placeholder='[{"id":"...","company":"..."}]' value={importTxt} onChange={e => setImportTxt(e.target.value)} />
              <button className="hov" style={{ ...btn("#166534",GRN,"#22c55e40"), width:"100%", marginTop:8, opacity:importTxt?1:.45 }} onClick={doImport} disabled={!importTxt}>Import JSON</button>
            </details>
          </div>
          <div style={{ padding:"12px 20px", borderTop:`1px solid ${BRD}`, display:"flex", justifyContent:"flex-end" }}>
            <button className="hov" style={btn("#1a2f4a",MUT,BRD)} onClick={() => setShowSync(false)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:999, padding:"10px 18px", borderRadius:8, background: toast.err ? "#7f1d1d" : "#14532d", border:`1px solid ${toast.err?"#ef444450":"#22c55e50"}`, color:TXT, fontSize:13, fontFamily:"inherit", boxShadow:"0 4px 24px rgba(0,0,0,.5)", animation:"toastIn .2s ease" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── SMALL HELPERS ── */
function Modal({ onClose, title, maxW=620, children }) {
  const BRD = "#1a2f4a";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)", animation:"fadeUp .15s ease" }} onClick={onClose}>
      <div style={{ background:"#0c1a2e", border:`1px solid ${BRD}`, borderRadius:12, width:"90%", maxWidth:maxW, maxHeight:"88vh", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${BRD}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:15, fontWeight:700 }}>{title}</div>
          <button style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:18, padding:"4px 6px" }} onClick={onClose}>&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PanelSection({ title, border, children }) {
  return (
    <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${border}` }}>
      <div style={{ fontSize:10, color:"#64748b", letterSpacing:2, fontWeight:700, marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>;
}

function Fld({ label, val, color, span }) {
  return (
    <div style={span ? { gridColumn:"1/-1" } : {}}>
      <div style={{ fontSize:10, color:"#475569", letterSpacing:1, marginBottom:3, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:13, fontFamily:"'DM Mono',monospace", color: color || "#94a3b8" }}>{val||"\u2014"}</div>
    </div>
  );
}
