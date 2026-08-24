import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, COMPANY_NAME, Empty, fmt, fmtDate, fmtDateLong, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
import { exportProfitLossPDF } from "../../utils/pdfExport";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function ProfitAndLoss() {
  const [startDate, setStart] = useState("");
  const [endDate, setEnd]     = useState("");
  const [submitted, setSubmitted] = useState(false);

  const params = new URLSearchParams({ startDate, endDate });
  const { data, loading } = useFetch(
    submitted ? `${API}/reports/profit-loss?${params}` : null,
    [submitted, startDate, endDate]
  );

  const rows    = data?.data     || [];
  const income   = data?.data?.income   || [];
  const expenses = data?.data?.expenses || [];
  const summary  = data?.summary        || {};
  const isProfit = Number(summary.netProfit) >= 0;

  if (!submitted) {
    return (
      <div className="acc-panel">
        <div className="acc-gate">
          <div className="acc-gate-icon">📊</div>
          <div className="acc-gate-title">Profit & Loss Statement</div>
          <div className="acc-gate-sub">
            Select a reporting period to see your income, expenses, and net profit or loss for that period.
          </div>
          <div className="acc-gate-form">
            <div className="acc-gate-field">
              <label>From date *</label>
              <input className="acc-input" type="date" value={startDate} onChange={e=>setStart(e.target.value)} />
            </div>
            <div className="acc-gate-field">
              <label>To date *</label>
              <input className="acc-input" type="date" value={endDate} onChange={e=>setEnd(e.target.value)} />
            </div>
            <button className="acc-btn primary" style={{ alignSelf:"flex-end" }}
              disabled={!startDate || !endDate}
              onClick={() => setSubmitted(true)}>
              Generate Report →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="acc-kpi-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <div className="acc-kpi income">
          <div className="acc-kpi-label">Total income</div>
          <div className="acc-kpi-value green">{fmt(summary.totalIncome)}</div>
          <div className="acc-kpi-sub">{income.length} income account{income.length!==1?"s":""}</div>
        </div>
        <div className="acc-kpi expense">
          <div className="acc-kpi-label">Total expenses</div>
          <div className="acc-kpi-value red">{fmt(summary.totalExpenses)}</div>
          <div className="acc-kpi-sub">{expenses.length} expense account{expenses.length!==1?"s":""}</div>
        </div>
        <div className={`acc-kpi net ${isProfit?"positive":"negative"}`}>
          <div className="acc-kpi-label">Net {isProfit ? "Profit" : "Loss"}</div>
          <div className={`acc-kpi-value ${isProfit?"green":"red"}`}>{fmt(summary.netProfit)}</div>
          <div className="acc-kpi-sub">
            {summary.totalIncome > 0 ? `${((Number(summary.netProfit)/Number(summary.totalIncome))*100).toFixed(1)}% net margin` : "—"}
          </div>
        </div>
      </div>

      <div className="acc-report">
        <div className="acc-report-cover">
          <div>
            <div className="acc-report-co">{COMPANY_NAME}</div>
            <div className="acc-report-name">Statement of Profit & Loss</div>
          </div>
          <div className="acc-report-meta">
            <div className="acc-report-meta-label">Period</div>
            <div className="acc-report-meta-val">{fmtDateLong(startDate)} to {fmtDateLong(endDate)}</div>
            <div style={{ display:"flex", gap:8, marginTop:12, justifyContent:"flex-end" }}>
              <button className="acc-btn ghost sm" onClick={() => setSubmitted(false)}>← Change period</button>
               <button className="acc-btn primary sm" onClick={() => exportProfitLossPDF({ rows, summary, startDate, endDate })}>
                              ⬇ Export PDF
                              </button>
            </div>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            <div className="acc-report-section">
              <div className="acc-report-section-hdr">📈 Income</div>
              <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                <span>Code</span><span>Account</span><span></span><span style={{textAlign:"right"}}>Amount</span>
              </div>
              {income.length === 0 && (
                <div style={{ padding:"20px 24px", color:"var(--text3)", fontSize:13 }}>No income recorded for this period</div>
              )}
              {income.map(r => (
                <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.code}>
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                  <span className="cat">{r.category?.replace(/_/g," ")}</span>
                  <span className="amt" style={{ color:"var(--green)" }}>{fmt(r.amount)}</span>
                </div>
              ))}
              <div className="acc-report-row sub">
                <span></span><span className="name">Total Income</span><span></span>
                <span className="amt" style={{ color:"var(--green)" }}>{fmt(summary.totalIncome)}</span>
              </div>
            </div>

            <div className="acc-report-section">
              <div className="acc-report-section-hdr">📉 Expenses</div>
              <div className="acc-report-row" style={{ background:"var(--bg3)", fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:".5px" }}>
                <span>Code</span><span>Account</span><span></span><span style={{textAlign:"right"}}>Amount</span>
              </div>
              {expenses.length === 0 && (
                <div style={{ padding:"20px 24px", color:"var(--text3)", fontSize:13 }}>No expenses recorded for this period</div>
              )}
              {expenses.map(r => (
                <div className={`acc-report-row ${r.is_sub_account?"indent":""}`} key={r.code}>
                  <span className="code">{r.code}</span>
                  <span className="name">{r.name}</span>
                  <span className="cat">{r.category?.replace(/_/g," ")}</span>
                  <span className="amt" style={{ color:"var(--amber)" }}>{fmt(r.amount)}</span>
                </div>
              ))}
              <div className="acc-report-row sub">
                <span></span><span className="name">Total Expenses</span><span></span>
                <span className="amt" style={{ color:"var(--red)" }}>{fmt(summary.totalExpenses)}</span>
              </div>
            </div>

            <div className="acc-report-row" style={{ background:"var(--bg4)", borderTop:"2px solid var(--border)", padding:"14px 24px" }}>
              <span></span>
              <span style={{ fontWeight:700, fontSize:14 }}>Gross profit before tax</span>
              <span></span>
              <span style={{ textAlign:"right", fontFamily:"var(--mono)", fontWeight:700, fontSize:14, color:"var(--text)" }}>
                {fmt(Number(summary.totalIncome) - Number(summary.totalExpenses))}
              </span>
            </div>

            <div className="acc-report-row grand">
              <span></span>
              <span className="name">Net {isProfit ? "Profit" : "Loss"} for the Period</span>
              <span></span>
              <span className="amt" style={{ color: isProfit ? "#a7d7b6" : "#fca5a5", fontSize:16 }}>
                {fmt(summary.netProfit)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
