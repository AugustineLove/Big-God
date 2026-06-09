import { useState, useEffect, useCallback, useRef } from "react";
import { companyId, userUUID } from "../../constants/appConstants";

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const API = (path) => `http://localhost:5000/api/variance/${companyId}${path}`;

const fmt = (n, d = 2) =>
  Number(n || 0).toLocaleString("en-GH", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

async function apiFetch(url, opts = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.message || "Request failed");
  return j;
}

// ─────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
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
// VARIANCE BADGE
// ─────────────────────────────────────────────────────────────
function VBadge({ type }) {
  if (!type) return null;
  const styles = {
    shortage: "bg-[#fdf2ef] text-[#b83c1e] border border-[#f0c4b8]",
    excess: "bg-[#f0f7f3] text-[#1e6b3c] border border-[#b4d9c4]",
    balanced: "bg-[#eff3f9] text-[#1e3c6b] border border-[#b4c8e0]",
  };
  const labels = {
    shortage: "▼ Shortage",
    excess: "▲ Excess",
    balanced: "= Balanced",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    open: "bg-[#fff8e6] text-[#c48c14] border border-[#f0d888]",
    resolved: "bg-[#f0f7f3] text-[#1e6b3c] border border-[#b4d9c4]",
    written_off: "bg-[#edeae3] text-[#6b6358] border border-[#d8d4cb]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT MODULE
// ─────────────────────────────────────────────────────────────
export default function CashVarianceModule() {
  const [view, setView] = useState("record");
  const [staff, setStaff] = useState([]);
  const { show, Toast } = useToast();

  useEffect(() => {
    fetch(`http://localhost:5000/api/staff?company_id=${companyId}`)
      .then((r) => r.json())
      .then((d) => setStaff(d.data || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <Toast />
      <div className="min-h-screen bg-[#ffffff] text-[#1a1510] font-['DM_Sans',sans-serif]">
        <div className="bg-[#ffffff] text-black px-8 h-14 flex items-center gap-6 sticky top-0 z-50">
          <div className="flex gap-1">
            {[
              { id: "record", label: "Record Variance" },
              { id: "list", label: "All Variances" },
              { id: "summary", label: "Staff Summary" },
            ].map((v) => (
              <button
                key={v.id}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === v.id
                    ? "bg-[#025d0f] text-white"
                    : "bg-transparent text-black/80 hover:bg-white/10"
                }`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {view === "record" && <RecordView staff={staff} toast={show} />}
          {view === "list" && <ListView staff={staff} toast={show} />}
          {view === "summary" && <SummaryView staff={staff} toast={show} />}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 1 — RECORD VARIANCE
// ─────────────────────────────────────────────────────────────
function RecordView({ staff, toast }) {
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [physical, setPhysical] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [looking, setLooking] = useState(false);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!staffId || !date) {
      setLookup(null);
      return;
    }
    setLooking(true);
    apiFetch(API(`/system-total?staff_id=${staffId}&date=${date}`))
      .then((d) => setLookup(d.data))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLooking(false));
  }, [staffId, date]);

  const sysTotal = parseFloat(lookup?.system_total || 0);
  const physicalAmt = parseFloat(physical || 0);
  const variance = sysTotal - physicalAmt;
  const vType = !physical
    ? null
    : Math.abs(variance) < 0.01
    ? "balanced"
    : variance > 0
    ? "shortage"
    : "excess";

  const submit = async () => {
    if (!staffId) return toast("Select a staff member", "error");
    if (!date) return toast("Select a date", "error");
    if (physical === "") return toast("Enter physical cash amount", "error");

    setLoading(true);
    try {
      const d = await apiFetch(API("/"), {
        method: "POST",
        body: JSON.stringify({
          staff_id: staffId,
          variance_date: date,
          physical_cash: physicalAmt,
          notes: notes || null,
          recorded_by: userUUID,
          transactions_count: lookup?.transaction_count || 0,
        }),
      });
      setSaved(d.data);
      toast(d.message, "success");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSaved(null);
    setPhysical("");
    setNotes("");
    setLookup(null);
  };

  if (saved) return <SuccessView variance={saved} onNew={reset} />;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
        <div>
          <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
            Record <em className="italic">Variance</em>
          </h1>
          <p className="text-sm text-[#6b6358] mt-1">
            Compare system total vs physical cash handed in by mobile banker
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-start">
        <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#d8d4cb]">
            <span className="font-semibold text-sm">Reconciliation entry</span>
          </div>
          <div className="p-6 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b6358]">
                  Mobile banker *
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                  value={staffId}
                  onChange={(e) => {
                    setStaffId(e.target.value);
                    setSaved(null);
                  }}
                >
                  <option value="">— Select staff —</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.staff_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#6b6358]">Date *</label>
                <input
                  className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors"
                  type="date"
                  value={date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {looking && (
              <div className="flex items-center gap-2 text-[#6b6358] text-sm">
                <div className="inline-block w-4 h-4 border-2 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
                Loading system total…
              </div>
            )}

            {lookup && !looking && (
              <div className="bg-[#f7f4ef] rounded-xl p-4 border border-[#d8d4cb]">
                <p className="text-xs font-bold tracking-wide uppercase text-[#9e9790] mb-2.5">
                  System — {lookup.transaction_count} transaction{lookup.transaction_count !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Cash deposits", val: lookup.cash_total },
                    { label: "MoMo deposits", val: lookup.momo_total },
                    { label: "System total", val: lookup.system_total, bold: true },
                  ].map((r) => (
                    <div key={r.label}>
                      <p className="text-xs text-[#6b6358]">{r.label}</p>
                      <p
                        className={`font-['Fira_Code',monospace] ${
                          r.bold ? "text-base font-bold mt-0.5" : "text-sm font-medium mt-0.5"
                        }`}
                      >
                        GHS {fmt(r.val)}
                      </p>
                    </div>
                  ))}
                </div>

                {lookup.existing_variance && (
                  <div className="mt-3 p-3 bg-[#eff3f9] border border-[#b4c8e0] rounded-lg text-xs text-[#1e3c6b] flex items-start gap-2">
                    <span>ℹ</span>
                    <span>
                      An existing {lookup.existing_variance.variance_type} record of GHS{" "}
                      {fmt(Math.abs(lookup.existing_variance.variance_amount))} exists for this
                      date. Submitting will overwrite it if still open.
                    </span>
                  </div>
                )}

                {lookup.transactions?.length > 0 && (
                  <details className="mt-2.5">
                    <summary className="text-xs text-[#6b6358] cursor-pointer select-none">
                      View individual transactions
                    </summary>
                    <div className="mt-2 max-h-52 overflow-y-auto border border-[#d8d4cb] rounded-lg">
                      {lookup.transactions.slice(0, 50).map((t, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 border-b border-[#d8d4cb] last:border-b-0"
                        >
                          <div>
                            <p className="font-medium text-xs">{t.customer}</p>
                            <p className="text-xs text-[#6b6358]">
                              {t.account_no} · {t.method || "cash"}
                            </p>
                          </div>
                          <span className="font-['Fira_Code',monospace] font-semibold text-xs">
                            GHS {fmt(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            <hr className="border-t border-[#d8d4cb]" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">
                Physical cash handed in (GHS) *
              </label>
              <input
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['Fira_Code',monospace] text-lg font-semibold outline-none focus:border-[#1a1510] transition-colors"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter the exact amount counted"
                value={physical}
                onChange={(e) => setPhysical(e.target.value)}
              />
            </div>

            {vType && (
              <div
                className={`text-center p-6 rounded-xl border-2 ${
                  vType === "shortage"
                    ? "bg-[#fdf2ef] border-[#f0c4b8] text-[#b83c1e]"
                    : vType === "excess"
                    ? "bg-[#f0f7f3] border-[#b4d9c4] text-[#1e6b3c]"
                    : "bg-[#eff3f9] border-[#b4c8e0] text-[#1e3c6b]"
                }`}
              >
                <p className="text-xs font-bold tracking-[1.5px] uppercase">
                  {vType === "shortage"
                    ? "Cash Shortage"
                    : vType === "excess"
                    ? "Cash Excess"
                    : "Balanced — No Variance"}
                </p>
                <p className="font-['Fraunces',serif] text-5xl font-black leading-none my-2">
                  {vType === "balanced" ? "GHS 0.00" : `GHS ${fmt(Math.abs(variance))}`}
                </p>
                <p className="text-sm opacity-70 mt-1">
                  {vType === "shortage" &&
                    `System: GHS ${fmt(sysTotal)} — Physical: GHS ${fmt(physicalAmt)} = Short GHS ${fmt(variance)}`}
                  {vType === "excess" &&
                    `Physical: GHS ${fmt(physicalAmt)} — System: GHS ${fmt(sysTotal)} = Over GHS ${fmt(Math.abs(variance))}`}
                  {vType === "balanced" && "Cash matches the system total perfectly"}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#6b6358]">Notes (optional)</label>
              <textarea
                className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors resize-y min-h-[72px]"
                rows={3}
                value={notes}
                placeholder="Explain the variance, any circumstances…"
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="px-5 py-3 bg-[#1a1510] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#332d28] active:scale-95 disabled:opacity-45 disabled:cursor-default"
              onClick={submit}
              disabled={loading || !lookup || physical === ""}
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Recording…
                </>
              ) : (
                "Record variance & post to accounts"
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#d8d4cb]">
              <span className="font-semibold text-sm">How it works</span>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              {[
                {
                  type: "shortage",
                  title: "Shortage recorded",
                  je: [
                    { dc: "Dr", acc: "Cash Shortage (5075)", note: "Loss recognised" },
                    { dc: "Cr", acc: "Cash In Vault (1010-01)", note: "Cash reduced by missing amount" },
                  ],
                },
                {
                  type: "excess",
                  title: "Excess recorded",
                  je: [
                    { dc: "Dr", acc: "Cash In Vault (1010-01)", note: "Cash increased" },
                    { dc: "Cr", acc: "Cash Over (4050)", note: "Gain recognised" },
                  ],
                },
              ].map((s) => (
                <div
                  key={s.type}
                  className={`rounded-xl p-3 border ${
                    s.type === "shortage"
                      ? "border-[#f0c4b8] bg-[#fdf2ef]"
                      : "border-[#b4d9c4] bg-[#f0f7f3]"
                  }`}
                >
                  <p
                    className={`text-xs font-bold mb-2 ${
                      s.type === "shortage" ? "text-[#b83c1e]" : "text-[#1e6b3c]"
                    }`}
                  >
                    {s.title}
                  </p>
                  {s.je.map((j, i) => (
                    <div key={i} className="flex gap-2 items-start mb-1">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                          s.type === "shortage" ? "bg-[#b83c1e]" : "bg-[#1e6b3c]"
                        }`}
                      >
                        {j.dc}
                      </span>
                      <div>
                        <p className="text-xs font-medium">{j.acc}</p>
                        <p className="text-xs text-[#6b6358]">{j.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {/* <div className="text-xs text-[#6b6358] leading-relaxed pt-3 border-t border-[#d8d4cb]">
                After recording, the staff member receives an SMS notification with the variance
                amount and reference number.
              </div> */}
            </div>
          </div>

          {staffId && lookup && (
            <StaffNetVariance staffId={staffId} staffName={staff.find((s) => s.id === staffId)?.full_name} />
          )}
        </div>
      </div>
    </div>
  );
}

function StaffNetVariance({ staffId, staffName }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    apiFetch(API(`/summary`))
      .then((d) => {
        const row = (d.data || []).find((r) => r.staff_id === staffId);
        setData(row || null);
      })
      .catch(() => {});
  }, [staffId]);

  if (!data) return null;

  const net = parseFloat(data.net_variance);
  return (
    <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
      <div className="px-5 py-3 border-b border-[#d8d4cb]">
        <span className="font-semibold text-sm">Running total for {staffName}</span>
      </div>
      <div className="p-5 grid grid-cols-2 gap-2.5">
        {[
          { label: "Total shortages", val: data.total_shortage, color: "#b83c1e", count: data.shortage_count },
          { label: "Total excess", val: data.total_excess, color: "#1e6b3c", count: data.excess_count },
        ].map((r) => (
          <div key={r.label} className="bg-[#f7f4ef] rounded-lg p-3">
            <p className="text-xs text-[#6b6358] mb-1">{r.label}</p>
            <p className="font-['Fira_Code',monospace] text-base font-bold" style={{ color: r.color }}>
              GHS {fmt(r.val)}
            </p>
            <p className="text-xs text-[#6b6358]">
              {r.count} record{r.count !== 1 ? "s" : ""}
            </p>
          </div>
        ))}
        <div className="col-span-2 pt-2.5 border-t border-[#d8d4cb]">
          <p className="text-xs text-[#6b6358] mb-1">Net position</p>
          <p
            className={`font-['Fira_Code',monospace] text-lg font-bold ${
              net > 0 ? "text-[#b83c1e]" : net < 0 ? "text-[#1e6b3c]" : "text-[#1e3c6b]"
            }`}
          >
            {net > 0
              ? `GHS ${fmt(net)} owed to company`
              : net < 0
              ? `GHS ${fmt(Math.abs(net))} excess total`
              : "Balanced"}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuccessView({ variance, onNew }) {
  const vType = variance.variance_type;
  const amt = Math.abs(parseFloat(variance.variance_amount));

  return (
    <div className="max-w-[580px] mx-auto pt-10">
      <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm overflow-hidden">
        <div
          className={`px-7 py-8 text-center border-b border-[#d8d4cb] ${
            vType === "shortage"
              ? "bg-[#fdf2ef]"
              : vType === "excess"
              ? "bg-[#f0f7f3]"
              : "bg-[#eff3f9]"
          }`}
        >
          <div className="text-4xl mb-3">{vType === "shortage" ? "⚠️" : vType === "excess" ? "✅" : "✓"}</div>
          <h2 className="font-['Fraunces',serif] text-3xl mb-1.5">Variance Recorded</h2>
          <p className="text-sm text-[#6b6358]">
            {vType === "shortage"
              ? `Shortage of GHS ${fmt(amt)} posted to accounts`
              : vType === "excess"
              ? `Excess of GHS ${fmt(amt)} posted to accounts`
              : "Cash balanced — no journal entry needed"}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-3">
          {[
            { label: "Staff", val: variance.staff_name },
            { label: "Date", val: fmtDate(variance.variance_date) },
            { label: "System total", val: `GHS ${fmt(variance.system_total)}` },
            { label: "Physical cash", val: `GHS ${fmt(variance.physical_cash)}` },
            { label: "Variance", val: vType === "balanced" ? "Balanced" : `GHS ${fmt(amt)} ${vType}`, bold: true },
            { label: "Ref", val: variance.id?.slice(0, 8).toUpperCase(), mono: true },
            { label: "JE posted", val: variance.accounting_je_id ? "Yes — " + variance.accounting_je_id?.slice(0, 8).toUpperCase() : "No JE needed" },
            { label: "SMS sent", val: variance.sms_sent ? "Sent to staff" : "Not sent (no phone on record)" },
          ].map((r) => (
            <div
              key={r.label}
              className="flex justify-between items-center pb-2.5 border-b border-[#d8d4cb] last:border-b-0"
            >
              <span className="text-sm text-[#6b6358]">{r.label}</span>
              <span
                className={`${r.mono ? "font-['Fira_Code',monospace]" : ""} text-sm ${
                  r.bold ? "font-bold" : "font-medium"
                }`}
              >
                {r.val}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-[#f7f4ef] flex">
          <button className="w-full px-5 py-3 bg-[#1a1510] text-white rounded-lg font-semibold text-sm transition-all hover:bg-[#332d28] active:scale-95" onClick={onNew}>
            Record another variance
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 2 — ALL VARIANCES LIST
// ─────────────────────────────────────────────────────────────
function ListView({ staff, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState(null);
  const [staffFilter, setStaffFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ page, limit: 30 });
    if (staffFilter) p.set("staff_id", staffFilter);
    if (typeFilter) p.set("variance_type", typeFilter);
    if (statusFilter) p.set("status", statusFilter);
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);

    apiFetch(API(`/?${p}`))
      .then((d) => {
        setRows(d.data || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [page, staffFilter, typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = rows.reduce(
    (a, r) => ({
      shortage:
        a.shortage + (r.variance_type === "shortage" ? Math.abs(parseFloat(r.variance_amount)) : 0),
      excess:
        a.excess + (r.variance_type === "excess" ? Math.abs(parseFloat(r.variance_amount)) : 0),
    }),
    { shortage: 0, excess: 0 }
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
        <div>
          <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
            All <em className="italic">Variances</em>
          </h1>
          <p className="text-sm text-[#6b6358] mt-1">{total} records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-[#d8d4cb] rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#b83c1e]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
            Total shortages (shown)
          </p>
          <p className="font-['Fira_Code',monospace] text-xl font-medium mt-1.5 mb-0.5">
            GHS {fmt(totals.shortage)}
          </p>
        </div>
        <div className="bg-white border border-[#d8d4cb] rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1e6b3c]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
            Total excess (shown)
          </p>
          <p className="font-['Fira_Code',monospace] text-xl font-medium mt-1.5 mb-0.5">
            GHS {fmt(totals.excess)}
          </p>
        </div>
        <div className="bg-white border border-[#d8d4cb] rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1a1510]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
            Net (shortage − excess)
          </p>
          <p className="font-['Fira_Code',monospace] text-xl font-medium mt-1.5 mb-0.5">
            GHS {fmt(totals.shortage - totals.excess)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
        <div className="p-4 border-b border-[#d8d4cb] flex gap-2.5 flex-wrap">
          <select
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-48"
            value={staffFilter}
            onChange={(e) => {
              setStaffFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
          <select
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="shortage">Shortage</option>
            <option value="excess">Excess</option>
            <option value="balanced">Balanced</option>
          </select>
          <select
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="written_off">Written off</option>
          </select>
          <input
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
          <button
            className="px-3 py-2 bg-transparent border border-[#ccc8be] rounded-lg text-sm font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all"
            onClick={load}
          >
            ↻
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-[#9e9790]">
            <div className="text-4xl mb-3 opacity-35">📋</div>
            <p>No variances found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#edeae3]">
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Staff
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      System total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Physical cash
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      JE
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      SMS
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const amt = Math.abs(parseFloat(r.variance_amount));
                    return (
                      <tr key={r.id} className="border-b border-[#d8d4cb] last:border-b-0 hover:bg-[#f7f4ef]">
                        <td className="px-4 py-3 text-xs text-[#6b6358] whitespace-nowrap">
                          {fmtDate(r.variance_date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm">{r.staff_name}</p>
                          <p className="text-xs text-[#6b6358]">{r.role}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-['Fira_Code',monospace] text-xs">
                          GHS {fmt(r.system_total)}
                        </td>
                        <td className="px-4 py-3 text-right font-['Fira_Code',monospace] text-xs">
                          GHS {fmt(r.physical_cash)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-['Fira_Code',monospace] text-xs font-bold ${
                            r.variance_type === "shortage"
                              ? "text-[#b83c1e]"
                              : r.variance_type === "excess"
                              ? "text-[#1e6b3c]"
                              : "text-[#1e3c6b]"
                          }`}
                        >
                          {r.variance_type === "shortage" ? "−" : r.variance_type === "excess" ? "+" : ""}
                          GHS {fmt(amt)}
                        </td>
                        <td className="px-4 py-3">
                          <VBadge type={r.variance_type} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          {r.accounting_je_id ? (
                            <span className="text-xs text-[#1e6b3c]">✓ Posted</span>
                          ) : (
                            <span className="text-xs text-[#6b6358]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {r.sms_sent ? (
                            <span className="text-xs text-[#1e6b3c]">✓</span>
                          ) : (
                            <span className="text-xs text-[#6b6358]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all"
                            onClick={() => setDetail(r)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#edeae3]">
                    <td colSpan={4} className="px-4 py-3 text-sm font-semibold">
                      Showing {rows.length} of {total}
                    </td>
                    <td className="px-4 py-3 text-right font-['Fira_Code',monospace] text-sm">
                      <span className="text-[#b83c1e]">−GHS {fmt(totals.shortage)}</span>
                      {" / "}
                      <span className="text-[#1e6b3c]">+GHS {fmt(totals.excess)}</span>
                    </td>
                    <td colSpan={5} className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-[#d8d4cb] text-xs text-[#6b6358]">
              <span>
                Page {page} of {Math.ceil(total / 30)}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all disabled:opacity-45 disabled:cursor-default"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <button
                  className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all disabled:opacity-45 disabled:cursor-default"
                  disabled={page * 30 >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <VarianceDetailModal
          variance={detail}
          onClose={() => setDetail(null)}
          onResolved={() => {
            setDetail(null);
            load();
            toast("Variance resolved", "success");
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW 3 — STAFF SUMMARY
// ─────────────────────────────────────────────────────────────
function SummaryView({ staff, toast }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    apiFetch(API(`/summary?${p}`))
      .then((d) => {
        setRows(d.data || []);
        setTotals(d.totals);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
        <div>
          <h1 className="font-['Fraunces',serif] text-4xl font-bold leading-tight">
            Staff <em className="italic">Summary</em>
          </h1>
          <p className="text-sm text-[#6b6358] mt-1">
            Cumulative variance breakdown per mobile banker
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            className="px-3 py-2 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg text-sm outline-none focus:border-[#1a1510] w-36"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button
            className="px-3 py-2 bg-transparent border border-[#ccc8be] rounded-lg text-sm font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all"
            onClick={load}
          >
            ↻
          </button>
        </div>
      </div>

      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total shortages", val: totals.total_shortage, color: "shortage" },
            { label: "Total excess", val: totals.total_excess, color: "excess" },
            { label: "Net variance", val: totals.net_variance, color: "" },
            { label: "Open records", val: totals.open_count, mono: false },
            { label: "Total records", val: totals.total_count, mono: false },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#d8d4cb] rounded-lg p-4 relative overflow-hidden">
              {s.color && (
                <div className={`absolute top-0 left-0 right-0 h-1 bg-${
                  s.color === "shortage" ? "[#b83c1e]" : s.color === "excess" ? "[#1e6b3c]" : "transparent"
                }`} />
              )}
              <p className="text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                {s.label}
              </p>
              <p className={`font-['Fira_Code',monospace] text-xl font-medium mt-1.5 mb-0.5 ${
                s.mono === false ? "font-['DM_Sans',sans-serif]" : ""
              }`}>
                {s.mono === false ? s.val : `GHS ${fmt(s.val)}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#d8d4cb] rounded-xl shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-[#9e9790]">
            <div className="text-4xl mb-3 opacity-35">👤</div>
            <p>No variance records found</p>
            <p className="text-xs mt-1">Record variances from the Record Variance tab</p>
          </div>
        ) : (
          rows.map((r) => {
            const net = parseFloat(r.net_variance);
            const initials = r.full_name
              ?.split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            return (
              <div
                key={r.staff_id}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#d8d4cb] last:border-b-0 hover:bg-[#f7f4ef] cursor-pointer transition-colors"
                onClick={() => setSelected(r)}
              >
                <div className="w-9 h-9 rounded-full bg-[#edeae3] border border-[#d8d4cb] flex items-center justify-center font-bold text-sm text-[#6b6358] flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{r.full_name}</p>
                  <p className="text-xs text-[#6b6358]">
                    {r.role} · {r.department}
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="text-right">
                    <p className="text-xs text-[#6b6358]">Shortages</p>
                    <p className="font-['Fira_Code',monospace] text-sm font-semibold text-[#b83c1e]">
                      GHS {fmt(r.total_shortage)}
                    </p>
                    <p className="text-xs text-[#6b6358]">{r.shortage_count} records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6b6358]">Excess</p>
                    <p className="font-['Fira_Code',monospace] text-sm font-semibold text-[#1e6b3c]">
                      GHS {fmt(r.total_excess)}
                    </p>
                    <p className="text-xs text-[#6b6358]">{r.excess_count} records</p>
                  </div>
                  <div
                    className={`font-['Fira_Code',monospace] text-sm font-semibold min-w-[120px] text-right ${
                      net > 0 ? "text-[#b83c1e]" : net < 0 ? "text-[#1e6b3c]" : "text-[#1e3c6b]"
                    }`}
                  >
                    <p className="text-xs text-[#6b6358] font-['DM_Sans',sans-serif] font-normal">
                      Net
                    </p>
                    GHS {fmt(Math.abs(net))}
                    <p className="text-xs text-[#6b6358] font-['DM_Sans',sans-serif] font-normal">
                      {net > 0 ? "owed to company" : net < 0 ? "company owes" : "balanced"}
                    </p>
                  </div>
                  {r.open_count > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-[#fff8e6] text-[#c48c14] border border-[#f0d888]">
                      {r.open_count} open
                    </span>
                  )}
                  <span className="text-lg text-[#6b6358]">›</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selected && (
        <StaffVarianceHistory staff={selected} onClose={() => setSelected(null)} toast={toast} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STAFF VARIANCE HISTORY MODAL
// ─────────────────────────────────────────────────────────────
function StaffVarianceHistory({ staff, onClose, toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    apiFetch(API(`/?staff_id=${staff.staff_id}&limit=100`))
      .then((d) => setRows(d.data || []))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [staff.staff_id]);

  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1510]/80 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#d8d4cb]">
          <div>
            <p className="font-bold text-lg">{staff.full_name}</p>
            <p className="text-xs text-[#6b6358]">
              {staff.role} — {staff.shortage_count} shortages · {staff.excess_count} excess
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
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#ccc8be] border-t-[#1a1510] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#edeae3]">
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Date
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      System
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Physical
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Variance
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase text-[#9e9790]"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#d8d4cb] last:border-b-0 hover:bg-[#f7f4ef]">
                      <td className="px-4 py-3 text-xs">{fmtDate(r.variance_date)}</td>
                      <td className="px-4 py-3 text-right font-['Fira_Code',monospace] text-xs">
                        GHS {fmt(r.system_total)}
                      </td>
                      <td className="px-4 py-3 text-right font-['Fira_Code',monospace] text-xs">
                        GHS {fmt(r.physical_cash)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-['Fira_Code',monospace] text-xs font-bold ${
                          r.variance_type === "shortage"
                            ? "text-[#b83c1e]"
                            : r.variance_type === "excess"
                            ? "text-[#1e6b3c]"
                            : "text-[#1e3c6b]"
                        }`}
                      >
                        GHS {fmt(Math.abs(parseFloat(r.variance_amount)))}
                      </td>
                      <td className="px-4 py-3">
                        <VBadge type={r.variance_type} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="px-3 py-1.5 bg-transparent border border-[#ccc8be] rounded-lg text-xs font-medium text-[#6b6358] hover:bg-[#f7f4ef] hover:text-[#1a1510] transition-all"
                          onClick={() => setDetail(r)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <VarianceDetailModal
          variance={detail}
          onClose={() => setDetail(null)}
          onResolved={() => {
            setDetail(null);
            setRows(rows.map((r) => (r.id === detail.id ? { ...r, status: "resolved" } : r)));
            toast("Variance resolved", "success");
          }}
          toast={toast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VARIANCE DETAIL + RESOLVE MODAL
// ─────────────────────────────────────────────────────────────
function VarianceDetailModal({ variance: v, onClose, onResolved, toast }) {
  const [resolveNote, setResolveNote] = useState("");
  const [reverseJE, setReverseJE] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("detail");
  const amt = Math.abs(parseFloat(v.variance_amount));

  const resolve = async () => {
    setSaving(true);
    try {
      await apiFetch(API(`/${v.id}/resolve`), {
        method: "PATCH",
        body: JSON.stringify({
          resolved_by: userUUID,
          resolution_note: resolveNote || null,
          reverse_je: reverseJE,
        }),
      });
      onResolved();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1510]/80 backdrop-blur-sm flex items-center justify-center p-5" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#d8d4cb]">
          <div>
            <p className="font-bold text-lg">{v.staff_name}</p>
            <p className="text-xs text-[#6b6358]">{fmtDate(v.variance_date)}</p>
          </div>
          <div className="flex gap-2">
            <VBadge type={v.variance_type} />
            <button
              className="w-8 h-8 rounded-lg border border-[#d8d4cb] bg-white text-[#6b6358] flex items-center justify-center cursor-pointer text-lg transition-all hover:bg-[#edeae3] hover:text-[#1a1510]"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex border-b border-[#d8d4cb]">
          {["detail", "resolve"].map((t) => (
            <button
              key={t}
              className={`flex-1 py-2.5 border-none bg-transparent font-['DM_Sans',sans-serif] text-sm font-semibold cursor-pointer transition-colors ${
                tab === t ? "text-[#1a1510] border-b-2 border-[#1a1510]" : "text-[#9e9790] border-b-2 border-transparent"
              }`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {tab === "detail" && (
            <>
              <div
                className={`text-center p-6 rounded-xl border-2 ${
                  v.variance_type === "shortage"
                    ? "bg-[#fdf2ef] border-[#f0c4b8] text-[#b83c1e]"
                    : v.variance_type === "excess"
                    ? "bg-[#f0f7f3] border-[#b4d9c4] text-[#1e6b3c]"
                    : "bg-[#eff3f9] border-[#b4c8e0] text-[#1e3c6b]"
                }`}
              >
                <p className="text-xs font-bold tracking-[1.5px] uppercase">
                  {v.variance_type === "shortage" ? "Shortage" : v.variance_type === "excess" ? "Excess" : "Balanced"}
                </p>
                <p className="font-['Fraunces',serif] text-5xl font-black leading-none my-2">
                  GHS {fmt(amt)}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  System: GHS {fmt(v.system_total)} · Physical: GHS {fmt(v.physical_cash)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: "Transactions", val: v.transactions_count || "—" },
                  { label: "Recorded by", val: v.recorded_by_name },
                  { label: "Recorded at", val: fmtDate(v.recorded_at) },
                  { label: "JE reference", val: v.accounting_je_id ? v.accounting_je_id.slice(0, 8).toUpperCase() : "No JE" },
                  { label: "SMS sent", val: v.sms_sent ? "Yes" : "No" },
                  { label: "Notes", val: v.notes || "—" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between py-2 border-b border-[#d8d4cb] last:border-b-0">
                    <span className="text-sm text-[#6b6358]">{r.label}</span>
                    <span className="text-sm font-medium">{r.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "resolve" && (
            <>
              {v.status === "resolved" ? (
                <div className="p-3 bg-[#f0f7f3] border border-[#b4d9c4] rounded-lg text-sm text-[#1e6b3c] flex items-start gap-2">
                  <span>✓</span>
                  <span>
                    This variance has been resolved on {fmtDate(v.resolved_at)}.
                    {v.resolution_note && ` Note: ${v.resolution_note}`}
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[#eff3f9] border border-[#b4c8e0] rounded-lg text-sm text-[#1e3c6b] flex items-start gap-2">
                    <span>ℹ</span>
                    <span>
                      Resolving marks this variance as investigated and closed. If cash was
                      returned or the JE should be reversed, tick the option below.
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#6b6358]">Resolution note *</label>
                    <textarea
                      className="w-full px-3 py-2.5 bg-white text-[#1a1510] border border-[#ccc8be] rounded-lg font-['DM_Sans',sans-serif] text-sm outline-none focus:border-[#1a1510] transition-colors resize-vertical"
                      rows={3}
                      value={resolveNote}
                      placeholder="Describe what happened and how it was resolved…"
                      onChange={(e) => setResolveNote(e.target.value)}
                    />
                  </div>

                  {v.accounting_je_id && (
                    <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg bg-[#f7f4ef] border border-[#d8d4cb] text-sm">
                      <input
                        type="checkbox"
                        checked={reverseJE}
                        onChange={(e) => setReverseJE(e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      <div>
                        <p className="font-semibold">Reverse the journal entry</p>
                        <p className="text-xs text-[#6b6358]">
                          Tick this if the cash was recovered / the error was corrected
                        </p>
                      </div>
                    </label>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {tab === "resolve" && v.status !== "resolved" && (
          <div className="px-6 py-4 border-t border-[#d8d4cb] flex gap-2.5 justify-end bg-[#f7f4ef]">
            <button
              className="px-4 py-2 bg-transparent border border-[#ccc8be] rounded-lg text-sm font-semibold text-[#6b6358] hover:bg-[#edeae3] hover:text-[#1a1510] transition-all"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#1a1510] text-white rounded-lg text-sm font-semibold transition-all hover:bg-[#332d28] active:scale-95 disabled:opacity-45 disabled:cursor-default"
              onClick={resolve}
              disabled={saving || !resolveNote.trim()}
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Resolving…
                </>
              ) : (
                "Mark as resolved"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}