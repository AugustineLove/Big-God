import React, { useState } from 'react';
import { Building, Eye, Edit3, Settings } from 'lucide-react';
import AccountSettingsModal from './AccountSettingsModal';

const AccountCard = ({ 
  account, 
  toggleAccountStatus, 
  refreshAccounts, 
  handleDeleteAccount,
  customerId 
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle settings save
  const handleSettingsSave = async (updatedAccount) => {
    // Refresh accounts list
    await refreshAccounts(customerId);
    console.log('Account settings updated:', updatedAccount);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        {/* ---- top icon + status ---- */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-white" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {account.status}
            </span>

            <button
              onClick={async () => {
                await toggleAccountStatus(account.id);
                await refreshAccounts(customerId);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${account.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}
              `}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${account.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        <h4 className="text-lg font-semibold text-gray-900 mb-1">
          {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
        </h4>

        <p className="text-sm text-gray-600 mb-3">
          {account.account_type.charAt(0).toUpperCase() +
            account.account_type.slice(1)} - {account.account_number}
        </p>

        {/* ---- balances + opened ---- */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Balance:</span>

            <span
              className={`font-medium ${
                Number(account.balance) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(account.balance)}
            </span>
          </div>

          {/* Show minimum balance if set */}
          {account.minimumBalance > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Min. Balance:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(account.minimumBalance)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Opened:</span>
            <span className="font-medium text-gray-900">
              {formatDate(account.created_at)}
            </span>
          </div>
        </div>

        {/* Low balance warning */}
        {account.minimumBalance > 0 && Number(account.balance) < account.minimumBalance && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-2">
            <p className="text-xs text-orange-800 font-medium">
              ⚠️ Balance below minimum required
            </p>
          </div>
        )}

        {/* ---- actions ---- */}
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
          <button 
            className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Activities</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          <button
            onClick={() => handleDeleteAccount(account.id)}
            className="flex items-center justify-center space-x-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AccountSettingsModal
        account={account}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSettingsSave}
      />
    </>
  );
};

export default AccountCard;