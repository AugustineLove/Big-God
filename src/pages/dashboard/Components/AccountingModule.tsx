import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart, Wallet } from "lucide-react";
import { companyId, userUUID } from "../../../constants/appConstants";
import { ChartOfAccounts } from "../../../components/AccountModule/ChartOfAccounts";
import { JournalEntries } from "../../../components/AccountModule/JournalEntries";
import { TrialBalance } from "../../../components/AccountModule/TrialBalance";
import { ProfitAndLoss } from "../../../components/AccountModule/ProfitAndLoss";
import { BalanceSheet } from "../../../components/AccountModule/BalanceSheet";
import { AccountDetail } from "../../../components/AccountModule/AccountDetail";
import { STYLES } from "../../../components/AccountModule/styles";
import { CashFlow } from "../../../components/AccountModule/CashFlow";

export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;
export const COMPANY_NAME = "Big God Susu Enterprise";

// ─────────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────────
export const fmt = (n) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency", currency: "GHS", minimumFractionDigits: 2,
  }).format(Number(n) || 0);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";

// ─────────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────────
export const authHeaders = () => {
  const token = localStorage.getItem("susupro_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────
// HOOK: useFetch
// ─────────────────────────────────────────────────────────────
export function useFetch(url, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(url, { headers: authHeaders() });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Request failed");
      setData(j);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, [url]);

  useEffect(() => { load(); }, [load, ...deps]);
  return { data, loading, error, refetch: load };
}

// ─────────────────────────────────────────────────────────────
// SHARED MICRO-COMPONENTS
// ─────────────────────────────────────────────────────────────
export const Spinner = () => (
  <div className="acc-loading"><div className="acc-spinner" /><span>Loading…</span></div>
);

export const Empty = ({ icon = "📭", text = "No records found", sub = "" }) => (
  <div className="acc-empty">
    <div className="acc-empty-icon">{icon}</div>
    <div className="acc-empty-text">{text}</div>
    {sub && <div className="acc-empty-sub">{sub}</div>}
  </div>
);

export const Chip = ({ type }) => {
  const map = { asset:"chip-asset", liability:"chip-liability", equity:"chip-equity",
    income:"chip-income", expense:"chip-expense", posted:"chip-posted", draft:"chip-draft",
    reversed:"chip-reversed", debit:"chip-debit", credit:"chip-credit",
    active:"chip-active", inactive:"chip-inactive" };
  return <span className={`acc-chip ${map[type] || "chip-draft"}`}>{type}</span>;
};

export const Pager = ({ pagination, onPage }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="acc-pager">
      <span>Showing page {pagination.page} of {pagination.totalPages} · {pagination.total} records</span>
      <div style={{ display:"flex", gap:6 }}>
        <button className="acc-btn ghost sm" disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}>← Prev</button>
        <button className="acc-btn ghost sm" disabled={pagination.page >= pagination.totalPages}
          onClick={() => onPage(pagination.page + 1)}>Next →</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// CHART OF ACCOUNTS
// ─────────────────────────────────────────────────────────────

// ─── Account Modal ────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// JOURNAL ENTRIES
// ─────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────
// GENERAL LEDGER
// ─────────────────────────────────────────────────────────────
function GeneralLedger() {
  const { data: coaData } = useFetch(`${API}/accounts`);
  const accounts = coaData?.data || [];

  const [coaId, setCoaId]     = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [page, setPage]       = useState(1);

  const params = new URLSearchParams({
    page, limit:50,
    ...(coaId     ? {coa_id:coaId} : {}),
    ...(startDate ? {startDate}    : {}),
    ...(endDate   ? {endDate}      : {}),
  });

  const { data, loading } = useFetch(`${API}/ledger?${params}`, [coaId, startDate, endDate, page]);
  const rows       = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="acc-panel">
        <div className="acc-panel-header">
          <span className="acc-panel-title">
            General Ledger
            {pagination && <span className="count">{pagination.total} lines</span>}
          </span>
        </div>
        <div className="acc-toolbar">
          <select className="acc-input" style={{ flex:1, minWidth:260 }} value={coaId}
            onChange={e => { setCoaId(e.target.value); setPage(1); }}>
            <option value="">— All accounts —</option>
            {["asset","liability","equity","income","expense"].map(type => (
              <optgroup key={type} label={type.charAt(0).toUpperCase()+type.slice(1)}>
                {accounts.filter(a=>a.account_type===type).map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <input className="acc-input" type="date" value={startDate} onChange={e=>{setStart(e.target.value);setPage(1);}} />
          <input className="acc-input" type="date" value={endDate}   onChange={e=>{setEnd(e.target.value);setPage(1);}} />
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-tbl-wrap">
            <table className="acc-tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Account</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className="r">Debit</th>
                  <th className="r">Credit</th>
                  <th className="r">Running balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={8}><Empty text="No ledger entries" sub="Select an account or date range to narrow results" /></td></tr>}
                {rows.map(r => (
                  <tr key={r.line_id}>
                    <td style={{ color:"var(--text2)", whiteSpace:"nowrap" }}>{fmtDate(r.entry_date)}</td>
                    <td><span className="mono" style={{ color:"var(--accent)" }}>{r.reference_no}</span></td>
                    <td>
                      <div className="mono" style={{ fontSize:11, color:"var(--accent)" }}>{r.account_code}</div>
                      <div style={{ fontSize:13 }}>{r.account_name}</div>
                    </td>
                    <td style={{ fontSize:13, color:"var(--text2)" }}>
                      {r.line_description || r.entry_description}
                      {r.customer_name && <div style={{ fontSize:11, color:"var(--text3)" }}>{r.customer_name}</div>}
                    </td>
                    <td><span style={{ fontSize:11, color:"var(--text3)" }}>{r.source?.replace(/_/g," ")}</span></td>
                    <td className="r"><span className="mono" style={{ color:"var(--sky)" }}>{r.debit_credit==="debit" ? fmt(r.amount) : ""}</span></td>
                    <td className="r"><span className="mono" style={{ color:"var(--green)" }}>{r.debit_credit==="credit" ? fmt(r.amount) : ""}</span></td>
                    <td className="r">
                      <span className="mono" style={{ color: Number(r.running_balance)<0 ? "var(--red)" : "var(--text)", fontWeight:600 }}>
                        {fmt(r.running_balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// BALANCE SHEET
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// ACCOUNT DETAIL (Ledger drilldown)
// ─────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────
// ROOT MODULE
// Flat tab navigation instead of a nested sidebar — this module
// already lives inside the app's own sidebar/layout, so a second
// sidebar was redundant. Books tabs and Reports tabs are grouped
// with a divider, the way most double-entry accounting apps do it.
// ─────────────────────────────────────────────────────────────
const TABS = [
  { id:"coa",     label:"Chart of Accounts", icon:BookOpen,  group:"books" },
  { id:"journal", label:"Journal Entries",   icon:FileText,  group:"books" },
  { id:"ledger",  label:"General Ledger",    icon:Layers,    group:"books" },
  { id:"trial",   label:"Trial Balance",     icon:Scale,     group:"reports" },
  { id:"pl",      label:"Profit & Loss",     icon:TrendingUp,group:"reports" },
  { id:"bs",      label:"Balance Sheet",     icon:PieChart,  group:"reports" },
  { id:"cf",      label:"Cash Flow",          icon:Wallet,    group:"reports" }
];

const TAB_TITLES = {
  coa:     "Chart of Accounts",
  journal: "Journal Entries",
  ledger:  "General Ledger",
  trial:   "Trial Balance",
  pl:      "Profit & Loss",
  bs:      "Balance Sheet",
  details: "Account Details",
  cf: "Statement of Cash Flows"
};

const AccountingModule = ({ companyId: _cid }) => {
  const [tab, setTab]         = useState("coa");
  const [selectedAcc, setAcc] = useState(null);

  const handleSelectAccount = (acc) => { setAcc(acc); setTab("details"); };
  const handleBack          = ()    => { setAcc(null); setTab("coa"); };
  const switchTab            = (id) => { setTab(id); setAcc(null); };

  const isDetails = tab === "details" && !!selectedAcc;
  const booksTabs   = TABS.filter(t => t.group === "books");
  const reportsTabs = TABS.filter(t => t.group === "reports");

  return (
    <>
      <style>{STYLES}</style>
      <div className="acc">
        <div className="acc-page-header">
          <div>
            <div className="acc-page-eyebrow">Accounting</div>
            <div className="acc-page-title">
              {isDetails ? `${selectedAcc.code} — ${selectedAcc.name}` : TAB_TITLES[tab]}
            </div>
          </div>
          <div className="acc-page-date">{fmtDateLong(new Date().toISOString())}</div>
        </div>

        {!isDetails && (
          <div className="acc-tabbar">
            {booksTabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`acc-tab ${tab===t.id?"active":""}`} onClick={() => switchTab(t.id)}>
                  <Icon size={15} strokeWidth={2} />{t.label}
                </button>
              );
            })}
            <span className="acc-tab-sep" />
            {reportsTabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`acc-tab ${tab===t.id?"active":""}`} onClick={() => switchTab(t.id)}>
                  <Icon size={15} strokeWidth={2} />{t.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="acc-body">
          {tab === "coa"     && <ChartOfAccounts onSelectAccount={handleSelectAccount} />}
          {tab === "journal" && <JournalEntries />}
          {tab === "ledger"  && <GeneralLedger />}
          {tab === "trial"   && <TrialBalance />}
          {tab === "pl"      && <ProfitAndLoss />}
          {tab === "bs"      && <BalanceSheet />}
          {tab === "details" && selectedAcc && (
            <AccountDetail account={selectedAcc} onBack={handleBack} />
          )}
          {tab === "cf" && <CashFlow />}
        </div>
      </div>
    </>
  );
};

export default AccountingModule;