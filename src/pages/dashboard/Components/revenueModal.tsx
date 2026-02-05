import React, { useState, useEffect } from 'react';
import { X, Eye, Edit2, Trash2, CheckCircle, AlertCircle, Calendar, FileText, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyId, userUUID } from '../../../constants/appConstants';
import { Commission } from '../../../data/mockData';
import { useFinance } from '../../../contexts/dashboard/Finance';
import { useTransactions } from '../../../contexts/dashboard/Transactions';

export interface RevenueItem {
  id: string | number;
  description: string;
  source: string;
  category: string;
  amount: number | string;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  notes?: string;
  method?: string;
  account_id?: string;
}

interface RevenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  revenue: RevenueItem | null;
  mode: 'view' | 'edit' | 'create';
  onSave: (data: RevenueItem) => void;
  onDelete?: (id: string | number) => void;
}

const NewRevenueModal = ({ isOpen, onClose, revenue, mode, onSave, onDelete }: RevenueModalProps) => {
  const [formData, setFormData] = useState<RevenueItem>({
    id: '',
    description: '',
    source: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: revenue?.status || 'Pending',
    notes: ''
  });
  const { addPayment } = useFinance();
    const { deductCommission } = useTransactions();

  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (revenue) {
      setFormData({
        ...revenue,
        status: revenue.status || '',
        notes: revenue.notes || '',
        amount: revenue.amount || '',
        date: revenue.payment_date ? revenue.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else if (mode === 'create') {
      setFormData({
        id: Date.now(),
        description: '',
        source: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        notes: ''
      });
    }
  }, [revenue, mode]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.source.trim()) {
      newErrors.source = 'Source is required';
    }
    
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave({
        ...formData,
        amount: Number(formData.amount)
      });
      onClose();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const isViewMode = mode === 'view';

  const submitRevenue = async (e: React.FormEvent, formData: RevenueItem, company_id: string) => {
    e.preventDefault();    
    if(validateForm()){
         const toastId = toast.loading('Adding payment...');
        try {
        const { description, amount, date, category, method, source, account_id, status, notes } = formData;

        console.log('Account id: ', account_id);
        const created_by = userUUID === companyId ? companyId : userUUID;
        const created_by_type = userUUID === companyId ? 'company' : 'staff';
        const company_id = companyId;
        const paymentData = { description, amount, date, category, method, source, account_id, created_by, created_by_type, company_id, status, notes };
        console.log(`Payment data: ${JSON.stringify(paymentData)}`)
        if (source === 'commissions'){
          const res = await deductCommission(paymentData as Commission);
          toast.success("Commission added successfully!", {id: toastId});
          onClose();
        }
        if (source !== 'commissions'){
          const res = await addPayment(company_id, {status: "approved", type: "payment", recorded_by: userUUID, ...paymentData});
          if (res === true){
            toast.success("Payment added successfully!", {id: toastId});
            onClose();
          }
        }
      } catch (error) {
        toast.error('Failed to add revenue', {id: toastId})
        console.log(error);
      }
        } onClose();
    };
  

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${isViewMode ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {isViewMode ? (
                    <Eye className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Edit2 className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isViewMode ? 'View Revenue' : mode === 'edit' ? 'Edit Revenue' : 'Add New Revenue'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isViewMode ? 'Review revenue details' : mode === 'edit' ? 'Update revenue information' : 'Add a new revenue stream'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-6 space-y-6">
              {/* Status & Amount Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  {isViewMode ? (
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${getStatusColor(formData.status)}`}>
                      {getStatusIcon(formData.status)}
                      <span className="capitalize font-medium">{formData.status}</span>
                    </div>
                  ) : (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  {isViewMode ? (
                    <div className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                      <span>¢{Number(formData.amount).toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">¢</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-4 py-2 border ${errors.amount ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                      {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Description & Source Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  {isViewMode ? (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.description}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                        placeholder="Enter revenue description"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  {isViewMode ? (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-900">{formData.source}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.source ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                        placeholder="Enter revenue source"
                      />
                      {errors.source && (
                        <p className="mt-1 text-sm text-red-600">{errors.source}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Category & Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  {isViewMode ? (
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                      <Tag className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{formData.category}</span>
                    </div>
                  ) : (
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">Select category</option>
                      <option value="sales">Sales</option>
                      <option value="services">Services</option>
                      <option value="subscriptions">Subscriptions</option>
                      <option value="licensing">Licensing</option>
                      <option value="other">Other</option>
                    </select>
                  )}
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  {isViewMode ? (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">
                        {new Date(formData.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border ${errors.date ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors`}
                      />
                      {errors.date && (
                        <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                {isViewMode ? (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg min-h-[100px]">
                    {formData.notes ? (
                      <p className="text-gray-900 whitespace-pre-wrap">{formData.notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">No notes added</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                    placeholder="Add any additional notes about this revenue..."
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {onDelete && mode !== 'create' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this revenue record?')) {
                        onDelete(formData.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>
                {!isViewMode && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                    onClick={(e) => submitRevenue(e, formData, companyId)}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{mode === 'edit' ? 'Save Changes' : 'Add Revenue'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewRevenueModal;