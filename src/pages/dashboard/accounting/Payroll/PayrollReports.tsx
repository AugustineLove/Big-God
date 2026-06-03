import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, Users, Calendar, FileText } from 'lucide-react';

const PayrollReports = ({ companyId }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchYearlyReport();
  }, [year]);

  const fetchYearlyReport = async () => {
    const res = await fetch(`https://susu-pro-backend.onrender.com/payroll/${companyId}/reports/yearly?year=${year}`);
    const data = await res.json();
    setMonthlyData(data.data.monthly);
    setSummary(data.data.summary);
  };

  const exportPAYE = () => {
    window.open(`https://susu-pro-backend.onrender.com/payroll/${companyId}/export/paye?year=${year}`, '_blank');
  };

  const exportSSNIT = () => {
    window.open(`https://susu-pro-backend.onrender.com/payroll/${companyId}/export/ssnit?year=${year}`, '_blank');
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
          <p className="text-sm text-gray-500 mt-1">PAYE & SSNIT annual summaries</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option>2024</option>
            <option>2025</option>
          </select>
          <button onClick={exportPAYE} className="px-4 py-2 bg-[#0B3B3C] text-white rounded-lg text-sm flex items-center gap-2">
            <Download size={14} /> Export PAYE
          </button>
          <button onClick={exportSSNIT} className="px-4 py-2 border border-[#0B3B3C] text-[#0B3B3C] rounded-lg text-sm flex items-center gap-2">
            <Download size={14} /> Export SSNIT
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-gray-400">Total PAYE Collected</p>
                <p className="text-2xl font-bold text-gray-900">GHS {summary.total_paye?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-400">Total SSNIT (Emp+Er)</p>
                <p className="text-2xl font-bold text-gray-900">GHS {summary.total_ssnit?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-gray-400">Payroll Runs</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_runs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Monthly Breakdown - {year}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-gray-200">
              <tr className="text-xs text-gray-500">
                <th className="px-6 py-3 text-left">Month</th>
                <th className="px-6 py-3 text-right">Gross Salary</th>
                <th className="px-6 py-3 text-right">PAYE Tax</th>
                <th className="px-6 py-3 text-right">SSNIT Employee</th>
                <th className="px-6 py-3 text-right">SSNIT Employer</th>
                <th className="px-6 py-3 text-right">Net Salary</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyData.map((month) => (
                <tr key={month.month} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{month.month_name}</td>
                  <td className="px-6 py-4 text-right">GHS {month.gross_salary?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-orange-600">GHS {month.paye?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">GHS {month.ssnit_employee?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">GHS {month.ssnit_employer?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold">GHS {month.net_salary?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      month.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {month.status}
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

export default PayrollReports;