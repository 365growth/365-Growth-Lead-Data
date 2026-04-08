import { ALL_SID, SID } from "../constants/stages.js";

/** @param {Date} [now] */
export function getDateWindowBounds(now = new Date(), daysBack = 30, daysAhead = 15) {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - daysBack);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(now);
  windowEnd.setDate(windowEnd.getDate() + daysAhead);
  windowEnd.setHours(23, 59, 59, 999);
  return { windowStart, windowEnd };
}

export function filterLeadsInWindow(leads, windowStart, windowEnd) {
  return leads.filter(l => {
    const d = new Date(l.dateAdded || 0);
    return d >= windowStart && d <= windowEnd;
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

  const beyondNew      = [SID.BOOKED, SID.ATTENDED, SID.TRIAL, SID.PAID, SID.WON, SID.CANCEL, SID.NOSHOW, SID.RESCHED, SID.DQ, SID.LOST];
  const beyondBooked   = [SID.ATTENDED, SID.TRIAL, SID.PAID, SID.WON, SID.LOST];
  const beyondAttended = [SID.TRIAL, SID.PAID, SID.WON];

  const funnelNew      = total;
  const funnelBooked   = windowLeads.filter(l => l.apptDate || beyondNew.includes(l.stageId)).length;
  const leadsAttended  = windowLeads.filter(l => beyondBooked.includes(l.stageId) || l.apptStatus === "showed").length;
  const funnelAttended = leadsAttended;
  const funnelTrial    = windowLeads.filter(l => beyondAttended.includes(l.stageId)).length;
  const funnelWon      = windowLeads.filter(l => [SID.PAID, SID.WON].includes(l.stageId)).length;

  const won        = counts[SID.WON] || 0;
  const closedPaid = counts[SID.PAID] || 0;
  const trials     = counts[SID.TRIAL] || 0;
  const mrr        = windowLeads.filter(l => [SID.WON, SID.PAID].includes(l.stageId)).reduce((s,l) => s + (l.value||0), 0);

  const leadsWithAppt = windowLeads.filter(l => l.apptDate).length;

  const funnelBookedForRate = funnelBooked;
  const showUpRate = funnelBookedForRate > 0 ? Math.round((leadsAttended / funnelBookedForRate) * 100) : 0;

  const stageNoShow      = counts[SID.NOSHOW] || 0;
  const stageCancelled   = counts[SID.CANCEL] || 0;
  const stageRescheduled = counts[SID.RESCHED] || 0;
  const stageDQ          = counts[SID.DQ] || 0;
  const stageLost        = counts[SID.LOST] || 0;

  const totalNoShow      = stageNoShow      + windowLeads.filter(l => l.apptStatus === "no_show"     && l.stageId !== SID.NOSHOW).length;
  const totalCancelled   = stageCancelled   + windowLeads.filter(l => l.apptStatus === "cancelled"   && l.stageId !== SID.CANCEL).length;
  const totalRescheduled = stageRescheduled + windowLeads.filter(l => l.apptStatus === "rescheduled" && l.stageId !== SID.RESCHED).length;

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
