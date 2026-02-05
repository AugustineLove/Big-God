
import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, User, DollarSign, Calendar } from 'lucide-react';
import { Customer } from '../data/mockData';

interface DeleteCustomerModalProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string) => void;
  isLoading?: boolean;
}



const DeleteCustomerModal: React.FC<DeleteCustomerModalProps> = ({
  customer,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');
  
  const expectedText = customer.name.toUpperCase();
  const isConfirmationValid = confirmationText.toUpperCase() === expectedText;

  const handleConfirm = () => {
    if (step === 'warning') {
      setStep('confirmation');
    } else if (isConfirmationValid) {
      onConfirm(customer.id || '');
    }
  };

  const handleClose = () => {
    setStep('warning');
    setConfirmationText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg mr-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete Customer
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'warning' ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    {customer.email && (
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    )}
                    {customer.phone_number && (
                      <p className="text-sm text-gray-600">{customer.phone_number}</p>
                    )}
                  </div>
                </div>
                
                {customer.total_balance && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Total Contributions: <span className="font-medium">¢{customer.total_balance.toLocaleString()}</span>
                    </span>
                  </div>
                )}
                
                {customer.account_number && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      Last Contribution: {new Date(customer.account_number).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-2">This action cannot be undone!</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All customer data will be permanently deleted</li>
                      <li>Transaction history will be removed</li>
                      <li>Related records may be affected</li>
                      <li>This customer cannot be recovered after deletion</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Alternative Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Alternative:</strong> Instead of deleting, you can set the customer status to "Inactive" 
                  to hide them from active lists while preserving their data for future reference.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Confirmation Step */}
              <div className="text-center">
                <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Trash2 className="h-8 w-8 text-red-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Are you absolutely sure?
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">{customer.name}</span> to confirm deletion
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type "${customer.name}" to confirm`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isLoading}
                />
              </div>

              {confirmationText && !isConfirmationValid && (
                <p className="text-sm text-red-600">
                  Text doesn't match. Please type "{customer.name}" exactly.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          {step === 'warning' ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                disabled={isLoading}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Continue to Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('warning')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isConfirmationValid || isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Customer
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteCustomerModal;