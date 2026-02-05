import React, { useState, useMemo } from 'react';
import { Search, Filter, Users, Edit, Trash2, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useCustomers } from '../../../contexts/dashboard/Customers';
import { userPermissions } from '../../../constants/appConstants';

const EnhancedClientTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Sample data - replace with your actual data
  const {customers, setCustomers} = useCustomers();
  
  // Get unique values for filters
  const uniqueLocations = [...new Set(customers.map(c => c.location).filter(Boolean))];
  const uniqueStaff = [...new Set(customers.map(c => c.registered_by_name).filter(Boolean))];
  const statuses = ['Active', 'Inactive'];
  
  // Check if any filters are active
  const hasActiveFilters = searchTerm || locationFilter !== 'all' || 
    staffFilter !== 'all' || statusFilter !== 'all' || dateRangeFilter !== 'all';
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('all');
    setStaffFilter('all');
    setStatusFilter('all');
    setDateRangeFilter('all');
    setSortConfig({ key: null, direction: 'asc' });
  };
  
  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-indigo-600" />
      : <ArrowDown className="h-4 w-4 text-indigo-600" />;
  };
  
  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let filtered = customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone_number.includes(searchTerm) ||
        customer.account_number.toLowerCase().includes(searchLower);
      
      const matchesLocation = locationFilter === 'all' || customer.location === locationFilter;
      const matchesStaff = staffFilter === 'all' || customer.registered_by_name === staffFilter;
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      let matchesDate = true;
      if (dateRangeFilter !== 'all') {
        const regDate = new Date(customer.date_of_registration);
        const now = new Date();
        const daysDiff = Math.floor((now - regDate) / (1000 * 60 * 60 * 24));
        
        switch(dateRangeFilter) {
          case 'last_week':
            matchesDate = daysDiff <= 7;
            break;
          case 'last_month':
            matchesDate = daysDiff <= 30;
            break;
          case 'last_3_months':
            matchesDate = daysDiff <= 90;
            break;
          case 'this_year':
            matchesDate = regDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesLocation && matchesStaff && matchesStatus && matchesDate;
    });
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch(sortConfig.key) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'balance':
            aValue = parseFloat(a.total_balance_across_all_accounts || 0);
            bValue = parseFloat(b.total_balance_across_all_accounts || 0);
            break;
          case 'daily_rate':
            aValue = parseFloat(a.daily_rate || 0);
            bValue = parseFloat(b.daily_rate || 0);
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [customers, searchTerm, locationFilter, staffFilter, statusFilter, dateRangeFilter, sortConfig]);
  
  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search clients by name, email, phone, or account number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white hover:border-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 mr-2">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Filter className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>
            
            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hover:border-gray-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">📍 All Locations</option>
              {uniqueLocations.map((location, index) => (
                <option key={index} value={location}>
                  {location}
                </option>
              ))}
            </select>

            {/* Staff Filter */}
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hover:border-gray-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">👤 All Staff</option>
              {uniqueStaff.map((staff, index) => (
                <option key={index} value={staff}>
                  {staff}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hover:border-gray-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">⚡ All Status</option>
              {statuses.map((status, index) => (
                <option key={index} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white hover:border-gray-400 transition-all cursor-pointer font-medium"
            >
              <option value="all">📅 All Time</option>
              <option value="last_week">Last Week</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="this_year">This Year</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 transition-all duration-200 bg-white shadow-sm hover:shadow"
              >
                <X className="h-4 w-4" />
                <span>Clear All</span>
              </button>
            )}
          </div>
          
          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-600">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                    Search: {searchTerm}
                  </span>
                )}
                {locationFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
                    Location: {locationFilter}
                  </span>
                )}
                {staffFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                    Staff: {staffFilter}
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                    Status: {statusFilter}
                  </span>
                )}
                {dateRangeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                    Date: {dateRangeFilter.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredClients.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{customers.length}</span> clients
        </p>
        {sortConfig.key && (
          <p className="text-xs text-gray-500">
            Sorted by {sortConfig.key} ({sortConfig.direction === 'asc' ? 'ascending' : 'descending'})
          </p>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span>Client</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th 
                  onClick={() => handleSort('balance')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span>Balance</span>
                    {getSortIcon('balance')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Join Date
                </th>
                <th 
                  onClick={() => handleSort('daily_rate')}
                  className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors group"
                >
                  <div className="flex items-center space-x-2">
                    <span>Daily Rate</span>
                    {getSortIcon('daily_rate')}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="text-gray-500">
                      <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-10 w-10 text-gray-400" />
                      </div>
                      <p className="text-lg font-semibold mb-2 text-gray-700">No clients found</p>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">
                        {hasActiveFilters 
                          ? "Try adjusting your filters or search terms to find what you're looking for" 
                          : "Get started by adding your first client to the system"
                        }
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((customer) => (
                  <tr 
                    key={customer.customer_id} 
                    onClick={() => navigate(`customer-details/${customer.customer_id}`)}
                    className="hover:bg-indigo-50 transition-all duration-150 cursor-pointer border-l-4 border-transparent hover:border-indigo-500 hover:shadow-sm"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-indigo-100">
                          <span className="text-white font-bold text-sm">
                            {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{customer.account_number}</div>
                          <div className='text-xs text-gray-400 mt-0.5'>
                            <span className="font-medium">Staff:</span> {customer.registered_by_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className='flex flex-col space-y-1.5'>
                        <span className="text-base font-bold text-green-600">
                          ¢{parseFloat(customer.total_balance_across_all_accounts || '0').toFixed(2)}
                        </span>
                        <div className={`${customer.status === 'Active' 
                          ? 'bg-green-100 border border-green-300' 
                          : 'bg-red-100 border border-red-300'} 
                          rounded-md flex items-center justify-center px-2 py-1`}
                        >
                          <span className={`text-xs font-bold ${customer.status === 'Active' 
                            ? 'text-green-700' 
                            : 'text-red-700'}`}
                          >
                            {customer.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className='flex flex-col space-y-1.5'>
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300">
                          📍 {customer.location || 'Unknown'}
                        </span>
                        <span className='text-xs font-medium text-gray-600 text-center'>
                          {customer.gender}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {new Date(customer.date_of_registration).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1.5 text-sm font-bold rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 shadow-sm">
                        ¢{parseFloat(customer.daily_rate || '0').toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {e.stopPropagation(); setEditingClient(customer)}}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 rounded-lg transition-all duration-150"
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {userPermissions.DELETE_CUSTOMER && (
                          <button
                            onClick={(e) => {e.stopPropagation(); handleDeleteClick(customer)}}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-all duration-150"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-150"
                          onClick={(e) => {e.stopPropagation(); navigate(`customer-details/${customer.customer_id}`)}}
                          title="View details"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientTable;
