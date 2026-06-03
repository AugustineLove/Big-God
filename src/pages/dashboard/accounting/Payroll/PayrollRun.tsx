import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle, AlertTriangle, Loader2, 
  RefreshCw, Users, Calendar, DollarSign, TrendingUp 
} from 'lucide-react';

const PayrollRun = ({ companyId, periodId }) => {
  const [period, setPeriod] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (periodId) {
      fetchPeriodDetails();
      fetchEligibleStaff();
    }
  }, [periodId]);

  const fetchPeriodDetails = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/api/payroll/${companyId}/periods/${periodId}`);
    const data = await res.json();
    setPeriod(data.data);
  };

  const fetchEligibleStaff = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/api/payroll/${companyId}/staff/payroll-info`);
    const data = await res.json();
    setStaffList(data.data);
  };

  const runPayroll = async () => {
    setRunning(true);
    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/payroll/${companyId}/periods/${periodId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ created_by: 'current-user-id' })
      });
      const data = await res.json();
      setResults(data.data);
    } catch (error) {
      console.error('Error running payroll:', error);
    } finally {
      setRunning(false);
    }
  };

  const PayrollSummary = () => (
    <div className="bg-gradient-to-r from-[#0B3B3C] to-[#1a5c5e] rounded-xl p-6 text-white">
      <h3 className="text-lg font-semibold mb-4">Payroll Summary</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-80">Total Gross Salary</p>
          <p className="text-2xl font-bold">GHS {results?.total_gross?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm opacity-80">Total Net Salary</p>
          <p className="text-2xl font-bold">GHS {results?.total_net?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm opacity-80">Total PAYE Tax</p>
          <p className="text-xl font-bold">GHS {results?.total_tax?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm opacity-80">Employees Processed</p>
          <p className="text-xl font-bold">{results?.employee_count}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">{period?.name}</p>
        </div>
        <button
          onClick={runPayroll}
          disabled={running}
          className="px-6 py-2.5 bg-[#0B3B3C] text-white rounded-lg font-medium hover:bg-[#0A2E2F] transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
          {running ? 'Processing...' : 'Run Payroll'}
        </button>
      </div>

      {/* Period Info */}
      {period && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Period Start</p>
                <p className="font-medium">{new Date(period.period_start).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Period End</p>
                <p className="font-medium">{new Date(period.period_end).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Eligible Staff</p>
                <p className="font-medium">{staffList.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="font-medium capitalize">{period.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && <PayrollSummary />}

      {/* Staff Preview Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Eligible Staff</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Allowances</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{staff.full_name}</p>
                      <p className="text-xs text-gray-400">{staff.staff_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{staff.department || '—'}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    GHS {(staff.basic_salary || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    GHS {(staff.total_allowances || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">
                      <CheckCircle size={10} /> Active
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

export default PayrollRun;