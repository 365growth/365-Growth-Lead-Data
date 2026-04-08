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
      { stageId: SID.WON, dateAdded: "2026-04-02", value: 1500, apptDate: "2026-04-01" },
    ];
    const counts = countsByStage(windowLeads, ALL_SID);
    const m = computeDashboardMetrics(windowLeads, counts);
    expect(m.total).toBe(2);
    expect(m.won).toBe(1);
    expect(m.mrr).toBe(1500);
    expect(m.leadsWithAppt).toBe(1);
  });
});
