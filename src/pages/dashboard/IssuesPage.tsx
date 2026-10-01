import { useState, useEffect, useCallback, useRef } from "react";
import { companyId, userUUID } from "../../constants/appConstants";

/**
 * IssuesPage — internal issue tracker.
 * Route:  <Route path="issues" element={<IssuesPage />} />   (i.e. /dashboard/issues)
 * Staff:  report issues, follow their own, reply, cancel or reopen.
 * Admin:  see every issue, set status/priority/assignee, add resolution + internal notes.
 * Admin rights are decided by the backend (response.is_admin), not by the browser.
 */

const BASE_URL = "https://susu-pro-backend.onrender.com/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  ticket_no: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reported_by: string;
  reported_by_name?: string;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  resolved_by_name?: string | null;
  related_customer_name?: string | null;
  related_reference?: string | null;
  resolution_note: string | null;
  comment_count?: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}
interface Comment { id: string; body: string; is_internal: boolean; created_at: string; author_name?: string; author_id: string }
interface HistoryRow { id: string; action: string; from_value: string | null; to_value: string | null; created_at: string; actor_name?: string }
interface StaffRow { id: string; full_name: string; role?: string }
interface Stats { total: number; open: number; in_progress: number; awaiting_info: number; resolved: number; closed: number; critical_active: number; unassigned: number }

