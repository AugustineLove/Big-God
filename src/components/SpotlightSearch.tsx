import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { useTabContext } from '../layouts/DashboardLayout'; // adjust path
import { Users } from 'lucide-react';
import { companyId } from '../constants/appConstants'; // adjust path

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerResult {
  id: string;
  customer_id?: string;
  name: string;
  phone_number: string;
  email?: string;
  account_number?: string;
  status?: string;
  total_balance_across_all_accounts?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_PALETTES = [
  { bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  { bg: 'bg-teal-50',    text: 'text-teal-700'   },
  { bg: 'bg-amber-50',   text: 'text-amber-700'  },
  { bg: 'bg-violet-50',  text: 'text-violet-700' },
  { bg: 'bg-rose-50',    text: 'text-rose-700'   },
  { bg: 'bg-emerald-50', text: 'text-emerald-700'},
];
const palette = (name: string) =>
  AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
    {children}
  </span>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const { openInNewTab } = useTabContext();

  // ── Focus input when opened ──
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ── Debounced search ──
  useEffect(() => {
    if (!query.trim()) { setResults([]); setLoading(false); return; }

    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://susu-pro-backend.onrender.com/api/customers/${companyId}/search?query=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data.data || []);
        setActiveIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  // ── Open customer in new tab ──
  const openCustomer = useCallback((customer: CustomerResult) => {
    const cid = customer.customer_id || customer.id;
    openInNewTab(customer.name, `/dashboard/clients/customer-details/${cid}`, Users);
    onClose();
  }, [openInNewTab, onClose]);

  // ── Keyboard navigation ──
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        openCustomer(results[activeIndex]);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, results, activeIndex, openCustomer, onClose]);

  // ── Scroll active row into view ──
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]') as HTMLElement;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[560px] overflow-hidden border border-gray-100"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          {loading
            ? (
              <svg className="w-5 h-5 animate-spin text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )
            : <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search customers by name, phone or account…"
            className="flex-1 text-[15px] text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          <Kbd>Esc</Kbd>
        </div>

        {/* Results */}
        <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto' }}>

          {/* Empty state — no query */}
          {!query && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Search className="w-8 h-8 text-gray-200" />
              <p className="text-[14px] font-medium text-gray-400">Start typing to search customers</p>
              <p className="text-[12px] text-gray-300">Search by name, phone number or account</p>
            </div>
          )}

          {/* No results */}
          {query && !loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-[14px] font-medium text-gray-400">No customers found for "{query}"</p>
              <p className="text-[12px] text-gray-300">Try a different name, phone or account number</p>
            </div>
          )}

          {/* Results list */}
          {results.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-5 pt-3 pb-1">
                Customers
              </p>
              {results.map((customer, i) => {
                const pal = palette(customer.name);
                const active = i === activeIndex;
                const bal = parseFloat(customer.total_balance_across_all_accounts || '0');

                return (
                  <div key={customer.id}>
                    <div
                      data-active={active}
                      onClick={() => openCustomer(customer)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors
                        ${active ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full ${pal.bg} ${pal.text} text-[12px] font-bold flex items-center justify-center flex-shrink-0`}>
                        {initials(customer.name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{customer.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {customer.phone_number}
                          {customer.account_number ? ` · ${customer.account_number}` : ''}
                        </p>
                        <span className={`inline-flex mt-1 text-[10px] font-semibold rounded-full px-2 py-0.5
                          ${customer.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'}`}>
                          {customer.status || 'Unknown'}
                        </span>
                      </div>

                      {/* Balance + arrow */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-emerald-600">
                            ¢{bal.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-gray-400">Balance</p>
                        </div>
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center
                          ${active ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <ArrowRight className={`w-3 h-3 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </div>

                    {i < results.length - 1 && (
                      <div className="h-px bg-gray-50 mx-5" />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Kbd>↑↓</Kbd> Navigate
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Kbd>↵</Kbd> Open in new tab
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <Kbd>Esc</Kbd> Close
            </span>
          </div>
          {results.length > 0 && (
            <span className="text-[11px] text-gray-300">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpotlightSearch;
