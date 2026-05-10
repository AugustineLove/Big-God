import { useState, useEffect, useCallback } from "react";
import { companyId } from "../../../constants/appConstants";

// ─── CONFIG ───────────────────────────────────────────────────
// Change this to your actual company ID and API base
const COMPANY_ID = companyId;
const API_BASE   = "https://susu-pro-backend.onrender.com/api/accounting";
const API        = `${API_BASE}/${COMPANY_ID}`;

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency", currency: "GHS", minimumFractionDigits: 2,
  }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }) : "—";

const abs = (n) => Math.abs(Number(n) || 0);

// ─── STYLES ──────────────────────────────────────────────────
const S = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=Lato:wght@300;400;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#080a0f;
  --bg2:#0e1117;
  --bg3:#141820;
  --bg4:#1a2030;
  --border:#1e2535;
  --border2:#252d40;
  --text:#dde3f0;
  --text2:#7a8aaa;
  --text3:#404860;
  --gold:#e8b84b;
  --gold2:#f5d280;
  --gold-dim:#3a2e10;
  --green:#34d98b;
  --green-dim:#0d2e1e;
  --red:#f06060;
  --red-dim:#2e0f0f;
  --blue:#5b9cf6;
  --blue-dim:#0d1e38;
  --purple:#a87ef8;
  --purple-dim:#1a0f38;
  --teal:#38e8d8;
  --teal-dim:#0a2828;
  --r:10px;
  --r2:16px;
}
body{background:var(--bg);color:var(--text);font-family:'Lato',sans-serif;min-height:100vh;}

/* topbar */
.topbar{
  padding:20px 28px 16px;
  border-bottom:1px solid var(--border);
  background:var(--bg2);
  display:flex;align-items:center;gap:16px;
  position:sticky;top:0;z-index:100;
}
.logo{
  font-family:'Syne',sans-serif;
  font-size:18px;font-weight:800;
  color:var(--gold);letter-spacing:-0.5px;
}
.topbar-title{font-size:13px;color:var(--text2);font-weight:300;}
.topbar-sep{flex:1;}
.company-badge{
  font-family:'IBM Plex Mono',monospace;
  font-size:10px;padding:4px 12px;border-radius:99px;
  background:var(--gold-dim);color:var(--gold);
  border:1px solid #4a3a18;letter-spacing:.3px;
}

/* layout */
.layout{display:grid;grid-template-columns:320px 1fr;min-height:calc(100vh - 61px);}
.sidebar{
  background:var(--bg2);
  border-right:1px solid var(--border);
  overflow-y:auto;
  max-height:calc(100vh - 61px);
  position:sticky;top:61px;
}
.main{padding:28px;overflow-y:auto;}

/* sidebar */
.sidebar-header{
  padding:16px 20px 12px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
}
.sidebar-title{
  font-family:'Syne',sans-serif;
  font-size:13px;font-weight:700;
  color:var(--text2);letter-spacing:.5px;
  text-transform:uppercase;
}
.refresh-btn{
  background:none;border:1px solid var(--border2);
  color:var(--text2);font-size:11px;
  padding:4px 10px;border-radius:6px;cursor:pointer;
  font-family:'Lato',sans-serif;
  transition:all .15s;
}
.refresh-btn:hover{border-color:var(--gold);color:var(--gold);}

