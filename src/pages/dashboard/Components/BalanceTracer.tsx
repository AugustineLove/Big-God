import { useState, useEffect, useCallback } from "react";
import { companyId } from "../../../constants/appConstants";

// ─── CONFIG ───────────────────────────────────────────────────
const COMPANY_ID = companyId;
const API_BASE = "https://susu-pro-backend.onrender.com/api/accounting";
const API = `${API_BASE}/${COMPANY_ID}`;

// ─── HELPERS ─────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(Number(n) || 0);

const fmtDate = (d: string) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ─── ACCOUNT TYPE CONFIGURATION ─────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; bgLight: string; textDark: string; borderLight: string }> = {
  asset: { label: "Asset", bgLight: "bg-blue-50", textDark: "text-blue-800", borderLight: "border-blue-200" },
  liability: { label: "Liability", bgLight: "bg-red-50", textDark: "text-red-800", borderLight: "border-red-200" },
  equity: { label: "Equity", bgLight: "bg-purple-50", textDark: "text-purple-800", borderLight: "border-purple-200" },
  income: { label: "Income", bgLight: "bg-emerald-50", textDark: "text-emerald-800", borderLight: "border-emerald-200" },
  expense: { label: "Expense", bgLight: "bg-amber-50", textDark: "text-amber-800", borderLight: "border-amber-200" },
};

const TYPE_ORDER = ["asset", "liability", "equity", "income", "expense"];

// ─── API CALLS ───────────────────────────────────────────────
async function fetchCOA() {
  const r = await fetch(`${API}/accounts`);
  const j = await r.json();
  return j.data || [];
}

async function fetchLedger(coaId: string, page = 1, limit = 100, startDate = "", endDate = "") {
  const p = new URLSearchParams({ coa_id: coaId, page: String(page), limit: String(limit) });
  if (startDate) p.set("startDate", startDate);
  if (endDate) p.set("endDate", endDate);
  const r = await fetch(`${API}/ledger?${p}`);
  const j = await r.json();
  return j;
}

// ─── TYPES ───────────────────────────────────────────────────
interface Account {
  id: string;
  code: string;
  name: string;
  account_type: string;
  normal_balance: "debit" | "credit";
  opening_balance: number;
  current_balance: number;
  category?: string;
  is_sub_account?: boolean;
}

interface LedgerLine {
  line_id: string;
  entry_date: string;
  reference_no: string;
  source: string;
  entry_description: string;
  line_description?: string;
  customer_name?: string;
  debit_credit: "debit" | "credit";
  amount: number;
  running_balance: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── SOURCE SUMMARY ─────────────────────────────────────────
function buildSourceSummary(lines: LedgerLine[], normalBalance: string) {
  const map: Record<string, { count: number; debit: number; credit: number }> = {};
  for (const line of lines) {
    const key = line.source || "unknown";
    if (!map[key]) map[key] = { count: 0, debit: 0, credit: 0 };
    map[key].count++;
    map[key].debit += Number(line.debit_credit === "debit" ? line.amount : 0);
    map[key].credit += Number(line.debit_credit === "credit" ? line.amount : 0);
  }
  return Object.entries(map).map(([source, v]) => ({
    source,
    ...v,
    net: normalBalance === "debit" ? v.debit - v.credit : v.credit - v.debit,
  }));
}

// ─── LEDGER DETAIL COMPONENT ─────────────────────────────────
function LedgerDetail({ account }: { account: Account }) {
  const [rows, setRows] = useState<LedgerLine[]>([]);
  const [pagination, setPag] = useState<Pagination | null>(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [startDate, setSD] = useState("");
  const [endDate, setED] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoad(true);
    setErr(null);
    try {
      const j = await fetchLedger(account.id, page, 100, startDate, endDate);
      setRows(j.data || []);
      setPag(j.pagination);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoad(false);
    }
  }, [account.id, page, startDate, endDate]);

  useEffect(() => {
    load();
  }, [load]);

  const totalDr = rows.reduce((s, r) => s + (r.debit_credit === "debit" ? Number(r.amount) : 0), 0);
  const totalCr = rows.reduce((s, r) => s + (r.debit_credit === "credit" ? Number(r.amount) : 0), 0);
  const nb = account.normal_balance;
  const netBal = nb === "debit" ? totalDr - totalCr : totalCr - totalDr;
  const openBal = Number(account.opening_balance) || 0;
  const finalBal = openBal + netBal;

