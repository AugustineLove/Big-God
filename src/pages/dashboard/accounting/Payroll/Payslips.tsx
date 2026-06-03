import React, { useState, useEffect } from 'react';
import { Download, Eye, Printer, Search, Calendar, Filter } from 'lucide-react';

const Payslips = ({ companyId, staffId = null }) => {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [filter, setFilter] = useState({ year: new Date().getFullYear(), month: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayslips();
  }, [filter]);

  const fetchPayslips = async () => {
    const url = staffId 
      ? `http://localhost:5050/api/payroll/${companyId}/staff/${staffId}/payslips`
      : `http://localhost:5050/api/payroll/${companyId}/payslips`;
    const res = await fetch(url);
    const data = await res.json();
    setPayslips(data.data);
    setLoading(false);
  };

  const downloadPDF = async (payslipId) => {
    const res = await fetch(`http://localhost:5050/api/payroll/${companyId}/payslips/${payslipId}/pdf`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslipId}.pdf`;
    a.click();
  };

  const PayslipModal = ({ payslip, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Payslip</h2>
          <div className="flex gap-2">
            <button onClick={() => downloadPDF(payslip.id)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6">
          {/* Company Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{payslip.company_name}</h1>
            <p className="text-sm text-gray-500">{payslip.company_address}</p>
            <p className="text-sm text-gray-500">Tel: {payslip.company_phone}</p>
          </div>

          {/* Payslip Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">PAYSLIP</h2>
            <p className="text-sm text-gray-500">{payslip.period_label}</p>
            <p className="text-xs text-gray-400">#{payslip.payslip_number}</p>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500">Employee Name</p>
              <p className="font-medium">{payslip.staff_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Staff ID</p>
              <p className="font-medium">{payslip.staff_id_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Job Title</p>
              <p className="font-medium">{payslip.job_title || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="font-medium">{payslip.department || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">SSNIT Number</p>
              <p className="font-medium">{payslip.ssnit_number || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">TIN</p>
              <p className="font-medium">{payslip.tin_number || '—'}</p>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Earnings</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm">Description</th>
                  <th className="px-4 py-2 text-right text-sm">Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">Basic Salary</td>
                  <td className="px-4 py-2 text-right">{payslip.basic_salary?.toLocaleString()}</td>
                </tr>
                {payslip.allowances_json?.map((a, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{a.name}</td>
                    <td className="px-4 py-2 text-right">{a.amount?.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-2">Gross Salary</td>
                  <td className="px-4 py-2 text-right">{payslip.gross_salary?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Deductions</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm">Description</th>
                  <th className="px-4 py-2 text-right text-sm">Amount (GHS)</th>
                 </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">SSNIT (Employee 5.5%)</td>
                  <td className="px-4 py-2 text-right">{payslip.ssnit_employee?.toLocaleString()}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">PAYE Income Tax</td>
                  <td className="px-4 py-2 text-right">{payslip.income_tax_paye?.toLocaleString()}</td>
                </tr>
                {payslip.deductions_json?.map((d, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{d.name}</td>
                    <td className="px-4 py-2 text-right">{d.amount?.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-2">Total Deductions</td>
                  <td className="px-4 py-2 text-right">{payslip.total_deductions?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div className="bg-gradient-to-r from-[#0B3B3C] to-[#1a5c5e] text-white rounded-lg p-4 text-center">
            <p className="text-sm opacity-80">Net Salary</p>
            <p className="text-3xl font-bold">GHS {payslip.net_salary?.toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 text-center text-xs text-gray-400 border-t">
            <p>Payment Date: {new Date(payslip.payment_date).toLocaleDateString()}</p>
            <p>Generated on: {new Date(payslip.generated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
          <p className="text-sm text-gray-500 mt-1">View and download payslips</p>
        </div>
        <div className="flex gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>2024</option>
            <option>2025</option>
          </select>
          <button className="px-4 py-2 border rounded-lg text-sm flex items-center gap-2">
            <Download size={14} /> Export All
          </button>
        </div>
      </div>

      {/* Payslip Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {payslips.map((payslip) => (
          <div key={payslip.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-400">{payslip.payslip_number}</p>
                  <p className="font-semibold text-gray-900 mt-1">{payslip.period_label}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs">Paid</span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">GHS {payslip.net_salary?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Net Pay</p>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <p>Gross: GHS {payslip.gross_salary?.toLocaleString()}</p>
                <p>PAYE: GHS {payslip.income_tax_paye?.toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedPayslip(payslip)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                  <Eye size={16} className="text-gray-500" />
                </button>
                <button onClick={() => downloadPDF(payslip.id)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
                  <Download size={16} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPayslip && <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />}
    </div>
  );
};

export default Payslips;