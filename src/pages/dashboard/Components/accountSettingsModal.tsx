import React, { useState } from 'react';
import { X, DollarSign, AlertTriangle, Save, Settings, TrendingDown, Shield } from 'lucide-react';

const AccountSettingsModal = ({ account, isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [settings, setSettings] = useState({
    minimumBalance: account?.minimum_balance || 0,
    allowNegativeBalance: account?.allowNegativeBalance || false,
    overdraftLimit: account?.overdraftLimit || 0,
    maintenanceFee: account?.maintenanceFee || 0,
    notifyOnLowBalance: account?.notifyOnLowBalance || true,
    lowBalanceThreshold: account?.lowBalanceThreshold || 100,
  });

  console.log(account)
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (settings.minimumBalance < 0) {
      setErrorMessage('Minimum balance cannot be negative');
      return;
    }

    if (settings.allowNegativeBalance && settings.overdraftLimit < 0) {
      setErrorMessage('Overdraft limit cannot be negative');
      return;
    }

    if (settings.lowBalanceThreshold < 0) {
      setErrorMessage('Low balance threshold cannot be negative');
      return;
    }

    setIsSubmitting(true);
    const updateBody = {
        minimum_balance: settings.minimumBalance,
        allow_negative_balance: settings.allowNegativeBalance,
        over_draft_limited: settings.overdraftLimit,
        low_balance_threshold: settings.lowBalanceThreshold,
    }

    console.log(`Settings ${JSON.stringify(updateBody)}`)

    try {
      const response = await fetch(`http://localhost:5000/api/accounts/${account.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`
        },
        body: JSON.stringify(updateBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update account settings');
      }

      const updatedAccount = await response.json();
      console.log(`Updated account: ${JSON.stringify(updatedAccount)}`)

      setSuccessMessage('Account settings updated successfully!');
      
      
      // Call onSave callback with updated data
      if (onSave) {
        onSave(updatedAccount);
      }

      // Close modal after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error updating account settings:', error);
      setErrorMessage(error.message || 'Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Account Settings</h3>
              <p className="text-sm text-gray-600">
                {account?.account_type} - {account?.account_number}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Shield className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Balance Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Current Balance</p>
                <p className={`text-2xl font-bold ${
                  Number(account?.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(account?.balance || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Minimum Balance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Minimum Balance Required *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                GHS
              </span>
              <input
                min="0"
                required
                value={settings.minimumBalance}
                onChange={(e) => setSettings({ ...settings, minimumBalance: parseFloat(e.target.value) || 0 })}
                className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The minimum amount that must be maintained in this account
            </p>
          </div>

          {/* Allow Negative Balance Toggle */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                  <TrendingDown size={16} className="text-orange-600" />
                  Allow Negative Balance (Overdraft)
                </label>
                <p className="text-xs text-gray-600">
                  Enable this to allow the account balance to go below zero
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ 
                  ...settings, 
                  allowNegativeBalance: !settings.allowNegativeBalance,
                  overdraftLimit: !settings.allowNegativeBalance ? settings.overdraftLimit : 0
                })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-3 flex-shrink-0
                  ${settings.allowNegativeBalance ? 'bg-blue-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.allowNegativeBalance ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Overdraft Limit - Only show if negative balance is allowed */}
            {settings.allowNegativeBalance && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overdraft Limit *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    GHS
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={settings.allowNegativeBalance}
                    value={settings.overdraftLimit}
                    onChange={(e) => setSettings({ ...settings, overdraftLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum negative balance allowed (e.g., 500 means balance can go to -500)
                </p>
              </div>
            )}
          </div>

          {/* Monthly Maintenance Fee */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly Maintenance Fee
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                GHS
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.maintenanceFee}
                onChange={(e) => setSettings({ ...settings, maintenanceFee: parseFloat(e.target.value) || 0 })}
                className="w-full pl-14 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Fee charged monthly for account maintenance (0 for no fee)
            </p>
          </div>

          {/* Low Balance Notifications */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  Low Balance Notifications
                </label>
                <p className="text-xs text-gray-600">
                  Get notified when balance falls below threshold
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, notifyOnLowBalance: !settings.notifyOnLowBalance })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-3 flex-shrink-0
                  ${settings.notifyOnLowBalance ? 'bg-yellow-600' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.notifyOnLowBalance ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Low Balance Threshold - Only show if notifications are enabled */}
            {settings.notifyOnLowBalance && (
              <div className="pt-4 border-t border-yellow-300">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Balance Threshold *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    GHS
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required={settings.notifyOnLowBalance}
                    value={settings.lowBalanceThreshold}
                    onChange={(e) => setSettings({ ...settings, lowBalanceThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll be notified when balance drops below this amount
                </p>
              </div>
            )}
          </div>

          {/* Warning Message */}
          {Number(account?.balance) < settings.minimumBalance && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-orange-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  Current Balance Below Minimum
                </p>
                <p className="text-xs text-orange-700">
                  The current balance ({formatCurrency(account?.balance || 0)}) is below the minimum balance 
                  you're setting ({formatCurrency(settings.minimumBalance)}). 
                  The account holder should be notified.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsModal;