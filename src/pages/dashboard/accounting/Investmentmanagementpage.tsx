import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { companyId, parentCompanyName } from "../../../constants/appConstants";
import MatureInvestmentModal from "../Components/Matureinvestmentmodal";
import RolloverInvestmentModal from "../Components/Rolloverinvestmentmodal";

const BASE_URL = "https://susu-pro-backend.onrender.com/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface InvestmentRow {
  id: string;
  reference: string;
  product_type: string;
  principal_amount: number | string;
  interest_rate: number | string;
  term_months: number;
  start_date: string;
  maturity_date: string | null;
  expected_interest: number | string;
  expected_maturity_value: number | string;
  actual_interest: number | string | null;
  actual_maturity_value: number | string | null;
  auto_rollover: boolean;
  status: "active" | "matured" | "cancelled";
  narration: string | null;
  matured_at: string | null;
  created_at: string;
  account_id: string;
  account_number: string;
  current_balance: number | string;
  account_status: string;
  sms_enabled?: boolean;
  sms_numbers?: string[];
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  days_to_maturity: number | null;
  is_overdue: boolean;
}

interface Stats {
  active_count: string | number;
  matured_count: string | number;
  cancelled_count: string | number;
  maturing_soon_count: string | number;
  overdue_count: string | number;
  total_active_principal: string | number;
  total_active_expected_value: string | number;
  total_active_expected_interest: string | number;
  total_paid_out: string | number;
  by_product: { product_type: string; count: number; total_principal: string | number }[];
}

type TabKey = "all" | "active" | "maturing_soon" | "overdue" | "matured" | "cancelled";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatGHS = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" }) : "—";

const PRODUCT_LABELS: Record<string, { label: string; icon: string }> = {
  fixed_deposit: { label: "Fixed Deposit", icon: "🔒" },
  treasury_bill: { label: "Treasury Bill", icon: "📜" },
  susu_plus: { label: "Susu Plus", icon: "📈" },
  investment_bond: { label: "Investment Bond", icon: "🏛️" },
  money_market: { label: "Money Market", icon: "💹" },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "#e1f5ee", color: "#0f6e56", label: "Active" },
  matured: { bg: "#e6f1fb", color: "#185fa5", label: "Matured" },
  cancelled: { bg: "#f5f4f0", color: "#888780", label: "Cancelled" },
};

// ─── Style tokens ───────────────────────────────────────────────────────────

const S = {
  page: { minHeight: "100vh", background: "#fafaf8", padding: "24px 20px 60px" } as React.CSSProperties,
  card: { background: "#fff", border: "1px solid #e8e8e6", borderRadius: 14 } as React.CSSProperties,
  input: {
    padding: "8px 12px", borderRadius: 8, border: "1px solid #d3d1c7",
    background: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none",
  } as React.CSSProperties,
};

