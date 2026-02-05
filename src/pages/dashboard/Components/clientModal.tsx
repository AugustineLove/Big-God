import { useState, useContext, createContext, useEffect } from "react";
import { Calendar, User, Mail, Phone, MapPin, CreditCard, Users, DollarSign, UserCheck } from "lucide-react";
import { Account, Customer } from "../../../data/mockData";
import { useCustomers } from "../../../contexts/dashboard/Customers";
import { useAuth } from "../../../contexts/AuthContext";
import { useStaff } from "../../../contexts/dashboard/Staff";
import { getEffectiveCompanyId, makeSuSuProName, parentCompanyName } from "../../../constants/appConstants";
import toast from "react-hot-toast";
import { useAccountNumber } from "../../../contexts/dashboard/NextAccountNumber";
import { useAccountNumbers } from "../../../contexts/dashboard/NextAccNumbers";
import { registerVersion } from "firebase/app";
import { useTransactions } from "../../../contexts/dashboard/Transactions";

// Staff Context (you can import this from your actual context file)
interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  company_id: string;
  created_at: string;
}

interface StaffContextType {
  staffList: Staff[];
  loading: boolean;
  refreshStaff: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

interface ClientModalProps {
  account: Account | null;
  client?: Customer | null;
  onSave: (client: any) => void;
  onClose: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({ account, client, onSave, onClose }) => {
  const { staffList, loading: staffLoading } = useStaff();
  const { customers, addCustomer, customerLoading } = useCustomers();
  const { company } = useAuth();
  const [startedAdding, setStartedAdding] = useState(false);
  const companyId = getEffectiveCompanyId();
  const { getNextAccountNumber, fetchLastAccountNumbers } = useAccountNumbers();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(client?.registered_by || '');
  const [nextAccNumber, setNextAccountNumber] = useState<string | null>(null);
  const { nextAccountNumber, refreshAccountNumber, loading } = useAccountNumber();
  const { sendMessage } = useTransactions();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone_number: client?.phone_number || '',
    momo_number: client?.momo_number || '',
    account_number: client?.account_number || nextAccNumber || '',
    city: client?.city || '',
    id_card: client?.id_card || '',
    gender: client?.gender
  ? client.gender.charAt(0).toUpperCase() + client.gender.slice(1)
  : '',
    next_of_kin: client?.next_of_kin || '',
    location: client?.location || '',
    daily_rate: client?.daily_rate || '',
    date_of_registration: client?.date_of_registration
  ? client.date_of_registration.split('T')[0]
  : new Date().toISOString().split('T')[0],
  date_of_birth: client?.date_of_birth ? client.date_of_birth.split('T')[0] : new Date().toISOString().split('T')[0],
    registered_by: client?.registered_by || '',
    account_type: account?.account_type || '',
    company_id: companyId,
    created_by: client?.registered_by
  });