  const sourceSummary = buildSourceSummary(rows, nb);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.reference_no || "").toLowerCase().includes(q) ||
      (r.entry_description || "").toLowerCase().includes(q) ||
      (r.source || "").toLowerCase().includes(q) ||
      (r.customer_name || "").toLowerCase().includes(q)
    );
  });

  const typeConfig = TYPE_CONFIG[account.account_type] || { textDark: "text-gray-800", bgLight: "bg-gray-50" };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight ${typeConfig.textDark}`}>{account.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{account.code}</code>
              <span className={`text-xs px-2 py-1 rounded-full ${typeConfig.bgLight} ${typeConfig.textDark} font-medium`}>
                {account.account_type}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-mono ${nb === "debit" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                normal {nb}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                {account.category?.replace(/_/g, " ") || "—"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold font-mono tracking-tight ${typeConfig.textDark}`}>{fmt(finalBal)}</div>
            <div className="text-xs text-gray-500 mt-1">current balance</div>
          </div>
        </div>

        {/* Balance Formula Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
            <span className="text-gray-500">Opening</span>
            <span className="font-semibold text-gray-800">{fmt(openBal)}</span>
            <span className="text-gray-400">+</span>
            <span className="text-gray-500">Total Dr</span>
            <span className="font-semibold text-blue-600">{fmt(totalDr)}</span>
            <span className="text-gray-400">−</span>
            <span className="text-gray-500">Total Cr</span>
            <span className="font-semibold text-emerald-600">{fmt(totalCr)}</span>
            <span className="text-gray-400">=</span>
            <span className="text-gray-500">Net movement</span>
            <span className={`font-semibold ${netBal < 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(netBal)}</span>
            <span className="text-gray-400">=</span>
            <span className="text-gray-500">Balance</span>
            <span className="font-bold text-amber-600">{fmt(finalBal)}</span>
          </div>
        </div>

        {/* Balance Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Opening balance</div>
            <div className="text-xl font-bold font-mono mt-1">{fmt(openBal)}</div>
            <div className="text-xs text-gray-500 mt-1">Before any entries</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total debits</div>
            <div className="text-xl font-bold font-mono mt-1 text-blue-600">{fmt(totalDr)}</div>
            <div className="text-xs text-gray-500 mt-1">{rows.filter((r) => r.debit_credit === "debit").length} lines</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total credits</div>
            <div className="text-xl font-bold font-mono mt-1 text-emerald-600">{fmt(totalCr)}</div>
            <div className="text-xs text-gray-500 mt-1">{rows.filter((r) => r.debit_credit === "credit").length} lines</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Net movement</div>
            <div className={`text-xl font-bold font-mono mt-1 ${netBal < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {netBal >= 0 ? "+" : ""}
              {fmt(netBal)}
            </div>
            <div className="text-xs text-gray-500 mt-1">In normal direction ({nb})</div>
          </div>
          <div className={`rounded-xl border-2 p-4 shadow-sm ${typeConfig.borderLight} ${typeConfig.bgLight}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Current balance</div>
            <div className={`text-2xl font-bold font-mono mt-1 ${typeConfig.textDark}`}>{fmt(finalBal)}</div>
            <div className="text-xs text-gray-500 mt-1">{rows.length} total lines</div>
          </div>
        </div>
      </div>

      {/* Source Summary Section */}
      {sourceSummary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-800">What built this balance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Sources that contributed to this account</p>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceSummary.map((s) => (
              <div
                key={s.source}
                className={`rounded-lg border p-3 ${s.net >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-red-200 bg-red-50/30"}`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {s.source.replace(/_/g, " ")}
                </div>
                <div className={`text-lg font-bold font-mono ${s.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {s.net >= 0 ? "+" : ""}
                  {fmt(s.net)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {s.count} line{s.count !== 1 ? "s" : ""} · Dr {fmt(s.debit)} · Cr {fmt(s.credit)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search reference, description, customer…"
          className="flex-1 min-w-[180px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={startDate}
          onChange={(e) => {
            setSD(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="date"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          value={endDate}
          onChange={(e) => {
            setED(e.target.value);
            setPage(1);
          }}
        />
        <button
          onClick={load}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ⟳ Refresh
        </button>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-500">Loading entries...</span>
        </div>
      ) : err ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">⚠ {err}</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">D/C</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Running Balance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      No journal lines found
                    </td>
                  </tr>
                )}
                {filtered.map((r, i) => {
                  const running = Number(r.running_balance);
                  const amount = Number(r.amount);
                  const impact =
                    nb === "debit"
                      ? r.debit_credit === "debit"
                        ? amount
                        : -amount
                      : r.debit_credit === "credit"
                      ? amount
                      : -amount;

                  return (
                    <tr key={r.line_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{fmtDate(r.entry_date)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-600">{r.reference_no}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {(r.source || "—").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {r.line_description || r.entry_description || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.customer_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                            r.debit_credit === "debit" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {r.debit_credit.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{fmt(amount)}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          running > 0 ? "text-emerald-600" : running < 0 ? "text-red-600" : "text-gray-400"
                        }`}
                      >
                        {fmt(running)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono text-xs font-semibold ${
                          impact >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {impact >= 0 ? "+" : ""}
                        {fmt(impact)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-xs font-semibold text-gray-600">
                    Totals ({filtered.length} lines shown)
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <div className="text-blue-600">Dr {fmt(filtered.reduce((s, r) => s + (r.debit_credit === "debit" ? Number(r.amount) : 0), 0))}</div>
                    <div className="text-emerald-600">Cr {fmt(filtered.reduce((s, r) => s + (r.debit_credit === "credit" ? Number(r.amount) : 0), 0))}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{fmt(finalBal)}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${netBal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {netBal >= 0 ? "+" : ""}
                    {fmt(netBal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 text-sm text-gray-500">
              <span>
                Page {page} of {pagination.totalPages} · {pagination.total} total lines
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SIDEBAR COMPONENT ───────────────────────────────────────
function Sidebar({
  accounts,
  selected,
  onSelect,
  loading,
  onRefresh,
}: {
  accounts: Account[];
  selected: Account | null;
  onSelect: (acc: Account) => void;
  loading: boolean;
  onRefresh: () => void;
}) {
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    rows: accounts.filter((a) => a.account_type === type),
    config: TYPE_CONFIG[type],
  })).filter((g) => g.rows.length > 0);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Accounts</h2>
        <button
          onClick={onRefresh}
          className="text-xs px-3 py-1.5 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          ⟳ Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
          </div>
        )}

        {grouped.map((g) => (
          <div key={g.type} className="border-b border-gray-100">
            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex justify-between">
              <span>{g.type}</span>
              <span>{g.rows.length}</span>
            </div>
            {g.rows.map((a) => {
              const bal = Number(a.current_balance) || 0;
              const isActive = selected?.id === a.id;
              const textColor = bal < 0 ? "text-red-600" : isActive ? TYPE_CONFIG[a.account_type]?.textDark : "text-gray-600";

              return (
                <div
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={`group px-4 py-2 flex items-center gap-2 cursor-pointer transition-all ${
                    a.is_sub_account ? "pl-8" : ""
                  } ${isActive ? "bg-amber-50 border-l-4 border-amber-400" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                >
                  <code className="text-[11px] font-mono text-gray-400 w-12 flex-shrink-0">{a.code}</code>
                  <span className={`flex-1 text-sm ${isActive ? "font-semibold text-gray-800" : "text-gray-600"}`}>{a.name}</span>
                  <span className={`text-xs font-mono font-medium ${textColor}`}>{fmt(bal)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ──────────────────────────────────────────
export default function BalanceTracer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingCOA, setLoadCOA] = useState(true);
  const [selected, setSelected] = useState<Account | null>(null);

  const loadCOA = useCallback(async () => {
    setLoadCOA(true);
    try {
      const data = await fetchCOA();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadCOA(false);
    }
  }, []);

  useEffect(() => {
    loadCOA();
  }, [loadCOA]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight text-amber-600">LedgerTrace</span>
          <span className="text-sm text-gray-400">Account Balance Explorer</span>
          <div className="flex-1" />
          
        </div>
      </div>

      {/* Layout */}
      <div className="flex">
        <Sidebar accounts={accounts} selected={selected} onSelect={setSelected} loading={loadingCOA} onRefresh={loadCOA} />

        <main className="flex-1 p-6">
          {!selected ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">📒</div>
              <h3 className="text-lg font-medium text-gray-700">Select an account</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-md">
                Choose an account from the sidebar to see its complete transaction history and balance breakdown.
              </p>
            </div>
          ) : (
            <LedgerDetail key={selected.id} account={selected} />
          )}
        </main>
      </div>
    </div>
  );
}