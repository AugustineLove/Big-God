import { useNavigate } from 'react-router-dom';
import { Plus, Receipt, TrendingUp, Wallet, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useBudget } from '../../../contexts/dashboard/Budget'; // adjust path as needed
import { userPermissions } from '../../../constants/appConstants';
import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Budget {
  id: string;
  allocated: number;
  spent: number;
  remaining: number;
  date: string;
  status?: string;
  teller_name?: string;
  teller_id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `¢${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

/** Returns Tailwind colour classes + a label based on usage % */
const getUsageStyle = (pct: number, closed: boolean) => {
  if (closed)        return { bar: 'bg-gray-300',    text: 'text-gray-400',    label: 'Float closed' };
  if (pct >= 100)    return { bar: 'bg-red-500',     text: 'text-red-500',     label: 'Over budget' };
  if (pct >= 80)     return { bar: 'bg-amber-400',   text: 'text-amber-600',   label: 'Approaching limit' };
  if (pct >= 60)     return { bar: 'bg-yellow-400',  text: 'text-yellow-600',  label: 'On track' };
  return               { bar: 'bg-emerald-500',  text: 'text-emerald-600', label: 'On track' };
};

/** Derive consistent avatar colours from a name string */
const AVATAR_PALETTES = [
  { bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  { bg: 'bg-amber-50',   text: 'text-amber-700'  },
  { bg: 'bg-teal-50',    text: 'text-teal-700'   },
  { bg: 'bg-violet-50',  text: 'text-violet-700' },
  { bg: 'bg-rose-50',    text: 'text-rose-700'   },
];
const palette = (name: string) =>
  AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
);

interface SummaryCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}
const SummaryCard = ({ label, value, sub, icon }: SummaryCardProps) => (
  <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-1">
    <div className="flex items-center justify-between mb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      <div className="text-gray-400">{icon}</div>
    </div>
    <p className="text-[22px] font-semibold text-gray-900 tracking-tight leading-none">{value}</p>
    <p className="text-[12px] text-gray-400">{sub}</p>
  </div>
);

interface FloatCardProps {
  budget: Budget;
  onNavigate: () => void;
  onToggle: (e: React.MouseEvent) => void;
  loadingToggle: boolean;
}
const FloatCard = ({ budget, onNavigate, onToggle, loadingToggle }: FloatCardProps) => {
  const closed = budget.status === 'Closed';
  const pct = budget.allocated > 0
    ? Math.round((budget.spent / budget.allocated) * 100)
    : 0;
  const remaining = Number(budget.allocated) - Number(budget.spent);
  const style = getUsageStyle(pct, closed);

  return (
    <div
      onClick={onNavigate}
      className={`ml-5 bg-white border rounded-2xl p-4 cursor-pointer transition-all
        ${closed
          ? 'border-gray-100 opacity-55'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[13px] font-semibold text-gray-900">{formatDate(budget.date)}</p>
          <p className={`text-[11px] font-medium mt-0.5 ${style.text}`}>{style.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-semibold text-gray-900">{fmt(budget.spent)}</p>
          <p className="text-[11px] text-gray-400">of {fmt(budget.allocated)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Remaining{' '}
          <span className="font-semibold text-gray-600">{fmt(remaining)}</span>
          {' · '}{pct}% used
        </p>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1
            ${closed ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
            {closed ? 'Closed' : 'Active'}
          </span>
          <button
            onClick={onToggle}
            disabled={loadingToggle}
            className={`text-[11px] font-semibold rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50
              ${closed
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
          >
            {loadingToggle
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : closed ? 'Reopen' : 'Close float'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Teller Group ─────────────────────────────────────────────────────────────

interface TellerGroupProps {
  tellerName: string;
  floats: Budget[];
  onNavigate: (b: Budget) => void;
  onToggle: (id: string, e: React.MouseEvent) => void;
  loadingToggle: boolean;
}
const TellerGroup = ({ tellerName, floats, onNavigate, onToggle, loadingToggle }: TellerGroupProps) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const pal = palette(tellerName);
  const totalAllocated = floats.reduce((s, b) => s + Number(b.allocated), 0);
  const activeCount = floats.filter(b => b.status !== 'Closed').length;

  return (
    <div className="flex flex-col gap-2">
      {/* Teller header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-5 py-3.5 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 transition-all w-full text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full ${pal.bg} ${pal.text} text-[12px] font-bold flex items-center justify-center flex-shrink-0`}>
            {initials(tellerName)}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900">{tellerName}</p>
            <p className="text-[11px] text-gray-400">{floats.length} float{floats.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <p className="text-[13px] font-semibold text-gray-700">{fmt(totalAllocated)}</p>
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1">
            {activeCount} active
          </span>
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-gray-400" />
            : <ChevronUp className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Float cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2">
          {floats.map(budget => (
            <FloatCard
              key={budget.id}
              budget={budget}
              onNavigate={() => onNavigate(budget)}
              onToggle={(e) => onToggle(budget.id, e)}
              loadingToggle={loadingToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface FloatTabProps {
  budgets: Budget[];
  setShowBudgetModal: (v: boolean) => void;
}

const FloatTab = ({ budgets, setShowBudgetModal }: FloatTabProps) => {
  const navigate = useNavigate();
  const { toggleBudgetStatus, loadingToggle } = useBudget();

  // ── Aggregates ──
  const totalAllocated = budgets.reduce((s, b) => s + Number(b.allocated), 0);
  const totalSpent     = budgets.reduce((s, b) => s + Number(b.spent), 0);
  const totalRemaining = totalAllocated - totalSpent;
  const usedPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const remPct  = totalAllocated > 0 ? Math.round((totalRemaining / totalAllocated) * 100) : 0;

  // ── Group by teller ──
  const byTeller = React.useMemo(() => {
    const map: Record<string, Budget[]> = {};
    budgets.forEach(b => {
      const key = b.teller_name || 'Unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    // Sort each teller's floats: active first, then by date desc
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Closed' ? 1 : -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
    );
    return map;
  }, [budgets]);

  const handleToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleBudgetStatus(id);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold text-gray-900">Float planning</h2>
          <p className="text-[13px] text-gray-400 mt-0.5">Plan and monitor floats by teller</p>
        </div>
        {userPermissions?.ALTER_FINANCE && (
          <button
            onClick={() => setShowBudgetModal(true)}
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create float
          </button>
        )}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          label="Total allocated"
          value={fmt(totalAllocated)}
          sub="Across all tellers"
          icon={<Wallet className="w-4 h-4" />}
        />
        <SummaryCard
          label="Total spent"
          value={fmt(totalSpent)}
          sub={totalAllocated > 0 ? `${usedPct}% of allocation used` : 'No floats yet'}
          icon={<Receipt className="w-4 h-4" />}
        />
        <SummaryCard
          label="Remaining"
          value={fmt(totalRemaining)}
          sub={totalAllocated > 0 ? `${remPct}% remaining` : 'No floats yet'}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Teller groups */}
      {budgets.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl py-16 text-center">
          <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-gray-500">No floats yet</p>
          <p className="text-[12px] text-gray-400 mt-1">Create a float to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          <SectionTitle>Teller floats</SectionTitle>
          {Object.entries(byTeller).map(([tellerName, floats]) => (
            <TellerGroup
              key={tellerName}
              tellerName={tellerName}
              floats={floats}
              onNavigate={(b) => navigate(`budgets/${b.id}`, { state: { budget: b } })}
              onToggle={handleToggle}
              loadingToggle={loadingToggle}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default FloatTab;
