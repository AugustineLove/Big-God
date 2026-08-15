import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { companyId } from '../../constants/appConstants';

const API_BASE = "https://susu-pro-backend.onrender.com"

interface FloatLine {
  line_id: string;
  entry_date: string;
  reference_no: string;
  entry_description: string;
  source: string;
  debit_credit: 'debit' | 'credit';
  amount: string;
  running_balance: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  transaction_id: string | null;
  transaction_type: string | null;
  transaction_status: string | null;
  unique_code: string | null;
  payment_method: string | null;
  withdrawal_type: string | null;
  transaction_description: string | null;
}

const statusColor: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800',
  approved: 'bg-indigo-100 text-indigo-800',
  pending: 'bg-amber-100 text-amber-800',
  reversed: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-100 text-red-800',
};

export const TellerFloatDetails: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();

  const [lines, setLines] = useState<FloatLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  const fetchHistory = useCallback(async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(search ? { search } : {}),
        ...(type !== 'all' ? { type } : {}),
        ...(status !== 'all' ? { status } : {}),
      });
      const res = await fetch(
        `${API_BASE}/api/accounting/${companyId}/tellers/${staffId}/float/history?${params.toString()}`
      );
      if (!res.ok) throw new Error('Failed to load float history');
      const json = await res.json();
      setLines(json.data);
      setTotalPages(json.totalPages);
    } catch (err) {
      setError('Could not load float history.');
      console.error('TellerFloatDetails fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [staffId, page, search, type, status]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Float Activity</h1>
          <p className="text-sm text-gray-500">Every transaction that has moved your float balance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Search customer, phone, or code…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setPage(1); setType(e.target.value); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="commission">Commission</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      {/* Ledger */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading activity…</div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 text-sm">{error}</div>
        ) : lines.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No float activity found.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {lines.map((line) => {
              const isCashIn = line.debit_credit === 'debit';
              return (
                <div key={line.line_id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isCashIn ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {isCashIn ? '+' : '−'}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {line.customer_name || line.entry_description}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(line.entry_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        {line.unique_code ? ` · ${line.unique_code}` : ''}
                        {line.payment_method ? ` · ${line.payment_method}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[14px] font-semibold tabular-nums ${isCashIn ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isCashIn ? '+' : '−'}₵{Number(line.amount).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      Balance: ₵{Number(line.running_balance).toLocaleString()}
                    </span>
                    {line.transaction_status && (
                      <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${statusColor[line.transaction_status] || 'bg-gray-100 text-gray-500'}`}>
                        {line.transaction_status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-semibold text-gray-500 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs font-semibold text-gray-500 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TellerFloatDetails;