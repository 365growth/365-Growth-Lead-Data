import { GHL_BASE, GHL_LOC, GHL_PIPE, GHL_CAL } from "../config.js";
import { GHL_STAGE_MAP, STAGE, STAGE_NAME_MAP, SID } from "../constants/stages.js";

/**
 * Keyword aliases for matching arbitrary GHL stage names to internal SIDs.
 * Order matters: more specific phrases first, since the first hit wins.
 * Each phrase is normalized (lowercased, non-letters stripped) before comparison.
 */
const STAGE_ALIASES = [
  { sid: SID.NOSHOW,   phrases: ["noshow", "didnotshow", "missed"] },
  { sid: SID.CANCEL,   phrases: ["cancelled", "canceled", "cancel"] },
  { sid: SID.RESCHED,  phrases: ["reschedul"] },
  { sid: SID.LOST,     phrases: ["closedlost", "lost"] },
  { sid: SID.PAID,     phrases: ["closedpaid", "paid"] },
  { sid: SID.WON,      phrases: ["closedwon", "won", "signed"] },
  { sid: SID.TRIAL,    phrases: ["trialstarted", "freetrial", "trial"] },
  { sid: SID.ATTENDED, phrases: ["apptattended", "callattended", "attended", "showed", "completedcall"] },
  { sid: SID.BOOKED,   phrases: ["apptbooked", "callbooked", "callset", "appointmentset", "scheduled", "booked"] },
  { sid: SID.DQ,       phrases: ["disqualified", "unqualified"] },
  { sid: SID.NEW,      phrases: ["newlead", "new"] },
];

export function matchStageByAlias(stageName) {
  if (!stageName) return null;
  const normalized = stageName.toLowerCase().replace(/[^a-z]/g, "");
  if (STAGE_NAME_MAP[normalized]) return STAGE_NAME_MAP[normalized];
  for (const { sid, phrases } of STAGE_ALIASES) {
    if (phrases.some(p => normalized.includes(p))) return sid;
  }
  return null;
}

let _ghlStageMap = {};
let _cfDefs = {};

export function resetGhlSyncState() {
  _ghlStageMap = {};
  _cfDefs = {};
}

/**
 * GHL allows ~100 req/10s per location. Wrap fetch with retry on 429 +
 * exponential backoff so concurrent contact/calendar lookups don't drop data.
 */
async function ghlFetch(url, init = {}, attempt = 0) {
  const res = await fetch(url, init);
  if (res.status === 429 && attempt < 4) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 0;
    const delayMs = retryAfter > 0 ? retryAfter * 1000 : Math.min(8000, 500 * Math.pow(2, attempt));
    await new Promise(r => setTimeout(r, delayMs + Math.random() * 200));
    return ghlFetch(url, init, attempt + 1);
  }
  return res;
}

export function getGhlStageMap() {
  return _ghlStageMap;
}

