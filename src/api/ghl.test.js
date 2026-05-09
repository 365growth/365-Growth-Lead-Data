import { describe, it, expect } from "vitest";
import { matchStageByAlias } from "./ghl.js";
import { SID } from "../constants/stages.js";

describe("matchStageByAlias — covers the 365Growth Sales Pipeline naming", () => {
  it("maps 'New Lead' → NEW", () => {
    expect(matchStageByAlias("New Lead")).toBe(SID.NEW);
  });
  it("maps 'Onboarding Call Set' → BOOKED", () => {
    expect(matchStageByAlias("Onboarding Call Set")).toBe(SID.BOOKED);
  });
  it("maps 'Onboarding Call Attended' → ATTENDED", () => {
    expect(matchStageByAlias("Onboarding Call Attended")).toBe(SID.ATTENDED);
  });
  it("maps 'Onboarding Call Cancelled' → CANCEL", () => {
    expect(matchStageByAlias("Onboarding Call Cancelled")).toBe(SID.CANCEL);
  });
  it("maps 'Onboarding Call No Show' → NOSHOW", () => {
    expect(matchStageByAlias("Onboarding Call No Show")).toBe(SID.NOSHOW);
  });
  it("maps 'Disqualified' → DQ", () => {
    expect(matchStageByAlias("Disqualified")).toBe(SID.DQ);
  });
  it("maps 'Free Trial Started' → TRIAL", () => {
    expect(matchStageByAlias("Free Trial Started")).toBe(SID.TRIAL);
  });
  it("maps 'Closed Won' → WON", () => {
    expect(matchStageByAlias("Closed Won")).toBe(SID.WON);
  });
  it("maps 'Closed Lost' → LOST", () => {
    expect(matchStageByAlias("Closed Lost")).toBe(SID.LOST);
  });
  it("returns null for unknown stage", () => {
    expect(matchStageByAlias("Random Other Stage")).toBe(null);
  });
});
