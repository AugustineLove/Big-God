
import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, User, DollarSign, Calendar } from 'lucide-react';
import { Customer } from '../data/mockData';

interface DeleteTransactionModalProps {
  transaction_id: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerId: string) => void;
  isLoading?: boolean;
}



const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  transaction_id,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');
  
  const expectedText = transaction_id
  const isConfirmationValid = confirmationText.toUpperCase() === expectedText;

  const handleConfirm = () => {
   onConfirm(transaction_id || '');
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
              Delete Transaction
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
                
                
               
                
              
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-2">This action cannot be undone!</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Transaction will affect customer account</li>
                      <li>Transaction will be removed from history</li>
                      </ul>
                  </div>
                </div>
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
                  Transaction id: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{transaction_id}</span> to confirm deletion
                </p>
              </div>
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
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Transaction
                  </>
                )}
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
                    Delete Transaction
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

export default DeleteTransactionModal;