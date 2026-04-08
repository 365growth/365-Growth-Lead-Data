export const STAGE = {
  "a83aba03-5543-466c-8d0e-55374489800e": { name: "New Lead", color: "#3b82f6", dot: "●", cat: "funnel", order: 0 },
  "c63d162e-3cfe-4c3b-9325-b509852e2610": { name: "Appt. Booked", color: "#818cf8", dot: "●", cat: "funnel", order: 1 },
  "6ed45350-b188-470a-a53e-651a4716ca32": { name: "Appt. Attended", color: "#06b6d4", dot: "●", cat: "funnel", order: 2 },
  "b3b07c71-be88-4fd5-804b-930b7efe83ac": { name: "Cancelled", color: "#f97316", dot: "●", cat: "side" },
  "1e1c7893-e529-45eb-a9dc-13427b6d4b92": { name: "No Show", color: "#ef4444", dot: "●", cat: "side" },
  "d6535484-6b2b-4d51-8f4e-4892b936b78a": { name: "Disqualified", color: "#6b7280", dot: "●", cat: "side" },
  "e4cff952-ece4-4415-9dc6-66ad7366958c": { name: "Trial Started", color: "#f59e0b", dot: "●", cat: "funnel", order: 3 },
  "f7a2c1d0-paid-4a1b-b2c3-closedpaid001": { name: "Closed Paid", color: "#10b981", dot: "●", cat: "funnel", order: 4 },
  "492cae24-83d0-47cd-930e-7da0e9af3764": { name: "Closed Won", color: "#22c55e", dot: "●", cat: "funnel", order: 5 },
  "1122f2d1-45da-493c-ad18-cf7490d5864f": { name: "Closed Lost", color: "#ef4444", dot: "●", cat: "side" },
  "e5b3a2f1-resc-4c2d-a1b0-rescheduled01": { name: "Rescheduled", color: "#f59e0b", dot: "●", cat: "side" },
};

export const FUNNEL = [
  "a83aba03-5543-466c-8d0e-55374489800e",
  "c63d162e-3cfe-4c3b-9325-b509852e2610",
  "6ed45350-b188-470a-a53e-651a4716ca32",
  "e4cff952-ece4-4415-9dc6-66ad7366958c",
  "f7a2c1d0-paid-4a1b-b2c3-closedpaid001",
  "492cae24-83d0-47cd-930e-7da0e9af3764",
];
export const SIDES = [
  "b3b07c71-be88-4fd5-804b-930b7efe83ac",
  "1e1c7893-e529-45eb-a9dc-13427b6d4b92",
  "e5b3a2f1-resc-4c2d-a1b0-rescheduled01",
  "d6535484-6b2b-4d51-8f4e-4892b936b78a",
  "1122f2d1-45da-493c-ad18-cf7490d5864f",
];
export const ALL_SID = [...FUNNEL, ...SIDES];

export const SAMPLE = [
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

export const BLANK = { name:"", company:"", market:"", phone:"", email:"", stageId:"a83aba03-5543-466c-8d0e-55374489800e", jobsPerMonth:"", avgJobValue:"", crewSize:"", yearsInBiz:"", website:"", source:"Facebook Ad", value:1500, notes:"", businessDescription:"", marketingBudget:"", marketingChannels:"", comfortableWith2500:"", hasCRM:"", isOwner:"", readyToInvest:"", isDecisionMaker:"", salesStructure:"", googleReviews:"", serviceRadius:"", insuranceClaims:"", financing:"", dqReason:"" };
export const SOURCES = ["Facebook Ad","Instagram Ad","Referral","Cold Outreach","Inbound","Other"];

export const GHL_STAGE_MAP = {
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

export const STAGE_NAME_MAP = {};
Object.entries(STAGE).forEach(([id, s]) => {
  STAGE_NAME_MAP[s.name.toLowerCase().replace(/[^a-z]/g, "")] = id;
});

export const APPT_STATUS = {
  confirmed:   { label: "Confirmed",   color: "#818cf8", bg: "#818cf820" },
  showed:      { label: "Showed",      color: "#22c55e", bg: "#22c55e20" },
  no_show:     { label: "No Show",     color: "#ef4444", bg: "#ef444420" },
  cancelled:   { label: "Cancelled",   color: "#f97316", bg: "#f9731620" },
  rescheduled: { label: "Rescheduled", color: "#f59e0b", bg: "#f59e0b20" },
};

/** Stage IDs used in funnel math (exported for tests). */
export const SID = {
  NEW:      "a83aba03-5543-466c-8d0e-55374489800e",
  BOOKED:   "c63d162e-3cfe-4c3b-9325-b509852e2610",
  ATTENDED: "6ed45350-b188-470a-a53e-651a4716ca32",
  TRIAL:    "e4cff952-ece4-4415-9dc6-66ad7366958c",
  PAID:     "f7a2c1d0-paid-4a1b-b2c3-closedpaid001",
  WON:      "492cae24-83d0-47cd-930e-7da0e9af3764",
  CANCEL:   "b3b07c71-be88-4fd5-804b-930b7efe83ac",
  NOSHOW:   "1e1c7893-e529-45eb-a9dc-13427b6d4b92",
  RESCHED:  "e5b3a2f1-resc-4c2d-a1b0-rescheduled01",
  DQ:       "d6535484-6b2b-4d51-8f4e-4892b936b78a",
  LOST:     "1122f2d1-45da-493c-ad18-cf7490d5864f",
};