  // Filter staff to get only Mobile Bankers
  const mobileBankers = staffList.filter(staff => staff.role === 'Mobile Banker' || staff.role === 'mobile banker' ||  staff.role === 'mobile_banker' || staff.role === 'teller');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Form data updated: ${formData.registered_by}`);
    setFormData(prev => ({ ...prev, [name]: value }));
     // If the changed field is 'registered_by', generate next account number
  if (name === 'registered_by' && value.length > 0) {
    const nextAccount = getNextAccountNumber(value);
    console.log('Next account number generated:', nextAccount);
    setNextAccountNumber(nextAccount);
  }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    if (!formData.id_card.trim()) newErrors.id_card = 'ID card number is required';
    if (!formData.registered_by) newErrors.registered_by = 'Please assign a mobile banker';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if(!formData.account_type.trim()) newErrors.account_type = 'Account type is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setStartedAdding(true);
    e.preventDefault();
    const toastId = "Adding customer...";
    console.log('Button clicked')
    if (!validateForm()) setStartedAdding(false);
    console.log('Form validated')
    if (!client) {
      let account_number;
      console.log('Assigned mobile banker:', formData.registered_by);
      if (formData.account_type === 'Susu'){
        account_number = `${nextAccNumber}SU1`;
      }
      else {
        account_number = `${nextAccNumber}SA1`;
      }
      const data =   { 
      ...formData, 
      company_id: companyId, 
      registered_by: formData.registered_by,
      account_type: formData.account_type,
      date_of_birth: formData.date_of_birth,
      total_balance: '0.00',
      total_transactions: '0',
      account_number: nextAccNumber
    }
    const addAccount = {"account_type": formData.account_type,} as Account;
      console.log('Updating client:', data);
      console.log('Add account', addAccount);
      const addedCustomerData = await addCustomer(data, formData.account_type, account_number);
      await fetchLastAccountNumbers();
      await sendMessage({
        messageTo: formData.phone_number,
        messageFrom: makeSuSuProName(parentCompanyName),
        message: `Dear ${formData.name}, you have successfully opened a ${formData.account_type} account with ${parentCompanyName}. Your customer account number is, ${addedCustomerData.data.account_number}. \nYour secret withdrawal code is ${addedCustomerData.data.withdrawal_code}. Please do not share this code with anyone. \nThank you for choosing us!`
      });
      toast.success('Client added successfully', { id: toastId });
      setStartedAdding(false);
      // window.location.reload();
      onClose();
    } else {
      onSave({
        customer_id: client?.customer_id,
        ...formData,
        id: Date.now().toString(),
        joinDate: new Date().toISOString().split('T')[0]
      });
      setStartedAdding(false);
      onClose();
    }
  };

  // Close modal when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {client ? 'Edit Client' : 'Add New Client'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Information Section */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-indigo-600" />
                  Personal Information
                </h4>
              </div>

              <FormField
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                error={errors.name}
                icon={<User className="w-4 h-4" />}
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<Mail className="w-4 h-4" />}
              />

              <FormField
                label="Phone Number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                error={errors.phone_number}
                icon={<Phone className="w-4 h-4" />}
              />

              <FormField
                label="Momo Number"
                name="momo_number"
                value={formData.momo_number}
                onChange={handleChange}
                error={errors.momo_number}
                icon={<Phone className="w-4 h-4" />}
              />

              <FormField
                label="ID Card Number"
                name="id_card"
                value={formData.id_card}
                onChange={handleChange}
                required
                error={errors.id_card}
                icon={<CreditCard className="w-4 h-4" />}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <FormField
                label="Date of Registration"
                name="date_of_registration"
                type="date"
                value={formData.date_of_registration}
                onChange={handleChange}
                icon={<Calendar className="w-4 h-4" />}
              />
              <FormField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                icon={<Calendar className="w-4 h-4" />}
              />

              {/* Contact & Location Section */}
              <div className="md:col-span-2 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-600" />
                  Contact & Location
                </h4>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  Town/City
                </label>
                <textarea
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Enter city..."
                />
              </div>

              <FormField
                label="Location/Area"
                name="location"
                value={formData.location}
                onChange={handleChange}
                icon={<MapPin className="w-4 h-4" />}
                placeholder="e.g., Downtown, Suburb name"
              />

              <FormField
                label="Next of Kin"
                name="next_of_kin"
                value={formData.next_of_kin}
                onChange={handleChange}
                icon={<Users className="w-4 h-4" />}
                placeholder="Emergency contact person"
              />

              {/* Financial Information */}
              <div className="md:col-span-2 mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  
                  Financial Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-gray-500" />
                  Assigned Mobile Banker
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="registered_by"
                  value={formData.registered_by}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    errors.registered_by
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                  disabled={staffLoading}
                >
                  <option value="">
                    {staffLoading ? 'Loading mobile bankers...' : 'Select a Mobile Banker'}
                  </option>
                  {mobileBankers.map((banker) => (
                    <option key={banker.id} value={banker.id}>
                      {banker.full_name} ({banker.staff_id})
                    </option>
                  ))}
                </select>
                {errors.assigned_mobile_banker && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.assigned_mobile_banker}
                  </p>
                )}
                {mobileBankers.length === 0 && !staffLoading && (
                  <p className="mt-1 text-sm text-amber-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No Mobile Bankers available
                  </p>
                )}
              </div>

               <FormField
                label="Account Number"
                name="account_number"
                value={nextAccNumber || ''}
                onChange={handleChange}
                required
                error={errors.account_number}
                icon={<Phone className="w-4 h-4" />}
              />

              <FormField
                label="Daily Rate"
                name="daily_rate"
                type="number"
                step="0.01"
                min="0"
                value={formData.daily_rate}
                onChange={handleChange}
               
                placeholder="0.00"
              />
            </div>

            <div className="mt-7">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  Account
                </label>
                <select
                  name="account_type"
                  value={formData.account_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Account</option>
                  <option value="Susu">Susu</option>
                  <option value="Savings">Savings</option>
                </select>
                {errors.account_type && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.account_type}
                  </p>
                )}
              </div>
              

          </div>
        </div>

        

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
            >
             {client ? (
                customerLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating client...
                  </div>
                ) : (
                  "Update Client"
                )
              ) : (
                customerLoading || startedAdding ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding client...
                  </div>
                ) : (
                  "Add Client"
                )
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced FormField component
const FormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  step,
  min,
  error,
  icon,
  placeholder
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  step?: string;
  min?: string;
  error?: string;
  icon?: React.ReactNode;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
      {icon && <span className="mr-2 text-gray-500">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      step={step}
      min={min}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-colors ${
        error 
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
          : 'border-gray-300 focus:border-indigo-500'
      }`}
    />
    {error && <p className="mt-1 text-sm text-red-600 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </p>}
  </div>
);
