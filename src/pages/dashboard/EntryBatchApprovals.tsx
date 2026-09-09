import { useState, useEffect } from "react";
import {
  Search, X, CheckCircle2, XCircle, Trash2, Loader2, ArrowUpCircle,
  ArrowDownCircle, Hash, Calendar, User, AlertCircle, Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import { companyId, userUUID } from "../../constants/appConstants";

const BASE_URL = "https://susu-pro-backend.onrender.com/api";

interface BatchSummary {
  id: string;
  batch_code: string;
  entry_date: string;
  mobile_banker_name: string;
  entered_by_name: string;
  status: string;
  total_deposits: string;
  total_withdrawals: string;
  row_count: number;
  created_at: string;
}

interface BatchRow {
  id: string;
  account_id: string;
  account_number: string;
  account_type: string;
  customer_name: string;
  customer_phone: string;
  amount: string;
  type: "deposit" | "withdrawal";
  description: string;
  status: string;
}

interface BatchDetail {
  batch: BatchSummary & { notes?: string; approved_by_name?: string; approved_at?: string };
  rows: BatchRow[];
}

const fmt = (n: string | number) => Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─────────────────────────────────────────────────────────────

interface EntryBatchApprovalsProps {
  /** Pass this when opened from Quick Actions as an overlay. */
  onClose?: () => void;
}

export default function EntryBatchApprovals({ onClose }: EntryBatchApprovalsProps) {
  const [pending, setPending] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupCode, setLookupCode] = useState("");
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/pending?company_id=${companyId}`);
      const data = await res.json();
      setPending(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPending(); }, []);

  const openByCode = async (code: string) => {
    if (!code.trim()) return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/${code.trim()}`);
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Sheet not found"); return; }
      setDetail(data.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => { setDetail(null); loadPending(); };

  return (
    <div className="mx-auto py-6 px-4">
      {/* Code lookup */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[15px] font-semibold text-[var(--ink)]">Field sheet approvals</h1>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--paper)]">
            <X className="w-4 h-4 text-[var(--ink-faint)]" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-6 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl px-4 py-3">
        <Hash className="w-4 h-4 text-[var(--ink-faint)]" />
        <input
          value={lookupCode}
          onChange={(e) => setLookupCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && openByCode(lookupCode)}
          placeholder="Enter a sheet code to pull up everything about it…"
          inputMode="numeric"
          className="flex-1 text-[15px] cd-mono tracking-wide bg-transparent focus:outline-none"
        />
        <button
          onClick={() => openByCode(lookupCode)}
          disabled={detailLoading}
          className="px-4 py-1.5 text-[12.5px] font-semibold text-white rounded-xl disabled:opacity-50"
          style={{ background: "var(--forest)" }}
        >
          {detailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Open"}
        </button>
      </div>

      {/* Pending list */}
      <h2 className="text-[13px] font-semibold text-[var(--ink)] mb-2.5">Pending sheets ({pending.length})</h2>
      {loading ? (
        <div className="py-10 text-center text-[13px] text-[var(--ink-faint)]"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…</div>
      ) : pending.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-[var(--ink-faint)] bg-[var(--paper)] rounded-2xl">Nothing waiting on approval right now</div>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((b) => (
            <div
              key={b.id}
              onClick={() => openByCode(b.batch_code)}
              className="flex items-center justify-between px-4 py-3 bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl cursor-pointer hover:border-[var(--forest)] transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="cd-mono text-[13px] font-bold text-[var(--forest-deep)]">{b.batch_code}</span>
                <span className="flex items-center gap-1 text-[12px] text-[var(--ink-faint)]"><Calendar className="w-3 h-3" /> {b.entry_date}</span>
                <span className="flex items-center gap-1 text-[12px] text-[var(--ink-faint)]"><User className="w-3 h-3" /> {b.mobile_banker_name}</span>
                <span className="text-[11px] text-[var(--ink-faint)]">{b.row_count} rows · entered by {b.entered_by_name}</span>
              </div>
              <div className="flex items-center gap-4 text-[12.5px]">
                <span style={{ color: "var(--forest)" }} className="cd-mono font-semibold">+¢{fmt(b.total_deposits)}</span>
                <span style={{ color: "var(--clay)" }} className="cd-mono font-semibold">−¢{fmt(b.total_withdrawals)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && <BatchDetailModal detail={detail} onClose={closeDetail} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Full-detail modal — the "type the code, see everything" screen.
// Editing is only available while the sheet is still pending;
// once approved/rejected/voided it's read-only here.
// ─────────────────────────────────────────────────────────────

function BatchDetailModal({ detail, onClose }: { detail: BatchDetail; onClose: () => void }) {
  const [rows, setRows] = useState<BatchRow[]>(detail.rows);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const isPending = detail.batch.status === "pending";

  const editRow = (id: string, patch: Partial<BatchRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const saveEdits = async () => {
    setBusy("saving");
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/${detail.batch.batch_code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: detail.batch.entry_date,
          rows: rows.map((r) => ({
            account_id: r.account_id,
            amount: parseFloat(r.amount),
            transaction_type: r.type,
            description: r.description,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Could not save changes"); return; }
      toast.success("Sheet updated");
      setEditing(false);
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    setBusy("approving");
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/${detail.batch.batch_code}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Approval blocked — see flagged rows");
        return;
      }
      toast.success("Approved — balances updated and SMS sent");
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    const reason = window.prompt("Reason for rejecting this sheet?") || "";
    setBusy("rejecting");
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/${detail.batch.batch_code}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejected_by: userUUID, reason }),
      });
      if (!res.ok) { toast.error("Could not reject sheet"); return; }
      toast.success("Sheet rejected");
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const voidSheet = async () => {
    if (!window.confirm(`Void sheet ${detail.batch.batch_code}? This cannot be undone.`)) return;
    setBusy("voiding");
    try {
      const res = await fetch(`${BASE_URL}/entry-batches/${detail.batch.batch_code}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voided_by: userUUID }),
      });
      if (!res.ok) { toast.error("Could not void sheet"); return; }
      toast.success("Sheet voided");
      onClose();
    } finally {
      setBusy(null);
    }
  };

  const statusColor =
    detail.batch.status === "approved" ? "var(--forest)" :
    detail.batch.status === "rejected" || detail.batch.status === "voided" ? "var(--clay)" : "#b8963f";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(6,20,10,0.55)] backdrop-blur-[2px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--card)] rounded-3xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--paper-line)]">
          <div>
            <p className="cd-mono text-[20px] font-bold" style={{ color: "var(--forest-deep)" }}>{detail.batch.batch_code}</p>
            <div className="flex items-center gap-3 mt-1 text-[12px] text-[var(--ink-faint)]">
              <span>{detail.batch.entry_date}</span>
              <span>·</span>
              <span>Mobile banker: {detail.batch.mobile_banker_name}</span>
              <span>·</span>
              <span>Entered by: {detail.batch.entered_by_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg" style={{ background: "var(--paper)", color: statusColor }}>
              {detail.batch.status}
            </span>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--paper)]"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-2 px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]" style={{ gridTemplateColumns: "2fr 1.4fr 90px 70px 1.4fr 32px" }}>
            <span>Customer</span><span>Account</span><span>Amount</span><span>Type</span><span>Description</span><span />
          </div>
          <div className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <div key={r.id} className="grid gap-2 px-1 py-1.5 items-center rounded-lg border border-[var(--paper-line)]" style={{ gridTemplateColumns: "2fr 1.4fr 90px 70px 1.4fr 32px" }}>
                <div>
                  <p className="text-[12.5px] font-semibold text-[var(--ink)]">{r.customer_name}</p>
                  <p className="text-[10.5px] text-[var(--ink-faint)]">{r.customer_phone}</p>
                </div>
                <p className="cd-mono text-[11.5px] text-[var(--ink-faint)]">····{r.account_number.slice(-4)} · {r.account_type}</p>
                {editing ? (
                  <input
                    value={r.amount}
                    onChange={(e) => editRow(r.id, { amount: e.target.value })}
                    className="w-full px-2 py-1 text-[12.5px] border border-[var(--paper-line)] rounded-lg bg-[var(--paper)]"
                  />
                ) : (
                  <p className="cd-mono text-[12.5px] font-semibold" style={{ color: r.type === "deposit" ? "var(--forest)" : "var(--clay)" }}>¢{fmt(r.amount)}</p>
                )}
                <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: r.type === "deposit" ? "var(--forest)" : "var(--clay)" }}>
                  {r.type === "deposit" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}
                  {r.type === "deposit" ? "In" : "Out"}
                </span>
                {editing ? (
                  <input
                    value={r.description}
                    onChange={(e) => editRow(r.id, { description: e.target.value })}
                    className="w-full px-2 py-1 text-[12.5px] border border-[var(--paper-line)] rounded-lg bg-[var(--paper)]"
                  />
                ) : (
                  <p className="text-[11.5px] text-[var(--ink-faint)] truncate">{r.description}</p>
                )}
                {editing ? (
                  <button onClick={() => removeRow(r.id)} className="p-1 rounded text-[var(--ink-faint)] hover:text-[var(--clay)]"><Trash2 className="w-3.5 h-3.5" /></button>
                ) : <span />}
              </div>
            ))}
          </div>

          {detail.batch.status !== "pending" && detail.batch.status !== "approved" && detail.batch.rejection_reason && (
            <div className="mt-4 flex items-start gap-2 text-[12px] px-3 py-2 rounded-xl" style={{ background: "var(--clay-soft)", color: "var(--clay)" }}>
              <AlertCircle className="w-3.5 h-3.5 mt-0.5" /> {detail.batch.rejection_reason}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--paper-line)]">
          <div className="text-[14px] font-bold text-[var(--ink)]">
            {rows.length} rows · deposits ¢{fmt(rows.filter(r=>r.type==="deposit").reduce((s,r)=>s+parseFloat(r.amount),0))} · withdrawals ¢{fmt(rows.filter(r=>r.type==="withdrawal").reduce((s,r)=>s+parseFloat(r.amount),0))}
          </div>

          {isPending && (
            <div className="flex items-center gap-2">
              {editing ? (
                <button onClick={saveEdits} disabled={!!busy} className="px-4 py-2 text-[12.5px] font-semibold text-white rounded-xl" style={{ background: "var(--forest)" }}>
                  {busy === "saving" ? "Saving…" : "Save changes"}
                </button>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium border border-[var(--paper-line)] rounded-xl hover:bg-[var(--paper)]">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
              )}
              <button onClick={voidSheet} disabled={!!busy} className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium rounded-xl" style={{ color: "var(--clay)" }}>
                <Trash2 className="w-3.5 h-3.5" /> Void
              </button>
              <button onClick={reject} disabled={!!busy} className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-medium rounded-xl border border-[var(--paper-line)] hover:bg-[var(--paper)]">
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button onClick={approve} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-semibold text-white rounded-xl" style={{ background: "var(--forest)" }}>
                {busy === "approving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Approve & send SMS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}