// ─── Config ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  open:          { label: "Open",          bg: "#e6f1fb", fg: "#185fa5" },
  in_progress:   { label: "In progress",   bg: "#faeeda", fg: "#854f0b" },
  awaiting_info: { label: "Needs info",    bg: "#f3e8fb", fg: "#6b2fa0" },
  resolved:      { label: "Resolved",      bg: "#e1f5ee", fg: "#0f6e56" },
  closed:        { label: "Closed",        bg: "#eeeeec", fg: "#5f5e5a" },
  rejected:      { label: "Rejected",      bg: "#fcebeb", fg: "#a32d2d" },
};
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:      { label: "Low",      color: "#888780" },
  medium:   { label: "Medium",   color: "#378add" },
  high:     { label: "High",     color: "#ba7517" },
  critical: { label: "Critical", color: "#e24b4a" },
};
const CATEGORIES: Record<string, string> = {
  deposit: "Deposits", withdrawal: "Withdrawals", accounting: "Accounting", customer: "Customer records",
  reports: "Reports", system_bug: "System bug", access: "Login / access", staff_conduct: "Staff conduct", other: "Other",
};
const ACTION_LABEL: Record<string, string> = {
  created: "Reported", status: "Status", priority: "Priority", category: "Category", assignee: "Assigned", resolution: "Resolution",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const api = async (path: string, init?: RequestInit) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleString("en-GH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const timeAgo = (d: string) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(d);
};

const label = (v: string | null) => (v && STATUS_META[v]?.label) || (v && PRIORITY_META[v]?.label) || (v && CATEGORIES[v]) || v || "—";

// ─── Style tokens (same palette as QuickTransferPage) ───────────────────────

const S = {
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d3d1c7", background: "#fff", color: "#1a1a18", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" } as React.CSSProperties,
  fieldLabel: { display: "block", fontSize: 12, color: "#5f5e5a", marginBottom: 6 } as React.CSSProperties,
  sectionLabel: { fontSize: 11, fontWeight: 500, color: "#888780", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 } as React.CSSProperties,
  ghostBtn: { padding: "8px 16px", borderRadius: 8, border: "1px solid #e8e8e6", background: "#fff", fontSize: 13, color: "#5f5e5a", cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties,
  card: { background: "#fff", border: "1px solid #e8e8e6", borderRadius: 14 } as React.CSSProperties,
};

function PrimaryBtn({ onClick, children, disabled, danger }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: "8px 18px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
        background: disabled ? "#b4b2a9" : danger ? "#e24b4a" : "#1d9e75", color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.open;
  return <span style={{ padding: "3px 10px", borderRadius: 99, background: m.bg, color: m.fg, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>{m.label}</span>;
}

function PriorityTag({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#5f5e5a", whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.color }} />{m.label}
    </span>
  );
}

function Overlay({ children, onClose, side }: { children: React.ReactNode; onClose: () => void; side?: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(26,26,24,0.35)", zIndex: 50, display: "flex", justifyContent: side ? "flex-end" : "center", alignItems: side ? "stretch" : "center", padding: side ? 0 : 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={side
          ? { width: "min(620px, 100%)", background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-4px 0 24px rgba(0,0,0,0.12)" }
          : { width: "min(560px, 100%)", background: "#fff", borderRadius: 16, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Report modal ───────────────────────────────────────────────────────────

function ReportModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("system_bug");
  const [priority, setPriority] = useState("medium");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!title.trim() || !description.trim()) { setErr("Add a title and describe what happened."); return; }
    setSaving(true); setErr("");
    try {
      await api("/issues", {
        method: "POST",
        body: JSON.stringify({
          company_id: companyId, staff_id: userUUID, title, description, category, priority,
          related_reference: reference || null,
        }),
      });
      onCreated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #eeeeec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a18" }}>Report an issue</div>
        <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#888780" }}>×</button>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {err && <div style={{ padding: "8px 12px", background: "#fcebeb", border: "1px solid #f7c1c1", borderRadius: 8, fontSize: 12, color: "#a32d2d", marginBottom: 14 }}>{err}</div>}

        <label style={S.fieldLabel}>What is the problem?</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Withdrawal approved but balance did not change" style={{ ...S.input, marginBottom: 14 }} maxLength={140} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={S.fieldLabel}>Area</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={S.input}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={S.fieldLabel}>How urgent is it?</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={S.input}>
              <option value="low">Low — can wait</option>
              <option value="medium">Medium — slows my work</option>
              <option value="high">High — blocking my work</option>
              <option value="critical">Critical — money or data is wrong</option>
            </select>
          </div>
        </div>

        <label style={S.fieldLabel}>Account number, customer or transaction code (optional)</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. BGSE010010SU1 or the transaction code" style={{ ...S.input, marginBottom: 14 }} />

        <label style={S.fieldLabel}>What happened? What did you expect?</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Describe the steps you took, what you saw on screen, and what should have happened." style={{ ...S.input, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <div style={{ padding: "14px 24px", borderTop: "1px solid #eeeeec", display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
        <PrimaryBtn onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Submit issue"}</PrimaryBtn>
      </div>
    </Overlay>
  );
}

// ─── Detail drawer ──────────────────────────────────────────────────────────

function DetailDrawer({ issueId, staff, onClose, onChanged }: { issueId: string; staff: StaffRow[]; onClose: () => void; onChanged: () => void }) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api(`/issues/detail/${issueId}?staff_id=${userUUID}`);
      setIssue(r.data.issue);
      setComments(r.data.comments);
      setHistory(r.data.history);
      setIsAdmin(r.is_admin);
      setNote(r.data.issue.resolution_note ?? "");
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true); setErr("");
    try {
      await api(`/issues/${issueId}`, { method: "PATCH", body: JSON.stringify({ staff_id: userUUID, ...body }) });
      await load();
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setBusy(true); setErr("");
    try {
      await api(`/issues/${issueId}/comments`, { method: "POST", body: JSON.stringify({ staff_id: userUUID, body: reply, is_internal: internal }) });
      setReply(""); setInternal(false);
      await load();
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const isMine = issue?.reported_by === userUUID;
  const active = !!issue && ["open", "in_progress", "awaiting_info"].includes(issue.status);

  return (
    <Overlay onClose={onClose} side>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #eeeeec", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 2 }}>
        <div style={{ fontSize: 13, fontFamily: "monospace", color: "#888780" }}>{issue?.ticket_no ?? "Issue"}</div>
        <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#888780" }}>×</button>
      </div>

      {loading ? (
        <div style={{ padding: 48, textAlign: "center", color: "#888780", fontSize: 13 }}>Loading…</div>
      ) : !issue ? (
        <div style={{ padding: 24, color: "#a32d2d", fontSize: 13 }}>{err || "Issue not found."}</div>
      ) : (
        <div style={{ padding: "20px 24px 40px" }}>
          {err && <div style={{ padding: "8px 12px", background: "#fcebeb", border: "1px solid #f7c1c1", borderRadius: 8, fontSize: 12, color: "#a32d2d", marginBottom: 14 }}>{err}</div>}

          <div style={{ fontSize: 17, fontWeight: 600, color: "#1a1a18", lineHeight: 1.35, marginBottom: 10 }}>{issue.title}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <StatusBadge status={issue.status} />
            <PriorityTag priority={issue.priority} />
            <span style={{ fontSize: 12, color: "#888780" }}>{CATEGORIES[issue.category] ?? issue.category}</span>
          </div>

          <div style={{ fontSize: 12, color: "#888780", marginBottom: 14, lineHeight: 1.7 }}>
            Reported by <b style={{ color: "#5f5e5a" }}>{issue.reported_by_name ?? "Unknown"}</b> on {fmtDate(issue.created_at)}
            {issue.assigned_to_name && <> · Assigned to <b style={{ color: "#5f5e5a" }}>{issue.assigned_to_name}</b></>}
            {issue.related_reference && <> · Ref: <span style={{ fontFamily: "monospace", color: "#5f5e5a" }}>{issue.related_reference}</span></>}
          </div>

          <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.6, color: "#1a1a18", background: "#fafaf8", border: "1px solid #eeeeec", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
            {issue.description}
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <div style={{ ...S.card, padding: 16, marginBottom: 18, background: "#fafaf8" }}>
              <div style={S.sectionLabel}>Manage issue</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={S.fieldLabel}>Status</label>
                  <select disabled={busy} value={issue.status} onChange={(e) => patch({ status: e.target.value })} style={S.input}>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.fieldLabel}>Priority</label>
                  <select disabled={busy} value={issue.priority} onChange={(e) => patch({ priority: e.target.value })} style={S.input}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.fieldLabel}>Assigned to</label>
                  <select disabled={busy} value={issue.assigned_to ?? ""} onChange={(e) => patch({ assigned_to: e.target.value || null })} style={S.input}>
                    <option value="">Unassigned</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
              </div>

              <label style={S.fieldLabel}>Resolution note (shown to the reporter; required to resolve or reject)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="What was done, or why this can't be actioned." style={{ ...S.input, resize: "vertical", lineHeight: 1.5, marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={S.ghostBtn} disabled={busy || note === (issue.resolution_note ?? "")} onClick={() => patch({ resolution_note: note })}>Save note</button>
                {active && <PrimaryBtn disabled={busy || !note.trim()} onClick={() => patch({ status: "resolved", resolution_note: note })}>Mark resolved</PrimaryBtn>}
                {active && <PrimaryBtn danger disabled={busy || !note.trim()} onClick={() => patch({ status: "rejected", resolution_note: note })}>Reject</PrimaryBtn>}
                {issue.status === "resolved" && <PrimaryBtn disabled={busy} onClick={() => patch({ status: "closed" })}>Close issue</PrimaryBtn>}
              </div>
            </div>
          )}

          {/* Resolution (read-only for staff) */}
          {!isAdmin && issue.resolution_note && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: "#f0faf6", border: "1px solid #bfe8d6", marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#0f6e56", fontWeight: 500, marginBottom: 4 }}>Resolution</div>
              <div style={{ fontSize: 13, color: "#1a1a18", whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{issue.resolution_note}</div>
            </div>
          )}

          {/* Reporter actions */}
          {!isAdmin && isMine && (
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {issue.status === "resolved" && <button style={S.ghostBtn} disabled={busy} onClick={() => patch({ status: "open" })}>Not fixed — reopen</button>}
              {["open", "awaiting_info", "resolved"].includes(issue.status) && (
                <button style={{ ...S.ghostBtn, color: "#a32d2d" }} disabled={busy} onClick={() => window.confirm("Close this issue?") && patch({ status: "closed" })}>
                  Close issue
                </button>
              )}
            </div>
          )}

          {/* Conversation */}
          <div style={S.sectionLabel}>Conversation</div>
          {comments.length === 0 && <div style={{ fontSize: 12, color: "#b4b2a9", marginBottom: 12 }}>No replies yet.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
            {comments.map((c) => (
              <div key={c.id} style={{
                padding: "10px 12px", borderRadius: 10, fontSize: 13, lineHeight: 1.55,
                background: c.is_internal ? "#faeeda" : c.author_id === userUUID ? "#f0faf6" : "#fff",
                border: `1px solid ${c.is_internal ? "#fac775" : "#e8e8e6"}`,
              }}>
                <div style={{ fontSize: 11, color: "#888780", marginBottom: 3 }}>
                  <b style={{ color: "#5f5e5a" }}>{c.author_name ?? "Staff"}</b> · {timeAgo(c.created_at)}
                  {c.is_internal && <b style={{ color: "#854f0b" }}> · Internal note (admins only)</b>}
                </div>
                <div style={{ whiteSpace: "pre-wrap", color: "#1a1a18" }}>{c.body}</div>
              </div>
            ))}
          </div>

          {(isAdmin || (isMine && issue.status !== "closed" && issue.status !== "rejected")) ? (
            <div style={{ marginBottom: 22 }}>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder={isAdmin ? "Reply to the reporter or leave an internal note…" : "Add more detail or answer a question…"} style={{ ...S.input, resize: "vertical", lineHeight: 1.5, marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {isAdmin ? (
                  <label style={{ fontSize: 12, color: "#5f5e5a", display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note
                  </label>
                ) : <span />}
                <PrimaryBtn disabled={busy || !reply.trim()} onClick={sendReply}>Send reply</PrimaryBtn>
              </div>
            </div>
          ) : null}

          {/* Audit trail */}
          <div style={S.sectionLabel}>Activity</div>
          <div style={{ borderLeft: "2px solid #eeeeec", marginLeft: 4, paddingLeft: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((h) => (
              <div key={h.id} style={{ fontSize: 12, color: "#5f5e5a", lineHeight: 1.5 }}>
                <b style={{ color: "#1a1a18" }}>{h.actor_name ?? "Staff"}</b>{" "}
                {h.action === "created" ? "reported this issue"
                  : h.action === "resolution" ? `${h.to_value} the resolution note`
                  : <>changed {ACTION_LABEL[h.action]?.toLowerCase() ?? h.action}{h.from_value ? <> from <b>{label(h.from_value)}</b></> : null} to <b>{label(h.to_value)}</b></>}
                <div style={{ fontSize: 11, color: "#b4b2a9" }}>{fmtDate(h.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Overlay>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [assigned, setAssigned] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showReport, setShowReport] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const showToast = (m: string) => {
    setToast(m);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        staff_id: userUUID, scope, status, priority, category, assigned,
        page: String(page), limit: "20",
      });
      if (debounced) q.set("search", debounced);

      const [list, st] = await Promise.all([
        api(`/issues/${companyId}?${q.toString()}`),
        api(`/issues/${companyId}/stats?staff_id=${userUUID}&scope=${scope}`),
      ]);
      setIssues(list.data);
      setTotalPages(list.totalPages);
      setTotal(list.total);
      setIsAdmin(list.is_admin);
      setStats(st.data);
      setErr("");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [scope, status, priority, category, assigned, debounced, page]);

  useEffect(() => { load(); }, [load]);

  // Admins land on the all-issues queue the first time we learn they're admin
  const didInit = useRef(false);
  useEffect(() => {
    if (isAdmin && !didInit.current) {
      didInit.current = true;
      setScope("all");
      api(`/issues/${companyId}/assignees`).then((r) => setStaff(r.data)).catch(() => {});
    }
  }, [isAdmin]);

  const showAll = isAdmin && scope === "all";

  const statCards: { key: string; label: string; value: number; filter: string; accent?: string }[] = stats ? [
    { key: "open", label: "Open", value: stats.open, filter: "open", accent: "#185fa5" },
    { key: "in_progress", label: "In progress", value: stats.in_progress, filter: "in_progress", accent: "#854f0b" },
    { key: "awaiting_info", label: "Needs info", value: stats.awaiting_info, filter: "awaiting_info", accent: "#6b2fa0" },
    { key: "resolved", label: "Resolved", value: stats.resolved, filter: "resolved", accent: "#0f6e56" },
  ] : [];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", padding: "28px 20px"}}>
      <div style={{ maxWidth: '85%', margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#1a1a18" }}>Issues</div>
            <div style={{ fontSize: 12.5, color: "#888780", marginTop: 2 }}>
              {showAll ? "Every issue reported" : "Issues you have reported"}
            </div>
          </div>
          <PrimaryBtn onClick={() => setShowReport(true)}>+ Report an issue</PrimaryBtn>
        </div>

        {/* Admin scope switch */}
        {isAdmin && (
          <div style={{ display: "inline-flex", border: "1px solid #e8e8e6", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            {(["all", "mine"] as const).map((s) => (
              <button key={s} onClick={() => { setScope(s); setPage(1); }}
                style={{ padding: "7px 16px", fontSize: 12.5, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: scope === s ? "#1d9e75" : "#fff", color: scope === s ? "#fff" : "#5f5e5a", fontWeight: scope === s ? 500 : 400 }}>
                {s === "all" ? "All issues" : "My reports"}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 14 }}>
            {statCards.map((c) => (
              <div key={c.key} onClick={() => { setStatus(c.filter); setPage(1); }}
                style={{ ...S.card, padding: "12px 14px", cursor: "pointer", borderColor: status === c.filter ? c.accent : "#e8e8e6" }}>
                <div style={{ fontSize: 11.5, color: "#888780" }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: c.accent, marginTop: 2 }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}
        {showAll && stats && (stats.critical_active > 0 || stats.unassigned > 0) && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            {stats.critical_active > 0 && (
              <div onClick={() => { setPriority("critical"); setStatus("active"); setPage(1); }} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#fcebeb", border: "1px solid #f7c1c1", fontSize: 12.5, color: "#a32d2d" }}>
                {stats.critical_active} critical {stats.critical_active === 1 ? "issue is" : "issues are"} still active
              </div>
            )}
            {stats.unassigned > 0 && (
              <div onClick={() => { setAssigned("unassigned"); setStatus("active"); setPage(1); }} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: "#faeeda", border: "1px solid #fac775", fontSize: 12.5, color: "#854f0b" }}>
                {stats.unassigned} active {stats.unassigned === 1 ? "issue has" : "issues have"} no assignee
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, title or reference" style={{ ...S.input, flex: "1 1 220px", width: "auto" }} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ ...S.input, width: "auto" }}>
            <option value="active">Active</option>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} style={{ ...S.input, width: "auto" }}>
            <option value="all">Any priority</option>
            {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ ...S.input, width: "auto" }}>
            <option value="all">Any area</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {showAll && (
            <select value={assigned} onChange={(e) => { setAssigned(e.target.value); setPage(1); }} style={{ ...S.input, width: "auto" }}>
              <option value="all">Anyone</option>
              <option value="unassigned">Unassigned</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          )}
        </div>

        {err && <div style={{ padding: "10px 14px", background: "#fcebeb", border: "1px solid #f7c1c1", borderRadius: 8, fontSize: 12.5, color: "#a32d2d", marginBottom: 12 }}>{err}</div>}

        {/* List */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center", fontSize: 13, color: "#888780" }}>Loading issues…</div>
          ) : issues.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#1a1a18", marginBottom: 4 }}>No issues match these filters</div>
              <div style={{ fontSize: 12.5, color: "#888780" }}>Use “Report an issue” to log your issue.</div>
            </div>
          ) : (
            issues.map((i, idx) => (
              <div key={i.id} onClick={() => setOpenId(i.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fafaf8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ padding: "13px 18px", cursor: "pointer", borderTop: idx ? "1px solid #eeeeec" : "none", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: PRIORITY_META[i.priority]?.color ?? "#888780", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "#1a1a18", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</div>
                  <div style={{ fontSize: 11.5, color: "#888780", marginTop: 3 }}>
                    <span style={{ fontFamily: "monospace" }}>{i.ticket_no}</span> · {CATEGORIES[i.category] ?? i.category}
                    {showAll && <> · {i.reported_by_name ?? "Unknown"}</>} · {timeAgo(i.created_at)}
                    {!!i.comment_count && <> · {i.comment_count} {i.comment_count === 1 ? "reply" : "replies"}</>}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end", flexShrink: 0 }}>
                  <StatusBadge status={i.status} />
                  <span style={{ fontSize: 11, color: "#888780" }}>{i.assigned_to_name ? `→ ${i.assigned_to_name}` : <PriorityTag priority={i.priority} />}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 12.5, color: "#888780" }}>
            <span>{total} issues</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={S.ghostBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {totalPages}</span>
              <button style={S.ghostBtn} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showReport && (
        <ReportModal
          onClose={() => setShowReport(false)}
          onCreated={() => { setShowReport(false); setStatus("active"); setPage(1); load(); showToast("Issue submitted. An admin will review it."); }}
        />
      )}

      {openId && <DetailDrawer issueId={openId} staff={staff} onClose={() => setOpenId(null)} onChanged={load} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1a1a18", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 13, zIndex: 60 }}>
          {toast}
        </div>
      )}
    </div>
  );
}