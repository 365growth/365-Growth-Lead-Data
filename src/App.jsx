import { useState, useEffect, Fragment, useMemo } from "react";
import { GHL_CAL, FB_AD_ACCT } from "./config.js";
import {
  STAGE, ALL_SID, SAMPLE, BLANK, SOURCES, APPT_STATUS, SID, SIDES,
} from "./constants/stages.js";
import { PIPE_KEY, CRED_KEY, storageGet, storageSet, storageRemove } from "./lib/storage.js";
import {
  filterLeadsInWindow,
  getDateWindowBounds,
  countsByStage,
  computeDashboardMetrics,
} from "./lib/metrics.js";
import { fetchFBAdSpend } from "./api/facebook.js";
import {
  fetchGHLLeads,
  fetchGHLAppointments,
  enrichLeadsWithAppointments,
  debugGHLRaw,
} from "./api/ghl.js";

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
  const [daysBack, setDaysBack]   = useState(30);
  const [daysAhead, setDaysAhead] = useState(15);
  const [syncBanner, setSyncBanner] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("365g-auth-expires");
    if (saved && Date.now() < Number(saved)) setAuthed(true);
    else localStorage.removeItem("365g-auth-expires");
  }, []);

  useEffect(() => { if (authed) load(); }, [authed]); // eslint-disable-line react-hooks/exhaustive-deps -- load once on auth

  useEffect(() => {
    if (ready && authed) save();
  }, [leads, ready, authed, apiKey, fbToken, lastSync, adSpend, daysBack, daysAhead]); // eslint-disable-line react-hooks/exhaustive-deps -- persist pipeline + creds

  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => {
      console.log("Auto-sync triggered (3h interval)");
      autoSync(apiKey, fbToken);
    }, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [apiKey, fbToken]); // eslint-disable-line react-hooks/exhaustive-deps -- stable interval on key change

  async function load() {
    try {
      let raw = await storageGet(PIPE_KEY);
      let credRaw = await storageGet(CRED_KEY);

      if (raw) {
        const d = JSON.parse(raw);
        /* Legacy: API keys lived inside PIPE_KEY — migrate once so lead saves never wipe them */
        if ((d.apiKey || d.fbToken) && !credRaw) {
          const { apiKey: ak, fbToken: ft, ...rest } = d;
          await storageSet(CRED_KEY, JSON.stringify({ apiKey: ak || "", fbToken: ft || "" }));
          await storageSet(PIPE_KEY, JSON.stringify(rest));
          credRaw = await storageGet(CRED_KEY);
          raw = await storageGet(PIPE_KEY);
        }
      }

      if (raw) {
        const d = JSON.parse(raw);
        if (d.leads?.length) setLeads(d.leads);
        if (d.lastSync)      setLastSync(d.lastSync);
        if (d.adSpend)       setAdSpend(d.adSpend);
        if (typeof d.daysBack === "number")  setDaysBack(d.daysBack);
        if (typeof d.daysAhead === "number") setDaysAhead(d.daysAhead);
      }

      if (credRaw) {
        const c = JSON.parse(credRaw);
        if (c.apiKey)  setApiKey(c.apiKey);
        if (c.fbToken) setFbToken(c.fbToken);
        if (c.apiKey)  autoSync(c.apiKey, c.fbToken);
      }
    } catch (e) {
      console.warn("Load failed:", e.message);
      setSyncBanner({ err: true, msg: "Could not load saved data. Starting with sample leads." });
    }
    setReady(true);
  }

  async function save() {
    if (!ready || !authed) return;
    try {
      await storageSet(
        PIPE_KEY,
        JSON.stringify({ leads, lastSync, adSpend, daysBack, daysAhead }),
      );
      if (apiKey.trim() || fbToken.trim()) {
        await storageSet(CRED_KEY, JSON.stringify({ apiKey, fbToken }));
      } else {
        await storageRemove(CRED_KEY);
      }
    } catch { /* ignore */ }
  }

  async function autoSync(key, fbTok) {
    if (!key) return;
    try {
      setSyncing(true);
      setSyncBanner(null);
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
      setSyncBanner(null);
      const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(); windowEnd.setDate(windowEnd.getDate() + 15);
      const [fetched, events, fbData] = await Promise.all([
        fetchGHLLeads(apiKey.trim()),
        fetchGHLAppointments(apiKey.trim()).catch((e) => { console.warn("Calendar fetch failed:", e.message); return []; }),
        fbToken ? fetchFBAdSpend(fbToken, windowStart, windowEnd) : Promise.resolve(null),
      ]);
      if (!fetched.length) {
        setSyncBanner({ err: true, msg: "No opportunities returned for this pipeline. Check pipeline ID in .env or GHL." });
        flash("No opportunities found in this pipeline", true);
        return;
      }
      const enriched = enrichLeadsWithAppointments(fetched, events);
      setLeads(enriched);
      const now = new Date().toISOString();
      setLastSync(now);
      if (fbData) setAdSpend(fbData);
      setShowSync(false);
      const fbMsg = fbData ? ` · $${fbData.spend.toFixed(0)} ad spend` : "";
      flash(`Synced ${enriched.length} leads + ${events.length} appointments${fbMsg}`);
    } catch (err) {
      setSyncBanner({ err: true, msg: err.message || "Sync failed" });
      flash(`Sync failed: ${err.message}`, true);
    } finally {
      setSyncing(false);
    }
  }

  async function debugGHL() {
    if (!apiKey.trim()) { flash("Enter API key first", true); return; }
    try {
      flash("Fetching raw data — check browser console (Cmd+Option+I)...");
      await debugGHLRaw(apiKey.trim());
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

  const now = new Date();
  const { windowStart, windowEnd } = useMemo(
    () => getDateWindowBounds(new Date(), daysBack, daysAhead),
    [daysBack, daysAhead],
  );

  const windowLeads = useMemo(
    () => filterLeadsInWindow(leads, windowStart, windowEnd),
    [leads, windowStart, windowEnd],
  );

  const counts = useMemo(() => countsByStage(windowLeads), [windowLeads]);

  const m = useMemo(() => computeDashboardMetrics(windowLeads, counts), [windowLeads, counts]);

  const {
    total, funnelNew, funnelBooked, leadsAttended, funnelTrial, funnelWon,
    won, closedPaid, trials, mrr, leadsWithAppt, showUpRate,
    totalNoShow, totalCancelled, totalRescheduled, stageDQ,
    apptRate, closeRate, noShowRate, cancelRate, reschedRate, dqRate,
  } = m;

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

  const upcoming = windowLeads
    .filter(l => l.apptDate && new Date(l.apptDate) >= now && new Date(l.apptDate) <= windowEnd && l.apptStatus !== "cancelled")
    .sort((a, b) => new Date(a.apptDate) - new Date(b.apptDate))
    .slice(0, 5);

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
      const ts = new Date().toISOString();
      setLastSync(ts);
      setShowSync(false);
      setImportTxt("");
      flash(`Imported ${d.length} leads`);
    } catch { flash("Invalid JSON format", true); }
  }

  async function disconnectGHL() {
    setApiKey("");
    setFbToken("");
    setAdSpend(null);
    try {
      await storageRemove(CRED_KEY);
    } catch { /* ignore */ }
    flash("API credentials removed");
  }

  function exportCsv() {
    const headers = ["company","name","market","stage","phone","email","dateAdded","source","value"];
    const rows = filtered.map(l => {
      const stage = STAGE[l.stageId]?.name || l.stageId;
      return [l.company, l.name, l.market, stage, l.phone, l.email, l.dateAdded, l.source, l.value]
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `365g-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash(`Exported ${filtered.length} rows`);
  }

  async function handleLogin() {
    const stored = localStorage.getItem("365g-pw-hash");
    const hash = await hashPassword(pw);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (!stored) {
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

  const BG   = "#060d1a";
  const SRF  = "#0c1a2e";
  const BRD  = "#1a2f4a";
  const TXT  = "#e2e8f0";
  const MUT  = "#64748b";
  const BLUE = "#3b82f6";
  const GRN  = "#22c55e";

  const inp  = { padding:"8px 10px", background:"#0a1628", border:`1px solid ${BRD}`, borderRadius:6, color:TXT, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
  const btn  = (bg,col,brd) => ({ padding:"7px 14px", background:bg||"transparent", color:col||TXT, border:`1px solid ${brd||"transparent"}`, borderRadius:6, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" });

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

      {syncBanner && (
        <div style={{ padding:"10px 20px", background: syncBanner.err ? "#450a0a" : "#0c2e1a", borderBottom:`1px solid ${BRD}`, fontSize:13, color: syncBanner.err ? "#fecaca" : "#86efac" }}>
          {syncBanner.msg}
          <button type="button" onClick={() => setSyncBanner(null)} style={{ marginLeft:12, background:"transparent", border:"none", color:"inherit", cursor:"pointer", textDecoration:"underline" }}>Dismiss</button>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 20px", height:52, borderBottom:`1px solid ${BRD}`, background:"#080e1c", position:"sticky", top:0, zIndex:100, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
          <div style={{ fontWeight:800, fontSize:15, letterSpacing:1.2, color:BLUE }}>
            365<span style={{ color:"#fff" }}>GROWTH</span>
          </div>
          <div style={{ width:1, height:20, background:BRD }}/>
          <div style={{ fontSize:13, color:MUT }}>Roofing Lead Pipeline</div>
          <div style={{ fontSize:10, color:"#2a3f5a" }}>{windowStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} &ndash; {windowEnd.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
          {lastSync && <div style={{ fontSize:11, color:"#2a3f5a" }}>synced {new Date(lastSync).toLocaleDateString()}</div>}
          <button className="hov" onClick={handleLogout} style={{ background:"none", border:`1px solid #a78bfa40`, borderRadius:6, color:"#a78bfa", fontSize:11, padding:"4px 10px", cursor:"pointer", fontFamily:"inherit", fontWeight:600 }}>Lock</button>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <label style={{ fontSize:11, color:MUT, display:"flex", alignItems:"center", gap:6 }}>
            −{""}
            <input type="number" min={7} max={120} value={daysBack} onChange={e => setDaysBack(Number(e.target.value)||30)} style={{ ...inp, width:52, padding:"4px 6px" }} />
            d / +
            <input type="number" min={0} max={90} value={daysAhead} onChange={e => setDaysAhead(Number(e.target.value)||15)} style={{ ...inp, width:52, padding:"4px 6px" }} />
            d
          </label>
          {syncing && <div style={{ fontSize:11, color:"#f59e0b", marginRight:4 }}>Syncing...</div>}
          {apiKey && <button className="hov" style={btn("#14532d","#22c55e","#22c55e40")} onClick={doSync} disabled={syncing}>Refresh</button>}
          <button className="hov" style={btn("#1a2f4a","#60a5fa","#3b82f640")} onClick={() => setShowSync(true)}>{apiKey ? "GHL Settings" : "Connect GHL"}</button>
          <button className="hov" style={btn(BLUE,"#fff")} onClick={openAdd}>+ Add Lead</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:1, background:BRD }}>
        {[
          { label:"Leads (window)",  val: total,                      color: BLUE     },
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

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:1, background:BRD }}>
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

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))", gap:1, background:BRD, borderBottom:`1px solid ${BRD}` }}>
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

      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${BRD}` }}>
        <div style={{ fontSize:10, color:MUT, letterSpacing:2, fontWeight:700, marginBottom:12 }}>CONVERSION FUNNEL</div>
        <div style={{ display:"flex", alignItems:"stretch", overflowX:"auto", gap:0 }}>
          {[
            { name:"New Lead",       count: funnelNew,      color:"#3b82f6", sid: SID.NEW },
            { name:"Appt. Booked",   count: funnelBooked,   color:"#818cf8", sid: SID.BOOKED },
            { name:"Showed Up",      count: leadsAttended,  color:"#06b6d4", sid: SID.ATTENDED },
            { name:"Trial Started",  count: funnelTrial,    color:"#f59e0b", sid: SID.TRIAL },
            { name:"Closed Won",     count: funnelWon,      color:"#22c55e", sid: SID.WON },
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
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            <button type="button" className="hov" onClick={exportCsv} style={{ ...btn("#1a2f4a", "#94a3b8", BRD), fontSize:12 }} disabled={!filtered.length}>Export CSV</button>
            <input style={{ ...inp, width:240, padding:"7px 12px" }} placeholder="Search company, owner, market..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        <div style={{ background:SRF, border:`1px solid ${BRD}`, borderRadius:8, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:640 }}>
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
                        {s ? (
                          <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:s.color+"18", color:s.color, border:`1px solid ${s.color}28` }}>
                            <span style={{ fontSize:7 }}>&#9679;</span>{s.name}
                          </span>
                        ) : (
                          <span style={{ color:MUT }}>—</span>
                        )}
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
                  <tr><td colSpan={8} style={{ padding:48, textAlign:"center", color:MUT }}>
                    {windowLeads.length === 0 ? "No leads in this date window. Widen the window above or sync from GHL." : "No leads match this filter"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {sel && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:150, background:"rgba(0,0,0,0.45)" }} onClick={() => setSel(null)} />
          <div style={{ position:"fixed", right:0, top:0, bottom:0, width:"min(420px, 100vw)", background:"#080e1c", borderLeft:`1px solid ${BRD}`, overflowY:"auto", zIndex:200, padding:20, animation:"slideR .2s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${BRD}` }}>
              <div>
                <div style={{ fontSize:17, fontWeight:700 }}>{sel.company}</div>
                <div style={{ fontSize:13, color:MUT, marginTop:2 }}>{sel.name}</div>
                {STAGE[sel.stageId] && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:4, fontSize:11, fontWeight:600, background:STAGE[sel.stageId].color+"20", color:STAGE[sel.stageId].color, border:`1px solid ${STAGE[sel.stageId].color}35`, marginTop:8 }}>
                    <span style={{ fontSize:7 }}>&#9679;</span>{STAGE[sel.stageId].name}
                  </span>
                )}
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button className="hov" style={btn(BLUE,"#fff")} onClick={e => openEdit(sel,e)}>Edit</button>
                <button style={{ background:"none", border:"none", color:MUT, cursor:"pointer", fontSize:18, padding:"4px 6px" }} onClick={() => setSel(null)}>&#10005;</button>
              </div>
            </div>

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

            <PanelSection title="CONTACT" border={BRD}>
              <Grid2>
                <Fld label="Phone"   val={sel.phone}   />
                <Fld label="Market"  val={sel.market}  />
                <Fld label="Email"   val={sel.email}   span />
                <Fld label="Website" val={sel.website} span />
              </Grid2>
            </PanelSection>

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
                autoComplete="off"
              />
              {apiKey ? (
                <div style={{ fontSize:11, color:"#22c55e", marginTop:6 }}>Saved on this device after sync. Use Disconnect to remove.</div>
              ) : null}
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

            <div style={{ marginBottom:16, paddingTop:14, borderTop:`1px solid ${BRD}` }}>
              <div style={{ fontSize:11, color:MUT, marginBottom:6, letterSpacing:.5 }}>Facebook Ads Access Token</div>
              <input
                style={{ ...inp, fontFamily:"'DM Mono',monospace", fontSize:11 }}
                type="password"
                placeholder="EAAxxxxxxx..."
                value={fbToken}
                onChange={e => setFbToken(e.target.value)}
                autoComplete="off"
              />
              {fbToken ? (
                <div style={{ fontSize:11, color:"#22c55e", marginTop:6 }}>Saved on this device. Clear the field and save to remove.</div>
              ) : null}
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

            <button className="hov" style={{ ...btn(BLUE,"#fff"), width:"100%", marginBottom:16, opacity: syncing ? 0.45 : 1 }} onClick={doSync} disabled={syncing || !apiKey.trim()}>
              {syncing ? "Syncing..." : apiKey ? "Sync Now (Leads + Appointments + Ad Spend)" : "Enter API Key to Connect"}
            </button>

            {apiKey && (
              <button className="hov" style={{ ...btn("transparent","#ef4444","#ef444430"), width:"100%", fontSize:12, marginBottom:16 }} onClick={disconnectGHL}>
                Disconnect (remove GHL + Facebook tokens)
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

      {toast && (
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:999, padding:"10px 18px", borderRadius:8, background: toast.err ? "#7f1d1d" : "#14532d", border:`1px solid ${toast.err?"#ef444450":"#22c55e50"}`, color:TXT, fontSize:13, fontFamily:"inherit", boxShadow:"0 4px 24px rgba(0,0,0,.5)", animation:"toastIn .2s ease" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

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
