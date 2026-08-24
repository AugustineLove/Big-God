import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, Empty, fmt, fmtDate, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { JournalModal } from "./JournalModal";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function JournalEntries() {
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("all");
  const [source, setSource]     = useState("all");
  const [startDate, setStart]   = useState("");
  const [endDate, setEnd]       = useState("");
  const [modal, setModal]       = useState(null); // null | "create" | {entry}
  const [expanded, setExpanded] = useState({});

  const params = new URLSearchParams({
    page,
    ...(search ? {search} : {}),
    ...(status !== "all" ? {status} : {}),
    ...(source !== "all" ? {source} : {}),
    ...(startDate ? {startDate} : {}),
    ...(endDate   ? {endDate}   : {}),
  });

  const { data, loading, refetch } = useFetch(`${API}/journal?${params}`, [page, search, status, source, startDate, endDate]);
  const entries    = data?.data        || [];
  const pagination = data?.pagination;

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const SOURCES = ["customer_deposit","customer_withdrawal","commission","expense","revenue","transfer","depreciation","manual","opening_balance"];

  return (
    <div>
      <div className="acc-panel">
        <div className="acc-panel-header">
          <span className="acc-panel-title">
            Journal Entries
            {pagination && <span className="count">{pagination.total}</span>}
          </span>
          <button className="acc-btn primary" onClick={() => setModal("create")}>+ New Journal Entry</button>
        </div>

        <div className="acc-toolbar">
          <input className="acc-input wide" placeholder="Search by reference or description…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <select className="acc-input" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
            <option value="reversed">Reversed</option>
          </select>
          <select className="acc-input" value={source} onChange={e => { setSource(e.target.value); setPage(1); }}>
            <option value="all">All sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
          <input className="acc-input" type="date" value={startDate} onChange={e => { setStart(e.target.value); setPage(1); }} />
          <input className="acc-input" type="date" value={endDate} onChange={e => { setEnd(e.target.value); setPage(1); }} />
        </div>

        {loading ? <Spinner /> : (
          <div className="acc-tbl-wrap">
            <table className="acc-tbl">
              <thead>
                <tr>
                  <th style={{ width:30 }}></th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className="r">Debits</th>
                  <th className="r">Credits</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr><td colSpan={9}><Empty text="No journal entries found" sub="Adjust your filters or post a new entry" /></td></tr>
                )}
                {entries.map(je => (
                  <React.Fragment key={je.id}>
                    <tr style={{ cursor:"pointer" }} onClick={() => toggle(je.id)}>
                      <td className="c" style={{ color:"var(--text3)", fontSize:10 }}>
                        {expanded[je.id] ? "▼" : "▶"}
                      </td>
                      <td><span className="mono" style={{ color:"var(--accent)" }}>{je.reference_no}</span></td>
                      <td style={{ color:"var(--text2)", whiteSpace:"nowrap" }}>{fmtDate(je.entry_date)}</td>
                      <td style={{ maxWidth:260 }}>{je.description}</td>
                      <td><span style={{ fontSize:12, color:"var(--text3)" }}>{je.source?.replace(/_/g," ")}</span></td>
                      <td className="r"><span className="mono" style={{ color:"var(--sky)" }}>{fmt(je.total_debits)}</span></td>
                      <td className="r"><span className="mono" style={{ color:"var(--green)" }}>{fmt(je.total_credits)}</span></td>
                      <td><Chip type={je.status} /></td>
                      <td>
                        {je.status !== "reversed" && (
                          <button className="acc-btn ghost sm" onClick={e => { e.stopPropagation(); setModal(je); }}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded[je.id] && (je.lines || []).map(line => (
                      <tr key={line.id} className="exp-row">
                        <td></td>
                        <td style={{ paddingLeft:28 }}>
                          <span className="mono" style={{ fontSize:11, color:"var(--text3)" }}>{line.account_code}</span>
                        </td>
                        <td colSpan={3} style={{ paddingLeft:8 }}>
                          <span style={{ fontSize:13 }}>{line.account_name}</span>
                          {line.description && <span style={{ color:"var(--text3)", fontSize:12 }}> — {line.description}</span>}
                        </td>
                        <td className="r" style={{ fontSize:12 }}>
                          {line.debit_credit === "debit" ? <span className="mono" style={{ color:"var(--sky)" }}>{fmt(line.amount)}</span> : ""}
                        </td>
                        <td className="r" style={{ fontSize:12 }}>
                          {line.debit_credit === "credit" ? <span className="mono" style={{ color:"var(--green)" }}>{fmt(line.amount)}</span> : ""}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager pagination={pagination} onPage={setPage} />
      </div>

      {modal && (
        <JournalModal
          entry={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch(); }}
        />
      )}
    </div>
  );
}