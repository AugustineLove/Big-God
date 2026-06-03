import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  MapPin,
  DollarSign,
  FileText,
  ChevronRight,
  Loader2,
  Search,
  Calendar,
  Eye,
  User,
  AlertCircle,
  Phone,
  Mail,
  Hash,
  Calendar as CalendarIcon,
  Printer
} from 'lucide-react';
import { useAccounts } from '../../../contexts/dashboard/Account';

const CardReplacementManager = () => {
  const [searchType, setSearchType] = useState('account'); // 'account' or 'customer'
  const [searchValue, setSearchValue] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const { accounts, refreshAccounts } = useAccounts();
  
  const [replacements, setReplacements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);
  const [recentReplacements, setRecentReplacements] = useState([]);
  
  const [formData, setFormData] = useState({
    replacement_reason: '',
    delivery_address: '',
    fee_charged: 0,
    notes: '',
    account_id: ''
  });

  const statusColors = {
    REQUESTED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    REQUESTED: <Clock className="h-4 w-4" />,
    APPROVED: <CheckCircle className="h-4 w-4" />,
    PROCESSING: <RefreshCw className="h-4 w-4" />,
    SHIPPED: <Truck className="h-4 w-4" />,
    DELIVERED: <CheckCircle className="h-4 w-4" />,
    COMPLETED: <CheckCircle className="h-4 w-4" />,
    REJECTED: <XCircle className="h-4 w-4" />,
    CANCELLED: <XCircle className="h-4 w-4" />
  };

  // Search for customer or account
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    setSearching(true);
    setError(null);
    setSearchResult(null);
    setReplacements([]);

    try {
      let url = '';
      if (searchType === 'account') {
        url = `https://susu-pro-backend.onrender.com/api/accounts/search?account_number=${encodeURIComponent(searchValue)}`;
      } else {
        url = `https://susu-pro-backend.onrender.com/api/customers/search?query=${encodeURIComponent(searchValue)}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log(`Result: ${JSON.stringify(result)}`)
      if (!response.ok) {
        throw new Error(result.message || 'Not found');
      }

      setSearchResult(result.data);
      
      // Fetch replacements for the found account/customer
      if (searchType === 'account' && result.data?.id) {
        await fetchReplacements(result.data.id, 'account');
      } else if (searchType === 'customer' && result.data?.id) {
        await fetchReplacements(result.data.id, 'customer');
      }
      
    } catch (err) {
      setError(err.message);
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  // Fetch replacements
  const fetchReplacements = async (id, type) => {
    setLoading(true);
    try {
      const url = type === 'account' 
        ? `https://susu-pro-backend.onrender.com/api/accounts/${id}/card-replacements`
        : `https://susu-pro-backend.onrender.com/api/customers/${id}/card-replacements`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        setReplacements(result.data || []);
      } else {
        setReplacements([]);
      }
    } catch (error) {
      console.error('Error fetching replacements:', error);
      setReplacements([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent replacements (all for the staff's company)
  const fetchRecentReplacements = async () => {
    try {
      const response = await fetch('https://susu-pro-backend.onrender.com/api/card-replacements/recent?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (response.ok) {
        setRecentReplacements(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching recent replacements:', error);
    }
  };

  useEffect(() => {
    fetchRecentReplacements();
  }, []);

  // Request new card replacement
  const handleRequestReplacement = async (e) => {
    e.preventDefault();
    if (!formData.account_id) {
      alert('Please select an account');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/accounts/${formData.account_id}/card/replace-with-record`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replacement_reason: formData.replacement_reason,
          delivery_address: formData.delivery_address,
          fee_charged: formData.fee_charged,
          notes: formData.notes
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        await fetchReplacements(
          searchResult?.id, 
          searchType === 'account' ? 'account' : 'customer'
        );
        await fetchRecentReplacements();
        setShowRequestForm(false);
        setFormData({
          replacement_reason: '',
          delivery_address: '',
          fee_charged: 0,             
          notes: '',
          account_id: ''
        });
        alert('Card replacement requested successfully!');
      } else {
        alert(result.message || 'Failed to request replacement');
      }
    } catch (error) {
      console.error('Error requesting replacement:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update replacement status
  const handleStatusUpdate = async (replacementId, newStatus, additionalData = {}) => {
    try {
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/card-replacements/${replacementId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('susupro_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          replacement_status: newStatus,
          ...additionalData
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (searchResult?.id) {
          await fetchReplacements(
            searchResult.id, 
            searchType === 'account' ? 'account' : 'customer'
          );
        }
        await fetchRecentReplacements();
        setSelectedReplacement(null);
        alert(`Status updated to ${newStatus}`);
      } else {
        alert(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('An error occurred');
    }
  };

  const StatusUpdateModal = ({ replacement, onClose }) => {
    const [trackingNumber, setTrackingNumber] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4">Update Status</h3>
          <p className="text-sm text-gray-600 mb-4">
            Current Status: <span className="font-semibold">{replacement.replacement_status}</span>
          </p>
          
          <div className="space-y-3">
            {replacement.replacement_status === 'REQUESTED' && (
              <button
                onClick={() => handleStatusUpdate(replacement.id, 'APPROVED')}
                className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                Approve Request
              </button>
            )}
            
            {replacement.replacement_status === 'APPROVED' && (
              <button
                onClick={() => handleStatusUpdate(replacement.id, 'PROCESSING')}
                className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg"
              >
                Start Processing
              </button>
            )}
            
            {replacement.replacement_status === 'PROCESSING' && (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (trackingNumber) {
                      handleStatusUpdate(replacement.id, 'SHIPPED', { tracking_number: trackingNumber });
                    } else {
                      alert('Please enter tracking number');
                    }
                  }}
                  className="w-full text-left px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                >
                  Mark as Shipped
                </button>
                <input
                  type="text"
                  placeholder="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            
            {replacement.replacement_status === 'SHIPPED' && (
              <button
                onClick={() => handleStatusUpdate(replacement.id, 'DELIVERED')}
                className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg"
              >
                Mark as Delivered
              </button>
            )}
            
            {replacement.replacement_status === 'DELIVERED' && (
              <button
                onClick={() => handleStatusUpdate(replacement.id, 'COMPLETED')}
                className="w-full text-left px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg"
              >
                Complete Replacement
              </button>
            )}
            
            {['REQUESTED', 'APPROVED'].includes(replacement.replacement_status) && (
              <div className="space-y-2 pt-2 border-t">
                <button
                  onClick={() => {
                    if (rejectionReason) {
                      handleStatusUpdate(replacement.id, 'REJECTED', { rejection_reason: rejectionReason });
                    } else {
                      alert('Please enter rejection reason');
                    }
                  }}
                  className="w-full text-left px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg"
                >
                  Reject Request
                </button>
                <textarea
                  placeholder="Rejection Reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows="2"
                />
              </div>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const ReplacementDetailModal = ({ replacement, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Card Replacement Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Request ID</p>
              <p className="font-mono text-sm">{replacement.id?.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[replacement.replacement_status]}`}>
                {statusIcons[replacement.replacement_status]}
                {replacement.replacement_status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Request Date</p>
              <p className="font-medium">{new Date(replacement.request_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Request Time</p>
              <p className="font-medium">{new Date(replacement.request_date).toLocaleTimeString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Old Card</p>
              <p className="font-mono text-sm">{replacement.old_card_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">New Card</p>
              <p className="font-mono text-sm">{replacement.new_card_number || 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Replacement Reason</p>
              <p className="text-sm">{replacement.replacement_reason}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fee Charged</p>
              <p className="font-medium text-red-600">¢{parseFloat(replacement.fee_charged || 0).toFixed(2)}</p>
            </div>
            {replacement.estimated_delivery_date && (
              <div>
                <p className="text-sm text-gray-500">Est. Delivery Date</p>
                <p className="text-sm">{new Date(replacement.estimated_delivery_date).toLocaleDateString()}</p>
              </div>
            )}
            {replacement.tracking_number && (
              <div>
                <p className="text-sm text-gray-500">Tracking Number</p>
                <p className="text-sm font-mono text-blue-600">{replacement.tracking_number}</p>
              </div>
            )}
            {replacement.delivery_date && (
              <div>
                <p className="text-sm text-gray-500">Actual Delivery Date</p>
                <p className="text-sm">{new Date(replacement.delivery_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          
          {replacement.delivery_address && (
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Delivery Address
              </p>
              <p className="text-sm bg-gray-50 p-2 rounded">{replacement.delivery_address}</p>
            </div>
          )}
          
          {replacement.notes && (
            <div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <FileText className="h-4 w-4" /> Notes
              </p>
              <p className="text-sm bg-gray-50 p-2 rounded">{replacement.notes}</p>
            </div>
          )}
          
          {replacement.rejection_reason && (
            <div>
              <p className="text-sm text-gray-500">Rejection Reason</p>
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{replacement.rejection_reason}</p>
            </div>
          )}
          
          <div className="border-t pt-4">
            <p className="text-xs text-gray-400">
              Requested by: {replacement.requested_by_name || 'System'} | 
              {replacement.approved_by_name && ` Approved by: ${replacement.approved_by_name}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Get customer accounts for replacement request
  const [customerAccounts, setCustomerAccounts] = useState([]);
  
  const fetchCustomerAccounts = async (customerId) => {
    try {
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/accounts/customer/${customerId}`);
      const result = await response.json();
      if (response.ok) {
        setCustomerAccounts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const handleReplacementRequest = (customerId) => {
    fetchCustomerAccounts(customerId);
    setFormData({ ...formData, account_id: '' });
    setShowRequestForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Card Replacement Management</h1>
          <p className="text-gray-600">Manage lost, stolen, or damaged card replacements</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Printer className="h-4 w-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchType('account')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'account' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search by Account
            </button>
            <button
              onClick={() => setSearchType('customer')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                searchType === 'customer' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Search by Customer
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'account' 
                ? "Enter account number e.g., ACC-123456" 
                : "Enter customer name, phone number, or email"}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </form>

        {/* Search Result */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {searchResult && !error && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {searchType === 'account' ? 'Account Found' : 'Customer Found'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {searchType === 'account' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Account Number:</span>
                        <span className="font-medium">{searchResult.account_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{searchResult.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Card Status:</span>
                        <span className={`font-medium ${
                          searchResult.card_status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {searchResult.card_status || 'No Card'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-medium">¢{parseFloat(searchResult.balance || 0).toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{searchResult.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{searchResult.phone_number}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{searchResult.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Customer ID:</span>
                        <span className="font-medium">{searchResult.account_number}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleReplacementRequest(searchResult.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Report Lost/Stolen Card
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Replacements History */}
      {(searchResult || replacements.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Card Replacement History
              {searchResult && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  for {searchType === 'account' ? searchResult.account_number : searchResult.name}
                </span>
              )}
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              </div>
            ) : replacements.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No card replacement requests found for this {searchType}</p>
                <button
                  onClick={() => handleReplacementRequest(searchResult?.id)}
                  className="mt-3 text-indigo-600 hover:text-indigo-800"
                >
                  Request a card replacement →
                </button>
              </div>
            ) : (
              replacements.map((replacement) => (
                <div key={replacement.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[replacement.replacement_status]}`}>
                          {statusIcons[replacement.replacement_status]}
                          {replacement.replacement_status}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(replacement.request_date).toLocaleDateString()}
                        </span>
                        {replacement.tracking_number && (
                          <span className="text-xs text-blue-600">
                            Tracking: {replacement.tracking_number}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">Account</p>
                          <p className="font-medium">{replacement.account_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Reason</p>
                          <p>{replacement.replacement_reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fee</p>
                          <p className="text-red-600">¢{parseFloat(replacement.fee_charged || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Est. Delivery</p>
                          <p>{replacement.estimated_delivery_date 
                            ? new Date(replacement.estimated_delivery_date).toLocaleDateString()
                            : 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReplacement(replacement)}
                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Only show status update for staff */}
                      {localStorage.getItem('userRole') !== 'customer' && (
                        <button
                          onClick={() => setSelectedReplacement({...replacement, updateMode: true})}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                          title="Update Status"
                        >
                          <RefreshCw className="h-5 w-5" />
                        </button>
                      )}
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recent Replacements (when no search results) */}
      {!searchResult && recentReplacements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Replacement Requests</h2>
            <p className="text-sm text-gray-500">Latest card replacement activities in your branch</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentReplacements.map((replacement) => (
              <div key={replacement.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[replacement.replacement_status]}`}>
                        {statusIcons[replacement.replacement_status]}
                        {replacement.replacement_status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(replacement.request_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium">{replacement.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account</p>
                        <p>{replacement.account_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Reason</p>
                        <p>{replacement.replacement_reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedReplacement(replacement)}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Report Lost/Stolen Card</h3>
              <button onClick={() => setShowRequestForm(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Reporting a card as lost or stolen will immediately block the current card and initiate replacement.
              </p>
            </div>
            
            <form onSubmit={handleRequestReplacement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Account *
                </label>
                <select
                  required
                  value={formData.account_id}
                  onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select an account</option>
                  {customerAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_number} - {acc.account_type} (¢{parseFloat(acc.balance).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replacement Reason *
                </label>
                <select
                  required
                  value={formData.replacement_reason}
                  onChange={(e) => setFormData({...formData, replacement_reason: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select reason</option>
                  <option value="LOST">Lost Card</option>
                  <option value="STOLEN">Stolen Card</option>
                  <option value="DAMAGED">Damaged Card</option>
                  <option value="EXPIRED">Expired Card</option>
                  <option value="MALFUNCTIONING">Malfunctioning Card</option>
                  <option value="NAME_CHANGE">Name Change</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Where should the new card be delivered?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Replacement Fee (¢)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fee_charged}
                  onChange={(e) => setFormData({...formData, fee_charged: parseFloat(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="2"
                  placeholder="Any additional information..."
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Submit Replacement Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedReplacement && !selectedReplacement.updateMode && (
        <ReplacementDetailModal 
          replacement={selectedReplacement} 
          onClose={() => setSelectedReplacement(null)} 
        />
      )}
      
      {/* Status Update Modal */}
      {selectedReplacement?.updateMode && (
        <StatusUpdateModal 
          replacement={selectedReplacement} 
          onClose={() => setSelectedReplacement(null)} 
        />
      )}
    </div>
  );
};

export default CardReplacementManager;