.type-group{border-bottom:1px solid var(--border);}
.type-label{
  padding:10px 20px 8px;
  font-size:10px;font-weight:700;
  letter-spacing:1px;text-transform:uppercase;
  color:var(--text3);
  display:flex;align-items:center;justify-content:space-between;
}
.acct-row{
  display:flex;align-items:center;gap:0;
  padding:10px 20px;cursor:pointer;
  border-left:3px solid transparent;
  transition:all .15s;
  gap:10px;
}
.acct-row:hover{background:var(--bg3);}
.acct-row.active{
  background:var(--bg4);
  border-left-color:var(--gold);
}
.acct-row.sub{padding-left:32px;}
.acct-code{
  font-family:'IBM Plex Mono',monospace;
  font-size:10px;color:var(--text3);
  width:52px;flex-shrink:0;
}
.acct-row.active .acct-code{color:var(--gold);}
.acct-name{font-size:12.5px;flex:1;color:var(--text2);font-weight:400;}
.acct-row.active .acct-name{color:var(--text);font-weight:700;}
.acct-bal{
  font-family:'IBM Plex Mono',monospace;
  font-size:11.5px;font-weight:600;
  text-align:right;
}

/* main area */
.main-empty{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  height:60vh;gap:12px;
  color:var(--text3);
}
.main-empty-icon{font-size:40px;opacity:.3;}
.main-empty-text{font-size:14px;}

