// ─── Journal Modal (QuickBooks-style) ────────────────────────
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { authHeaders, Chip, Empty, fmt, fmtDate, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId } from "../../constants/appConstants";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;
import { userUUID } from "../../constants/appConstants";

export function JournalModal({ entry, onClose, onSaved }) {
  const isEdit = !!entry;
  const { data: coaData } = useFetch(`${API}/accounts`);
  const accounts = coaData?.data || [];

  const [desc, setDesc]       = useState(entry?.description || "");
  const [date, setDate]       = useState(entry?.entry_date?.slice(0,10) || new Date().toISOString().slice(0,10));
  const [memo, setMemo]       = useState(entry?.memo || "");
  const [lines, setLines]     = useState(() => {
    if (entry?.lines && entry.lines.length > 0) {
      return entry.lines.map(l => ({
        coa_id:      l.coa_id || "",
        debit_credit: l.debit_credit,
        amount:       l.amount,
        description:  l.description || "",
      }));
    }
    return [
      { coa_id:"", debit_credit:"debit",  amount:"", description:"" },
      { coa_id:"", debit_credit:"credit", amount:"", description:"" },
    ];
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  const totalDebits  = lines.filter(l => l.debit_credit==="debit"). reduce((s,l)=>s+Number(l.amount||0),0);
  const totalCredits = lines.filter(l => l.debit_credit==="credit").reduce((s,l)=>s+Number(l.amount||0),0);
  const diff         = Math.abs(totalDebits - totalCredits);
  const balanced     = diff < 0.01;

  const addLine = () => setLines(ls => [...ls, { coa_id:"", debit_credit:"debit", amount:"", description:"" }]);
  const remLine = (i) => setLines(ls => ls.filter((_,idx) => idx !== i));
  const setLine = (i, k, v) => setLines(ls => ls.map((l,idx) => idx===i ? {...l,[k]:v} : l));

  const handleAmountChange = (i, val) => {
    setLine(i, "amount", val);
  };

  const submit = async () => {
    if (!desc.trim()) return setErr("Description is required");
    if (!balanced)    return setErr(`Entry is unbalanced — difference of ${fmt(diff)}`);
    const validLines = lines.filter(l => l.coa_id && l.amount);
    if (validLines.length < 2) return setErr("At least 2 complete lines are required");

    setLoading(true); setErr(null);
    const r = await fetch(`${API}/journal`, {
      method: "POST",
      headers: { "Content-Type":"application/json", ...authHeaders() },
      body: JSON.stringify({
        description: desc, entry_date: date, memo,
        lines: validLines, created_by: userUUID,
      }),
    });
    const j = await r.json();
    setLoading(false);
    if (r.ok) onSaved();
    else setErr(j.message);
  };

  return (
    <div className="acc-modal-bg" onClick={onClose}>
      <div className="acc-modal wide" onClick={e => e.stopPropagation()}>
        <div className="acc-modal-hdr">
          <span className="acc-modal-title">
            {isEdit ? `Edit Journal Entry — ${entry.reference_no}` : "New Journal Entry"}
          </span>
          <button className="acc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="acc-modal-body">
          {err && <div className="acc-alert err">✕ {err}</div>}

          <div className="f-grid-3">
            <div className="f-row" style={{ gridColumn:"span 2" }}>
              <label>Description *</label>
              <input className="acc-input" value={desc} onChange={e=>setDesc(e.target.value)}
                placeholder="e.g. Adjusting entry for Q4 accruals" />
            </div>
            <div className="f-row">
              <label>Entry date *</label>
              <input className="acc-input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
            </div>
          </div>
          <div className="f-row" style={{ marginTop:12 }}>
            <label>Memo (internal reference)</label>
            <input className="acc-input" value={memo} onChange={e=>setMemo(e.target.value)}
              placeholder="Optional internal note" />
          </div>

          <div style={{ marginTop:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:"var(--text2)" }}>Journal Lines</span>
              <button className="acc-btn ghost sm" onClick={addLine}>+ Add line</button>
            </div>

            <table className="je-lines-tbl">
              <thead>
                <tr>
                  <th style={{ width:34 }}>#</th>
                  <th>Account</th>
                  <th style={{ width:90 }}>Dr / Cr</th>
                  <th style={{ width:130 }} className="r">Amount (GHS)</th>
                  <th>Description</th>
                  <th style={{ width:36 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td style={{ color:"var(--text3)", fontSize:12, textAlign:"center" }}>{i+1}</td>
                    <td>
                      <select className="acc-input" style={{ width:"100%" }}
                        value={line.coa_id} onChange={e=>setLine(i,"coa_id",e.target.value)}>
                        <option value="">— Select account —</option>
                        {["asset","liability","equity","income","expense"].map(type => (
                          <optgroup key={type} label={type.charAt(0).toUpperCase()+type.slice(1)}>
                            {accounts.filter(a=>a.account_type===type).map(a => (
                              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select className="acc-input" style={{ width:"100%" }}
                        value={line.debit_credit} onChange={e=>setLine(i,"debit_credit",e.target.value)}>
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                    </td>
                    <td>
                      <input className="acc-input" type="number" style={{ width:"100%", textAlign:"right" }}
                        placeholder="0.00" value={line.amount}
                        onChange={e=>handleAmountChange(i, e.target.value)} />
                    </td>
                    <td>
                      <input className="acc-input" style={{ width:"100%" }}
                        placeholder="Note (optional)" value={line.description}
                        onChange={e=>setLine(i,"description",e.target.value)} />
                    </td>
                    <td>
                      <button className="acc-btn danger sm icon"
                        disabled={lines.length<=2} onClick={()=>remLine(i)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign:"right", color:"var(--text2)" }}>Totals</td>
                  <td style={{ textAlign:"right", fontFamily:"var(--mono)" }}>
                    <div style={{ color:"var(--sky)" }}>DR {fmt(totalDebits)}</div>
                    <div style={{ color:"var(--green)", marginTop:2 }}>CR {fmt(totalCredits)}</div>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>

            <div className="je-balance-bar" style={{ marginTop:12 }}>
              <div className="side">
                <span className="label">Debits</span>
                <span className="val dr">{fmt(totalDebits)}</span>
              </div>
              <div className="side">
                <span className={`bal-pill ${balanced ? "ok" : "bad"}`}>
                  {balanced ? "✓ Balanced" : `Out by ${fmt(diff)}`}
                </span>
              </div>
              <div className="side">
                <span className="label">Credits</span>
                <span className="val cr">{fmt(totalCredits)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="acc-modal-ftr">
          <button className="acc-btn ghost" onClick={onClose}>Cancel</button>
          <button className="acc-btn primary" onClick={submit} disabled={loading || !balanced}>
            {loading ? "Posting…" : isEdit ? "Save & Repost" : "Post Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