function PrimaryBtn({ onClick, children, disabled, small }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; small?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: small ? "5px 10px" : "8px 18px", borderRadius: 8, border: "none",
        background: disabled ? "#b4b2a9" : "#1d9e75",
        color: "white", fontSize: small ? 11.5 : 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

function GhostBtn({ onClick, children, small, color = "#5f5e5a" }: { onClick?: () => void; children: React.ReactNode; small?: boolean; color?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? "5px 10px" : "7px 14px", borderRadius: 8,
        border: "1px solid #e8e8e6", background: "#fff",
        color, fontSize: small ? 11.5 : 12.5, cursor: "pointer", fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >{children}</button>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ ...S.card, padding: "14px 16px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 11, color: "#888780", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: accent ?? "#1a1a18" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#888780", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function InvestmentManagementPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [tab, setTab] = useState<TabKey>("all");
  const [productFilter, setProductFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [matureTarget, setMatureTarget] = useState<InvestmentRow | null>(null);
  const [rolloverTarget, setRolloverTarget] = useState<InvestmentRow | null>(null);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [tab, productFilter, debouncedSearch]);

  const tabToParams = (t: TabKey): { status?: string; maturity_status?: string } => {
    switch (t) {
      case "active": return { status: "active" };
      case "maturing_soon": return { status: "active", maturity_status: "upcoming" };
      case "overdue": return { status: "active", maturity_status: "overdue" };
      case "matured": return { status: "matured" };
      case "cancelled": return { status: "cancelled" };
      default: return {};
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/investments/stats/${companyId}`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.warn("Failed to load investment stats:", err);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams();
      const { status, maturity_status } = tabToParams(tab);
      if (status) params.set("status", status);
      if (maturity_status) params.set("maturity_status", maturity_status);
      if (productFilter) params.set("product_type", productFilter);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sort", tab === "matured" ? "created_desc" : "maturity_date_asc");

      const res = await fetch(`${BASE_URL}/investments/all/${companyId}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data);
        setTotalPages(data.pagination?.total_pages ?? 1);
      } else {
        setErrorMsg(data.message ?? "Failed to load investments.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Failed to load investments.");
    } finally {
      setLoading(false);
    }
  }, [tab, productFilter, debouncedSearch, page]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchRows(); }, [fetchRows]);

  const refreshAll = () => { fetchStats(); fetchRows(); };

  const handleReverse = async (row: InvestmentRow) => {
    const reason = window.prompt(
      `Reversing ${row.reference} will restore any source account balance and mark this investment cancelled.\n\nEnter a reason (min 5 characters):`
    );
    if (!reason || reason.trim().length < 5) return;

    setReversingId(row.id);
    try {
      const res = await fetch(`${BASE_URL}/investments/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lookup_type: "ia_id",
          lookup_value: row.id,
          company_id: companyId,
          reversed_by: window.localStorage.getItem("userUUID") ?? "",
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        window.alert(data.message ?? "Reversal failed.");
      } else {
        refreshAll();
      }
    } catch (err: any) {
      window.alert(err?.message ?? "Reversal failed.");
    } finally {
      setReversingId(null);
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = useMemo(() => [
    { key: "all", label: "All" },
    { key: "active", label: "Active", count: Number(stats?.active_count ?? 0) },
    { key: "maturing_soon", label: "Maturing Soon (7d)", count: Number(stats?.maturing_soon_count ?? 0) },
    { key: "overdue", label: "Overdue", count: Number(stats?.overdue_count ?? 0) },
    { key: "matured", label: "Matured", count: Number(stats?.matured_count ?? 0) },
    { key: "cancelled", label: "Cancelled", count: Number(stats?.cancelled_count ?? 0) },
  ], [stats]);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a18" }}>Investment Management</div>
          <div style={{ fontSize: 13, color: "#888780", marginTop: 2 }}>
            Track fixed deposits, bonds, and savings products across every customer.
          </div>
        </div>
        <PrimaryBtn onClick={() => navigate("/investments/new")}>+ New Investment</PrimaryBtn>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Active Investments" value={String(stats?.active_count ?? "—")} sub={`GHS ${formatGHS(stats?.total_active_principal)} principal`} />
        <StatCard label="Expected Interest" value={`GHS ${formatGHS(stats?.total_active_expected_interest)}`} accent="#0f6e56" />
        <StatCard label="Maturing (7 days)" value={String(stats?.maturing_soon_count ?? "—")} accent={Number(stats?.maturing_soon_count ?? 0) > 0 ? "#a05f20" : undefined} />
        <StatCard label="Overdue for Processing" value={String(stats?.overdue_count ?? "—")} accent={Number(stats?.overdue_count ?? 0) > 0 ? "#e24b4a" : undefined} />
        <StatCard label="Total Paid Out" value={`GHS ${formatGHS(stats?.total_paid_out)}`} sub={`${stats?.matured_count ?? 0} matured`} />
      </div>

      {/* Tabs + filters */}
      <div style={{ ...S.card, marginBottom: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #eeeeec", overflowX: "auto" }}>
          {tabs.map((t) => (
            <div
              key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "12px 16px", cursor: "pointer", fontSize: 12.5, whiteSpace: "nowrap",
                borderBottom: `2px solid ${tab === t.key ? "#1d9e75" : "transparent"}`,
                color: tab === t.key ? "#0f6e56" : "#5f5e5a",
                fontWeight: tab === t.key ? 500 : 400,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  fontSize: 10, background: tab === t.key ? "#1d9e75" : "#e8e8e6",
                  color: tab === t.key ? "#fff" : "#5f5e5a", padding: "1px 6px", borderRadius: 99,
                }}>
                  {t.count}
                </span>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderBottom: "1px solid #eeeeec" }}>
          <input
            type="text" placeholder="Search customer, phone, account no. or reference…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...S.input, flex: 1, minWidth: 220 }}
          />
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={S.input}>
            <option value="">All products</option>
            {Object.entries(PRODUCT_LABELS).map(([key, v]) => (
              <option key={key} value={key}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {errorMsg && (
          <div style={{ padding: "10px 16px", background: "#fcebeb", fontSize: 12, color: "#a32d2d" }}>{errorMsg}</div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#fafaf8", textAlign: "left" }}>
                {["Reference", "Customer", "Product", "Principal", "Rate", "Maturity", "Current Value", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", fontSize: 10.5, color: "#888780", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} style={{ padding: "30px", textAlign: "center", color: "#888780", fontSize: 12.5 }}>Loading investments…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={9} style={{ padding: "30px", textAlign: "center", color: "#888780", fontSize: 12.5 }}>No investments match these filters.</td></tr>
              )}
              {!loading && rows.map((row) => {
                const product = PRODUCT_LABELS[row.product_type] ?? { label: row.product_type, icon: "💰" };
                const statusStyle = STATUS_STYLE[row.status] ?? STATUS_STYLE.active;
                const rowBg = row.is_overdue ? "#fff9f5" : (row.days_to_maturity !== null && row.days_to_maturity <= 7 && row.days_to_maturity >= 0 && row.status === "active") ? "#fffdf5" : "#fff";
                const currentValue = row.status === "matured" ? row.actual_maturity_value : row.expected_maturity_value;

                return (
                  <>
                    <tr key={row.id} style={{ borderTop: "1px solid #eeeeec", background: rowBg }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11.5, color: "#5f5e5a" }}>
                        <span style={{ cursor: "pointer", color: "#0f6e56" }} onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
                          {row.reference}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ fontWeight: 500, color: "#1a1a18" }}>{row.customer_name}</div>
                        <div style={{ fontSize: 10.5, color: "#888780" }}>{row.account_number}</div>
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{product.icon} {product.label}</td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>GHS {formatGHS(row.principal_amount)}</td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{row.interest_rate}%</td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        {formatDate(row.maturity_date)}
                        {row.status === "active" && row.days_to_maturity !== null && (
                          <div style={{ fontSize: 10.5, color: row.is_overdue ? "#e24b4a" : row.days_to_maturity <= 7 ? "#a05f20" : "#888780" }}>
                            {row.is_overdue ? `${Math.abs(row.days_to_maturity)}d overdue` : `in ${row.days_to_maturity}d`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap", fontWeight: 500, color: "#0f6e56" }}>GHS {formatGHS(currentValue)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 500, padding: "3px 9px", borderRadius: 99, background: statusStyle.bg, color: statusStyle.color }}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          {row.status === "active" && (
                            <>
                              <PrimaryBtn small onClick={() => setMatureTarget(row)}>Mature</PrimaryBtn>
                              <GhostBtn small onClick={() => setRolloverTarget(row)}>Rollover</GhostBtn>
                              <GhostBtn small color="#a32d2d" onClick={() => handleReverse(row)}>
                                {reversingId === row.id ? "…" : "Reverse"}
                              </GhostBtn>
                            </>
                          )}
                          {row.status !== "active" && (
                            <GhostBtn small onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>Details</GhostBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr style={{ background: "#fafaf8", borderTop: "1px solid #eeeeec" }}>
                        <td colSpan={9} style={{ padding: "12px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, fontSize: 12 }}>
                            <div><div style={{ color: "#888780", fontSize: 10.5 }}>Started</div>{formatDate(row.start_date)}</div>
                            <div><div style={{ color: "#888780", fontSize: 10.5 }}>Term</div>{row.term_months > 0 ? `${row.term_months} months` : "Open-ended"}</div>
                            <div><div style={{ color: "#888780", fontSize: 10.5 }}>Auto-rollover</div>{row.auto_rollover ? "Yes" : "No"}</div>
                            <div><div style={{ color: "#888780", fontSize: 10.5 }}>Phone</div>{row.customer_phone || "—"}</div>
                            <div><div style={{ color: "#888780", fontSize: 10.5 }}>Expected interest</div>GHS {formatGHS(row.expected_interest)}</div>
                            {row.status === "matured" && (
                              <>
                                <div><div style={{ color: "#888780", fontSize: 10.5 }}>Matured at</div>{row.matured_at ? formatDate(row.matured_at) : "—"}</div>
                                <div><div style={{ color: "#888780", fontSize: 10.5 }}>Actual interest paid</div>GHS {formatGHS(row.actual_interest)}</div>
                                <div><div style={{ color: "#888780", fontSize: 10.5 }}>Actual payout</div>GHS {formatGHS(row.actual_maturity_value)}</div>
                              </>
                            )}
                            {row.narration && (
                              <div style={{ gridColumn: "1 / -1" }}><div style={{ color: "#888780", fontSize: 10.5 }}>Narration</div>{row.narration}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 16px", borderTop: "1px solid #eeeeec" }}>
            <GhostBtn small onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</GhostBtn>
            <span style={{ fontSize: 12, color: "#5f5e5a", alignSelf: "center" }}>Page {page} of {totalPages}</span>
            <GhostBtn small onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</GhostBtn>
          </div>
        )}
      </div>

      {/* Product breakdown */}
      {stats && stats.by_product?.length > 0 && (
        <div style={{ ...S.card, marginTop: 16, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#5f5e5a", marginBottom: 10 }}>Active portfolio by product</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {stats.by_product.map((p) => {
              const meta = PRODUCT_LABELS[p.product_type] ?? { label: p.product_type, icon: "💰" };
              return (
                <div key={p.product_type} style={{ fontSize: 12.5, color: "#1a1a18" }}>
                  {meta.icon} {meta.label} — <strong>{p.count}</strong> · GHS {formatGHS(p.total_principal)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action modals */}
      <MatureInvestmentModal
        isOpen={!!matureTarget}
        investment={matureTarget}
        parentCompanyName={parentCompanyName}
        onClose={() => setMatureTarget(null)}
        onSuccess={refreshAll}
      />
      <RolloverInvestmentModal
        isOpen={!!rolloverTarget}
        investment={rolloverTarget}
        parentCompanyName={parentCompanyName}
        onClose={() => setRolloverTarget(null)}
        onSuccess={refreshAll}
      />
    </div>
  );
}