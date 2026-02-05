import React, { useState, useEffect } from 'react';
import { useTransactions } from '../../../contexts/dashboard/Transactions';

const AllTransactions = () => {
  const { transactions } = useTransactions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  console.log('Transactions:', transactions);
 

  const filteredTransactions = transactions.filter(tx => {
    const matchSearch =
      tx.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === 'all' || tx.type === filterType;

    return matchSearch && matchType;
  });

  const getTypeBadgeStyle = (type: string) => {
    return type === 'deposit'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Transactions</h1>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <input
          type="text"
          placeholder="Search by customer, staff, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full md:w-1/5 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full table-auto text-sm text-left">
          <thead className="bg-indigo-50 text-indigo-700 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Type</th>
              <th className="p-4">Staff</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr
                  key={tx.transaction_id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-900">{tx.customer_name}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    ${Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeStyle(
                        tx.type
                      )}`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{tx.staff_name}</td>
                  <td className="p-4 text-gray-600">
                    {new Date(tx.transaction_date).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-700">{tx.status}</td>
                  <td className="p-4 text-gray-500">{tx.description || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTransactions;
