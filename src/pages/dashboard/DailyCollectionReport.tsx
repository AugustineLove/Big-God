import React, { useState, useCallback, useEffect } from 'react';
import { Calendar, Download, Search, FileText, Users, PiggyBank, CreditCard, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { handleDailyCollectionPdfExport, handlePdfExport } from '../../utils/helper';
import { companyId, userUUID } from '../../constants/appConstants';

interface DailyCollection {
  transaction_id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  transaction_date: string;
  payment_method: string;
  unique_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  account_number: string;
  recorded_staff_name: string;
  mobile_banker_name: string;
}

interface DailyCollectionSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  byPaymentMethod: Record<string, { count: number; total: number }>;
  byBanker: Record<string, { count: number; total: number }>;
}

// Helper function to format date without date-fns
const formatDate = (date: Date | string, format: 'date' | 'time' | 'full' = 'full'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'date') {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  if (format === 'time') {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Full format
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const DailyCollectionReport: React.FC = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [collections, setCollections] = useState<DailyCollection[]>([]);
  const [summary, setSummary] = useState<DailyCollectionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [staffName, setStaffName] = useState('');

  const fetchDailyCollections = useCallback(async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!companyId) {
      toast.error('Company not found');
      return;
    }

    if (!userUUID) {
      toast.error('Staff not found. Please log in again.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `https://susu-pro-backend.onrender.com/api/transactions/company/${companyId}/${userUUID}/daily-collections?date=${selectedDate}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        setCollections(data.data);
        setSummary(data.summary);
        
        if (data.data.length === 0) {
          toast('No collections found for this date', {
            icon: '📋',
          });
        } else {
          toast.success(`Found ${data.data.length} collections`);
        }
      } else {
        toast.error(data.message || 'Failed to fetch collections');
      }
    } catch (error) {
      console.error('Error fetching daily collections:', error);
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, companyId, userUUID]);

  const handleExportPDF = () => {
  if (collections.length === 0) {
    toast.error('No data to export');
    return;
  }

  try {
    handleDailyCollectionPdfExport(
      collections,
      summary,
      selectedDate,
      staffName
    );

    toast.success('Daily collection report exported');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to export PDF');
  }
};

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return `¢${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get payment method label
  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Bank Transfer',
      momo: 'MoMo',
      transfer: 'Transfer',
    };
    return labels[method] || method;
  };

  // Get payment method color
  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      cash: 'var(--forest)',
      mobile_money: 'var(--brass)',
      bank_transfer: 'var(--clay)',
      momo: '#b8963f',
      transfer: 'var(--brass)',
    };
    return colors[method] || 'var(--ink-soft)';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="cd-display text-2xl font-semibold text-[var(--ink)]">
          My Daily Collections
        </h1>
        <p className="text-[var(--ink-soft)] flex items-center gap-2">
          <User className="h-4 w-4" />
          View your collections for the day
          {staffName && <span className="font-medium text-[var(--ink)]">({staffName})</span>}
        </p>
      </div>

      {/* Date Picker & Actions */}
      <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--paper-line)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Date Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1">
              Select Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ink-faint)] h-5 w-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-xl focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)] outline-none"
                max={getTodayString()}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={fetchDailyCollections}
              disabled={loading}
              className="bg-[var(--forest)] text-white px-6 py-2.5 rounded-xl hover:bg-[var(--forest-deep)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  View Collections
                </>
              )}
            </button>

            {hasSearched && collections.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="bg-[var(--card)] border border-[var(--paper-line)] text-[var(--ink-soft)] px-6 py-2.5 rounded-xl hover:border-[var(--forest)] hover:text-[var(--forest)] transition-colors flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <>
          {/* Summary Cards */}
          {summary && collections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--paper-line)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--ink-soft)]">Total Collections</p>
                    <p className="cd-mono text-2xl font-bold text-[var(--forest)]">
                      {formatCurrency(summary.totalAmount)}
                    </p>
                    <p className="text-xs text-[var(--ink-faint)] mt-1">
                      {summary.totalCount} transactions
                    </p>
                  </div>
                  <div className="bg-[rgba(47,74,50,0.1)] p-3 rounded-xl">
                    <PiggyBank className="h-6 w-6" style={{ color: 'var(--forest)' }} />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--paper-line)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--ink-soft)]">Average Amount</p>
                    <p className="cd-mono text-2xl font-bold text-[var(--ink)]">
                      {formatCurrency(summary.averageAmount)}
                    </p>
                    <p className="text-xs text-[var(--ink-faint)] mt-1">
                      Per transaction
                    </p>
                  </div>
                  <div className="bg-[var(--paper)] p-3 rounded-xl">
                    <FileText className="h-6 w-6 text-[var(--ink-soft)]" />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--paper-line)] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--ink-soft)]">Payment Methods</p>
                    <div className="space-y-0.5 mt-1">
                      {Object.entries(summary.byPaymentMethod).map(([method, data]) => (
                        <div key={method} className="flex items-center justify-between text-sm">
                          <span className="text-[var(--ink-soft)]" style={{ color: getMethodColor(method) }}>
                            {getMethodLabel(method)}
                          </span>
                          <span className="cd-mono font-medium text-[var(--ink)]">
                            {data.count} ({formatCurrency(data.total)})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[rgba(173,127,58,0.14)] p-3 rounded-xl">
                    <CreditCard className="h-6 w-6" style={{ color: 'var(--brass)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--paper-line)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--paper)] border-b border-[var(--paper-line)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--paper-line)]">
                  {collections.length > 0 ? (
                    collections.map((collection) => (
                      <tr key={collection.transaction_id} className="hover:bg-[var(--paper)] transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="font-medium text-sm text-[var(--forest-deep)]">
                                {collection.customer_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-[var(--ink)]">
                                {collection.customer_name}
                              </div>
                              <div className="text-xs text-[var(--ink-faint)]">
                                {collection.customer_phone}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="cd-mono text-lg font-semibold text-[var(--forest)]">
                            {formatCurrency(collection.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize"
                            style={{
                              background: `${getMethodColor(collection.payment_method)}20`,
                              color: getMethodColor(collection.payment_method),
                            }}
                          >
                            {getMethodLabel(collection.payment_method)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--ink-soft)]">
                          {formatDate(collection.transaction_date, 'time')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full capitalize"
                            style={{
                              background: 'rgba(47,74,50,0.1)',
                              color: 'var(--forest)',
                            }}
                          >
                            {collection.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Calendar className="h-12 w-12 text-[var(--paper-line)] mb-4" />
                          <h3 className="cd-display text-lg font-medium text-[var(--ink)] mb-2">
                            No collections found
                          </h3>
                          <p className="text-[var(--ink-soft)]">
                            You had no completed collections on {formatDate(selectedDate, 'date')}.
                          </p>
                          {staffName && (
                            <p className="text-xs text-[var(--ink-faint)] mt-1">
                              Showing collections for {staffName}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Staff footer */}
          {collections.length > 0 && staffName && (
            <div className="flex justify-end">
              <p className="text-xs text-[var(--ink-faint)]">
                Collections recorded by: <span className="font-medium text-[var(--ink-soft)]">{staffName}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyCollectionReport;