import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, Banknote } from 'lucide-react';

const PayrollApproval = ({ companyId, periodId }) => {
  const [entries, setEntries] = useState([]);
  const [period, setPeriod] = useState(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchPeriod();
  }, [periodId]);

  const fetchEntries = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/payroll/${companyId}/periods/${periodId}/entries`);
    const data = await res.json();
    setEntries(data.data);
  };

  const fetchPeriod = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/payroll/${companyId}/periods/${periodId}`);
    const data = await res.json();
    setPeriod(data.data);
  };

  const approvePayroll = async () => {
    setApproving(true);
    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/payroll/${companyId}/periods/${periodId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: 'current-user-id' })
      });
      const data = await res.json();
      alert(data.message);
      fetchEntries();
      fetchPeriod();
    } catch (error) {
      console.error('Error approving payroll:', error);
    } finally {
      setApproving(false);
    }
  };

  const markAsPaid = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/payroll/${companyId}/periods/${periodId}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid_by: 'current-user-id', payment_date: new Date().toISOString().split('T')[0] })
    });
    const data = await res.json();
    alert(data.message);
    fetchPeriod();
  };

  const totals = entries.reduce((acc, e) => ({
    gross: acc.gross + (e.gross_salary || 0),
    net: acc.net + (e.net_salary || 0),
    paye: acc.paye + (e.income_tax_paye || 0),
    ssnit: acc.ssnit + (e.ssnit_employee || 0)
  }), { gross: 0, net: 0, paye: 0, ssnit: 0 });

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Review & Approval</h1>
          <p className="text-sm text-gray-500 mt-1">{period?.name}</p>
        </div>
        <div className="flex gap-3">
          {period?.status === 'reviewed' && (
            <button
              onClick={approvePayroll}
              disabled={approving}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle size={16} /> Approve Payroll
            </button>
          )}
          {period?.status === 'approved' && (
            <button
              onClick={markAsPaid}
              className="px-5 py-2 bg-[#0B3B3C] text-white rounded-lg font-medium hover:bg-[#0A2E2F] flex items-center gap-2"
            >
              <Banknote size={16} /> Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400">Total Gross</p>
          <p className="text-2xl font-bold text-gray-900">GHS {totals.gross.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400">Total Net Pay</p>
          <p className="text-2xl font-bold text-emerald-600">GHS {totals.net.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400">Total PAYE</p>
          <p className="text-2xl font-bold text-orange-600">GHS {totals.paye.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-400">Total SSNIT (Emp)</p>
          <p className="text-2xl font-bold text-purple-600">GHS {totals.ssnit.toLocaleString()}</p>
        </div>
      </div>

      {/* Staff Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Staff Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr className="text-xs text-gray-500">
                <th className="px-6 py-3 text-left">Staff</th>
                <th className="px-6 py-3 text-right">Basic</th>
                <th className="px-6 py-3 text-right">Allowances</th>
                <th className="px-6 py-3 text-right">Gross</th>
                <th className="px-6 py-3 text-right">PAYE</th>
                <th className="px-6 py-3 text-right">SSNIT</th>
                <th className="px-6 py-3 text-right">Net Pay</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{entry.full_name}</p>
                    <p className="text-xs text-gray-400">{entry.job_title}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">GHS {(entry.basic_salary || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm">GHS {(entry.total_allowances || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-medium">GHS {(entry.gross_salary || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-orange-600">GHS {(entry.income_tax_paye || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-purple-600">GHS {(entry.ssnit_employee || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">GHS {(entry.net_salary || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                      entry.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      entry.status === 'computed' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {entry.status === 'approved' && <CheckCircle size={10} />}
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollApproval;