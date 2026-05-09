import { describe, it, expect } from "vitest";
import {
  getDateWindowBounds,
  filterLeadsInWindow,
  countsByStage,
  computeDashboardMetrics,
} from "./metrics.js";
import { ALL_SID, SID } from "../constants/stages.js";

describe("getDateWindowBounds", () => {
  it("returns start before end for positive offsets", () => {
    const anchor = new Date("2026-04-08T12:00:00Z");
    const { windowStart, windowEnd } = getDateWindowBounds(anchor, 30, 15);
    expect(windowStart.getTime()).toBeLessThan(windowEnd.getTime());
  });
});

describe("filterLeadsInWindow", () => {
  it("keeps leads whose dateAdded falls inside the window", () => {
    const ws = new Date("2026-03-01");
    const we = new Date("2026-04-30");
    const leads = [
      { dateAdded: "2026-02-01" },
      { dateAdded: "2026-03-15" },
      { dateAdded: "2026-05-01" },
    ];
    const out = filterLeadsInWindow(leads, ws, we);
    expect(out).toHaveLength(1);
    expect(out[0].dateAdded).toBe("2026-03-15");
  });
});

describe("countsByStage", () => {
  it("counts per stage id", () => {
    const leads = [
      { stageId: SID.NEW },
      { stageId: SID.NEW },
      { stageId: SID.WON },
    ];
    const c = countsByStage(leads, ALL_SID);
    expect(c[SID.NEW]).toBe(2);
    expect(c[SID.WON]).toBe(1);
    expect(c[SID.TRIAL]).toBe(0);
  });
});

describe("computeDashboardMetrics", () => {
  it("computes totals and rates for a minimal set", () => {
    const windowLeads = [
      { stageId: SID.NEW, dateAdded: "2026-04-01", value: 0 },
      { stageId: SID.WON, dateAdded: "2026-04-02", value: 1500, apptDate: "2026-04-01", hadPastAppt: true, everShowed: true },
    ];
    const counts = countsByStage(windowLeads, ALL_SID);
    const m = computeDashboardMetrics(windowLeads, counts);
    expect(m.total).toBe(2);
    expect(m.won).toBe(1);
    expect(m.mrr).toBe(1500);
    expect(m.leadsWithAppt).toBe(1);
  });

  describe("show rate", () => {
    it("excludes leads whose only appointment is in the future when stage hasn't advanced", () => {
      const windowLeads = [
        { stageId: SID.NEW,     dateAdded: "2026-04-10", apptDate: "2026-04-20", hadPastAppt: false, everShowed: false },
        { stageId: SID.BOOKED,  dateAdded: "2026-04-10", apptDate: "2026-04-05", hadPastAppt: true,  everShowed: true  },
      ];
      const counts = countsByStage(windowLeads, ALL_SID);
      const m = computeDashboardMetrics(windowLeads, counts);
      expect(m.funnelBooked).toBe(1);
      expect(m.leadsAttended).toBe(1);
      expect(m.showUpRate).toBe(100);
    });

    it("counts a lead who cancelled and then showed at a later appt as a show", () => {
      const windowLeads = [
        {
          stageId: SID.ATTENDED,
          dateAdded: "2026-04-01",
          hadPastAppt: true,
          everShowed: true,
          latestPastApptStatus: "showed",
        },
      ];
      const counts = countsByStage(windowLeads, ALL_SID);
      const m = computeDashboardMetrics(windowLeads, counts);
      expect(m.funnelBooked).toBe(1);
      expect(m.leadsAttended).toBe(1);
      expect(m.totalCancelled).toBe(0);
    });

    it("keeps the show signal when a past-showed lead books a future follow-up", () => {
      const windowLeads = [
        {
          stageId: SID.ATTENDED,
          dateAdded: "2026-04-01",
          hadPastAppt: true,
          everShowed: true,
          latestPastApptStatus: "showed",
          apptDate: "2026-04-25",
          apptStatus: "confirmed",
        },
      ];
      const counts = countsByStage(windowLeads, ALL_SID);
      const m = computeDashboardMetrics(windowLeads, counts);
      expect(m.leadsAttended).toBe(1);
      expect(m.showUpRate).toBe(100);
    });

    it("counts a past-cancel-only lead in the denominator, not the numerator", () => {
      const windowLeads = [
        {
          stageId: SID.CANCEL,
          dateAdded: "2026-04-01",
          hadPastAppt: true,
          everShowed: false,
          latestPastApptStatus: "cancelled",
        },
      ];
      const counts = countsByStage(windowLeads, ALL_SID);
      const m = computeDashboardMetrics(windowLeads, counts);
      expect(m.funnelBooked).toBe(1);
      expect(m.leadsAttended).toBe(0);
      expect(m.showUpRate).toBe(0);
    });

    it("counts a Closed Won lead with no appt data as a show via stage fallback", () => {
      const windowLeads = [
        { stageId: SID.WON, dateAdded: "2026-04-01", value: 1500 },
      ];
      const counts = countsByStage(windowLeads, ALL_SID);
      const m = computeDashboardMetrics(windowLeads, counts);
      expect(m.funnelBooked).toBe(1);
      expect(m.leadsAttended).toBe(1);
      expect(m.showUpRate).toBe(100);
    });
  });
});
