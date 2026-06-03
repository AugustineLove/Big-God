import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Users, TrendingUp, Download, Eye,
  CheckCircle, Clock, AlertCircle, ChevronRight,
  DollarSign, FileText, Banknote, X, ArrowLeft,
  Plus, Search, Play, Loader2, RefreshCw,
  ChevronDown, Edit2, Trash2, Shield, CreditCard,
  BarChart2, AlertTriangle, Check, Building2
} from 'lucide-react';
import { companyId, userUUID } from '../../../../constants/appConstants';

const BASE = 'http://localhost:5050/api/payroll';

// ─── helpers ─────────────────────────────────────────────────
const fmt = (v) => parseFloat(v || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtShort = (v) => {
  const n = parseFloat(v || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(2);
};

const STATUS_STYLES = {
  draft:      'bg-slate-100 text-slate-600 border border-slate-200',
  processing: 'bg-blue-50  text-blue-700  border border-blue-200',
  reviewed:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:   'bg-violet-50 text-violet-700 border border-violet-200',
  paid:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled:  'bg-red-50   text-red-600   border border-red-200',
};

const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
    {status}
  </span>
);

// ─── toast ───────────────────────────────────────────────────
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colours = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-[#0B3B3C]' };
  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl text-sm font-medium ${colours[type] || colours.info}`}>
      {type === 'success' && <CheckCircle size={16} />}
      {type === 'error'   && <AlertTriangle size={16} />}
      {type === 'info'    && <Clock size={16} />}
      {msg}
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
};
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = 'info') => setToast({ msg, type }), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
};

// ─── Modal wrapper ────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} /></button>
      </div>
      <div className="overflow-y-auto flex-1">{children}</div>
    </div>
  </div>
);

// ─── Stat card ────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-3 rounded-xl ml-3 flex-shrink-0 ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// NEW PERIOD MODAL
// ─────────────────────────────────────────────────────────────
const NewPeriodModal = ({ onClose, onCreated, toast }) => {
  const now = new Date();
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const [form, setForm] = useState({
    name: `${now.toLocaleString('default', { month: 'long' })} ${y} Payroll`,
    period_start: `${y}-${m}-01`,
    period_end:   `${y}-${m}-${lastDay}`,
    payment_date: `${y}-${m}-${lastDay}`,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name || !form.period_start || !form.period_end)
      return toast.show('Name, start & end dates are required', 'error');
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/${companyId}/periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      toast.show('Payroll period created!', 'success');
      onCreated(data.data);
      onClose();
    } catch (e) {
      toast.show(e.message, 'error');
    } finally { setSaving(false); }
  };

  const Field = ({ label, type = 'text', field, placeholder }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type={type} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/30 focus:border-[#0B3B3C] transition"
        value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
    </div>
  );

  return (
    <Modal title="New Payroll Period" onClose={onClose}>
      <div className="p-6 space-y-4">
        <Field label="Period Name" field="name" placeholder="e.g. May 2025 Payroll" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" type="date" field="period_start" />
          <Field label="End Date"   type="date" field="period_end" />
        </div>
        <Field label="Payment Date" type="date" field="payment_date" />
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
          <textarea rows={2} placeholder="Optional notes..."
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/30 focus:border-[#0B3B3C] resize-none transition"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex-1 py-2.5 bg-[#0B3B3C] text-white rounded-xl font-semibold text-sm hover:bg-[#0a2e2f] transition disabled:opacity-50 flex items-center justify-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />}
          {saving ? 'Creating…' : 'Create Period'}
        </button>
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────
// DASHBOARD VIEW
// ─────────────────────────────────────────────────────────────
const DashboardView = ({ onNav, toast }) => {
  const [stats, setStats]     = useState(null);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [running, setRunning] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`${BASE}/${companyId}/stats`),
        fetch(`${BASE}/${companyId}/periods`),
      ]);
      const [sData, pData] = await Promise.all([sRes.json(), pRes.json()]);
      if (sData.data) setStats(sData.data);
      if (pData.data) setPeriods(pData.data.slice(0, 8));
    } catch { toast.show('Failed to load dashboard data', 'error'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runPayroll = async (periodId) => {
    setRunning(periodId);
    try {
      const res = await fetch(`${BASE}/${companyId}/periods/${periodId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Run failed');
      toast.show(`✓ Payroll computed — ${data.data.employee_count} staff processed`, 'success');
      load();
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setRunning(null); }
  };

  const ytd = stats?.ytd || {};
  const ssnitTotal = (parseFloat(ytd.ytd_ssnit_emp || 0) + parseFloat(ytd.ytd_ssnit_er || 0));

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
      <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="space-y-7">
      {/* header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payroll</h1>
          <p className="text-sm text-gray-500 mt-0.5">PAYE · SSNIT Tier 1/2/3</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
          <button onClick={() => setShowNew(true)}
            className="px-4 py-2.5 bg-[#0B3B3C] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2e2f] transition flex items-center gap-2">
            <Plus size={15} /> New Payroll Run
          </button>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Staff"     value={stats?.activeStaff || 0}
          sub="Payroll eligible" icon={Users} accent="bg-[#0B3B3C]" />
        <StatCard title="YTD Gross"        value={`GHS ${fmtShort(ytd.ytd_gross)}`}
          sub="Year to date" icon={Banknote} accent="bg-[#0B3B3C]" />
        <StatCard title="YTD PAYE"         value={`GHS ${fmtShort(ytd.ytd_paye)}`}
          sub="Income tax remitted" icon={TrendingUp} accent="bg-[#0B3B3C]" />
        <StatCard title="SSNIT (YTD)"      value={`GHS ${fmtShort(ssnitTotal)}`}
          sub="Employee + Employer" icon={Shield} accent="bg-[#0B3B3C]" />
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Staff Setup',   sub: 'Salaries, allowances & deductions', view: 'staff',   icon: Users },
          { label: 'Approve & Pay', sub: 'Review computed payroll runs',       view: 'approve', icon: CheckCircle },
          { label: 'Reports',       sub: 'PAYE, SSNIT & payslip exports',      view: 'reports', icon: BarChart2 },
        ].map(({ label, sub, view, icon: Icon }) => (
          <button key={view} onClick={() => onNav(view)}
            className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-[#0B3B3C]/20 transition-all group flex items-start gap-4">
            <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-[#0B3B3C]/5 transition-colors">
              <Icon size={20} className="text-[#0B3B3C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0B3B3C] mt-1 transition-colors" />
          </button>
        ))}
      </div>

      {/* periods table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Payroll Periods</h2>
          <span className="text-xs text-gray-400">{periods.length} record{periods.length !== 1 ? 's' : ''}</span>
        </div>

        {periods.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No payroll periods yet.</p>
            <button onClick={() => setShowNew(true)}
              className="mt-3 px-4 py-2 bg-[#0B3B3C] text-white text-sm rounded-xl font-semibold hover:bg-[#0a2e2f] transition">
              Create First Period
            </button>
          </div>
        ) : (
          <>
            {/* desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Period</th>
                    <th className="px-6 py-3 text-left">Dates</th>
                    <th className="px-6 py-3 text-right">Staff</th>
                    <th className="px-6 py-3 text-right">Gross</th>
                    <th className="px-6 py-3 text-right">Net</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {periods.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(p.period_start).toLocaleDateString('en-GH', { day:'2-digit', month:'short' })}
                        {' – '}
                        {new Date(p.period_end).toLocaleDateString('en-GH', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">{p.employee_count || 0}</td>
                      <td className="px-6 py-4 text-right tabular-nums font-medium">GHS {fmt(p.total_gross)}</td>
                      <td className="px-6 py-4 text-right tabular-nums text-emerald-700 font-medium">GHS {fmt(p.total_net)}</td>
                      <td className="px-6 py-4 text-center"><StatusBadge status={p.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onNav('periodDetail', p)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                            <Eye size={15} className="text-gray-500" />
                          </button>
                          {p.status === 'draft' && (
                            <button onClick={() => runPayroll(p.id)} disabled={running === p.id}
                              className="px-2.5 py-1 bg-[#0B3B3C] text-white rounded-lg text-xs font-semibold hover:bg-[#0a2e2f] transition disabled:opacity-50 flex items-center gap-1">
                              {running === p.id ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                              Run
                            </button>
                          )}
                          {p.status === 'reviewed' && (
                            <button onClick={() => onNav('approve', p)}
                              className="px-2.5 py-1 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition">
                              Approve
                            </button>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => onNav('approve', p)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {periods.map(p => (
                <div key={p.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(p.period_start).toLocaleDateString()} – {new Date(p.period_end).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Gross</p>
                      <p className="font-bold text-gray-800">GHS {fmt(p.total_gross)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Net</p>
                      <p className="font-bold text-emerald-700">GHS {fmt(p.total_net)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => onNav('periodDetail', p)} className="p-2 hover:bg-gray-100 rounded-xl">
                        <Eye size={16} className="text-gray-500" />
                      </button>
                      {p.status === 'draft' && (
                        <button onClick={() => runPayroll(p.id)} disabled={running === p.id}
                          className="px-3 py-1.5 bg-[#0B3B3C] text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                          {running === p.id ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Run
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showNew && <NewPeriodModal onClose={() => setShowNew(false)} onCreated={() => load()} toast={toast} />}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STAFF SETUP VIEW
// ─────────────────────────────────────────────────────────────
const StaffSetupView = ({ onNav, toast }) => {
  const [staff,   setStaff]   = useState([]);
  const [types,   setTypes]   = useState({ allowanceTypes: [], deductionTypes: [], salaryGrades: [] });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [selected, setSelected] = useState(null);   // staff being configured
  const [tab,      setTab]      = useState('profile'); // profile | allowances | deductions | preview

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`${BASE}/${companyId}/staff`),
        fetch(`${BASE}/${companyId}/types`),
      ]);
      const [sData, tData] = await Promise.all([sRes.json(), tRes.json()]);
      if (sData.data) setStaff(sData.data);
      if (tData.data) setTypes(tData.data);
    } catch { toast.show('Failed to load staff data', 'error'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase()) ||
    s.staff_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) return (
    <StaffProfileEditor
      staffMember={selected} types={types}
      onBack={() => { setSelected(null); load(); }} toast={toast}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNav('dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Staff Payroll Setup</h1>
          <p className="text-sm text-gray-500">Configure salaries, allowances & deductions per staff</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search staff…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20" />
          </div>
          <p className="text-xs text-gray-400">{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[0,1,2,3,4].map(i => <div key={i} className="px-6 py-4 h-16 animate-pulse bg-gray-50/50" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No staff found.</p>
          </div>
        ) : (
          <>
            {/* desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Dept / Grade</th>
                    <th className="px-6 py-3 text-right">Basic Salary</th>
                    <th className="px-6 py-3 text-right">Allowances</th>
                    <th className="px-6 py-3 text-right">Deductions</th>
                    <th className="px-6 py-3 text-center">Payroll</th>
                    <th className="px-6 py-3 text-center">Setup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{s.full_name}</p>
                        <p className="text-xs text-gray-400">{s.staff_id}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <p>{s.department || '—'}</p>
                        <p className="text-xs text-gray-400">{s.grade_name || s.job_title || '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">
                        {s.basic_salary ? `GHS ${fmt(s.basic_salary)}` : <span className="text-red-400 text-xs">Not set</span>}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-emerald-700">
                        +GHS {fmt(s.total_allowances)}
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums text-orange-600">
                        −GHS {fmt(s.total_deductions)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.is_payroll_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.is_payroll_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setSelected(s)}
                          className="px-3 py-1.5 bg-[#0B3B3C] text-white rounded-lg text-xs font-semibold hover:bg-[#0a2e2f] transition flex items-center gap-1.5 mx-auto">
                          <Edit2 size={11} /> Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map(s => (
                <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900">{s.full_name}</p>
                    <p className="text-xs text-gray-400">{s.department || s.job_title || s.staff_id}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      {s.basic_salary ? `GHS ${fmt(s.basic_salary)}` : <span className="text-red-400 text-xs">No salary set</span>}
                    </p>
                  </div>
                  <button onClick={() => setSelected(s)}
                    className="px-3 py-2 bg-[#0B3B3C] text-white rounded-xl text-xs font-semibold flex items-center gap-1">
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// STAFF PROFILE EDITOR  (salary + allowances + deductions)
// ─────────────────────────────────────────────────────────────
const StaffProfileEditor = ({ staffMember, types, onBack, toast }) => {
  const [tab,      setTab]    = useState('profile');
  const [profile,  setProfile] = useState(null);
  const [preview,  setPreview] = useState(null);
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  const [profForm, setProfForm] = useState({
    basic_salary: '', grade_id: '', use_grade_salary: false, salary_account_number: '',
    payment_method: 'bank', is_tax_exempt: false, tax_relief: '0',
    ssnit_exempt: false, effective_from: new Date().toISOString().slice(0,10),
    tin_number: '', ssnit_number: '', bank_name: '', bank_branch: '',
    bank_account_name: '', bank_account_number: '', hire_date: '',
    employment_type: 'full_time', department: staffMember.department || '',
    job_title: staffMember.job_title || '',
  });

  const [newAllowance, setNewAllowance] = useState({ allowance_type_id: '', calculation_type: 'fixed', amount: '' });
  const [newDeduction, setNewDeduction] = useState({ deduction_type_id: '', calculation_type: 'fixed', amount: '', total_limit: '' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes, dRes] = await Promise.all([
        fetch(`${BASE}/${companyId}/staff/${staffMember.id}/profile`),
        fetch(`${BASE}/${companyId}/staff/${staffMember.id}/allowances`),
        fetch(`${BASE}/${companyId}/staff/${staffMember.id}/deductions`),
      ]);
      const [pData, aData, dData] = await Promise.all([pRes.json(), aRes.json(), dRes.json()]);
      if (pData.data) {
        setProfile(pData.data);
        setProfForm(f => ({
          ...f,
          basic_salary:       pData.data.basic_salary || '',
          grade_id:           pData.data.grade_id || '',
          use_grade_salary:   pData.data.use_grade_salary || false,
          payment_method:     pData.data.payment_method || 'bank',
          is_tax_exempt:      pData.data.is_tax_exempt || false,
          tax_relief:         pData.data.tax_relief || '0',
          ssnit_exempt:       pData.data.ssnit_exempt || false,
          effective_from:     pData.data.effective_from?.slice(0,10) || f.effective_from,
          tin_number:         pData.data.tin_number || '',
          ssnit_number:       pData.data.ssnit_number || '',
          bank_name:          pData.data.bank_name || '',
          bank_branch:        pData.data.bank_branch || '',
          bank_account_name:  pData.data.bank_account_name || '',
          bank_account_number:pData.data.bank_account_number || '',
          hire_date:          pData.data.hire_date?.slice(0,10) || '',
          employment_type:    pData.data.employment_type || 'full_time',
          department:         pData.data.department || staffMember.department || '',
          job_title:          pData.data.job_title || staffMember.job_title || '',
          salary_account_number: pData.data.salary_account_number || '',
        }));
      }
      if (aData.data) setAllowances(aData.data);
      if (dData.data) setDeductions(dData.data);
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setLoading(false); }
  }, [staffMember.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadPreview = async () => {
    try {
      const res  = await fetch(`${BASE}/${companyId}/staff/${staffMember.id}/preview`);
      const data = await res.json();
      if (data.data) setPreview(data.data);
      else toast.show(data.message || 'No salary profile set yet', 'error');
    } catch { toast.show('Preview failed', 'error'); }
  };
  useEffect(() => { if (tab === 'preview') loadPreview(); }, [tab]);

  const saveProfile = async () => {
    console.log(`${JSON.stringify({ ...profForm, created_by: userUUID })}`)
    if (!profForm.basic_salary && !profForm.use_grade_salary && !profForm.salary_account_number)
      return toast.show('Salary account number and Basic salary is required (or use grade salary)', 'error');
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/${companyId}/staff/${staffMember.id}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profForm, created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      toast.show('Profile saved!', 'success');
      loadAll();
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const addAllowance = async () => {
    if (!newAllowance.allowance_type_id || !newAllowance.amount)
      return toast.show('Select allowance type and enter amount', 'error');
    try {
      const res  = await fetch(`${BASE}/${companyId}/staff/${staffMember.id}/allowances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAllowance, created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.show('Allowance added', 'success');
      setNewAllowance({ allowance_type_id: '', calculation_type: 'fixed', amount: '' });
      loadAll();
    } catch (e) { toast.show(e.message, 'error'); }
  };

  const removeAllowance = async (id) => {
    try {
      await fetch(`${BASE}/${companyId}/allowances/${id}`, { method: 'DELETE' });
      toast.show('Allowance removed', 'success');
      loadAll();
    } catch { toast.show('Remove failed', 'error'); }
  };

  const addDeduction = async () => {
    if (!newDeduction.deduction_type_id || !newDeduction.amount)
      return toast.show('Select deduction type and enter amount', 'error');
    try {
      const res  = await fetch(`${BASE}/${companyId}/staff/${staffMember.id}/deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDeduction, created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.show('Deduction added', 'success');
      setNewDeduction({ deduction_type_id: '', calculation_type: 'fixed', amount: '', total_limit: '' });
      loadAll();
    } catch (e) { toast.show(e.message, 'error'); }
  };

  const removeDeduction = async (id) => {
    try {
      await fetch(`${BASE}/${companyId}/deductions/${id}`, { method: 'DELETE' });
      toast.show('Deduction removed', 'success');
      loadAll();
    } catch { toast.show('Remove failed', 'error'); }
  };

  const TABS = ['profile', 'allowances', 'deductions', 'preview'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{staffMember.full_name}</h1>
          <p className="text-sm text-gray-500">{staffMember.job_title || staffMember.role || ''} · {staffMember.staff_id}</p>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${tab === t ? 'bg-white text-[#0B3B3C] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" /> : (

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* salary */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Salary</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Basic Salary (GHS)</label>
                    <input type="number" placeholder="e.g. 3500.00"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20 focus:border-[#0B3B3C]"
                      value={profForm.basic_salary}
                      onChange={e => setProfForm({ ...profForm, basic_salary: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Salary account (GHS)</label>
                    <input placeholder="e.g. BGSE0010001SA1"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20 focus:border-[#0B3B3C]"
                      value={profForm.salary_account_number}
                      onChange={e => setProfForm({ ...profForm, salary_account_number: e.target.value })} />
                  </div>
                  {types.salaryGrades?.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Salary Grade</label>
                      <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                        value={profForm.grade_id}
                        onChange={e => setProfForm({ ...profForm, grade_id: e.target.value })}>
                        <option value="">— No grade —</option>
                        {types.salaryGrades.map(g => <option key={g.id} value={g.id}>{g.name} (GHS {fmt(g.basic_salary)})</option>)}
                      </select>
                    </div>
                  )}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={profForm.use_grade_salary}
                      onChange={e => setProfForm({ ...profForm, use_grade_salary: e.target.checked })}
                      className="w-4 h-4 accent-[#0B3B3C] rounded" />
                    <span className="text-sm text-gray-700">Use grade salary (overrides basic)</span>
                  </label>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Tax Relief (GHS / month)</label>
                    <input type="number" placeholder="0.00"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.tax_relief}
                      onChange={e => setProfForm({ ...profForm, tax_relief: e.target.value })} />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={profForm.is_tax_exempt}
                        onChange={e => setProfForm({ ...profForm, is_tax_exempt: e.target.checked })}
                        className="w-4 h-4 accent-[#0B3B3C] rounded" />
                      <span className="text-sm text-gray-700">Tax Exempt</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={profForm.ssnit_exempt}
                        onChange={e => setProfForm({ ...profForm, ssnit_exempt: e.target.checked })}
                        className="w-4 h-4 accent-[#0B3B3C] rounded" />
                      <span className="text-sm text-gray-700">SSNIT Exempt</span>
                    </label>
                  </div>
                </div>

                {/* employment */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Employment</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                      <input type="text" placeholder="e.g. Finance"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                        value={profForm.department}
                        onChange={e => setProfForm({ ...profForm, department: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Job Title</label>
                      <input type="text" placeholder="e.g. Manager"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                        value={profForm.job_title}
                        onChange={e => setProfForm({ ...profForm, job_title: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Employment Type</label>
                    <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.employment_type}
                      onChange={e => setProfForm({ ...profForm, employment_type: e.target.value })}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Hire Date</label>
                    <input type="date"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.hire_date}
                      onChange={e => setProfForm({ ...profForm, hire_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Payment Method</label>
                    <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.payment_method}
                      onChange={e => setProfForm({ ...profForm, payment_method: e.target.value })}>
                      <option value="bank">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="momo">Mobile Money</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Effective From</label>
                    <input type="date"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.effective_from}
                      onChange={e => setProfForm({ ...profForm, effective_from: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* statutory & banking */}
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Statutory IDs</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">TIN Number</label>
                    <input type="text" placeholder="C0012345678"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.tin_number}
                      onChange={e => setProfForm({ ...profForm, tin_number: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">SSNIT Number</label>
                    <input type="text" placeholder="A123456789"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.ssnit_number}
                      onChange={e => setProfForm({ ...profForm, ssnit_number: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Banking</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Bank Name</label>
                      <input type="text" placeholder="GCB Bank"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                        value={profForm.bank_name}
                        onChange={e => setProfForm({ ...profForm, bank_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Branch</label>
                      <input type="text" placeholder="Head Office"
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                        value={profForm.bank_branch}
                        onChange={e => setProfForm({ ...profForm, bank_branch: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Account Name</label>
                    <input type="text" placeholder="Kwame Mensah"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.bank_account_name}
                      onChange={e => setProfForm({ ...profForm, bank_account_name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Account Number</label>
                    <input type="text" placeholder="1234567890"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={profForm.bank_account_number}
                      onChange={e => setProfForm({ ...profForm, bank_account_number: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-3">
                <button onClick={saveProfile} disabled={saving}
                  className="px-6 py-2.5 bg-[#0B3B3C] text-white rounded-xl font-semibold text-sm hover:bg-[#0a2e2f] transition disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
                <button onClick={() => setTab('preview')}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition flex items-center gap-2">
                  <Eye size={14} /> Preview Payslip
                </button>
              </div>
            </div>
          )}

          {/* ── ALLOWANCES TAB ── */}
          {tab === 'allowances' && (
            <div className="p-6 space-y-5">
              {/* add form */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Add Allowance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newAllowance.allowance_type_id}
                    onChange={e => setNewAllowance({ ...newAllowance, allowance_type_id: e.target.value })}>
                    <option value="">— Select type —</option>
                    {types.allowanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newAllowance.calculation_type}
                    onChange={e => setNewAllowance({ ...newAllowance, calculation_type: e.target.value })}>
                    <option value="fixed">Fixed Amount (GHS)</option>
                    <option value="percentage_of_basic">% of Basic</option>
                  </select>
                  <div className="flex gap-2">
                    <input type="number" placeholder={newAllowance.calculation_type === 'fixed' ? 'Amount (GHS)' : 'Percentage (%)'}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                      value={newAllowance.amount}
                      onChange={e => setNewAllowance({ ...newAllowance, amount: e.target.value })} />
                    <button onClick={addAllowance}
                      className="px-4 py-2 bg-[#0B3B3C] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2e2f] transition">
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* existing */}
              {allowances.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No allowances configured.</div>
              ) : (
                <div className="space-y-2">
                  {allowances.map(a => (
                    <div key={a.id} className={`flex items-center justify-between p-4 rounded-xl border ${a.is_active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{a.type_name}</p>
                        <p className="text-xs text-gray-400">
                          {a.calculation_type === 'fixed' ? `GHS ${fmt(a.amount)}` : `${a.amount}% of basic`}
                          {' · '}<span className={`${a.taxability === 'taxable' ? 'text-orange-500' : 'text-emerald-600'}`}>{a.taxability}</span>
                          {!a.is_active && ' · Inactive'}
                        </p>
                      </div>
                      {a.is_active && (
                        <button onClick={() => removeAllowance(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DEDUCTIONS TAB ── */}
          {tab === 'deductions' && (
            <div className="p-6 space-y-5">
              {/* add form */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Add Deduction</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newDeduction.deduction_type_id}
                    onChange={e => setNewDeduction({ ...newDeduction, deduction_type_id: e.target.value })}>
                    <option value="">— Select type —</option>
                    {types.deductionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newDeduction.calculation_type}
                    onChange={e => setNewDeduction({ ...newDeduction, calculation_type: e.target.value })}>
                    <option value="fixed">Fixed Amount (GHS)</option>
                    <option value="percentage_of_basic">% of Basic</option>
                    <option value="percentage_of_gross">% of Gross</option>
                  </select>
                  <input type="number" placeholder="Amount / Percentage"
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newDeduction.amount}
                    onChange={e => setNewDeduction({ ...newDeduction, amount: e.target.value })} />
                  <input type="number" placeholder="Total Limit (optional, e.g. loan balance)"
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20"
                    value={newDeduction.total_limit}
                    onChange={e => setNewDeduction({ ...newDeduction, total_limit: e.target.value })} />
                </div>
                <button onClick={addDeduction}
                  className="px-4 py-2 bg-[#0B3B3C] text-white rounded-xl text-sm font-semibold hover:bg-[#0a2e2f] transition">
                  Add Deduction
                </button>
              </div>

              {deductions.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No deductions configured.</div>
              ) : (
                <div className="space-y-2">
                  {deductions.map(d => (
                    <div key={d.id} className={`flex items-center justify-between p-4 rounded-xl border ${d.is_active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{d.type_name}</p>
                        <p className="text-xs text-gray-400">
                          {d.calculation_type === 'fixed' ? `GHS ${fmt(d.amount)}` : `${d.amount}% ${d.calculation_type === 'percentage_of_gross' ? 'of gross' : 'of basic'}`}
                          {d.total_limit ? ` · Limit: GHS ${fmt(d.total_limit)}` : ''}
                          {' · '}{d.tax_treatment}
                          {!d.is_active && ' · Inactive'}
                        </p>
                      </div>
                      {d.is_active && (
                        <button onClick={() => removeDeduction(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PREVIEW TAB ── */}
          {tab === 'preview' && (
            <div className="p-6">
              {!preview ? (
                <div className="py-12 text-center">
                  <button onClick={loadPreview} className="px-5 py-2.5 bg-[#0B3B3C] text-white rounded-xl font-semibold text-sm hover:bg-[#0a2e2f]">
                    Load Preview
                  </button>
                  <p className="text-xs text-gray-400 mt-2">Computes a live payroll preview without saving anything</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Basic',    v: preview.basicSalary,    c: 'text-gray-900' },
                      { label: 'Gross',    v: preview.grossSalary,    c: 'text-blue-700' },
                      { label: 'Taxable',  v: preview.taxableIncome,  c: 'text-orange-600' },
                      { label: 'Net Pay',  v: preview.netSalary,      c: 'text-emerald-700 font-extrabold' },
                    ].map(({ label, v, c }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className={`text-lg font-bold ${c}`}>GHS {fmt(v)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Earnings</h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">Basic Salary</span>
                          <span className="font-medium tabular-nums">GHS {fmt(preview.basicSalary)}</span>
                        </div>
                        {preview.allowanceLines?.map((a, i) => (
                          <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                            <span className="text-gray-600">{a.name} <span className="text-xs text-gray-400">({a.taxability})</span></span>
                            <span className="font-medium tabular-nums text-emerald-700">+GHS {fmt(a.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Deductions</h3>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">SSNIT Employee (5.5%)</span>
                          <span className="font-medium tabular-nums text-orange-600">−GHS {fmt(preview.ssnitEmployee)}</span>
                        </div>
                        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">PAYE Income Tax</span>
                          <span className="font-medium tabular-nums text-orange-600">−GHS {fmt(preview.paye)}</span>
                        </div>
                        {preview.deductionLines?.map((d, i) => (
                          <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                            <span className="text-gray-600">{d.name}</span>
                            <span className="font-medium tabular-nums text-orange-600">−GHS {fmt(d.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                          <span className="text-gray-400 text-xs">Employer SSNIT (13%) — company cost</span>
                          <span className="text-xs text-gray-400">GHS {fmt(preview.ssnitEmployer)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0B3B3C] rounded-xl p-4 flex justify-between items-center text-white">
                    <span className="font-semibold">Net Pay</span>
                    <span className="text-2xl font-extrabold tabular-nums">GHS {fmt(preview.netSalary)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// APPROVE VIEW
// ─────────────────────────────────────────────────────────────
const ApproveView = ({ onNav, initPeriod, toast }) => {
  const [periods,  setPeriods]  = useState([]);
  const [selected, setSelected] = useState(initPeriod || null);
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(false);

  useEffect(() => {
    fetch(`${BASE}/${companyId}/periods`)
      .then(r => r.json())
      .then(d => { if (d.data) setPeriods(d.data.filter(p => ['reviewed','approved'].includes(p.status))); })
      .catch(() => toast.show('Failed loading periods', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    fetch(`${BASE}/${companyId}/periods/${selected.id}/entries`)
      .then(r => r.json())
      .then(d => { if (d.data) setEntries(d.data); })
      .catch(() => toast.show('Failed loading entries', 'error'))
      .finally(() => setLoading(false));
  }, [selected]);

  const approve = async () => {
    setActing(true);
    try {
      const res  = await fetch(`${BASE}/${companyId}/periods/${selected.id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.show(data.message || 'Approved! Payslips generated.', 'success');
      setSelected(p => ({ ...p, status: 'approved' }));
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setActing(false); }
  };

  const markPaid = async () => {
    setActing(true);
    try {
      const res  = await fetch(`${BASE}/${companyId}/periods/${selected.id}/mark-paid`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_by: userUUID, payment_date: new Date().toISOString().slice(0,10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.show('Payroll marked as paid! Bank JE posted.', 'success');
      setSelected(p => ({ ...p, status: 'paid' }));
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setActing(false); }
  };

  const totals = entries.reduce((a, e) => ({
    gross: a.gross + parseFloat(e.gross_salary || 0),
    net:   a.net   + parseFloat(e.net_salary   || 0),
    paye:  a.paye  + parseFloat(e.income_tax_paye || 0),
    ssnit: a.ssnit + parseFloat(e.ssnit_employee  || 0),
  }), { gross:0, net:0, paye:0, ssnit:0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNav('dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Approve & Pay</h1>
          <p className="text-sm text-gray-500">Review computed payroll, approve, then mark as paid</p>
        </div>
      </div>

      {/* period picker */}
      {!selected ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Select a Period to Review</h2>
          </div>
          {loading ? <div className="h-32 animate-pulse m-6 bg-gray-100 rounded-xl" /> :
           periods.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <CheckCircle size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm">No periods awaiting review or approval.</p>
              <p className="text-xs mt-1">Run payroll first from the dashboard.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {periods.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 text-left transition">
                  <div>
                    <p className="font-bold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.employee_count} staff · GHS {fmt(p.total_gross)} gross</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setSelected(null)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft size={14} /> All Periods
            </button>
            <span className="text-gray-300">›</span>
            <span className="font-bold text-gray-800">{selected.name}</span>
            <StatusBadge status={selected.status} />
            <div className="flex-1" />
            {selected.status === 'reviewed' && (
              <button onClick={approve} disabled={acting}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2">
                {acting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve & Generate Payslips
              </button>
            )}
            {selected.status === 'approved' && (
              <button onClick={markPaid} disabled={acting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
                {acting ? <Loader2 size={14} className="animate-spin" /> : <Banknote size={14} />}
                Mark as Paid
              </button>
            )}
          </div>

          {/* summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:'Total Gross', v: totals.gross, c: 'text-gray-900' },
              { label:'Net Pay',     v: totals.net,   c: 'text-emerald-700' },
              { label:'PAYE Tax',    v: totals.paye,  c: 'text-orange-600' },
              { label:'SSNIT (Emp)', v: totals.ssnit, c: 'text-violet-700' },
            ].map(({ label, v, c }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-xl font-extrabold ${c}`}>GHS {fmt(v)}</p>
              </div>
            ))}
          </div>

          {/* entries table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/50">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="px-6 py-3 text-left">Staff</th>
                    <th className="px-6 py-3 text-right">Basic</th>
                    <th className="px-6 py-3 text-right">Allow.</th>
                    <th className="px-6 py-3 text-right">Gross</th>
                    <th className="px-6 py-3 text-right">PAYE</th>
                    <th className="px-6 py-3 text-right">SSNIT</th>
                    <th className="px-6 py-3 text-right">Net Pay</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-gray-800">{e.full_name}</p>
                        <p className="text-xs text-gray-400">{e.job_title || e.department || ''}</p>
                      </td>
                      <td className="px-6 py-3.5 text-right tabular-nums">GHS {fmt(e.basic_salary)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-emerald-700">+{fmt(e.total_allowances)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums font-medium">GHS {fmt(e.gross_salary)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-orange-600">{fmt(e.income_tax_paye)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums text-violet-600">{fmt(e.ssnit_employee)}</td>
                      <td className="px-6 py-3.5 text-right tabular-nums font-extrabold text-emerald-700">GHS {fmt(e.net_salary)}</td>
                      <td className="px-6 py-3.5 text-center"><StatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr className="text-sm font-bold">
                    <td className="px-6 py-3 text-gray-500">TOTAL ({entries.length} staff)</td>
                    <td className="px-6 py-3 text-right tabular-nums">GHS {fmt(totals.gross - totals.gross + entries.reduce((a,e) => a + parseFloat(e.basic_salary||0), 0))}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-emerald-700">+{fmt(entries.reduce((a,e) => a + parseFloat(e.total_allowances||0), 0))}</td>
                    <td className="px-6 py-3 text-right tabular-nums">GHS {fmt(totals.gross)}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-orange-600">{fmt(totals.paye)}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-violet-600">{fmt(totals.ssnit)}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-emerald-700">GHS {fmt(totals.net)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {entries.map(e => (
                <div key={e.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{e.full_name}</p>
                      <p className="text-xs text-gray-400">{e.job_title || e.department || ''}</p>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                    <div><p className="text-gray-400">Gross</p><p className="font-bold">GHS {fmt(e.gross_salary)}</p></div>
                    <div><p className="text-gray-400">PAYE</p><p className="font-bold text-orange-600">{fmt(e.income_tax_paye)}</p></div>
                    <div><p className="text-gray-400">Net</p><p className="font-bold text-emerald-700">GHS {fmt(e.net_salary)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// REPORTS VIEW
// ─────────────────────────────────────────────────────────────
const ReportsView = ({ onNav, toast }) => {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(new Date().getFullYear());

  useEffect(() => {
    fetch(`${BASE}/${companyId}/periods`)
      .then(r => r.json())
      .then(d => { if (d.data) setPeriods(d.data.filter(p => p.status === 'paid' || p.status === 'approved')); })
      .catch(() => toast.show('Failed loading periods', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = periods.filter(p => new Date(p.period_start).getFullYear() === year);
  const ytdGross  = filtered.reduce((a, p) => a + parseFloat(p.total_gross  || 0), 0);
  const ytdNet    = filtered.reduce((a, p) => a + parseFloat(p.total_net    || 0), 0);
  const ytdPaye   = filtered.reduce((a, p) => a + parseFloat(p.total_tax    || 0), 0);
  const ytdSsnit  = filtered.reduce((a, p) => a + parseFloat(p.total_ssnit_employee || 0) + parseFloat(p.total_ssnit_employer || 0), 0);
  const years     = [...new Set(periods.map(p => new Date(p.period_start).getFullYear()))].sort((a,b) => b-a);
  if (!years.includes(year)) years.unshift(year);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNav('dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Payroll Reports</h1>
            <p className="text-sm text-gray-500">PAYE, SSNIT summaries & payslip exports</p>
          </div>
        </div>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B3B3C]/20">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* YTD summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Gross Salaries',  v: ytdGross, accent:'bg-blue-500' },
          { label:'Net Disbursed',   v: ytdNet,   accent:'bg-emerald-500' },
          { label:'PAYE Collected',  v: ytdPaye,  accent:'bg-orange-500' },
          { label:'SSNIT Total',     v: ytdSsnit, accent:'bg-violet-500' },
        ].map(({ label, v, accent }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${accent} mb-2`} />
            <p className="text-xs text-gray-400 mb-1">{label} {year}</p>
            <p className="text-xl font-extrabold text-gray-900">GHS {fmt(v)}</p>
          </div>
        ))}
      </div>

      {/* export cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title:'PAYE Schedule',        sub:`GRA monthly returns for ${year}`,                 icon: FileText, action: () => toast.show('Failed to hit /export/paye on backend', 'info') },
          { title:'SSNIT Contribution',   sub:'Employee & employer schedule for submission',     icon: Shield,   action: () => toast.show('Failed to hit /export/ssnit on backend', 'info') },
          { title:'Payroll Summary',      sub:'Full breakdown by staff and period',               icon: BarChart2,action: () => toast.show('Failed to hit /export/summary on backend', 'info') },
          { title:'Bank Transfer File',   sub:'Generate payment file for bank upload',            icon: CreditCard,action: () => toast.show('Failed to hit /export/bank-file on backend', 'info') },
        ].map(({ title, sub, icon: Icon, action }) => (
          <button key={title} onClick={action}
            className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-[#0B3B3C]/20 transition-all group flex items-start gap-4">
            <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-[#0B3B3C]/5 transition-colors">
              <Icon size={20} className="text-[#0B3B3C]" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            <Download size={16} className="text-gray-300 group-hover:text-[#0B3B3C] mt-1 transition-colors" />
          </button>
        ))}
      </div>

      {/* monthly breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Monthly Breakdown — {year}</h2>
        </div>
        {loading ? <div className="h-40 animate-pulse m-6 bg-gray-100 rounded-xl" /> :
         filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No completed payroll runs for {year}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3 text-left">Period</th>
                  <th className="px-6 py-3 text-right">Staff</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">PAYE</th>
                  <th className="px-6 py-3 text-right">SSNIT (Emp)</th>
                  <th className="px-6 py-3 text-right">Net Pay</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-gray-800">{p.name}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums">{p.employee_count}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-medium">GHS {fmt(p.total_gross)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-orange-600">{fmt(p.total_tax)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-violet-600">{fmt(p.total_ssnit_employee)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-emerald-700 font-bold">GHS {fmt(p.total_net)}</td>
                    <td className="px-6 py-3.5 text-center"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <tr>
                  <td className="px-6 py-3 text-gray-500">TOTAL</td>
                  <td className="px-6 py-3 text-right">{filtered.reduce((a,p) => a + (p.employee_count||0), 0)}</td>
                  <td className="px-6 py-3 text-right">GHS {fmt(ytdGross)}</td>
                  <td className="px-6 py-3 text-right text-orange-600">{fmt(ytdPaye)}</td>
                  <td className="px-6 py-3 text-right text-violet-600">{fmt(filtered.reduce((a,p) => a + parseFloat(p.total_ssnit_employee||0), 0))}</td>
                  <td className="px-6 py-3 text-right text-emerald-700">GHS {fmt(ytdNet)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PERIOD DETAIL VIEW
// ─────────────────────────────────────────────────────────────
const PeriodDetailView = ({ period: initPeriod, onNav, toast }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/${companyId}/periods/${initPeriod.id}/entries`)
      .then(r => r.json())
      .then(d => { if (d.data) setEntries(d.data); })
      .catch(() => toast.show('Failed loading entries', 'error'))
      .finally(() => setLoading(false));
  }, [initPeriod.id]);

  const runPayroll = async () => {
    setRunning(true);
    try {
      const res  = await fetch(`${BASE}/${companyId}/periods/${initPeriod.id}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: userUUID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.show(`Computed for ${data.data.employee_count} staff`, 'success');
      setEntries([]);
      fetch(`${BASE}/${companyId}/periods/${initPeriod.id}/entries`)
        .then(r => r.json()).then(d => { if (d.data) setEntries(d.data); });
    } catch (e) { toast.show(e.message, 'error'); }
    finally { setRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => onNav('dashboard')} className="p-2 hover:bg-gray-100 rounded-xl transition">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{initPeriod.name}</h1>
          <p className="text-sm text-gray-500">
            {new Date(initPeriod.period_start).toLocaleDateString('en-GH')}
            {' – '}
            {new Date(initPeriod.period_end).toLocaleDateString('en-GH')}
          </p>
        </div>
        <StatusBadge status={initPeriod.status} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Gross', v: initPeriod.total_gross, c:'text-gray-900' },
          { label:'Net',   v: initPeriod.total_net,   c:'text-emerald-700' },
          { label:'PAYE',  v: initPeriod.total_tax,   c:'text-orange-600' },
          { label:'Staff', v: initPeriod.employee_count || entries.length, c:'text-blue-700', isNum: true },
        ].map(({ label, v, c, isNum }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-xl font-extrabold ${c}`}>{isNum ? v : `GHS ${fmt(v)}`}</p>
          </div>
        ))}
      </div>

      {initPeriod.status === 'draft' && (
        <button onClick={runPayroll} disabled={running}
          className="w-full py-3 bg-[#0B3B3C] text-white rounded-xl font-bold text-sm hover:bg-[#0a2e2f] transition disabled:opacity-50 flex items-center justify-center gap-2">
          {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {running ? 'Computing payroll…' : 'Run Payroll for This Period'}
        </button>
      )}
      {(initPeriod.status === 'reviewed' || initPeriod.status === 'approved') && (
        <button onClick={() => onNav('approve', initPeriod)}
          className="w-full py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          {initPeriod.status === 'reviewed' ? 'Approve This Payroll' : 'Mark as Paid'}
        </button>
      )}

      {/* entries */}
      {loading ? <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" /> :
       entries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Payroll Entries ({entries.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  <th className="px-6 py-3 text-left">Staff</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">PAYE</th>
                  <th className="px-6 py-3 text-right">SSNIT</th>
                  <th className="px-6 py-3 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-gray-800">{e.full_name}</p>
                      <p className="text-xs text-gray-400">{e.job_title || e.department || ''}</p>
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-medium">GHS {fmt(e.gross_salary)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-orange-600">{fmt(e.income_tax_paye)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-violet-600">{fmt(e.ssnit_employee)}</td>
                    <td className="px-6 py-3.5 text-right tabular-nums font-extrabold text-emerald-700">GHS {fmt(e.net_salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────
export default function PayrollDashboard() {
  const [view,          setView]    = useState('dashboard');
  const [contextPeriod, setContext] = useState(null);
  const toast = useToast();

  const navigate = (v, period = null) => {
    setView(v);
    setContext(period);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50/70 p-4 md:p-6">
      {view === 'dashboard'    && <DashboardView  onNav={navigate} toast={toast} />}
      {view === 'staff'        && <StaffSetupView onNav={navigate} toast={toast} />}
      {view === 'approve'      && <ApproveView    onNav={navigate} toast={toast} initPeriod={contextPeriod} />}
      {view === 'reports'      && <ReportsView    onNav={navigate} toast={toast} />}
      {view === 'periodDetail' && contextPeriod && <PeriodDetailView period={contextPeriod} onNav={navigate} toast={toast} />}

      {toast.toast && <Toast msg={toast.toast.msg} type={toast.toast.type} onClose={toast.hide} />}
    </div>
  );
}