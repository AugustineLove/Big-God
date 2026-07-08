import { useState, useEffect, useCallback } from "react";
import { companyId, userUUID } from "../../constants/appConstants";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
interface CoaRef {
  id: string;
  code: string;
  name: string;
}

interface AccountingRule {
  id: string;
  transaction_type: string;
  account_subtype: string | null;
  payment_method: string | null;
  label: string;
  is_system_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  debit_coa_id: string;
  debit_coa_code: string;
  debit_coa_name: string;
  credit_coa_id: string;
  credit_coa_code: string;
  credit_coa_name: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  normal_balance?: string;
  account_category?: string;
}

interface TransactionTypeOption {
  value: string;
  label: string;
}

type ToastType = "success" | "error" | "info";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const BASE = "https://susu-pro-backend.onrender.com/api";
const RULES_API = (path: string) => `${BASE}/${companyId}/accounting-rules${path}`;
const COA_API = (path: string) => `${BASE}/accounting/${companyId}/accounts${path}`;

const fmtDateTime = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

async function apiFetch<T = any>(url: string, opts: RequestInit = {}): Promise<T> {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || "Request failed");
  return j;
}

// ─────────────────────────────────────────────────────────────
// TOAST (matches existing module pattern exactly)
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: ToastType }[]>([]);
  const show = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const Toast = () => (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 shadow-xl animate-slide-in ${
            t.type === "success"
              ? "bg-[#1a1510] text-white"
              : t.type === "error"
              ? "bg-[#b83c1e] text-white"
              : "bg-[#1e3c6b] text-white"
          }`}
        >
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
  return { show, Toast };
}

// ─────────────────────────────────────────────────────────────
// SHARED BADGES
// ─────────────────────────────────────────────────────────────
function SystemBadge({ isDefault }: { isDefault: boolean }) {
  if (!isDefault) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-[#eff3f9] text-[#1e3c6b] border border-[#b4c8e0] whitespace-nowrap">
      System default
    </span>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-[#f0f7f3] text-[#1e6b3c] border border-[#b4d9c4]">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-[#edeae3] text-[#6b6358] border border-[#d8d4cb]">
      Inactive
    </span>
  );
}

function MethodBadge({ method }: { method: string | null }) {
  if (!method)
    return <span className="text-xs text-[#9e9790] italic">any method</span>;
  const labels: Record<string, string> = { cash: "Cash", momo: "MoMo", bank: "Bank" };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#f7f4ef] text-[#6b6358] border border-[#d8d4cb]">
      {labels[method] || method}
    </span>
  );
}

function SubtypeBadge({ subtype }: { subtype: string | null }) {
  if (!subtype)
    return <span className="text-xs text-[#9e9790] italic">any account type</span>;
  const labels: Record<string, string> = {
    savings: "Savings",
    susu: "Susu",
    fixed_deposit: "Fixed deposit",
    loan: "Loan",
  };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#f7f4ef] text-[#6b6358] border border-[#d8d4cb]">
      {labels[subtype] || subtype}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// THE LEDGER STRIP — signature element.
// A literal Dr → Cr rail showing the two-sided entry. This is
// the one place the module gets visually bold: every rule is
// rendered as a tiny balanced ledger, because that is the one
// true fact about every row in this table — money never moves
// without an equal and opposite entry.
// ─────────────────────────────────────────────────────────────
function LedgerStrip({
  debitCode,
  debitName,
  creditCode,
  creditName,
  size = "md",
}: {
  debitCode: string;
  debitName: string;
  creditCode: string;
  creditName: string;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-3 py-2" : "px-4 py-3";
  const codeSize = size === "sm" ? "text-xs" : "text-sm";
  const nameSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div className="flex items-stretch rounded-lg overflow-hidden border border-[#d8d4cb]">
      <div className={`flex-1 ${pad} bg-[#fdf2ef] border-r border-[#d8d4cb]`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#b83c1e]">Dr</span>
          <span className={`font-['Fira_Code',monospace] ${codeSize} font-semibold text-[#1a1510]`}>
            {debitCode}
          </span>
        </div>
        <p className={`${nameSize} text-[#6b6358] truncate`}>{debitName}</p>
      </div>
      <div className="flex items-center justify-center w-7 bg-[#f7f4ef] text-[#9e9790] text-xs flex-shrink-0">
        →
      </div>
      <div className={`flex-1 ${pad} bg-[#f0f7f3]`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-[#1e6b3c]">Cr</span>
          <span className={`font-['Fira_Code',monospace] ${codeSize} font-semibold text-[#1a1510]`}>
            {creditCode}
          </span>
        </div>
        <p className={`${nameSize} text-[#6b6358] truncate`}>{creditName}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT MODULE
// ─────────────────────────────────────────────────────────────
export default function AccountingRulesModule() {
  const [view, setView] = useState<"rules" | "preview" | "audit">("rules");
  const [coaAccounts, setCoaAccounts] = useState<ChartAccount[]>([]);
  const [txTypes, setTxTypes] = useState<TransactionTypeOption[]>([]);
  const [subtypes, setSubtypes] = useState<TransactionTypeOption[]>([]);
  const [methods, setMethods] = useState<TransactionTypeOption[]>([]);
  const { show, Toast } = useToast();

  useEffect(() => {
    apiFetch(RULES_API("/transaction-types"))
      .then((d: any) => {
        setTxTypes(d.data?.types || []);
        setSubtypes(d.data?.subtypes || []);
        setMethods(d.data?.methods || []);
      })
      .catch(() => {});

    apiFetch(COA_API(""))
      .then((d: any) => setCoaAccounts(d.data || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <Toast />
      <div className="min-h-screen bg-[#ffffff] text-[#1a1510] font-['DM_Sans',sans-serif]">
        <div className="bg-[#ffffff] text-black px-8 h-14 flex items-center gap-6 sticky top-0 z-50 border-b border-[#d8d4cb]">
          <div className="flex gap-1">
            {[
              { id: "rules", label: "Accounting Rules" },
              { id: "preview", label: "Test a Transaction" },
              { id: "audit", label: "Change History" },
            ].map((v) => (
              <button
                key={v.id}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === v.id
                    ? "bg-[#025d0f] text-white"
                    : "bg-transparent text-black/80 hover:bg-black/5"
                }`}
                onClick={() => setView(v.id as typeof view)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {view === "rules" && (
            <RulesView
              coaAccounts={coaAccounts}
              txTypes={txTypes}
              subtypes={subtypes}
              methods={methods}
              toast={show}
            />
          )}
          {view === "preview" && (
            <PreviewView txTypes={txTypes} subtypes={subtypes} methods={methods} toast={show} />
          )}
          {view === "audit" && <AuditView toast={show} />}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 1 — ACCOUNTING RULES (the main settings table)
// ─────────────────────────────────────────────────────────────
function RulesView({
  coaAccounts,
  txTypes,
  subtypes,
  methods,
  toast,
}: {
  coaAccounts: ChartAccount[];
  txTypes: TransactionTypeOption[];
  subtypes: TransactionTypeOption[];
  methods: TransactionTypeOption[];
  toast: (msg: string, type?: ToastType) => void;
}) {
  const [rules, setRules] = useState<AccountingRule[]>([]);
  const [grouped, setGrouped] = useState<Record<string, AccountingRule[]>>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<AccountingRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (typeFilter) p.set("transaction_type", typeFilter);
    if (!showInactive) p.set("is_active", "true");
    apiFetch<{ data: AccountingRule[]; grouped: Record<string, AccountingRule[]> }>(
      RULES_API(`/?${p}`)
    )
      .then((d) => {
        setRules(d.data || []);
        setGrouped(d.grouped || {});
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [typeFilter, showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const typeLabel = (val: string) => txTypes.find((t) => t.value === val)?.label || val;

  const toggleCollapse = (type: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const groupKeys = Object.keys(grouped).sort();

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
        <div>
          <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
            Accounting <em className="italic">Rules</em>
          </h1>
          <p className="text-sm text-[#6b6358] mt-1 max-w-xl">
            Every deposit, withdrawal, and repayment posts a journal entry. This page controls
            which accounts those entries hit — change a mapping here and every future
            transaction follows it, with no code changes.
          </p>
        </div>
        <button
          className="px-5 py-3 bg-[#1a1510] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#332d28] active:scale-95 whitespace-nowrap"
          onClick={() => setCreating(true)}
        >
          + New rule
        </button>
      </div>

      <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
        <div className="p-4 border-b border-[#d8d4cb] flex gap-2.5 flex-wrap items-center">
          <select
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-56"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All transaction types</option>
            {txTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-[#6b6358] cursor-pointer ml-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5"
            />
            Show inactive rules
          </label>

          <button
            className="px-3 py-2 bg-transparent border border-[#ccc8be] rounded-lg text-sm font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all ml-auto"
            onClick={load}
          >
            ↻
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
          </div>
        ) : groupKeys.length === 0 ? (
          <div className="text-center py-16 text-[#9e9790]">
            <div className="text-4xl mb-3 opacity-35">⚖️</div>
            <p>No accounting rules found</p>
            <p className="text-xs mt-1">Create one, or run the default seeder for this company</p>
          </div>
        ) : (
          <div className="divide-y divide-[#d8d4cb]">
            {groupKeys.map((type) => {
              const rows = grouped[type];
              const isCollapsed = collapsed.has(type);
              return (
                <div key={type}>
                  <button
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-[#f7f4ef] hover:bg-[#edeae3] transition-colors text-left"
                    onClick={() => toggleCollapse(type)}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-xs text-[#9e9790] transition-transform ${
                          isCollapsed ? "" : "rotate-90"
                        }`}
                      >
                        ▸
                      </span>
                      <span className="font-semibold text-sm">{typeLabel(type)}</span>
                      <span className="text-xs text-[#9e9790]">
                        {rows.length} rule{rows.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="px-5 py-4 flex flex-col gap-3">
                      {rows.map((r) => (
                        <RuleRow key={r.id} rule={r} onEdit={() => setEditing(r)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(editing || creating) && (
        <RuleEditorModal
          rule={editing}
          coaAccounts={coaAccounts}
          txTypes={txTypes}
          subtypes={subtypes}
          methods={methods}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SINGLE RULE ROW
// ─────────────────────────────────────────────────────────────
function RuleRow({ rule, onEdit }: { rule: AccountingRule; onEdit: () => void }) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        rule.is_active
          ? "border-[#d8d4cb] bg-white hover:border-[#ccc8be]"
          : "border-[#d8d4cb] bg-[#f7f4ef] opacity-60"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <p className="font-semibold text-sm">{rule.label}</p>
          <SystemBadge isDefault={rule.is_system_default} />
        </div>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <SubtypeBadge subtype={rule.account_subtype} />
          <MethodBadge method={rule.payment_method} />
        </div>
        <LedgerStrip
          debitCode={rule.debit_coa_code}
          debitName={rule.debit_coa_name}
          creditCode={rule.credit_coa_code}
          creditName={rule.credit_coa_name}
          size="sm"
        />
      </div>

      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <ActiveBadge active={rule.is_active} />
        <button
          className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RULE EDITOR / CREATE MODAL
// ─────────────────────────────────────────────────────────────
function RuleEditorModal({
  rule,
  coaAccounts,
  txTypes,
  subtypes,
  methods,
  onClose,
  onSaved,
  toast,
}: {
  rule: AccountingRule | null;
  coaAccounts: ChartAccount[];
  txTypes: TransactionTypeOption[];
  subtypes: TransactionTypeOption[];
  methods: TransactionTypeOption[];
  onClose: () => void;
  onSaved: () => void;
  toast: (msg: string, type?: ToastType) => void;
}) {
  const isEdit = !!rule;

  const [transactionType, setTransactionType] = useState(rule?.transaction_type || "");
  const [accountSubtype, setAccountSubtype] = useState(rule?.account_subtype || "");
  const [paymentMethod, setPaymentMethod] = useState(rule?.payment_method || "");
  const [debitCoaId, setDebitCoaId] = useState(rule?.debit_coa_id || "");
  const [creditCoaId, setCreditCoaId] = useState(rule?.credit_coa_id || "");
  const [label, setLabel] = useState(rule?.label || "");
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const debitAccount = coaAccounts.find((c) => c.id === debitCoaId);
  const creditAccount = coaAccounts.find((c) => c.id === creditCoaId);

  const canSave =
    transactionType && debitCoaId && creditCoaId && debitCoaId !== creditCoaId && label.trim();

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        await apiFetch(RULES_API(`/${rule!.id}`), {
          method: "PATCH",
          body: JSON.stringify({
            debit_coa_id: debitCoaId,
            credit_coa_id: creditCoaId,
            label,
            is_active: isActive,
            updated_by: userUUID,
          }),
        });
        toast("Rule updated", "success");
      } else {
        await apiFetch(RULES_API("/"), {
          method: "POST",
          body: JSON.stringify({
            transaction_type: transactionType,
            account_subtype: accountSubtype || null,
            payment_method: paymentMethod || null,
            debit_coa_id: debitCoaId,
            credit_coa_id: creditCoaId,
            label,
            created_by: userUUID,
          }),
        });
        toast("Rule created", "success");
      }
      onSaved();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    if (!rule) return;
    setSaving(true);
    try {
      await apiFetch(RULES_API(`/${rule.id}`), {
        method: "PATCH",
        body: JSON.stringify({ is_active: false, updated_by: userUUID }),
      });
      toast("Rule deactivated", "success");
      onSaved();
    } catch (e: any) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] bg-[#1a1510]/80 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#d8d4cb]">
          <div>
            <p className="font-bold text-lg">{isEdit ? "Edit rule" : "New accounting rule"}</p>
            <p className="text-xs text-[#6b6358]">
              {isEdit
                ? "Change which accounts this rule posts to"
                : "Define when this rule applies and which accounts it posts to"}
            </p>
          </div>
          <button
            className="w-8 h-8 rounded-lg border border-[#d8d4cb] bg-white text-[#6b6358] flex items-center justify-center cursor-pointer text-lg transition-all hover:bg-[#edeae3] hover:text-[#1a1510]"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {isEdit && rule!.is_system_default && (
            <div className="p-3 bg-[#eff3f9] border border-[#b4c8e0] rounded-lg text-xs text-[#1e3c6b] flex items-start gap-2">
              <span>ℹ</span>
              <span>
                This is a system default rule. You can change which accounts it posts to, but it
                can't be deleted — only deactivated.
              </span>
            </div>
          )}

          {!isEdit && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b6358]">Transaction type *</label>
                <select
                  className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                >
                  <option value="">— Select type —</option>
                  {txTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b6358]">
                    Account type
                    <span className="text-[#9e9790] font-normal"> (optional)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                    value={accountSubtype}
                    onChange={(e) => setAccountSubtype(e.target.value)}
                  >
                    <option value="">Any account type</option>
                    {subtypes.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6b6358]">
                    Payment method
                    <span className="text-[#9e9790] font-normal"> (optional)</span>
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Any method</option>
                    {methods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-[#9e9790] -mt-2">
                Leave both blank to create a catch-all default for this transaction type. More
                specific rules (with a method or account type set) always take priority over
                catch-all ones.
              </p>

              <hr className="border-t border-[#d8d4cb]" />
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#6b6358]">Label *</label>
            <input
              className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
              type="text"
              placeholder="e.g. Cash deposit — savings account"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">
                Debit account <span className="text-[#b83c1e]">*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#b83c1e] transition-colors"
                value={debitCoaId}
                onChange={(e) => setDebitCoaId(e.target.value)}
              >
                <option value="">— Select account —</option>
                {coaAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">
                Credit account <span className="text-[#1e6b3c]">*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1e6b3c] transition-colors"
                value={creditCoaId}
                onChange={(e) => setCreditCoaId(e.target.value)}
              >
                <option value="">— Select account —</option>
                {coaAccounts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {debitCoaId && creditCoaId && debitCoaId === creditCoaId && (
            <p className="text-xs text-[#b83c1e]">
              Debit and credit accounts must be different — an entry can't post to itself.
            </p>
          )}

          {debitAccount && creditAccount && debitCoaId !== creditCoaId && (
            <div>
              <p className="text-xs font-semibold text-[#6b6358] mb-2">Preview</p>
              <LedgerStrip
                debitCode={debitAccount.code}
                debitName={debitAccount.name}
                creditCode={creditAccount.code}
                creditName={creditAccount.name}
              />
            </div>
          )}

          {isEdit && (
            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-lg bg-[#f7f4ef] border border-[#d8d4cb] text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-3.5 h-3.5"
              />
              <div>
                <p className="font-semibold">Rule is active</p>
                <p className="text-xs text-[#6b6358]">
                  Inactive rules are skipped when the system looks up where to post a transaction
                </p>
              </div>
            </label>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#d8d4cb] flex gap-2.5 justify-between bg-[#f7f4ef]">
          <div>
            {isEdit && !rule!.is_system_default && !confirmingDeactivate && (
              <button
                className="px-4 py-2 bg-transparent border border-[#f0c4b8] rounded-lg text-sm font-semibold text-[#b83c1e] hover:bg-[#fdf2ef] transition-all"
                onClick={() => setConfirmingDeactivate(true)}
              >
                Delete rule
              </button>
            )}
            {confirmingDeactivate && (
              <DeleteConfirm
                ruleId={rule!.id}
                onCancel={() => setConfirmingDeactivate(false)}
                onDeleted={() => {
                  toast("Rule deleted", "success");
                  onSaved();
                }}
                toast={toast}
              />
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              className="px-4 py-2 bg-transparent border border-[#ccc8be] rounded-lg text-sm font-semibold text-[#6b6358] hover:bg-[#edeae3] hover:text-[#1a1510] transition-all"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#1a1510] text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#332d28] active:scale-95 disabled:opacity-45 disabled:cursor-default"
              onClick={save}
              disabled={saving || !canSave}
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Create rule"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirm({
  ruleId,
  onCancel,
  onDeleted,
  toast,
}: {
  ruleId: string;
  onCancel: () => void;
  onDeleted: () => void;
  toast: (msg: string, type?: ToastType) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await apiFetch(RULES_API(`/${ruleId}`), { method: "DELETE" });
      onDeleted();
    } catch (e: any) {
      toast(e.message, "error");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#b83c1e]">Delete this rule permanently?</span>
      <button
        className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-white transition-all"
        onClick={onCancel}
      >
        No
      </button>
      <button
        className="px-3 py-1.5 bg-[#b83c1e] text-white rounded-lg text-xs font-semibold hover:bg-[#a32d2d] transition-all disabled:opacity-45"
        onClick={confirm}
        disabled={deleting}
      >
        {deleting ? "…" : "Yes, delete"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2 — TEST A TRANSACTION
// Lets a non-technical admin simulate "if a MoMo deposit hits a
// susu account today, where does the money actually go?" without
// touching a real customer record.
// ─────────────────────────────────────────────────────────────
function PreviewView({
  txTypes,
  subtypes,
  methods,
  toast,
}: {
  txTypes: TransactionTypeOption[];
  subtypes: TransactionTypeOption[];
  methods: TransactionTypeOption[];
  toast: (msg: string, type?: ToastType) => void;
}) {
  const [transactionType, setTransactionType] = useState("deposit");
  const [accountSubtype, setAccountSubtype] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(() => {
    if (!transactionType) return;
    setLoading(true);
    setNotFound(false);
    const p = new URLSearchParams({ transaction_type: transactionType });
    if (accountSubtype) p.set("account_subtype", accountSubtype);
    if (paymentMethod) p.set("payment_method", paymentMethod);

    apiFetch(RULES_API(`/preview?${p}`))
      .then((d: any) => setResult(d.data))
      .catch(() => {
        setResult(null);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [transactionType, accountSubtype, paymentMethod]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
          Test a <em className="italic">Transaction</em>
        </h1>
        <p className="text-sm text-[#6b6358] mt-1 max-w-xl">
          Pick a scenario and see exactly which rule fires and which two accounts it touches —
          before any real money moves.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-start">
        <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-[#d8d4cb]">
            <span className="font-semibold text-sm">Scenario</span>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">Transaction type</label>
              <select
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
              >
                {txTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">Account type</label>
              <select
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                value={accountSubtype}
                onChange={(e) => setAccountSubtype(e.target.value)}
              >
                <option value="">Any account type</option>
                {subtypes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">Payment method</label>
              <select
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Any method</option>
                {methods.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-[#d8d4cb]">
            <span className="font-semibold text-sm">Result</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
              </div>
            ) : notFound ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2 opacity-40">⚠️</div>
                <p className="text-sm font-semibold text-[#b83c1e]">No rule matches this scenario</p>
                <p className="text-xs text-[#6b6358] mt-1">
                  A real transaction like this would fail. Go to Accounting Rules and add a
                  mapping for it.
                </p>
              </div>
            ) : result ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{result.label}</p>
                  <SystemBadge isDefault={result.is_system_default} />
                </div>

                <LedgerStrip
                  debitCode={result.debit_coa_code}
                  debitName={result.debit_coa_name}
                  creditCode={result.credit_coa_code}
                  creditName={result.credit_coa_name}
                />

                <div className="bg-[#f7f4ef] rounded-lg p-3.5 text-xs text-[#6b6358] leading-relaxed">
                  This rule matched because it's the most specific one defined for{" "}
                  <strong className="text-[#1a1510]">
                    {txTypes.find((t) => t.value === transactionType)?.label}
                  </strong>
                  {result.account_subtype && (
                    <>
                      {" "}
                      on{" "}
                      <strong className="text-[#1a1510]">
                        {subtypes.find((s) => s.value === result.account_subtype)?.label}
                      </strong>{" "}
                      accounts
                    </>
                  )}
                  {result.payment_method && (
                    <>
                      {" "}
                      via{" "}
                      <strong className="text-[#1a1510]">
                        {methods.find((m) => m.value === result.payment_method)?.label}
                      </strong>
                    </>
                  )}
                  .
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 3 — CHANGE HISTORY
// Shows every rule sorted by most recently touched, so an admin
// can answer "what changed and when" without digging through a
// separate audit log table.
// ─────────────────────────────────────────────────────────────
function AuditView({ toast }: { toast: (msg: string, type?: ToastType) => void }) {
  const [rules, setRules] = useState<AccountingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ data: AccountingRule[] }>(RULES_API("/"))
      .then((d) => {
        const sorted = [...(d.data || [])].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setRules(sorted);
      })
      .catch((e: any) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
          Change <em className="italic">History</em>
        </h1>
        <p className="text-sm text-[#6b6358] mt-1">
          Every rule, ordered by when it was last touched
        </p>
      </div>

      <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16 text-[#9e9790]">
            <div className="text-4xl mb-3 opacity-35">🕓</div>
            <p>No history yet</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#edeae3]">
                <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                  Rule
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                  Posts to
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                  Created
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                  Last updated
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-[#d8d4cb] last:border-b-0 hover:bg-[#f7f4ef]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{r.label}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <SubtypeBadge subtype={r.account_subtype} />
                      <MethodBadge method={r.payment_method} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-['Fira_Code',monospace] text-xs">
                    <span className="text-[#b83c1e]">{r.debit_coa_code}</span>
                    {" → "}
                    <span className="text-[#1e6b3c]">{r.credit_coa_code}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b6358] whitespace-nowrap">
                    {fmtDateTime(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b6358] whitespace-nowrap">
                    {fmtDateTime(r.updated_at)}
                  </td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={r.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

