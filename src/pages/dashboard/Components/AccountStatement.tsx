import React, { useState } from 'react';
import { Calendar, Download, Search, Loader2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { printStatement } from '../../../utils/printStatement';

const AccountStatement = () => {
  const [formData, setFormData] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
    transactionType: 'all',
    includePending: false
  });
  
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Fetch statement
  const fetchStatement = async (e) => {
    e.preventDefault();
    
    if (!formData.accountId) {
      setError('Please enter an account ID or number');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const params = new URLSearchParams();
      if (formData.startDate) params.append('startDate', formData.startDate);
      if (formData.endDate) params.append('endDate', formData.endDate);
      if (formData.transactionType !== 'all') params.append('transactionTypes', formData.transactionType);
      if (formData.includePending) params.append('includePending', 'true');
    
      const accountNumber = formData.accountId;
      const queryString = params.toString();
      const url = `https://susu-pro-backend.onrender.com/accounts/${accountNumber}/statement${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Response: ${JSON.stringify(response)}`)

      const result = await response.json();
      console.log(`Result: ${JSON.stringify(result)}`)

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch statement');
      }

      setStatement(result.data);
    } catch (err) {
      setError(err.message);
      setStatement(null);
    } finally {
      setLoading(false);
    }
  };

  // Download statement as CSV
  const downloadCSV = () => {
    if (!statement || !statement.transactions.length) return;

    const headers = ['Date', 'Description', 'Transaction Type', 'Debit (¢)', 'Credit (¢)', 'Balance (¢)', 'Status'];
    const rows = statement.transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      tx.description,
      tx.transaction_type_display,
      tx.debit,
      tx.credit,
      tx.balance,
      tx.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${statement.account_info.account_number}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = statement?.transactions?.slice(indexOfFirstTransaction, indexOfLastTransaction) || [];
  const totalPages = Math.ceil((statement?.transactions?.length || 0) / transactionsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Statement</h1>
          <p className="text-gray-600">View and download your transaction history</p>
        </div>
        {statement && (
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={printStatement(statement)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <FileText className="h-4 w-4" /> Print
            </button>
          </div>
        )}
      </div>

      {/* Search Form */}
      <form onSubmit={fetchStatement} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account ID/Number *
            </label>
            <input
              type="text"
              name="accountId"
              value={formData.accountId}
              onChange={handleChange}
              placeholder="Enter account ID or number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" /> Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" /> End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              name="transactionType"
              value={formData.transactionType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Transactions</option>
              <option value="deposits">Deposits Only</option>
              <option value="withdrawals">Withdrawals Only</option>
              <option value="transfers">Transfers Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="includePending"
                checked={formData.includePending}
                onChange={handleChange}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Include pending transactions</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Generate Statement
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Statement Results */}
      {statement && !loading && (
        <div id="statement-content">
          {/* Bank Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4">
              <h2 className="text-xl font-bold">{statement.bank_info?.company_name || 'Bank Statement'}</h2>
              <p className="text-sm opacity-90">{statement.bank_info?.company_address}</p>
              <p className="text-sm opacity-90">Email: {statement.bank_info?.company_email} | Tel: {statement.bank_info?.company_phone}</p>
            </div>

            {/* Account Info */}
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Account Name</p>
                  <p className="font-medium">{statement.account_info.customer_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account Number</p>
                  <p className="font-medium">{statement.account_info.account_number}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account Type</p>
                  <p className="font-medium">{statement.account_info.account_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    statement.account_info.account_status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {statement.account_info.account_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Statement Period */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Statement Period: 
                    {statement.statement_period.start_date 
                      ? ` ${new Date(statement.statement_period.start_date).toLocaleDateString()} to `
                      : ' Beginning to '}
                    {new Date(statement.statement_period.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Generated on: {new Date(statement.statement_period.generated_on).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Opening Balance</p>
                  <p className="text-xl font-bold text-indigo-600">¢{statement.balances.opening_balance}</p>
                </div>
              </div>
            </div>

            {/* Balance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600">Total Deposits</p>
                <p className="text-xl font-bold text-green-700">¢{statement.summary.total_deposits}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-red-600">Total Withdrawals</p>
                <p className="text-xl font-bold text-red-700">¢{statement.summary.total_withdrawals}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">Net Change</p>
                <p className="text-xl font-bold text-blue-700">¢{statement.summary.net_change}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600">Closing Balance</p>
                <p className="text-xl font-bold text-purple-700">¢{statement.balances.closing_balance}</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Debit (¢)</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Credit (¢)</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance (¢)</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                        No transactions found for this period
                      </td>
                    </tr>
                  ) : (
                    currentTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">
                          {transaction.description}
                          {transaction.reversed && (
                            <span className="ml-2 text-xs text-red-500">(Reversed)</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-red-600">
                          {transaction.debit !== '0.00' ? `¢${transaction.debit}` : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-green-600">
                          {transaction.credit !== '0.00' ? `¢${transaction.credit}` : '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-right font-medium">
                          ¢{transaction.balance}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'approved' || transaction.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 border-t font-semibold">
                  <tr>
                    <td colSpan="4" className="px-6 py-3 text-right text-sm text-gray-700">
                      Closing Balance:
                    </td>
                    <td className="px-6 py-3 text-right text-lg font-bold text-indigo-600">
                      ¢{statement.balances.closing_balance}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {indexOfFirstTransaction + 1} to {Math.min(indexOfLastTransaction, statement.transactions.length)} of {statement.transactions.length} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 border-t text-center text-xs text-gray-500">
              <p>This is an electronically generated statement and does not require a signature.</p>
              <p>For any discrepancies, please contact our customer service within 30 days.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatement;