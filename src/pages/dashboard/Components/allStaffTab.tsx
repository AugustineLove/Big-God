import React, { useState } from 'react';
import { X, Key, AlertTriangle, Users, Search, Eye, EyeOff } from 'lucide-react';
import { useStaff } from '../../../contexts/dashboard/Staff';
import { useSettings } from '../../../contexts/dashboard/Settings';
import { userUUID } from '../../../constants/appConstants';

const AllStaffTab = () => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetStaffPassword } = useSettings();
  
  const { dashboardStaffList, dashboardLoading, fetchDashboardStaff } = useStaff();

  // Password Reset Form State
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');

  // Filter staff based on search term
  const filteredStaff = dashboardStaffList.filter(staff => 
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open Reset Password Modal
  const handleResetPasswordClick = (staff) => {
    setSelectedStaff(staff);
    setResetForm({
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowResetModal(true);
  };

  // Validate Password
  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  // Handle Password Reset Submit
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    // Validate passwords match
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate password strength
    const validationError = validatePassword(resetForm.newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // API call to reset password
     const resetStatus = await resetStaffPassword(selectedStaff.id, resetForm.newPassword)
      if(resetStatus){
        setShowResetModal(false);
      setSelectedStaff(null);
      setResetForm({ newPassword: '', confirmPassword: '' });
      alert('Password reset successfully!');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const roleColors = {
      'mobile_banker': 'bg-blue-100 text-blue-700',
      'admin': 'bg-purple-100 text-purple-700',
      'manager': 'bg-green-100 text-green-700',
      'accountant': 'bg-yellow-100 text-yellow-700',
      'default': 'bg-gray-100 text-gray-700'
    };
    return roleColors[role?.toLowerCase()] || roleColors.default;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Staff</h2>
          <p className="text-gray-600">View all staff members and reset passwords</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={18} />
          <span className="font-medium">{dashboardStaffList.length} Total Staff</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {dashboardLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Staff Table */}
      {!dashboardLoading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Staff Member</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Role</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Department</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Contact</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      No staff members found
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{staff.name}</div>
                            <div className="text-sm text-gray-600">
                              {staff.joinDate ? `Joined ${staff.joinDate}` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(staff.role)}`}>
                          {staff.role || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-900">{staff.department || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-gray-900">{staff.phone || 'N/A'}</div>
                        <div className="text-sm text-gray-600">{staff.email || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-sm rounded-full ${
                          staff.status === 'Active' 
                            ? 'bg-green-100 text-green-700' 
                            : staff.status === 'Inactive'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {staff.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => handleResetPasswordClick(staff)}
                          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <Key size={16} />
                          <span className="text-sm font-medium">Reset Password</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Key className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
                  <p className="text-sm text-gray-600">{selectedStaff?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleResetSubmit} className="p-6">
              <div className="space-y-4">
                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The staff member will need to use this new password to log in. 
                    Make sure to communicate it securely.
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className={resetForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}>●</span>
                      At least 8 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/[A-Z]/.test(resetForm.newPassword) ? 'text-green-600' : 'text-gray-400'}>●</span>
                      One uppercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/[a-z]/.test(resetForm.newPassword) ? 'text-green-600' : 'text-gray-400'}>●</span>
                      One lowercase letter
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={/[0-9]/.test(resetForm.newPassword) ? 'text-green-600' : 'text-gray-400'}>●</span>
                      One number
                    </li>
                  </ul>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                      <p className="text-sm text-red-800">{passwordError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Key size={18} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllStaffTab;