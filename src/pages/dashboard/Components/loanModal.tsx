import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  Eye, 
  Info,
  Users,
  User,
  Upload,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { companyId, userUUID } from '../../../constants/appConstants';

type LoanType = 'individual' | 'group';
type InterestMethod = 'fixed' | 'reducing' | 'flat';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface GroupMember {
  customerId: string;
  customerName: string;
  customerPhone: string;
  loanShare: number; // percentage or fixed amount
}

export interface LoanFormData {
  // Loan Classification
  loanType: LoanType;
  
  // Customer Information
  customer_id?: string; // for individual loans
  groupMembers?: GroupMember[]; // for group loans
  groupName?: string;
  
  // Loan Details
  loanCategory: string; // Business, Personal, Agricultural, etc.
  loanAmount: string;
  interestRate: string;
  duration: string; // in months
  interestMethod: InterestMethod;
  
  // Dates
  requestDate: string;
  disbursementDate: string;
  maturityDate: string;
  
  // Financial Details
  disbursedAmount: string;
  monthlyPayment: string;
  totalPayable: string;
  totalInterest: string;
  
  // Security
  collateral: string;
  collateralValue?: string;
  guarantor: string;
  guarantorPhone: string;
  guarantorAddress?: string;
  guarantorRelationship?: string;
  
  // Purpose & Documentation
  purpose: string;
  description?: string;
  
  // Documents (file uploads would be handled separately)
  documents?: {
    customerId?: File;
    businessPlan?: File;
    bankStatement?: File;
    guarantorForm?: File;
  };
  
  // System fields
  created_by: string;
  company_id: string;
  created_by_type: string;
  status: string;
  amountPaid: string;
  outstandingBalance: string;
}

interface LoanCalculations {
  totalInterest: number;
  totalRepayment: number;
  monthlyPayment: number;
  effectiveRate: number;
  maturityDate: string;
  paymentSchedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

interface NewLoanModalProps {
  showNewLoanModal: boolean;
  setShowNewLoanModal: (show: boolean) => void;
  availableCustomers?: Customer[]; // List of all customers for group loan selection
}

const NewLoanModal: React.FC<NewLoanModalProps> = ({
  showNewLoanModal,
  setShowNewLoanModal,
  availableCustomers = []
}) => {
  const [formData, setFormData] = useState<LoanFormData>({
    loanType: 'individual',
    loanCategory: '',
    loanAmount: '',
    interestRate: '',
    duration: '',
    interestMethod: 'fixed',
    requestDate: new Date().toISOString().split('T')[0],
    disbursementDate: '',
    maturityDate: '',
    disbursedAmount: '',
    monthlyPayment: '',
    totalPayable: '',
    totalInterest: '',
    collateral: '',
    guarantor: '',
    guarantorPhone: '',
    purpose: '',
    created_by: userUUID,
    company_id: companyId,
    created_by_type: userUUID === companyId ? 'company' : 'staff',
    status: 'pending',
    amountPaid: '0',
    outstandingBalance: '0',
    groupMembers: [],
    groupName: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [calculations, setCalculations] = useState<LoanCalculations | null>(null);
  const [selectedCustomerForGroup, setSelectedCustomerForGroup] = useState<string>('');
  const [memberLoanShare, setMemberLoanShare] = useState<string>('');

  // Reset form when modal closes
  useEffect(() => {
    if (!showNewLoanModal) {
      resetForm();
    }
  }, [showNewLoanModal]);

  // Auto-calculate disbursed amount when loan amount changes
  useEffect(() => {
    if (formData.loanAmount && !formData.disbursedAmount) {
      setFormData(prev => ({
        ...prev,
        disbursedAmount: formData.loanAmount
      }));
    }
  }, [formData.loanAmount]);

  // Calculate loan whenever relevant fields change
  useEffect(() => {
    if (
      formData.loanAmount && 
      formData.interestRate && 
      formData.duration && 
      formData.requestDate
    ) {
      const amount = parseFloat(formData.loanAmount);
      const rate = parseFloat(formData.interestRate);
      const months = parseInt(formData.duration);
      const startDate = new Date(formData.requestDate);

      if (amount > 0 && rate > 0 && months > 0 && !isNaN(startDate.getTime())) {
        calculateLoan(amount, rate, months, startDate);
      }
    }
  }, [
    formData.loanAmount, 
    formData.interestRate, 
    formData.duration, 
    formData.requestDate, 
    formData.interestMethod
  ]);

  const resetForm = () => {
    setFormData({
      loanType: 'individual',
      loanCategory: '',
      loanAmount: '',
      interestRate: '',
      duration: '',
      interestMethod: 'fixed',
      requestDate: new Date().toISOString().split('T')[0],
      disbursementDate: '',
      maturityDate: '',
      disbursedAmount: '',
      monthlyPayment: '',
      totalPayable: '',
      totalInterest: '',
      collateral: '',
      guarantor: '',
      guarantorPhone: '',
      purpose: '',
      created_by: userUUID,
      company_id: companyId,
      created_by_type: userUUID === companyId ? 'company' : 'staff',
      status: 'pending',
      amountPaid: '0',
      outstandingBalance: '0',
      groupMembers: [],
      groupName: ''
    });
    setErrors({});
    setShowPreview(false);
    setCalculations(null);
  };

  const calculateLoan = (
    principal: number, 
    annualRate: number, 
    months: number, 
    startDate: Date
  ) => {
    const monthlyRate = annualRate / 100 / 12;
    let totalInterest = 0;
    let monthlyPayment = 0;
    const schedule = [];

    if (formData.interestMethod === 'fixed') {
      // Fixed interest calculation
      totalInterest = principal * (annualRate / 100);
      monthlyPayment = (principal + totalInterest) / months;
      
      const monthlyPrincipal = principal / months;
      const monthlyInterest = totalInterest / months;
      let balance = principal;

      for (let month = 1; month <= months; month++) {
        balance -= monthlyPrincipal;
        schedule.push({
          month,
          payment: monthlyPayment,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          balance: Math.max(0, balance)
        });
      }
    } else if (formData.interestMethod === 'reducing') {
      // Reducing balance method (EMI)
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                       (Math.pow(1 + monthlyRate, months) - 1);
      
      let balance = principal;
      for (let month = 1; month <= months; month++) {
        const interestPayment = balance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        balance -= principalPayment;
        totalInterest += interestPayment;

        schedule.push({
          month,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: Math.max(0, balance)
        });
      }
    } else {
      // Flat rate method
      totalInterest = principal * (annualRate / 100) * (months / 12);
      monthlyPayment = (principal + totalInterest) / months;
      
      const monthlyPrincipal = principal / months;
      const monthlyInterest = totalInterest / months;
      let balance = principal;

      for (let month = 1; month <= months; month++) {
        balance -= monthlyPrincipal;
        schedule.push({
          month,
          payment: monthlyPayment,
          principal: monthlyPrincipal,
          interest: monthlyInterest,
          balance: Math.max(0, balance)
        });
      }
    }

    // Calculate maturity date
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + months);

    const totalRepayment = principal + totalInterest;
    const effectiveRate = (totalInterest / principal) * (12 / months) * 100;

    setFormData(prev => ({
      ...prev,
      maturityDate: maturityDate.toISOString().split('T')[0],
      monthlyPayment: monthlyPayment.toFixed(2),
      totalPayable: totalRepayment.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
      outstandingBalance: (-totalRepayment).toFixed(2)
    }));

    setCalculations({
      totalInterest,
      totalRepayment,
      monthlyPayment,
      effectiveRate,
      maturityDate: maturityDate.toLocaleDateString(),
      paymentSchedule: schedule
    });
  };

  const handleInputChange = (field: keyof LoanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Group loan functions
  const addGroupMember = () => {
    if (!selectedCustomerForGroup || !memberLoanShare) {
      setErrors(prev => ({
        ...prev,
        groupMember: 'Please select a customer and enter loan share'
      }));
      return;
    }

    const customer = availableCustomers.find(c => c.id === selectedCustomerForGroup);
    if (!customer) return;

    // Check if customer already added
    if (formData.groupMembers?.some(m => m.customerId === customer.id)) {
      setErrors(prev => ({
        ...prev,
        groupMember: 'Customer already added to group'
      }));
      return;
    }

    const newMember: GroupMember = {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      loanShare: parseFloat(memberLoanShare)
    };

    setFormData(prev => ({
      ...prev,
      groupMembers: [...(prev.groupMembers || []), newMember]
    }));

    setSelectedCustomerForGroup('');
    setMemberLoanShare('');
    setErrors(prev => ({ ...prev, groupMember: '' }));
  };

  const removeGroupMember = (customerId: string) => {
    setFormData(prev => ({
      ...prev,
      groupMembers: prev.groupMembers?.filter(m => m.customerId !== customerId)
    }));
  };

  const getTotalGroupShare = () => {
    return formData.groupMembers?.reduce((sum, member) => sum + member.loanShare, 0) || 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Loan type validation
    if (formData.loanType === 'individual' && !formData.customer_id) {
      newErrors.customer_id = 'Please select a customer';
    }

    if (formData.loanType === 'group') {
      if (!formData.groupName) {
        newErrors.groupName = 'Please enter a group name';
      }
      if (!formData.groupMembers || formData.groupMembers.length < 2) {
        newErrors.groupMembers = 'Group loan requires at least 2 members';
      }
    }

    // Basic loan details
    if (!formData.loanCategory) newErrors.loanCategory = 'Please select loan category';
    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0';
    }
    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = 'Please enter a valid interest rate';
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    if (!formData.requestDate) newErrors.requestDate = 'Please select request date';
    if (!formData.purpose) newErrors.purpose = 'Please enter loan purpose';
    if (!formData.guarantor) newErrors.guarantor = 'Please enter guarantor name';
    if (!formData.guarantorPhone) newErrors.guarantorPhone = 'Please enter guarantor phone';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Prepare the final loan data
      const loanData = {
        ...formData,
        // Convert string values to appropriate types
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        duration: parseInt(formData.duration),
        disbursedAmount: parseFloat(formData.disbursedAmount),
        monthlyPayment: parseFloat(formData.monthlyPayment),
        totalPayable: parseFloat(formData.totalPayable),
        totalInterest: parseFloat(formData.totalInterest),
        outstandingBalance: parseFloat(formData.outstandingBalance),
        amountPaid: parseFloat(formData.amountPaid),
        collateralValue: formData.collateralValue ? parseFloat(formData.collateralValue) : undefined,
        // Include calculations for reference
        calculations: calculations
      };

      console.log('=== LOAN APPLICATION DATA ===');
      console.log(JSON.stringify(loanData, null, 2));
      console.log('=== END LOAN DATA ===');
      
      // Here you would make your API call
      // await createLoan(loanData);
      
      // Close modal and reset
      setShowNewLoanModal(false);
      resetForm();
    }
  };

  if (!showNewLoanModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center">
                <CreditCard className="mr-3 h-8 w-8" />
                New Loan Application
              </h2>
              <p className="mt-2 text-purple-100">
                Complete loan details with automatic calculations
              </p>
            </div>
            <button 
              onClick={() => setShowNewLoanModal(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {!showPreview ? (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Loan Type Selection */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Loan Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('loanType', 'individual')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.loanType === 'individual'
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <User className="h-6 w-6 mb-2" />
                    <span className="font-medium">Individual Loan</span>
                    <span className="text-xs text-gray-500 mt-1">Single borrower</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('loanType', 'group')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.loanType === 'group'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="font-medium">Group Loan</span>
                    <span className="text-xs text-gray-500 mt-1">Multiple borrowers</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Customer/Group Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                {formData.loanType === 'individual' ? 'Customer Information' : 'Group Information'}
              </h3>
              
              {formData.loanType === 'individual' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => handleInputChange('customer_id', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.customer_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select customer</option>
                    {availableCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                  {errors.customer_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.customer_id}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={formData.groupName || ''}
                      onChange={(e) => handleInputChange('groupName', e.target.value)}
                      placeholder="e.g., Women Entrepreneurs Group"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                        errors.groupName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.groupName && (
                      <p className="text-red-600 text-sm mt-1">{errors.groupName}</p>
                    )}
                  </div>

                  {/* Add Group Members */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add Group Members *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <select
                        value={selectedCustomerForGroup}
                        onChange={(e) => setSelectedCustomerForGroup(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select customer</option>
                        {availableCustomers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={memberLoanShare}
                        onChange={(e) => setMemberLoanShare(e.target.value)}
                        placeholder="Loan share amount"
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={addGroupMember}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors flex items-center justify-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Member
                      </button>
                    </div>
                    {errors.groupMember && (
                      <p className="text-red-600 text-sm mt-1">{errors.groupMember}</p>
                    )}
                  </div>

                  {/* Group Members List */}
                  {formData.groupMembers && formData.groupMembers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-700 mb-2">
                        Group Members ({formData.groupMembers.length})
                      </h4>
                      <div className="space-y-2">
                        {formData.groupMembers.map((member, index) => (
                          <div 
                            key={member.customerId}
                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{member.customerName}</p>
                              <p className="text-sm text-gray-500">{member.customerPhone}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-blue-600">
                                {formatCurrency(member.loanShare)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeGroupMember(member.customerId)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">
                          Total Group Share: <strong>{formatCurrency(getTotalGroupShare())}</strong>
                        </p>
                      </div>
                    </div>
                  )}
                  {errors.groupMembers && (
                    <p className="text-red-600 text-sm mt-1">{errors.groupMembers}</p>
                  )}
                </div>
              )}
            </div>

            {/* Interest Calculation Method */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Interest Calculation Method *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="fixed"
                    checked={formData.interestMethod === 'fixed'}
                    onChange={(e) => handleInputChange('interestMethod', e.target.value as InterestMethod)}
                    className="mr-2"
                  />
                  <span className="text-sm">Fixed Interest</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="reducing"
                    checked={formData.interestMethod === 'reducing'}
                    onChange={(e) => handleInputChange('interestMethod', e.target.value as InterestMethod)}
                    className="mr-2"
                  />
                  <span className="text-sm">Reducing Balance (EMI)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="flat"
                    checked={formData.interestMethod === 'flat'}
                    onChange={(e) => handleInputChange('interestMethod', e.target.value as InterestMethod)}
                    className="mr-2"
                  />
                  <span className="text-sm">Flat Rate</span>
                </label>
              </div>
            </div>

            {/* Loan Details */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Loan Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Category *
                  </label>
                  <select
                    value={formData.loanCategory}
                    onChange={(e) => handleInputChange('loanCategory', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.loanCategory ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select loan category</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Agricultural Loan">Agricultural Loan</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="Auto Loan">Auto Loan</option>
                    <option value="Emergency Loan">Emergency Loan</option>
                  </select>
                  {errors.loanCategory && (
                    <p className="text-red-600 text-sm mt-1">{errors.loanCategory}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount (₵) *
                  </label>
                  <input
                    type="number"
                    value={formData.loanAmount}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    placeholder="50000.00"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.loanAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.loanAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.loanAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    placeholder="15.0"
                    min="0"
                    step="0.1"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.interestRate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.interestRate && (
                    <p className="text-red-600 text-sm mt-1">{errors.interestRate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Duration (Months) *
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.duration ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select duration</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="60">60 months</option>
                  </select>
                  {errors.duration && (
                    <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Request Date *
                  </label>
                  <input
                    type="date"
                    value={formData.requestDate}
                    onChange={(e) => handleInputChange('requestDate', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.requestDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.requestDate && (
                    <p className="text-red-600 text-sm mt-1">{errors.requestDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maturity Date (Auto-calculated)
                  </label>
                  <input
                    type="date"
                    value={formData.maturityDate}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disbursed Amount (₵)
                  </label>
                  <input
                    type="number"
                    value={formData.disbursedAmount}
                    onChange={(e) => handleInputChange('disbursedAmount', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="50000.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose *
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    placeholder="e.g., Business expansion"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.purpose ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.purpose && (
                    <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>
                  )}
                </div>
              </div>

              {/* Fixed Interest Information Banner */}
              {formData.interestMethod === 'fixed' && formData.loanAmount && formData.interestRate && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Fixed Interest Loan Information
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    For Fixed Interest Loans: Interest is calculated as a fixed percentage of the principal amount.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">Fixed Interest Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(parseFloat(formData.loanAmount) * (parseFloat(formData.interestRate) / 100))}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">Total Repayment</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatCurrency(
                          parseFloat(formData.loanAmount) + 
                          (parseFloat(formData.loanAmount) * (parseFloat(formData.interestRate) / 100))
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formData.interestRate}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Loan Calculations Display */}
            {calculations && (
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Loan Calculations ({
                    formData.interestMethod === 'reducing' 
                      ? 'Reducing Balance' 
                      : formData.interestMethod === 'fixed' 
                      ? 'Fixed Interest' 
                      : 'Flat Rate'
                  })
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(calculations.monthlyPayment)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Interest</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(calculations.totalInterest)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Repayment</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(calculations.totalRepayment)}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Effective Rate</p>
                    <p className="text-xl font-bold text-orange-600">
                      {calculations.effectiveRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Guarantor Information */}
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h3 className="font-semibold text-gray-900 mb-4">Guarantor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.guarantor}
                    onChange={(e) => handleInputChange('guarantor', e.target.value)}
                    placeholder="Full name"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.guarantor ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.guarantor && (
                    <p className="text-red-600 text-sm mt-1">{errors.guarantor}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Phone *
                  </label>
                  <input
                    type="tel"
                    value={formData.guarantorPhone}
                    onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                    placeholder="+233 XX XXX XXXX"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 ${
                      errors.guarantorPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.guarantorPhone && (
                    <p className="text-red-600 text-sm mt-1">{errors.guarantorPhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    value={formData.guarantorRelationship || ''}
                    onChange={(e) => handleInputChange('guarantorRelationship', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select relationship</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Business Partner">Business Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Address
                  </label>
                  <input
                    type="text"
                    value={formData.guarantorAddress || ''}
                    onChange={(e) => handleInputChange('guarantorAddress', e.target.value)}
                    placeholder="Address"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral
                  </label>
                  <input
                    type="text"
                    value={formData.collateral}
                    onChange={(e) => handleInputChange('collateral', e.target.value)}
                    placeholder="e.g., Business Equipment, Land Title"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral Value (₵)
                  </label>
                  <input
                    type="number"
                    value={formData.collateralValue || ''}
                    onChange={(e) => handleInputChange('collateralValue', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Required Documents */}
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-gray-900 mb-4">Required Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <div className="text-sm text-gray-600">Customer ID Card</div>
                  <button 
                    type="button"
                    className="mt-2 text-purple-600 text-sm hover:underline"
                  >
                    Upload File
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <div className="text-sm text-gray-600">Business Plan/Proof of Income</div>
                  <button 
                    type="button"
                    className="mt-2 text-purple-600 text-sm hover:underline"
                  >
                    Upload File
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <div className="text-sm text-gray-600">Bank Statement</div>
                  <button 
                    type="button"
                    className="mt-2 text-purple-600 text-sm hover:underline"
                  >
                    Upload File
                  </button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <div className="text-sm text-gray-600">Guarantor Form</div>
                  <button 
                    type="button"
                    className="mt-2 text-purple-600 text-sm hover:underline"
                  >
                    Upload File
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Additional Notes
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Any additional information about this loan application"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {calculations && (
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="bg-white border border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Preview Application
                </button>
              )}
              <button 
                type="button"
                onClick={() => setShowNewLoanModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition-all font-semibold flex items-center justify-center"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Submit Application
              </button>
            </div>
          </form>
        ) : (
          /* Preview Section */
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Application Preview</h3>
              <p className="text-gray-600">Review all details before submission</p>
            </div>

            <div className="space-y-6">
              {/* Loan Type Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full font-semibold ${
                  formData.loanType === 'individual' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {formData.loanType === 'individual' ? (
                    <><User className="inline h-4 w-4 mr-1" /> Individual Loan</>
                  ) : (
                    <><Users className="inline h-4 w-4 mr-1" /> Group Loan</>
                  )}
                </span>
              </div>

              {/* Customer/Group Info */}
              {formData.loanType === 'group' && (
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-blue-900 mb-4">
                    Group: {formData.groupName}
                  </h4>
                  <div className="space-y-2">
                    {formData.groupMembers?.map((member, index) => (
                      <div key={member.customerId} className="bg-white p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{member.customerName}</p>
                          <p className="text-sm text-gray-600">{member.customerPhone}</p>
                        </div>
                        <p className="font-bold text-blue-600">{formatCurrency(member.loanShare)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-800">
                      Total Group Allocation: <strong>{formatCurrency(getTotalGroupShare())}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Loan Information */}
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl">
                <h4 className="font-bold text-lg text-purple-900 mb-4">Loan Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Loan Category</p>
                    <p className="font-semibold text-gray-900">{formData.loanCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(formData.loanAmount || '0'))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Rate</p>
                    <p className="font-semibold text-gray-900">{formData.interestRate}% per annum</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-semibold text-gray-900">{formData.duration} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interest Method</p>
                    <p className="font-semibold text-gray-900 capitalize">{formData.interestMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Request Date</p>
                    <p className="font-semibold text-gray-900">{formData.requestDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Maturity Date</p>
                    <p className="font-semibold text-gray-900">{formData.maturityDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Disbursed Amount</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(formData.disbursedAmount || '0'))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              {calculations && (
                <div className="bg-white border-2 border-purple-200 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-purple-900 mb-4">Financial Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {formatCurrency(calculations.monthlyPayment)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Interest</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(calculations.totalInterest)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Total Repayment</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculations.totalRepayment)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Effective Rate</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculations.effectiveRate.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Payment Schedule Preview */}
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-3">
                      Payment Schedule Preview (First 6 Months)
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Month</th>
                            <th className="px-4 py-2 text-right">Principal</th>
                            <th className="px-4 py-2 text-right">Interest</th>
                            <th className="px-4 py-2 text-right">Payment</th>
                            <th className="px-4 py-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculations.paymentSchedule.slice(0, 6).map((payment) => (
                            <tr key={payment.month} className="border-b">
                              <td className="px-4 py-2">{payment.month}</td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(payment.principal)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(payment.interest)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(payment.payment)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {formatCurrency(payment.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {calculations.paymentSchedule.length > 6 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        + {calculations.paymentSchedule.length - 6} more months...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Security & Guarantor */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-bold text-lg text-gray-900 mb-4">Security & Guarantor</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Collateral</p>
                    <p className="font-semibold text-gray-900">
                      {formData.collateral || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Collateral Value</p>
                    <p className="font-semibold text-gray-900">
                      {formData.collateralValue 
                        ? formatCurrency(parseFloat(formData.collateralValue)) 
                        : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guarantor</p>
                    <p className="font-semibold text-gray-900">{formData.guarantor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Guarantor Phone</p>
                    <p className="font-semibold text-gray-900">{formData.guarantorPhone}</p>
                  </div>
                  {formData.guarantorRelationship && (
                    <div>
                      <p className="text-sm text-gray-600">Relationship</p>
                      <p className="font-semibold text-gray-900">{formData.guarantorRelationship}</p>
                    </div>
                  )}
                  {formData.guarantorAddress && (
                    <div>
                      <p className="text-sm text-gray-600">Guarantor Address</p>
                      <p className="font-semibold text-gray-900">{formData.guarantorAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Purpose */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h4 className="font-bold text-lg text-gray-900 mb-2">Loan Purpose</h4>
                <p className="text-gray-700">{formData.purpose}</p>
                {formData.description && (
                  <>
                    <h4 className="font-bold text-lg text-gray-900 mt-4 mb-2">Additional Notes</h4>
                    <p className="text-gray-700">{formData.description}</p>
                  </>
                )}
              </div>
            </div>

            {/* Preview Action Buttons */}
            <div className="mt-8 flex gap-4">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirm & Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewLoanModal;