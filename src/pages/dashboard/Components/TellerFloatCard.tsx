import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { companyId, userUUID } from '../../../constants/appConstants';
// Adjust this import to whatever HTTP client / base URL you already use
// elsewhere in the app (e.g. an `api` axios instance) — this file assumes
// a plain fetch against your API host.
const API_BASE = "https://susu-pro-backend.onrender.com";

interface TellerFloatData {
  staff_id: string;
  staff_name: string | null;
  coa_code: string;
  balance: number;
  todays_cash_in: number;
  todays_cash_out: number;
  todays_net_movement: number;
  todays_transaction_count: number;
}

export const TellerFloatCard: React.FC = () => {
  const navigate = useNavigate();
  const [float, setFloat] = useState<TellerFloatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFloat = async () => {
      try {
        const staffId = userUUID; // Assuming userUUID is the staff ID for the logged-in teller
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/api/accounting/${companyId}/tellers/${staffId}/float`
        );
        if (!res.ok) throw new Error('Failed to load float balance');
        const json = await res.json();
        console.log('TellerFloatCard fetch response:', json);
        if (!cancelled) setFloat(json.data);
      } catch (err) {
        if (!cancelled) setError('Could not load your float balance.');
        console.error('TellerFloatCard fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFloat();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-base font-bold text-gray-800 tracking-tight">
          My Float
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          Live Balance
        </span>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading your float…</div>
        ) : error ? (
          <div className="py-8 text-center text-red-400 text-sm">{error}</div>
        ) : (
          <button
            onClick={() => navigate(`/dashboard/my-float/${userUUID}`)}
            className="group w-full text-left p-5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Current Float Balance</p>
                <h4 className="text-3xl font-bold text-gray-900">
                  ₵{(float?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h4>
              </div>
              <Wallet className="w-8 h-8 text-blue-400" />
            </div>

            <div className="flex items-center gap-6 mb-4">
              <div className="flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Cash in today</p>
                  <p className="text-sm font-bold text-emerald-600">
                    ₵{(float?.todays_cash_in ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Cash out today</p>
                  <p className="text-sm font-bold text-red-500">
                    ₵{(float?.todays_cash_out ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400">
                {float?.todays_transaction_count ?? 0} transaction(s) today
              </span>
              <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-xs font-semibold">
                View Details
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default TellerFloatCard;