/* account detail header */
.acct-detail-header{margin-bottom:24px;}
.acct-detail-top{
  display:flex;align-items:flex-start;
  justify-content:space-between;gap:16px;
  margin-bottom:20px;flex-wrap:wrap;
}
.acct-detail-name{
  font-family:'Syne',sans-serif;
  font-size:26px;font-weight:800;
  line-height:1.1;
}
.acct-detail-meta{
  display:flex;gap:8px;align-items:center;
  margin-top:6px;flex-wrap:wrap;
}
.pill{
  font-size:10.5px;font-weight:700;
  padding:3px 10px;border-radius:99px;
  font-family:'IBM Plex Mono',monospace;
  letter-spacing:.3px;
}
.pill.asset    {background:var(--blue-dim);  color:var(--blue);  border:1px solid #1a3060;}
.pill.liability{background:var(--red-dim);   color:var(--red);   border:1px solid #3a1818;}
.pill.equity   {background:var(--purple-dim);color:var(--purple);border:1px solid #2a1860;}
.pill.income   {background:var(--green-dim); color:var(--green); border:1px solid #153820;}
.pill.expense  {background:var(--gold-dim);  color:var(--gold);  border:1px solid #3a2810;}
.pill.normal-dr{background:var(--blue-dim);  color:var(--blue);  border:1px solid #1a3060;}
.pill.normal-cr{background:var(--green-dim); color:var(--green); border:1px solid #153820;}

/* balance breakdown cards */
.bal-cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:14px;
  margin-bottom:28px;
}
.bal-card{
  background:var(--bg3);
  border:1px solid var(--border);
  border-radius:var(--r);
  padding:16px 18px;
}
.bal-card-label{
  font-size:10px;font-weight:700;
  letter-spacing:.8px;text-transform:uppercase;
  color:var(--text3);margin-bottom:8px;
}
.bal-card-value{
  font-family:'IBM Plex Mono',monospace;
  font-size:18px;font-weight:600;
}
.bal-card-sub{font-size:11px;color:var(--text3);margin-top:4px;}

/* formula row */
.formula-row{
  background:var(--bg4);
  border:1px solid var(--border2);
  border-radius:var(--r);
  padding:14px 18px;
  font-family:'IBM Plex Mono',monospace;
  font-size:12.5px;
  color:var(--text2);
  margin-bottom:24px;
  display:flex;align-items:center;gap:8px;
  flex-wrap:wrap;
}
.formula-val{color:var(--text);font-weight:600;}
.formula-op{color:var(--text3);}
.formula-result{color:var(--gold);font-weight:700;}

/* ledger table */
.ledger-wrap{overflow-x:auto;}
.ledger-table{width:100%;border-collapse:collapse;font-size:12.5px;}
.ledger-table th{
  padding:9px 14px;
  font-size:10px;font-weight:700;
  letter-spacing:.6px;text-transform:uppercase;
  color:var(--text3);
  border-bottom:1px solid var(--border);
  background:var(--bg3);
  white-space:nowrap;
  text-align:left;
}
.ledger-table th.right,.ledger-table td.right{text-align:right;}
.ledger-table td{
  padding:10px 14px;
  border-bottom:1px solid var(--border);
  vertical-align:middle;
}
.ledger-table tr:last-child td{border-bottom:none;}
.ledger-table tr:hover td{background:#ffffff03;}

.mono{font-family:'IBM Plex Mono',monospace;}
.muted{color:var(--text2);}
.ref{color:var(--gold);font-size:11px;}

.dc-badge{
  display:inline-flex;align-items:center;justify-content:center;
  width:42px;height:20px;border-radius:4px;
  font-family:'IBM Plex Mono',monospace;
  font-size:9.5px;font-weight:700;letter-spacing:.5px;
}
.dc-badge.dr{background:var(--blue-dim); color:var(--blue);}
.dc-badge.cr{background:var(--green-dim);color:var(--green);}

.running-pos{color:var(--green);}
.running-neg{color:var(--red);}
.running-zero{color:var(--text3);}

.source-chip{
  display:inline-block;
  font-family:'IBM Plex Mono',monospace;
  font-size:9.5px;padding:2px 7px;border-radius:4px;
  background:var(--bg4);color:var(--text2);
  border:1px solid var(--border2);
  white-space:nowrap;
}

/* what built this balance */
.builder-section{
  background:var(--bg3);
  border:1px solid var(--border);
  border-radius:var(--r2);
  overflow:hidden;
  margin-bottom:24px;
}
.builder-header{
  padding:14px 20px;
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
}
.builder-title{
  font-family:'Syne',sans-serif;
  font-size:15px;font-weight:700;
}
.builder-sub{font-size:12px;color:var(--text2);}

.contrib-row{
  display:grid;
  grid-template-columns:1fr 1fr 140px 140px;
  padding:11px 20px;
  border-bottom:1px solid var(--border);
  font-size:12.5px;align-items:center;gap:12px;
}
.contrib-row:last-child{border-bottom:none;}
.contrib-row:hover{background:var(--bg4);}
.contrib-row.header{
  background:var(--bg4);
  font-size:10px;font-weight:700;
  letter-spacing:.6px;text-transform:uppercase;
  color:var(--text3);
}
.contrib-source{display:flex;flex-direction:column;gap:3px;}

/* loading / error */
.spin{
  display:inline-block;width:16px;height:16px;
  border:2px solid var(--border2);
  border-top-color:var(--gold);
  border-radius:50%;
  animation:spin .6s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.loader{display:flex;align-items:center;gap:8px;color:var(--text2);font-size:13px;padding:40px;}
.err{color:var(--red);font-size:13px;padding:20px;}

/* filters */
.filters{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;}
.inp{
  background:var(--bg3);
  border:1px solid var(--border2);
  border-radius:var(--r);
  color:var(--text);
  font-family:'Lato',sans-serif;
  font-size:12.5px;
  padding:7px 12px;outline:none;
  transition:border-color .15s;
}
.inp:focus{border-color:var(--gold);}
.inp::placeholder{color:var(--text3);}
.inp.wide{flex:1;min-width:160px;}
select.inp{cursor:pointer;}

/* summary by source */
.source-summary{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
  gap:12px;
  margin-bottom:24px;
}
.source-card{
  background:var(--bg3);border:1px solid var(--border);
  border-radius:var(--r);padding:14px 16px;
  display:flex;flex-direction:column;gap:6px;
}
.source-card-label{font-size:11px;color:var(--text3);font-weight:700;letter-spacing:.5px;text-transform:uppercase;}
.source-card-net{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;}
.source-card-detail{font-size:11px;color:var(--text2);}

/* pagination */
.pager{
  display:flex;align-items:center;justify-content:space-between;
  padding:14px 0;font-size:12px;color:var(--text2);
}
.pager-btns{display:flex;gap:8px;}
.pager-btn{
  background:var(--bg3);border:1px solid var(--border2);
  color:var(--text2);font-size:12px;
  padding:6px 14px;border-radius:var(--r);cursor:pointer;
  font-family:'Lato',sans-serif;
  transition:all .15s;
}
.pager-btn:hover:not(:disabled){border-color:var(--gold);color:var(--gold);}
.pager-btn:disabled{opacity:.3;cursor:default;}
`;

// ─── ACCOUNT TYPE COLORS ─────────────────────────────────────
const typeColor = {
  asset:     "var(--blue)",
  liability: "var(--red)",
  equity:    "var(--purple)",
  income:    "var(--green)",
  expense:   "var(--gold)",
};

const TYPE_ORDER = ["asset","liability","equity","income","expense"];

// ─── API CALLS ───────────────────────────────────────────────
async function fetchCOA() {
  const r = await fetch(`${API}/accounts`);
  const j = await r.json();
  return j.data || [];
}

async function fetchLedger(coaId, page=1, limit=50, startDate="", endDate="") {
  const p = new URLSearchParams({ coa_id: coaId, page, limit });
  if (startDate) p.set("startDate", startDate);
  if (endDate)   p.set("endDate",   endDate);
  const r = await fetch(`${API}/ledger?${p}`);
  const j = await r.json();
  return j;
}

// ─── COMPONENTS ──────────────────────────────────────────────
function Loader() {
  return <div className="loader"><div className="spin"/> Loading…</div>;
}

// Summarise ledger lines by source
function buildSourceSummary(lines, normalBalance) {
  const map = {};
  for (const line of lines) {
    const key = line.source || "unknown";
    if (!map[key]) map[key] = { count:0, debit:0, credit:0 };
    map[key].count++;
    map[key].debit  += Number(line.debit_credit === "debit"  ? line.amount : 0);
    map[key].credit += Number(line.debit_credit === "credit" ? line.amount : 0);
  }
  return Object.entries(map).map(([source, v]) => ({
    source,
    ...v,
    net: normalBalance === "debit"
      ? v.debit - v.credit
      : v.credit - v.debit,
  })).sort((a,b) => Math.abs(b.net) - Math.abs(a.net));
}

// ─── LEDGER DETAIL ───────────────────────────────────────────
function LedgerDetail({ account }) {
  const [rows, setRows]     = useState([]);
  const [pagination, setPag]= useState(null);
  const [loading, setLoad]  = useState(true);
  const [err, setErr]       = useState(null);
  const [page, setPage]     = useState(1);
  const [startDate, setSD]  = useState("");
  const [endDate,   setED]  = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoad(true); setErr(null);
    try {
      const j = await fetchLedger(account.id, page, 100, startDate, endDate);
      setRows(j.data || []);
      setPag(j.pagination);
    } catch(e) {
      setErr(e.message);
    } finally {
      setLoad(false);
    }
  }, [account.id, page, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  // compute balance from rows
  const totalDr  = rows.reduce((s,r) => s + (r.debit_credit==="debit"  ? Number(r.amount) : 0), 0);
  const totalCr  = rows.reduce((s,r) => s + (r.debit_credit==="credit" ? Number(r.amount) : 0), 0);
  const nb       = account.normal_balance;
  const netBal   = nb === "debit" ? totalDr - totalCr : totalCr - totalDr;
  const openBal  = Number(account.opening_balance) || 0;
  const finalBal = openBal + netBal;

  const sourceSummary = buildSourceSummary(rows, nb);

  // filter rows by search
  const filtered = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.reference_no||"").toLowerCase().includes(q)
      || (r.entry_description||"").toLowerCase().includes(q)
      || (r.source||"").toLowerCase().includes(q)
      || (r.customer_name||"").toLowerCase().includes(q);
  });

  const color = typeColor[account.account_type] || "var(--text)";

  return (
    <div>
      {/* ── Header ── */}
      <div className="acct-detail-header">
        <div className="acct-detail-top">
          <div>
            <div className="acct-detail-name" style={{ color }}>
              {account.name}
            </div>
            <div className="acct-detail-meta">
              <span className="mono" style={{ fontSize:12, color:"var(--text3)" }}>{account.code}</span>
              <span className={`pill ${account.account_type}`}>{account.account_type}</span>
              <span className={`pill normal-${nb}`}>normal {nb}</span>
              <span className="pill" style={{background:"var(--bg4)",color:"var(--text2)",border:"1px solid var(--border2)"}}>
                {account.category?.replace(/_/g," ")}
              </span>
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:"IBM Plex Mono,monospace", fontSize:26, fontWeight:700, color }}>
              {fmt(finalBal)}
            </div>
            <div style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>current balance</div>
          </div>
        </div>

        {/* ── Balance formula ── */}
        <div className="formula-row">
          <span style={{ color:"var(--text3)" }}>Opening</span>
          <span className="formula-val">{fmt(openBal)}</span>
          <span className="formula-op">+</span>
          <span style={{ color:"var(--text3)" }}>Total Dr</span>
          <span className="formula-val" style={{ color:"var(--blue)" }}>{fmt(totalDr)}</span>
          <span className="formula-op">−</span>
          <span style={{ color:"var(--text3)" }}>Total Cr</span>
          <span className="formula-val" style={{ color:"var(--green)" }}>{fmt(totalCr)}</span>
          <span className="formula-op">=</span>
          <span style={{ color:"var(--text3)" }}>Net movement</span>
          <span className="formula-val" style={{ color: netBal < 0 ? "var(--red)" : "var(--green)" }}>{fmt(netBal)}</span>
          <span className="formula-op">=</span>
          <span style={{ color:"var(--text3)" }}>Balance</span>
          <span className="formula-result">{fmt(finalBal)}</span>
        </div>

        {/* ── Balance cards ── */}
        <div className="bal-cards">
          <div className="bal-card">
            <div className="bal-card-label">Opening balance</div>
            <div className="bal-card-value mono">{fmt(openBal)}</div>
            <div className="bal-card-sub">Before any posted entries</div>
          </div>
          <div className="bal-card">
            <div className="bal-card-label">Total debits</div>
            <div className="bal-card-value mono" style={{ color:"var(--blue)" }}>{fmt(totalDr)}</div>
            <div className="bal-card-sub">{rows.filter(r=>r.debit_credit==="debit").length} lines</div>
          </div>
          <div className="bal-card">
            <div className="bal-card-label">Total credits</div>
            <div className="bal-card-value mono" style={{ color:"var(--green)" }}>{fmt(totalCr)}</div>
            <div className="bal-card-sub">{rows.filter(r=>r.debit_credit==="credit").length} lines</div>
          </div>
          <div className="bal-card">
            <div className="bal-card-label">Net movement</div>
            <div className="bal-card-value mono" style={{ color: netBal < 0 ? "var(--red)" : "var(--green)" }}>
              {netBal >= 0 ? "+" : ""}{fmt(netBal)}
            </div>
            <div className="bal-card-sub">In normal direction ({nb})</div>
          </div>
          <div className="bal-card" style={{ borderColor: color, background:"var(--bg4)" }}>
            <div className="bal-card-label">Current balance</div>
            <div className="bal-card-value mono" style={{ color, fontSize:22 }}>{fmt(finalBal)}</div>
            <div className="bal-card-sub">{rows.length} total journal lines</div>
          </div>
        </div>
      </div>

      {/* ── What built this balance: by source ── */}
      {sourceSummary.length > 0 && (
        <div className="builder-section" style={{ marginBottom:24 }}>
          <div className="builder-header">
            <div>
              <div className="builder-title">What built this balance</div>
              <div className="builder-sub">Every source type that contributed to this account, with its net impact</div>
            </div>
          </div>
          <div className="source-summary" style={{ padding:16 }}>
            {sourceSummary.map(s => (
              <div className="source-card" key={s.source}
                style={{ borderColor: s.net >= 0 ? "#1e3520" : "#351e1e" }}>
                <div className="source-card-label">{s.source.replace(/_/g," ")}</div>
                <div className="source-card-net mono"
                  style={{ color: s.net >= 0 ? "var(--green)" : "var(--red)" }}>
                  {s.net >= 0 ? "+" : ""}{fmt(s.net)}
                </div>
                <div className="source-card-detail">
                  {s.count} line{s.count!==1?"s":""} · Dr {fmt(s.debit)} · Cr {fmt(s.credit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="filters">
        <input className="inp wide" placeholder="Search reference, description, customer…"
          value={search} onChange={e=>setSearch(e.target.value)} />
        <input className="inp" type="date" value={startDate}
          onChange={e=>{ setSD(e.target.value); setPage(1); }} />
        <input className="inp" type="date" value={endDate}
          onChange={e=>{ setED(e.target.value); setPage(1); }} />
        <button className="pager-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* ── Ledger lines table ── */}
      {loading ? <Loader /> : err ? <div className="err">⚠ {err}</div> : (
        <>
          <div className="ledger-wrap">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Source</th>
                  <th>Description</th>
                  <th>Customer</th>
                  <th>D/C</th>
                  <th className="right">Amount</th>
                  <th className="right">Running balance</th>
                  <th className="right">Impact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={10} style={{ textAlign:"center", padding:40, color:"var(--text3)" }}>
                    No journal lines found
                  </td></tr>
                )}
                {filtered.map((r, i) => {
                  const running = Number(r.running_balance);
                  const amount  = Number(r.amount);
                  // how much this line moved the balance in normal direction
                  const impact = nb === "debit"
                    ? (r.debit_credit === "debit"  ?  amount : -amount)
                    : (r.debit_credit === "credit" ?  amount : -amount);
                  const runClass = running > 0 ? "running-pos" : running < 0 ? "running-neg" : "running-zero";

                  return (
                    <tr key={r.line_id}>
                      <td className="muted mono" style={{ fontSize:10 }}>{i+1}</td>
                      <td className="muted" style={{ fontSize:12, whiteSpace:"nowrap" }}>{fmtDate(r.entry_date)}</td>
                      <td><span className="ref mono">{r.reference_no}</span></td>
                      <td><span className="source-chip">{(r.source||"—").replace(/_/g," ")}</span></td>
                      <td className="muted" style={{ fontSize:12, maxWidth:200 }}>
                        {r.line_description || r.entry_description || "—"}
                      </td>
                      <td className="muted" style={{ fontSize:11 }}>
                        {r.customer_name || "—"}
                      </td>
                      <td><span className={`dc-badge ${r.debit_credit}`}>{r.debit_credit.toUpperCase()}</span></td>
                      <td className="right mono" style={{ fontWeight:600 }}>{fmt(amount)}</td>
                      <td className={`right mono ${runClass}`} style={{ fontWeight:600 }}>
                        {fmt(running)}
                      </td>
                      <td className="right mono" style={{ fontSize:12,
                        color: impact >= 0 ? "var(--green)" : "var(--red)", fontWeight:600 }}>
                        {impact >= 0 ? "+" : ""}{fmt(impact)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:"var(--bg4)", borderTop:"2px solid var(--border2)" }}>
                  <td colSpan={7} style={{ padding:"10px 14px", fontSize:12, color:"var(--text2)", fontWeight:700 }}>
                    Totals ({filtered.length} lines shown)
                  </td>
                  <td className="right mono" style={{ padding:"10px 14px", fontWeight:700, fontSize:12 }}>
                    <div style={{ color:"var(--blue)" }}>Dr {fmt(filtered.reduce((s,r)=>s+(r.debit_credit==="debit"?Number(r.amount):0),0))}</div>
                    <div style={{ color:"var(--green)" }}>Cr {fmt(filtered.reduce((s,r)=>s+(r.debit_credit==="credit"?Number(r.amount):0),0))}</div>
                  </td>
                  <td className="right mono" style={{ padding:"10px 14px", fontWeight:700, color }}>
                    {fmt(finalBal)}
                  </td>
                  <td className="right mono" style={{ padding:"10px 14px", fontWeight:700,
                    color: netBal >= 0 ? "var(--green)" : "var(--red)" }}>
                    {netBal >= 0 ? "+" : ""}{fmt(netBal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pager">
              <span>Page {page} of {pagination.totalPages} · {pagination.total} total lines</span>
              <div className="pager-btns">
                <button className="pager-btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
                <button className="pager-btn" disabled={page>=pagination.totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────
function Sidebar({ accounts, selected, onSelect, loading, onRefresh }) {
  const grouped = TYPE_ORDER.map(type => ({
    type,
    rows: accounts.filter(a => a.account_type === type),
  })).filter(g => g.rows.length > 0);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Accounts</span>
        <button className="refresh-btn" onClick={onRefresh}>↻</button>
      </div>
      {loading && <div className="loader" style={{ padding:20 }}><div className="spin"/></div>}
      {grouped.map(g => (
        <div className="type-group" key={g.type}>
          <div className="type-label">
            <span>{g.type}</span>
            <span style={{ fontVariantNumeric:"tabular-nums" }}>{g.rows.length}</span>
          </div>
          {g.rows.map(a => {
            const bal = Number(a.current_balance) || 0;
            const color = typeColor[a.account_type];
            return (
              <div key={a.id}
                className={`acct-row${a.is_sub_account?" sub":""} ${selected?.id===a.id?" active":""}`}
                onClick={() => onSelect(a)}>
                <span className="acct-code">{a.code}</span>
                <span className="acct-name">{a.name}</span>
                <span className="acct-bal mono"
                  style={{ color: bal < 0 ? "var(--red)" : selected?.id===a.id ? color : "var(--text2)" }}>
                  {fmt(bal)}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────────────────
export default function BalanceTracer() {
  const [accounts, setAccounts] = useState([]);
  const [loadingCOA, setLoadCOA]= useState(true);
  const [selected, setSelected] = useState(null);

  const loadCOA = useCallback(async () => {
    setLoadCOA(true);
    try {
      const data = await fetchCOA();
      setAccounts(data);
    } catch(e) {
      console.error(e);
    } finally {
      setLoadCOA(false);
    }
  }, []);

  useEffect(() => { loadCOA(); }, [loadCOA]);

  return (
    <>
      <style>{S}</style>
      <div>
        <div className="topbar">
          <span className="logo">LedgerTrace</span>
          <span className="topbar-title">Account Balance Explorer</span>
          <span className="topbar-sep"/>
          <span className="company-badge">
            {COMPANY_ID === "YOUR_COMPANY_ID_HERE" ? "⚠ Set COMPANY_ID" : `Company: ${COMPANY_ID.slice(0,8)}…`}
          </span>
        </div>

        <div className="layout">
          <Sidebar
            accounts={accounts}
            selected={selected}
            onSelect={setSelected}
            loading={loadingCOA}
            onRefresh={loadCOA}
          />

          <div className="main">
            {!selected ? (
              <div className="main-empty">
                <div className="main-empty-icon">📒</div>
                <div className="main-empty-text">Select an account from the left to trace its balance</div>
                <div style={{ fontSize:12, color:"var(--text3)", maxWidth:360, textAlign:"center", lineHeight:1.6, marginTop:8 }}>
                  Every account shows you the exact journal lines that built its balance, grouped by source type, with a running balance column so you can see exactly when and why a value went negative.
                </div>
              </div>
            ) : (
              <LedgerDetail key={selected.id} account={selected} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
