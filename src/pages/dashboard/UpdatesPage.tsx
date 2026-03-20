import React, { useState } from 'react';
import {
  Download, FileText, LayoutGrid, TrendingUp, User,
  AlertCircle, AlertTriangle, RefreshCw, Zap, Monitor, Shield
} from 'lucide-react';

const UPDATES = [
  {
    version: 'v2.4.0', tag: 'latest', date: 'March 20, 2026',
    items: [
      {
        type: 'new', icon: FileText,
        title: 'Smart reports with date range filtering',
        desc: 'Reports now support full date range filtering — week, month, quarter, year, or custom. Every report type respects the selected range and the backend computes all aggregates server-side. PDF, Excel and CSV exports include the period label in the file header.',
      },
      {
        type: 'new', icon: LayoutGrid,
        title: 'Multi-tab navigation with memory',
        desc: 'The dashboard now works like a browser. Each page opens in its own tab. Sidebar clicks always open a fresh tab. Clicking an existing tab restores exactly where you left off — even deep inside a customer detail page.',
      },
      {
        type: 'new', icon: TrendingUp,
        title: 'Profit & Loss modal — full rewrite',
        desc: 'The P&L modal fetches its own data, supports all date ranges including custom, and has three tabbed sections: overview (income statement + insights), monthly trend (6-month charts), and expense breakdown. CSV and PDF export work directly from the modal.',
      },
      {
        type: 'imp', icon: User,
        title: 'Customer overview tab redesign',
        desc: 'Clean stat cards, a recent transactions list with colour-coded badges and status dots, and a compact account summary panel with balance, masked account number and opened date.',
      },
      {
        type: 'fix', icon: AlertCircle,
        title: 'Commission aggregation fixed in finance backend',
        desc: 'The finance endpoint was only returning the first day\'s commission total instead of summing across the full period. Now correctly uses SUM across the requested date range with a COALESCE fallback.',
      },
      {
        type: 'fix', icon: AlertTriangle,
        title: 'Tab navigation restoring wrong page',
        desc: 'Clicking a tab was navigating back to the root of that section instead of where you last were. Tabs now correctly remember and restore the last visited path.',
      },
      {
        type: 'fix', icon: RefreshCw,
        title: 'Monthly trend missing zero-activity months',
        desc: 'The trend chart skipped months with no activity, creating misleading gaps. The backend now uses generate_series so every month in the 6-month window always appears.',
      },
    ],
  },
  {
    version: 'v2.3.1', tag: 'patch', date: 'February 28, 2026',
    items: [
      {
        type: 'sec', icon: Shield,
        title: 'Withdrawal code masked by default',
        desc: 'Customer withdrawal codes are now hidden behind a show/hide toggle on the profile page. Previously visible in plain text to any staff member who opened the profile.',
      },
      {
        type: 'perf', icon: Zap,
        title: 'Dashboard report endpoint — single query',
        desc: 'The report endpoint previously ran 5 sequential DB queries. Replaced with Promise.all, reducing average response time by ~60%. Aggregates are now pre-computed server-side.',
      },
      {
        type: 'imp', icon: Monitor,
        title: 'Sidebar collapse now shows icon tooltips',
        desc: 'Collapsed sidebar now shows icon-only nav items with hover tooltips. Finance accordion auto-expands when clicked from the collapsed icon state.',
      },
    ],
  },
];

const TYPE_STYLES: Record<string, { pill: string; icon: string; iconBg: string }> = {
  new:  { pill: 'bg-emerald-50 text-emerald-800',  icon: 'text-emerald-600', iconBg: 'bg-emerald-50'  },
  imp:  { pill: 'bg-indigo-50 text-indigo-800',    icon: 'text-indigo-600',  iconBg: 'bg-indigo-50'   },
  fix:  { pill: 'bg-red-50 text-red-700',          icon: 'text-red-500',     iconBg: 'bg-red-50'      },
  sec:  { pill: 'bg-amber-50 text-amber-800',      icon: 'text-amber-600',   iconBg: 'bg-amber-50'    },
  perf: { pill: 'bg-violet-50 text-violet-800',    icon: 'text-violet-600',  iconBg: 'bg-violet-50'   },
};

const TYPE_LABELS: Record<string, string> = {
  new: 'New', imp: 'Improved', fix: 'Fix', sec: 'Security', perf: 'Performance',
};

const TAG_STYLES: Record<string, string> = {
  latest: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  stable: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
  patch:  'bg-gray-100 text-gray-600 border border-gray-200',
};

const FILTERS = ['all', 'new', 'imp', 'fix', 'sec', 'perf'];
const FILTER_LABELS: Record<string, string> = {
  all: 'All updates', new: 'New features', imp: 'Improvements',
  fix: 'Bug fixes', sec: 'Security', perf: 'Performance',
};

const UpdatesPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const allItems = UPDATES.flatMap(r => r.items);
  const counts = {
    total: allItems.length,
    new: allItems.filter(i => i.type === 'new').length,
    imp: allItems.filter(i => i.type === 'imp').length,
    fix: allItems.filter(i => i.type === 'fix').length,
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">

      {/* Hero */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-7 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-[11px] font-semibold text-emerald-800 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Now available — v2.4.0
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">What's new?</h1>
          <p className="text-[13px] text-gray-400">Full release notes, improvements, fixes and security updates.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-[12px] text-gray-300">Released March 20, 2026</span>
          <button className="inline-flex items-center gap-1.5 bg-gray-900 text-white rounded-xl px-4 py-2.5 text-[12px] font-medium">
            <Download className="w-3.5 h-3.5" /> Download changelog
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { n: counts.total, l: 'Total updates' },
          { n: counts.new,   l: 'New features' },
          { n: counts.imp,   l: 'Improvements' },
          { n: counts.fix,   l: 'Bug fixes' },
        ].map(s => (
          <div key={s.l} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="text-2xl font-semibold text-gray-900">{s.n}</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-[12px] font-medium border transition-colors
              ${filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'}`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Releases */}
      {UPDATES.map(release => {
        const visible = release.items.filter(i => filter === 'all' || i.type === filter);
        if (visible.length === 0) return null;
        return (
          <div key={release.version} className="mb-8">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-100">
              <span className="text-[15px] font-semibold text-gray-900">{release.version}</span>
              <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1 ${TAG_STYLES[release.tag]}`}>
                {release.tag.charAt(0).toUpperCase() + release.tag.slice(1)}
              </span>
              <span className="text-[12px] text-gray-300 ml-auto">{release.date}</span>
            </div>
            <div className="flex flex-col gap-2">
              {visible.map((item, i) => {
                const s = TYPE_STYLES[item.type];
                const Icon = item.icon;
                return (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-3 items-start hover:border-gray-200 transition-colors">
                    <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[14px] font-semibold text-gray-900">{item.title}</span>
                        <span className={`text-[10px] font-semibold rounded-md px-2 py-0.5 uppercase tracking-wide ${s.pill}`}>
                          {TYPE_LABELS[item.type]}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-4 mt-4">
        <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-gray-400 leading-relaxed">
          <span className="font-semibold text-gray-600">Auto-update enabled.</span> Updates automatically in the background. You'll see a notification when a new version is ready. Just refresh your browser to pick up the latest changes.
        </p>
      </div>
    </div>
  );
};

export default UpdatesPage;