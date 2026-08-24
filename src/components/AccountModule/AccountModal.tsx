import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, FileText, Layers, Scale, TrendingUp, PieChart } from "lucide-react";
import { Chip, COMPANY_NAME, Empty, fmt, fmtDate, fmtDateLong, Pager, Spinner, useFetch } from "../../pages/dashboard/Components/AccountingModule";
import { companyId, userUUID } from "../../constants/appConstants";
export const API = `https://susu-pro-backend.onrender.com/api/accounting/${companyId}`;


export function AccountModal({ account, accounts, onClose, onSaved }) {
  const isEdit = !!account;
  const [form, setForm] = useState({
    code:            account?.code || "",
    name:            account?.name || "",
    description:     account?.description || "",
    account_type:    account?.account_type || "asset",
    category:        account?.category || "cash_and_cash_equivalents",
    parent_id:       account?.parent_id || "",
    opening_balance: account?.opening_balance || 0,
    opening_date:    account?.opening_date?.slice(0,10) || new Date().toISOString().slice(0,10),
    is_active:       account?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState(null);

  const CATS = {
    asset:     ["cash_and_cash_equivalents","bank_accounts","accounts_receivable","other_receivables","fixed_assets","accumulated_depreciation","other_assets"],
    liability: ["customer_deposits","loans_payable","accounts_payable","accrued_liabilities","other_liabilities"],
    equity:    ["share_capital","retained_earnings","current_year_profit"],
    income:    ["interest_income","commission_income","fee_income","other_income"],
    expense:   ["staff_costs","depreciation_expense","interest_expense","operating_expense","commission_expense","other_expense"],
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true); setErr(null);
    const url    = isEdit ? `${API}/accounts/${account.id}` : `${API}/accounts`;
    const method = isEdit ? "PATCH" : "POST";
    const body   = isEdit
      ? { name:form.name, description:form.description, is_active:form.is_active }
      : { ...form, created_by: userUUID };
    const r = await fetch(url, {
      method, headers: { "Content-Type":"application/json", ...authHeaders() },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    setLoading(false);
    if (r.ok) onSaved();
    else setErr(j.message);
  };

  return (
    <div className="acc-modal-bg" onClick={onClose}>
      <div className="acc-modal" onClick={e => e.stopPropagation()}>
        <div className="acc-modal-hdr">
          <span className="acc-modal-title">{isEdit ? "Edit Account" : "New Account"}</span>
          <button className="acc-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="acc-modal-body">
          {err && <div className="acc-alert err">✕ {err}</div>}

          <div className="f-grid-2">
            <div className="f-row">
              <label>Account code *</label>
              <input className="acc-input" value={form.code} disabled={isEdit}
                onChange={e => set("code", e.target.value)} placeholder="e.g. 1010-04" />
            </div>
            <div className="f-row">
              <label>Account type *</label>
              <select className="acc-input" value={form.account_type} disabled={isEdit}
                onChange={e => { set("account_type", e.target.value); set("category", CATS[e.target.value][0]); }}>
                {["asset","liability","equity","income","expense"].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="f-row" style={{ marginTop:14 }}>
            <label>Account name *</label>
            <input className="acc-input" value={form.name}
              onChange={e => set("name", e.target.value)} placeholder="e.g. Petty Cash" />
          </div>

          <div className="f-row" style={{ marginTop:14 }}>
            <label>Category *</label>
            <select className="acc-input" value={form.category} disabled={isEdit}
              onChange={e => set("category", e.target.value)}>
              {(CATS[form.account_type]||[]).map(c => (
                <option key={c} value={c}>{c.replace(/_/g," ")}</option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <>
              <div className="f-row" style={{ marginTop:14 }}>
                <label>Parent account (optional)</label>
                <select className="acc-input" value={form.parent_id} onChange={e => set("parent_id", e.target.value)}>
                  <option value="">— None (top-level) —</option>
                  {accounts.filter(a => a.account_type === form.account_type && !a.is_sub_account)
                    .map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div className="f-grid-2" style={{ marginTop:14 }}>
                <div className="f-row">
                  <label>Opening balance (GHS)</label>
                  <input className="acc-input" type="number" value={form.opening_balance}
                    onChange={e => set("opening_balance", e.target.value)} />
                </div>
                <div className="f-row">
                  <label>Opening date</label>
                  <input className="acc-input" type="date" value={form.opening_date}
                    onChange={e => set("opening_date", e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div className="f-row" style={{ marginTop:14 }}>
            <label>Description (optional)</label>
            <input className="acc-input" value={form.description}
              onChange={e => set("description", e.target.value)} placeholder="Internal notes" />
          </div>

          {isEdit && (
            <div className="f-row" style={{ marginTop:14 }}>
              <label>Status</label>
              <select className="acc-input" value={String(form.is_active)}
                onChange={e => set("is_active", e.target.value === "true")}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
        </div>
        <div className="acc-modal-ftr">
          <button className="acc-btn ghost" onClick={onClose}>Cancel</button>
          <button className="acc-btn primary" onClick={submit} disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create account"}
          </button>
        </div>
      </div>
    </div>
  );
}