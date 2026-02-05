import React, { useState, useEffect } from 'react';
import { X, Plus, PiggyBank, Wallet, CreditCard, Calendar, DollarSign, User, FileText, CheckCircle, TrendingUp, Eye, Info } from 'lucide-react';
import { Customer } from '../data/mockData';
import { companyId, userUUID } from '../constants/appConstants';

type account_type = 'susu' | 'savings' | 'loan';

export interface AccountFormData {
  id?: string;
  customer_id: string;
  created_at?: string;
  account_type: account_type;
  accountName: string;
  description: string;
  created_by: string;
  company_id: string;
  balance?: Number;
  // Susu specific
  susuAmount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  susuDuration?: number; // in months
  startDate?: string;
  daily_rate?: number;
  // Savings specific
  minimumBalance?: number;
  interestRate?: number;
  // Loan specific
  initial_deposit?: number;
  interestRateLoan?: number;
  loanTerm?: number; // in months
  collateral?: string;
  guarantor?: string;
  guarantorPhone?: string;
  created_by_type: string;
  loanType?: string;
  loanAmount?: string;
  duration?: string;
  purpose?: string;
  disbursedAmount?: string;
  disbursementDate?: string;
  maturityDate?: string;
  monthlypayment?: string;
  totalpayable?: string;
  amountpaid?: string;
  outstandingbalance?: string;
  interestmethod?: string;
}

