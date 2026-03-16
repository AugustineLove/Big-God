import React, { useState } from 'react';
import { X, Save, Shield, AlertTriangle, Edit, Trash2, Users, UserPlus, Search } from 'lucide-react';
import { useStaff } from '../../../contexts/dashboard/Staff';

const OtherStaffTab = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const { dashboardStaffList, dashboardLoading, fetchDashboardStaff } = useStaff();
    const otherStaff = dashboardStaffList.filter(staff => staff.role !== 'mobile_banker');
    

  // Edit Modal Form State
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    department: '',
    phone: '',
    email: '',
    status: 'Active'
  });

  // Permissions Form State
  const [permissionsForm, setPermissionsForm] = useState({
    view_patients: false,
    edit_appointments: false,
    view_reports: false,
    manage_billing: false,
    manage_staff: false,
    access_medical_records: false,
    modify_schedules: false,
    generate_reports: false
  });

  // Open Edit Modal
  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      role: staff.role,
      department: staff.department,
      phone: staff.phone,
      email: staff.email,
      status: staff.status
    });
    setShowEditModal(true);
  };

  // Open Permissions Modal
  const handlePermissionsClick = (staff) => {
    setSelectedStaff(staff);
    setPermissionsForm(staff.permissions);
    setShowPermissionsModal(true);
  };

  // Open Delete Modal
  const handleDeleteClick = (staff) => {
    setSelectedStaff(staff);
    setShowDeleteModal(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call to update staff
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) throw new Error('Failed to update staff');

      const updatedStaff = await response.json();

      // Update local state
      setOtherStaff(prev => 
        prev.map(staff => staff.id === selectedStaff.id ? { ...staff, ...editForm } : staff)
      );

      setShowEditModal(false);
      setSelectedStaff(null);
      // Show success message (you can add a toast notification here)
      alert('Staff member updated successfully!');
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Permissions Submit
  const handlePermissionsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log(permissionsForm);
    try {
      // API call to update permissions
      const response = await fetch(`http://localhost:5000/api/staff/${selectedStaff.id}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: permissionsForm })
      });

      if (!response.ok) throw new Error('Failed to update permissions');

      // Update local state
      setOtherStaff(prev =>
        prev.map(staff =>
          staff.id === selectedStaff.id
            ? { ...staff, permissions: permissionsForm }
            : staff
        )
      );

      setShowPermissionsModal(false);
      setSelectedStaff(null);
      alert('Permissions updated successfully!');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    setIsSubmitting(true);

    try {
      // API call to delete staff
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete staff');

      // Update local state
      setOtherStaff(prev => prev.filter(staff => staff.id !== selectedStaff.id));

      setShowDeleteModal(false);
      setSelectedStaff(null);
      alert('Staff member deleted successfully!');
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Other Staff</h2>
          <p className="text-gray-600">Manage office staff and permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search staff members..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Staff table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Staff Member</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Role & Department</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Contact</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Permissions</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {otherStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="text-purple-600" size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-sm text-gray-600">Joined {staff.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{staff.role}</div>
                    <div className="text-sm text-gray-600">{staff.department}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-900">{staff.phone}</div>
                    <div className="text-sm text-gray-600">{staff.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(staff.permissions)
                        .filter(([_, value]) => value === true)
                        .map(([key], index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded uppercase">
                            {key.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {staff.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClick(staff)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit Staff"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handlePermissionsClick(staff)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Manage Permissions"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(staff)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Staff"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Edit className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Edit Staff Member</h3>
                  <p className="text-sm text-gray-600">Update staff information</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Office Manager"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select department</option>
                    <option value="Administration">Administration</option>
                    <option value="Front Desk">Front Desk</option>
                    <option value="Billing">Billing</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Facilities">Facilities</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 234-567-8900"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="staff@hospital.com"
                  />
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="text-green-600" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Manage Permissions</h3>
                  <p className="text-sm text-gray-600">{selectedStaff?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePermissionsSubmit} className="p-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select the permissions you want to grant to this staff member
                </p>

                {/* Permission Checkboxes */}
                {[
                  { key: 'ALTER_ACCOUNT', label: 'Alter Account', description: 'Can view and edit account details' },
                  { key: 'PROCESS_TRANSACTIONS', label: 'Process Transactions', description: 'Can create deposit and withdrawal transactions' },
                  { key: 'VIEW_REPORTS', label: 'View Reports', description: 'Can access system reports and analytics' },
                  { key: 'CUSTOMER_EDIT', label: 'Manage Customer', description: 'Can view and edit customer details' },
                  { key: 'MANAGE_STAFF', label: 'Manage Staff', description: 'Can add, edit, and remove staff members' },
                  { key: 'LOAN_PRIVILIGES', label: 'Loan Priviliges', description: 'Can view and edit loan requests' },
                  { key: 'TRANSACTION_CREATE', label: 'Create Transaction', description: 'Can create new transaction' },
                  { key: 'VIEW_BRIEFING', label: 'View Briefing', description: 'Can view company stat briefing' },
                  { key: 'SETTINGS_ACCESS', label: 'Access Settings', description: 'Can access company setting details' },
                  { key: 'DELETE_CUSTOMER', label: 'Delete Customer', description: 'Can delete customer from the system' },
                ].map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={permissionsForm[permission.key] || false}
                      onChange={(e) =>
                        setPermissionsForm({
                          ...permissionsForm,
                          [permission.key]: e.target.checked
                        })
                      }
                      className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{permission.label}</div>
                      <div className="text-sm text-gray-600">{permission.description}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-green-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Update Permissions
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Delete Staff Member</h3>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? 
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action cannot be undone. All data associated with this staff member will be permanently removed from the system.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:bg-red-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete Staff
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherStaffTab;