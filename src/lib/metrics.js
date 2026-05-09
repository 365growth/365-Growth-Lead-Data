import { ALL_SID, SID } from "../constants/stages.js";

/**
 * "Last N days" = a window of exactly N calendar days ending today (today
 * inclusive). So `daysBack=30` with anchor=May 8 gives windowStart=Apr 9, not
 * Apr 8 — matching how GHL, Google Analytics, FB Ads Manager, etc. interpret
 * "last 30 days".
 *
 * @param {Date} [now]
 * @param {number|"all"} [daysBack]  pass "all" to disable the lower bound
 * @param {number} [daysAhead]
 */
export function getDateWindowBounds(now = new Date(), daysBack = 30, daysAhead = 15) {
  const windowStart = daysBack === "all" ? new Date(0) : (() => {
    const d = new Date(now);
    d.setDate(d.getDate() - (daysBack - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + daysAhead);
  windowEnd.setHours(23, 59, 59, 999);
  return { windowStart, windowEnd };
}

/**
 * Compare on YYYY-MM-DD calendar dates in the dashboard's local TZ instead of
 * raw Date objects. Lead.dateAdded is already a local YYYY-MM-DD string set by
 * the GHL adapter; convert windowStart/End the same way to avoid UTC drift.
 */
function toLocalYMD(d) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

export function filterLeadsInWindow(leads, windowStart, windowEnd) {
  const startStr = windowStart.getTime() === 0 ? "0000-00-00" : toLocalYMD(windowStart);
  const endStr = toLocalYMD(windowEnd);
  return leads.filter(l => {
    const ld = (l.dateAdded || "").slice(0, 10);
    if (!ld) return false;
    return ld >= startStr && ld <= endStr;
  });
}

export function countsByStage(windowLeads, allSid = ALL_SID) {
  const counts = {};
  allSid.forEach(id => {
    counts[id] = windowLeads.filter(l => l.stageId === id).length;
  });
  return counts;
}

/** Core funnel / KPI math used by the dashboard (pure, testable). */
export function computeDashboardMetrics(windowLeads, counts) {
  const total = windowLeads.length;

  // DQ here implies a disqualification call took place, so it counts as both
  // booked and attended even though it's a side-stage in the GHL pipeline.
  const beyondNew      = [SID.BOOKED, SID.ATTENDED, SID.TRIAL, SID.PAID, SID.WON, SID.CANCEL, SID.NOSHOW, SID.LOST, SID.DQ];
  const beyondBooked   = [SID.ATTENDED, SID.TRIAL, SID.PAID, SID.WON, SID.LOST, SID.DQ];
  const beyondAttended = [SID.TRIAL, SID.PAID, SID.WON];

  const funnelNew      = total;
  const funnelBooked   = windowLeads.filter(l => l.hadPastAppt || beyondNew.includes(l.stageId)).length;
  const leadsAttended  = windowLeads.filter(l => l.everShowed || beyondBooked.includes(l.stageId)).length;
  const funnelAttended = leadsAttended;
  const funnelTrial    = windowLeads.filter(l => beyondAttended.includes(l.stageId)).length;
  const funnelWon      = windowLeads.filter(l => [SID.PAID, SID.WON].includes(l.stageId)).length;

  const won        = counts[SID.WON] || 0;
  const closedPaid = counts[SID.PAID] || 0;
  const trials     = counts[SID.TRIAL] || 0;
  const mrr        = windowLeads.filter(l => [SID.WON, SID.PAID].includes(l.stageId)).reduce((s,l) => s + (l.value||0), 0);

  const leadsWithAppt = windowLeads.filter(l => l.apptDate).length;

  const showUpRate = funnelBooked > 0 ? Math.round((leadsAttended / funnelBooked) * 100) : 0;

  const stageNoShow      = counts[SID.NOSHOW] || 0;
  const stageCancelled   = counts[SID.CANCEL] || 0;
  const stageDQ          = counts[SID.DQ] || 0;
  const stageLost        = counts[SID.LOST] || 0;
  const stageRescheduled = 0;

  const totalNoShow      = stageNoShow    + windowLeads.filter(l => l.latestPastApptStatus === "no_show"     && l.stageId !== SID.NOSHOW).length;
  const totalCancelled   = stageCancelled + windowLeads.filter(l => l.latestPastApptStatus === "cancelled"   && l.stageId !== SID.CANCEL).length;
  const totalRescheduled = windowLeads.filter(l => l.latestPastApptStatus === "rescheduled").length;

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;
  const apptPct = (n) => leadsWithAppt > 0 ? Math.round((n / leadsWithAppt) * 100) : 0;

  const apptRate    = pct(leadsWithAppt);
  const closeRate   = pct(won + closedPaid);
  const noShowRate  = apptPct(totalNoShow);
  const cancelRate  = apptPct(totalCancelled);
  const reschedRate = apptPct(totalRescheduled);
  const dqRate      = pct(stageDQ);

  return {
    total,
    funnelNew,
    funnelBooked,
    funnelAttended,
    leadsAttended,
    funnelTrial,
    funnelWon,
    won,
    closedPaid,
    trials,
    mrr,
    leadsWithAppt,
    showUpRate,
    stageNoShow,
    stageCancelled,
    stageRescheduled,
    stageDQ,
    stageLost,
    totalNoShow,
    totalCancelled,
    totalRescheduled,
    apptRate,
    closeRate,
    noShowRate,
    cancelRate,
    reschedRate,
    dqRate,
  };
}