interface LoanCalculations {
  totalInterest: number;
  totalRepayment: number;
  monthlyPayment: number;
  effectiveRate: number;
  maturityDate: string;
  paymentSchedule: Array<{
    month: number;
    week?: number;
    day?: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (accountData: AccountFormData) => void;
  customer: Customer;
  isLoading?: boolean;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customer,
  isLoading = false
}) => {
  const [interestMethod, setInterestMethod] = useState<'reducing' | 'flat' | 'fixed'>('fixed');

  const [formData, setFormData] = useState<AccountFormData>({
    customer_id: customer.id || '',
    created_by: userUUID,
    company_id: companyId,
    account_type: 'susu',
    accountName: '',
    description: '',
    daily_rate: 0,
    created_by_type: userUUID === companyId ? 'company' : 'staff',
    loanAmount: '',
    collateral: '',
    guarantor: '',
    guarantorPhone: '',
    loanTerm: 0,
    loanType: '',
    purpose: '',
    duration: '',
    disbursedAmount: '',
    disbursementDate: '',
    maturityDate: '',
    monthlypayment: '',
    totalpayable: '',
    amountpaid: '',
    outstandingbalance: '',
    interestmethod: interestMethod
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [calculations, setCalculations] = useState<LoanCalculations | null>(null);
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_id: customer.id || '',
        account_type: 'susu',
        accountName: '',
        description: '',
        created_by: userUUID,
        company_id: companyId,
        created_by_type: userUUID === companyId ? 'company' : 'staff',
        guarantor: '',
        guarantorPhone: '',
        loanTerm: 0,
        loanType: '',
        purpose: '',
        duration: '',
        disbursedAmount: '',
        disbursementDate: '',
        maturityDate: '',
        monthlypayment: '',
        totalpayable: '',
        amountpaid: '',
        outstandingbalance: '',
        interestmethod: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.loanAmount && formData.interestRate && formData.duration && formData.disbursementDate) {
      const amount = parseFloat(formData.loanAmount);
      const rate = formData.interestRate;
      const months = parseInt(formData.duration);
      const startDate = new Date(formData.disbursementDate);

      if (amount > 0 && rate > 0 && months > 0 && !isNaN(startDate.getTime())) {
        calculateLoan(amount, rate, months, startDate);
      }
    }
  }, [formData.loanAmount, formData.interestRate, formData.duration, formData.disbursementDate, interestMethod]);

   useEffect(() => {
    if (formData.loanAmount && !formData.disbursedAmount) {
      setFormData(prev => ({
        ...prev,
        disbursedAmount: formData.loanAmount
      }));
    }
  }, [formData.loanAmount]);

   const calculateLoan = (principal: number, annualRate: number, months: number, startDate: Date) => {
    const monthlyRate = annualRate / 100 / 12;
    let totalInterest = 0;
    let monthlyPayment = 0;
    const schedule = [];
    if ( interestMethod === 'fixed' ) {
    // Fixed interest calculation: Interest = Principal * Rate
    totalInterest = principal * (annualRate / 100);
    monthlyPayment = (principal + totalInterest) / months;
    
    // For fixed loans, interest is the same regardless of months
    const monthlyPrincipal = principal / months;
    const monthlyInterest = totalInterest / months;
    let balance = principal;

    for (let month = 1; month <= months; month++) {
      balance -= monthlyPrincipal;
      schedule.push({
        month,
        week: month / 7,
        day: month * 30 / 7,
        payment: monthlyPayment,
        principal: monthlyPrincipal,
        interest: monthlyInterest,
        balance: Math.max(0, balance)
      });
    }
  }

    else if (interestMethod === 'reducing') {
      // Reducing balance method (EMI)
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      
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
      monthlypayment: `${monthlyPayment}`,
      totalpayable: `${totalRepayment}`,
      amountpaid: '0',
      outstandingbalance: `${-totalRepayment}`
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


  const handleInputChange = (field: keyof AccountFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    console.log(`Form data: ${JSON.stringify(formData)}`)
    if (!formData.customer_id) newErrors.customer_id = 'Please select a customer';
    
    // Type-specific validations
    switch (formData.account_type) {
      case 'susu':
        if (!formData.daily_rate || formData.daily_rate <= 0) {
          newErrors.daily_rate = 'Daily rate must be greater than 0';
        }
        if (!formData.frequency) newErrors.frequency = 'Please select frequency';
        break;

      case 'savings':
        // if (!formData.initial_deposit || formData.initial_deposit < 0) {
        //   newErrors.initial_deposit = 'Initial deposit must be 0 or greater';
        // }
        if (!formData.minimumBalance || formData.minimumBalance < 0) {
          newErrors.minimumBalance = 'Minimum balance must be 0 or greater';
        }
        if (formData.interestRate && (formData.interestRate < 0 || formData.interestRate > 100)) {
          newErrors.interestRate = 'Interest rate must be between 0 and 100';
        }
        break;

      case 'loan':
        if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
          newErrors.initial_deposit = 'Loan amount must be greater than 0';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const getAccountIcon = (type: account_type) => {
    switch (type) {
      case 'susu': return <PiggyBank className="h-5 w-5" />;
      case 'savings': return <Wallet className="h-5 w-5" />;
      case 'loan': return <CreditCard className="h-5 w-5" />;
    }
  };

  const getAccountColor = (type: account_type) => {
    switch (type) {
      case 'susu': return 'bg-green-100 text-green-800 border-green-200';
      case 'savings': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'loan': return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-full w-[50%] max-h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <Plus className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Add New Account</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Customer: {customer.name}
              </label>
              {/* <select
                value={formData.customer_id}
                onChange={(e) => handleInputChange('customer_id', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.customer_id ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email && `(${customer.email})`}
                  </option>
                ))}
              </select> */}
              {/* {errors.customer_id && <p className="text-red-600 text-sm mt-1">{errors.customer_id}</p>} */}
            </div>

            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Account Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {(['susu', 'savings', 'loan'] as account_type[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleInputChange('account_type', type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.account_type === type
                        ? getAccountColor(type)
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    disabled={isLoading}
                  >
                    <div className="flex flex-col items-center">
                      {getAccountIcon(type)}
                      <span className="text-sm font-medium capitalize mt-2">{type}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            

            {/* Type-specific fields */}
            {formData.account_type === 'susu' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 flex items-center">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  Susu Account Details
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      Daily Rate (¢) *
                    </label>
                    <input
                      type="number"
                      value={formData.daily_rate || ''}
                      onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.susuAmount ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {errors.susuAmount && <p className="text-red-600 text-sm mt-1">{errors.susuAmount}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency *</label>
                    <select
                      value={formData.frequency || ''}
                      onChange={(e) => handleInputChange('frequency', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.frequency ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select frequency</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    {errors.frequency && <p className="text-red-600 text-sm mt-1">{errors.frequency}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Deposit (¢)
                    </label>
                    <input
                      type="number"
                      value={formData.initial_deposit || ''}
                      onChange={(e) => handleInputChange('initial_deposit', parseFloat(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.initial_deposit ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    </div> */}
                  </div>
              </div>
            )}

            {formData.account_type === 'savings' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 flex items-center">
                  <Wallet className="h-4 w-4 mr-2" />
                  Savings Account Details
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Deposit (¢)
                    </label>
                    <input
                      type="number"
                      value={formData.initial_deposit || ''}
                      onChange={(e) => handleInputChange('initial_deposit', parseFloat(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.initial_deposit ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {errors.initial_deposit && <p className="text-red-600 text-sm mt-1">{errors.initial_deposit}</p>}
                  </div> */}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Balance (¢) *
                    </label>
                    <input
                      type="number"
                      value={formData.minimumBalance || ''}
                      onChange={(e) => handleInputChange('minimumBalance', parseFloat(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.minimumBalance ? 'border-red-300' : 'border-gray-300'
                      }`}
                      disabled={isLoading}
                    />
                    {errors.minimumBalance && <p className="text-red-600 text-sm mt-1">{errors.minimumBalance}</p>}
                  </div>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (% per year)
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate || ''}
                    onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value))}
                    placeholder="2.5"
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.interestRate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.interestRate && <p className="text-red-600 text-sm mt-1">{errors.interestRate}</p>}
                </div> */}
              </div>
            )}

            {formData.account_type === 'loan' && (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold flex items-center">
                  <CreditCard className="mr-3 h-8 w-8" />
                  Loan Application
                </h2>
                <p className="mt-2 text-purple-100">Complete loan details with automatic calculations</p>
              </div>
              
            </div>
          </div>

          {!showPreview ? (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interest Calculation Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="fixed"
                      checked={interestMethod === 'fixed'}
                      onChange={(e) => setInterestMethod(e.target.value as 'fixed' | 'reducing' | 'flat')}
                      className="mr-2"
                    />
                    <span className="text-sm">Fixed</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="reducing"
                      checked={interestMethod === 'reducing'}
                      onChange={(e) => setInterestMethod(e.target.value as 'reducing' | 'flat')}
                      className="mr-2"
                    />
                    <span className="text-sm">Reducing Balance (EMI)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="flat"
                      checked={interestMethod === 'flat'}
                      onChange={(e) => setInterestMethod(e.target.value as 'reducing' | 'flat')}
                      className="mr-2"
                    />
                    <span className="text-sm">Flat Rate</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Type *
                  </label>
                  <select
                    value={formData.loanType || ''}
                    onChange={(e) => handleInputChange('loanType', e.target.value)}
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.loanType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select loan type</option>
                    <option value="Business Loan">Business Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Emergency Loan">Emergency Loan</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="Agricultural Loan">Agricultural Loan</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.loanType && <p className="text-red-600 text-sm mt-1">{errors.loanType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount (GHS) *
                  </label>
                  <input
                    type="number"
                    value={formData.loanAmount || ''}
                    onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                    placeholder="50000.00"
                    min="0"
                    step="0.01"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.loanAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.loanAmount && <p className="text-red-600 text-sm mt-1">{errors.loanAmount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interest Rate (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate || ''}
                    onChange={(e) => handleInputChange('interestRate', e.target.value)}
                    placeholder="15.0"
                    required={true}
                    min="0"
                    step="0.1"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.interestRate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.interestRate && <p className="text-red-600 text-sm mt-1">{errors.interestRate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Duration (Months) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration || ''}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="12"
                    min="1"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.duration ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
                </div>

                {/* In the form, replace the disbursement date field with this: */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Request Date *
  </label>
  <input
    type="date"
    value={formData.disbursementDate || ''}
    onChange={(e) => handleInputChange('disbursementDate', e.target.value)}
    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
      errors.disbursementDate ? 'border-red-300' : 'border-gray-300'
    }`}
  />
  {errors.disbursementDate && <p className="text-red-600 text-sm mt-1">{errors.disbursementDate}</p>}
</div>

{/* Add a new field for fixed loan additional information */}
{interestMethod === 'fixed' && (
  <div className="col-span-2">
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
        <Info className="mr-2 h-5 w-5" />
        Fixed Interest Loan Information
      </h4>
      <p className="text-sm text-yellow-700 mb-3">
        For Fixed Interest Loans: Interest is calculated as a fixed percentage of the principal amount, 
        regardless of the loan duration. Example: 10% of GHS 1,000 = GHS 100 total interest.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-600">Fixed Interest Amount</p>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(
              formData.loanAmount && formData.interestRate 
                ? parseFloat(formData.loanAmount) * (formData.interestRate / 100)
                : 0
            )}
          </p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-600">Total Repayment</p>
          <p className="text-lg font-bold text-purple-600">
            {formatCurrency(
              formData.loanAmount && formData.interestRate 
                ? parseFloat(formData.loanAmount) + (parseFloat(formData.loanAmount) * (formData.interestRate / 100))
                : 0
            )}
          </p>
        </div>
        <div className="bg-white p-3 rounded border">
          <p className="text-sm text-gray-600">Fixed Interest Rate</p>
          <p className="text-lg font-bold text-blue-600">
            {formData.interestRate ? formData.interestRate : 0}%
          </p>
        </div>
      </div>
    </div>
  </div>
)}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maturity Date (Auto-calculated)
                  </label>
                  <input
                    type="date"
                    value={formData.maturityDate || ''}
                    readOnly
                    className="w-full border rounded-lg px-4 py-3 bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disbursed Amount (GHS) *
                  </label>
                  <input
                    type="number"
                    value={formData.disbursedAmount || ''}
                    onChange={(e) => handleInputChange('disbursedAmount', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="50000.00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral
                  </label>
                  <input
                    type="text"
                    value={formData.collateral || ''}
                    onChange={(e) => handleInputChange('collateral', e.target.value)}
                    placeholder="e.g. Business Equipment, Land Title"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.collateral ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.collateral && <p className="text-red-600 text-sm mt-1">{errors.collateral}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor Name *
                  </label>
                  <input
                    type="text"
                    value={formData.guarantor || ''}
                    onChange={(e) => handleInputChange('guarantor', e.target.value)}
                    placeholder="Full name of guarantor"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.guarantor ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.guarantor && <p className="text-red-600 text-sm mt-1">{errors.guarantor}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guarantor's Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formData.guarantorPhone || ''}
                    onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                    placeholder="0123456789"
                    className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      errors.guarantor ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.guarantor && <p className="text-red-600 text-sm mt-1">{errors.guarantor}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loan Purpose *
                </label>
                <textarea
                  value={formData.purpose || ''}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  placeholder="Describe the purpose of this loan"
                  rows={3}
                  className={`w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.purpose ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
              </div>

              {calculations && (
                <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Loan Calculations ({interestMethod === 'reducing' ? 'Reducing Balance' : interestMethod === 'fixed' ? 'Fixed Interest Rate' : 'Flat Rate'})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Monthly Payment</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(calculations.monthlyPayment)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(calculations.totalInterest)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Total Repayment</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(calculations.totalRepayment)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-600">Effective Rate</p>
                      <p className="text-xl font-bold text-orange-600">{calculations.effectiveRate.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Any additional information"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mt-8 flex gap-4">
                {calculations && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  {showPreview ? 'Edit Form' : 'Preview Application'}
                </button>
              )}
                {/* <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Submit Loan Application
                </button> */}
              </div>
            </form>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Loan Application Preview</h3>
                <p className="text-gray-600">Review all details before submission</p>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-purple-900 mb-4">Loan Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Loan Type</p>
                      <p className="font-semibold text-gray-900">{formData.loanType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Loan Amount</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(formData.loanAmount || '0'))}</p>
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
                      <p className="text-sm text-gray-600">Disbursement Date</p>
                      <p className="font-semibold text-gray-900">{formData.disbursementDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Maturity Date</p>
                      <p className="font-semibold text-gray-900">{formData.maturityDate}</p>
                    </div>
                  </div>
                </div>

                {calculations && (
                  <div className="bg-white border-2 border-purple-200 p-6 rounded-xl">
                    <h4 className="font-bold text-lg text-purple-900 mb-4">Financial Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Monthly Payment</p>
                        <p className="text-2xl font-bold text-purple-600">{formatCurrency(calculations.monthlyPayment)}</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Interest</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculations.totalInterest)}</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Total Repayment</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(calculations.totalRepayment)}</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Effective Rate</p>
                        <p className="text-2xl font-bold text-orange-600">{calculations.effectiveRate.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h5 className="font-semibold text-gray-900 mb-3">Payment Schedule Preview (First 6 Months)</h5>
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
                                <td className="px-4 py-2 text-right">{formatCurrency(payment.principal)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(payment.interest)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(payment.payment)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(payment.balance)}</td>
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

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-gray-900 mb-4">Security & Guarantor</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Collateral</p>
                      <p className="font-semibold text-gray-900">{formData.collateral}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guarantor</p>
                      <p className="font-semibold text-gray-900">{formData.guarantor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guarantor Phone</p>
                      <p className="font-semibold text-gray-900">{formData.guarantorPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-gray-900 mb-2">Loan Purpose</h4>
                  <p className="text-gray-700">{formData.purpose}</p>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Back to Edit
                </button>
                {/* <button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Confirm & Submit
                </button> */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
            )}
            </div>
          {/* Actions */}
          <div className="flex space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAccountModal;