import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Edit2, DollarSign, Percent, 
  Calendar, Shield, AlertCircle, Save, X 
} from 'lucide-react';

const StaffPayrollSetup = ({ companyId, staffId }) => {
  const [profile, setProfile] = useState(null);
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [showAllowanceModal, setShowAllowanceModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [allowanceTypes, setAllowanceTypes] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffData();
    fetchPayrollTypes();
  }, [staffId]);

  const fetchStaffData = async () => {
    try {
      const [profileRes, allowancesRes, deductionsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/payroll/${companyId}/staff/${staffId}/salary-profile`),
        fetch(`http://localhost:5000/api/payroll/${companyId}/staff/${staffId}/allowances`),
        fetch(`http://localhost:5000/api/payroll/${companyId}/staff/${staffId}/deductions`)
      ]);
      
      setProfile((await profileRes.json()).data);
      setAllowances((await allowancesRes.json()).data);
      setDeductions((await deductionsRes.json()).data);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollTypes = async () => {
    const res = await fetch(`http://localhost:5000/api/payroll/${companyId}/types`);
    const data = await res.json();
    setAllowanceTypes(data.data.allowanceTypes);
    setDeductionTypes(data.data.deductionTypes);
  };

  const AllowanceModal = () => {
    const [form, setForm] = useState({ allowance_type_id: '', calculation_type: 'fixed', amount: 0 });

    const handleSubmit = async () => {
      const res = await fetch(`http://localhost:5000/api/payroll/${companyId}/staff/${staffId}/allowances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, created_by: 'current-user-id' })
      });
      if (res.ok) {
        setShowAllowanceModal(false);
        fetchStaffData();
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl w-full max-w-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add Allowance</h3>
          <div className="space-y-4">
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B3B3C]"
              onChange={(e) => setForm({ ...form, allowance_type_id: e.target.value })}
            >
              <option value="">Select Allowance Type</option>
              {allowanceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setForm({ ...form, calculation_type: e.target.value })}
            >
              <option value="fixed">Fixed Amount</option>
              <option value="percentage_of_basic">Percentage of Basic</option>
            </select>
            <input 
              type="number" 
              placeholder="Amount" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSubmit} className="flex-1 py-2 bg-[#0B3B3C] text-white rounded-lg">Add</button>
            <button onClick={() => setShowAllowanceModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Salary Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm text-gray-500">Basic Salary</label>
            <p className="text-xl font-bold text-gray-900">GHS {(profile?.basic_salary || 0).toLocaleString()}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Payment Method</label>
            <p className="font-medium capitalize">{profile?.payment_method || 'Bank'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Tax Status</label>
            <p className="font-medium">{profile?.is_tax_exempt ? 'Tax Exempt' : 'Taxable'}</p>
          </div>
        </div>
      </div>

      {/* Allowances Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Allowances</h2>
          <button onClick={() => setShowAllowanceModal(true)} className="text-sm text-[#0B3B3C] font-medium flex items-center gap-1">
            <Plus size={14} /> Add Allowance
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {allowances.map((allowance) => (
            <div key={allowance.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{allowance.type_name}</p>
                <p className="text-xs text-gray-500 capitalize">{allowance.calculation_type}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">GHS {allowance.amount.toLocaleString()}</p>
                <button className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {allowances.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">No allowances added</div>
          )}
        </div>
      </div>

      {/* Deductions Section */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">Deductions</h2>
          <button onClick={() => setShowDeductionModal(true)} className="text-sm text-[#0B3B3C] font-medium flex items-center gap-1">
            <Plus size={14} /> Add Deduction
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {deductions.map((deduction) => (
            <div key={deduction.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{deduction.type_name}</p>
                <p className="text-xs text-gray-500 capitalize">{deduction.calculation_type}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold text-red-600">-GHS {deduction.amount.toLocaleString()}</p>
                <button className="text-red-400 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {deductions.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400">No deductions added</div>
          )}
        </div>
      </div>

      {showAllowanceModal && <AllowanceModal />}
    </div>
  );
};

export default StaffPayrollSetup;