async function fetchPipelineStages(apiKey) {
  const endpoints = [
    `${GHL_BASE}/opportunities/pipelines/${GHL_PIPE}?locationId=${GHL_LOC}`,
    `${GHL_BASE}/opportunities/pipelines?locationId=${GHL_LOC}`,
  ];
  for (const url of endpoints) {
    try {
      const res = await ghlFetch(url, {
        headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      let stages = data.pipeline?.stages || data.stages || [];
      if (!stages.length && data.pipelines) {
        const pipe = data.pipelines.find(p => p.id === GHL_PIPE);
        if (pipe) stages = pipe.stages || [];
      }
      if (!stages.length) continue;
      console.log("=== GHL PIPELINE STAGES ===");
      stages.forEach(s => {
        const matched = matchStageByAlias(s.name);
        console.log(`  GHL stage: "${s.name}" → ${matched ? `mapped to ${matched}` : "UNMAPPED"} (id: ${s.id})`);
        if (matched) _ghlStageMap[s.id] = matched;
      });
      console.log("=== DYNAMIC STAGE MAP ===", _ghlStageMap);
      return;
    } catch { /* ignore */ }
  }
  console.warn("Could not fetch pipeline stages from any endpoint");
}

function buildStageMapFromOpps(opps) {
  const stageIds = [...new Set(opps.map(o => o.pipelineStageId).filter(Boolean))];
  console.log("=== UNIQUE STAGE IDs FROM OPPORTUNITIES ===");
  stageIds.forEach(sid => {
    const count = opps.filter(o => o.pipelineStageId === sid).length;
    const sampleName = opps.find(o => o.pipelineStageId === sid)?.stageName;
    console.log(`  ${sid} → name: "${sampleName}", count: ${count}`);
    if (STAGE[sid]) {
      _ghlStageMap[sid] = sid;
    }
  });
}

function mapGHLStage(ghlStageId, ghlStageName) {
  if (_ghlStageMap[ghlStageId]) return _ghlStageMap[ghlStageId];
  if (GHL_STAGE_MAP[ghlStageId]) return GHL_STAGE_MAP[ghlStageId];
  const aliasMatch = matchStageByAlias(ghlStageName);
  if (aliasMatch) {
    _ghlStageMap[ghlStageId] = aliasMatch;
    return aliasMatch;
  }
  return SID.NEW;
}

function nullSafe(v) { return (v && v !== "undefined" && v !== "null") ? v : ""; }

/** Format an ISO timestamp as YYYY-MM-DD in the browser's local timezone. */
function toLocalDateString(iso) {
  const d = new Date(iso);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

async function fetchCustomFieldDefs(apiKey) {
  try {
    const res = await ghlFetch(`${GHL_BASE}/locations/${GHL_LOC}/customFields`, {
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

function parseGHLOpportunity(opp, fullContact) {
  const contact = fullContact || opp.contact || {};

  const cf = {};
  (contact.customFields || contact.customField || []).forEach(f => {
    const val = f.value || f.fieldValue || "";
    if (!val) return;
    const name = _cfDefs[f.id] || (f.key || f.fieldKey || f.id || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
    cf[name] = val;
  });

  if (fullContact && !parseGHLOpportunity._logged) {
    console.log("=== CONTACT CUSTOM FIELDS (first contact, mapped) ===");
    Object.entries(cf).forEach(([k, v]) => console.log(`  "${k}" = "${v}"`));
    console.log("=== CONTACT STANDARD FIELDS ===");
    console.log(`  name: "${contact.name}", firstName: "${contact.firstName}", lastName: "${contact.lastName}"`);
    console.log(`  companyName: "${contact.companyName}", website: "${contact.website}"`);
    console.log(`  city: "${contact.city}", state: "${contact.state}"`);
    parseGHLOpportunity._logged = true;
  }

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
    _rawStageName: opp.stageName || null,
    _rawStageId:   opp.pipelineStageId || null,
    jobsPerMonth:  findCF("how_many_roofing_jobs", "roofing_jobs_does"),
    avgJobValue:   findCF("avg_job", "average_job"),
    crewSize:      findCF("crew_size"),
    yearsInBiz:    findCF("how_long_have_you_been_in_business"),
    website:       nullSafe(contact.website) || findCF("do_you_have_a_website", "website") || "",
    /* Use the user's local TZ so a lead created at 9 PM CST on Apr 8 (Apr 9 UTC)
     * is bucketed on Apr 8 — matching how GHL's UI shows it for the same user. */
    dateAdded:     toLocalDateString(opp.createdAt || new Date().toISOString()),
    updatedAt:     opp.updatedAt ? toLocalDateString(opp.updatedAt) : null,
    source:        opp.source || contact.source || "Facebook Ad",
    value:         opp.monetaryValue ?? 0,
    notes:         opp.notes || "",
    tags:          contact.tags || [],
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
    apptDate:   null,
    apptStatus: null,
  };
}

async function fetchGHLContact(apiKey, contactId) {
  const res = await ghlFetch(`${GHL_BASE}/contacts/${contactId}`, {
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

export async function fetchGHLLeads(apiKey) {
  await Promise.all([
    fetchPipelineStages(apiKey),
    fetchCustomFieldDefs(apiKey).then(defs => { _cfDefs = defs; }),
  ]);

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

    const res = await ghlFetch(`${GHL_BASE}/opportunities/search?${params}`, {
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

  if (Object.keys(_ghlStageMap).length === 0) {
    buildStageMapFromOpps(allOpps);
  }

  parseGHLOpportunity._logged = false;
  const contactCache = {};
  const contactIds = [...new Set(allOpps.map(o => o.contactId).filter(Boolean))];

  const BATCH = 2;
  for (let i = 0; i < contactIds.length; i += BATCH) {
    const batch = contactIds.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(cid => fetchGHLContact(apiKey, cid).catch(() => null)));
    results.forEach((c, idx) => { if (c) contactCache[batch[idx]] = c; });
    if (i + BATCH < contactIds.length) await new Promise(r => setTimeout(r, 500));
  }

  return allOpps.map(opp => parseGHLOpportunity(opp, contactCache[opp.contactId] || null));
}

export async function fetchGHLAppointments(apiKey) {
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

  let calendarIds = [];
  try {
    const cRes = await ghlFetch(`${GHL_BASE}/calendars/?locationId=${GHL_LOC}`, { headers });
    if (cRes.ok) {
      const cData = await cRes.json();
      calendarIds = (cData.calendars || []).map(c => c.id);
      console.log("=== ALL CALENDARS ===");
      (cData.calendars || []).forEach(c => console.log(`  ${c.id} → "${c.name}"`));
    }
  } catch { /* ignore */ }

  if (!calendarIds.length) calendarIds = [GHL_CAL];

  for (const calId of calendarIds) {
    try {
      const params = new URLSearchParams({
        locationId: GHL_LOC,
        calendarId: calId,
        startTime: String(startDate.getTime()),
        endTime: String(endDate.getTime()),
      });
      let res = await ghlFetch(`${GHL_BASE}/calendars/events?${params}`, { headers });
      let data = res.ok ? await res.json() : {};
      let events = data.events || [];

      if (!events.length) {
        const p2 = new URLSearchParams({
          locationId: GHL_LOC,
          calendarId: calId,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        });
        res = await ghlFetch(`${GHL_BASE}/calendars/events?${p2}`, { headers });
        data = res.ok ? await res.json() : {};
        events = data.events || [];
      }

      if (events.length) {
        console.log(`Calendar ${calId}: found ${events.length} events`);
        allEvents.push(...events);
      }
    } catch { /* ignore */ }
  }

  if (!allEvents.length) {
    for (const calId of calendarIds) {
      try {
        const p3 = new URLSearchParams({
          locationId: GHL_LOC,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        const r3 = await ghlFetch(`${GHL_BASE}/calendars/${calId}/events?${p3}`, { headers });
        if (r3.ok) {
          const d3 = await r3.json();
          console.log(`calendars/${calId}/events:`, d3);
          const evts = d3.events || d3.appointments || d3.data || [];
          if (evts.length) { allEvents.push(...evts); break; }
        }
      } catch { /* ignore */ }
    }
  }

  if (!allEvents.length) {
    try {
      const p4 = new URLSearchParams({
        locationId: GHL_LOC,
        startDate: String(startDate.getTime()),
        endDate: String(endDate.getTime()),
      });
      const r4 = await ghlFetch(`${GHL_BASE}/appointments/?${p4}`, { headers });
      if (r4.ok) {
        const d4 = await r4.json();
        console.log("appointments/ response:", d4);
        const evts = d4.appointments || d4.events || [];
        if (evts.length) allEvents.push(...evts);
      }
    } catch { /* ignore */ }
  }

  console.log(`Total appointments found across ${calendarIds.length} calendar(s): ${allEvents.length}`);
  return allEvents;
}

function parseApptStatus(appt) {
  const s = (appt.appointmentStatus || appt.status || "").toLowerCase();
  if (s.includes("show") && !s.includes("no")) return "showed";
  if (s.includes("no_show") || s.includes("noshow") || s.includes("no show")) return "no_show";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("reschedule")) return "rescheduled";
  return "confirmed";
}

function normalizeAppt(evt) {
  return {
    startTime: evt.startTime || evt.start || null,
    endTime: evt.endTime || evt.end || null,
    status: parseApptStatus(evt),
    title: evt.title || evt.name || "",
  };
}

export function enrichLeadsWithAppointments(leads, events, now = new Date()) {
  const byContact = {};
  for (const evt of events) {
    const cid = evt.contactId;
    if (!cid) continue;
    (byContact[cid] = byContact[cid] || []).push(evt);
  }

  return leads.map(lead => {
    let matched = byContact[lead.contactId] ? [...byContact[lead.contactId]] : [];
    if (matched.length === 0) {
      for (const evt of events) {
        const ec = evt.contact || {};
        if ((lead.email && ec.email === lead.email) || (lead.phone && ec.phone === lead.phone)) {
          matched.push(evt);
        }
      }
    }

    if (matched.length === 0) return lead;

    const appts = matched
      .map(normalizeAppt)
      .filter(a => a.startTime)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const everShowed = appts.some(a => a.status === "showed");
    const pastAppts = appts.filter(a => new Date(a.startTime) < now);
    const hadPastAppt = pastAppts.length > 0;
    const latestPastApptStatus = hadPastAppt ? pastAppts[pastAppts.length - 1].status : null;

    const latest = appts[appts.length - 1];

    return {
      ...lead,
      apptDate: latest.startTime,
      apptStatus: latest.status,
      apptTitle: latest.title,
      apptEndDate: latest.endTime,
      appts,
      everShowed,
      hadPastAppt,
      latestPastApptStatus,
    };
  });
}

/** Debug helper: raw opportunities + contact + calendars (uses same auth as app). */
export async function debugGHLRaw(apiKey) {
  const params = new URLSearchParams({ location_id: GHL_LOC, pipeline_id: GHL_PIPE, limit: "5" });
  const res = await ghlFetch(`${GHL_BASE}/opportunities/search?${params}`, {
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

    if (opp.contactId) {
      const cRes = await ghlFetch(`${GHL_BASE}/contacts/${opp.contactId}`, {
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
  console.log("=== FETCHING CUSTOM FIELD DEFINITIONS ===");
  const cfRes = await ghlFetch(`${GHL_BASE}/locations/${GHL_LOC}/customFields`, {
    headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
  });
  if (cfRes.ok) {
    const cfData = await cfRes.json();
    console.log("=== CUSTOM FIELD DEFINITIONS ===");
    (cfData.customFields || []).forEach(f => console.log(`  ${f.id} → "${f.name}" (key: ${f.fieldKey})`));
  }

  const now = new Date();
  const start = new Date(now); start.setDate(start.getDate() - 30);
  const end = new Date(now); end.setDate(end.getDate() + 15);
  console.log(`=== CALENDAR: searching ${start.toISOString()} → ${end.toISOString()} ===`);

  const calParams = new URLSearchParams({ locationId: GHL_LOC, calendarId: GHL_CAL, startTime: start.toISOString(), endTime: end.toISOString() });
  const calRes2 = await ghlFetch(`${GHL_BASE}/calendars/events?${calParams}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
  });
  const calData = await calRes2.json();
  console.log("=== calendars/events ===", JSON.stringify(calData, null, 2));

  const calsRes = await ghlFetch(`${GHL_BASE}/calendars/?locationId=${GHL_LOC}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Version: "2021-07-28", Accept: "application/json" },
  });
  if (calsRes.ok) {
    const calsData = await calsRes.json();
    console.log("=== ALL CALENDARS IN LOCATION ===");
    (calsData.calendars || []).forEach(c => console.log(`  ${c.id} → "${c.name}" (type: ${c.calendarType})`));
  }
}

