import React, { useEffect, useState } from 'react';
import { X, Save, Shield, AlertTriangle, Edit, Trash2, Users, UserPlus, Search, Building2, Verified } from 'lucide-react';
import { useStaff } from '../../../contexts/dashboard/Staff';
import {  User, ArrowUpDown, FileText, CreditCard,
  RefreshCcw, UserCog, DollarSign, PlusCircle,
  BarChart3, Settings } from 'lucide-react';

const OtherStaffTab = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
   const { dashboardStaffList, dashboardLoading, fetchDashboardStaff } = useStaff();
    const [otherStaff, setOtherStaff] = useState([]);

    useEffect(() => {
  const filtered = dashboardStaffList.filter(
    staff => staff.role !== 'mobile_banker'
  );
  setOtherStaff(dashboardStaffList);
}, [dashboardStaffList]);

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
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/staff/${selectedStaff.id}`, {
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
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/staff/${selectedStaff.id}/permissions`, {
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
      const response = await fetch(`https://susu-pro-backend.onrender.com/api/staff/${selectedStaff.id}`, {
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
          <h2 className="cd-display text-2xl font-semibold text-[var(--ink)]">Other Staff</h2>
          <p className="text-[var(--ink-soft)]">Manage office staff and permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--forest)] hover:bg-[var(--forest-deep)] text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ink-faint)]" size={18} />
        <input
          type="text"
          placeholder="Search staff members..."
          className="w-full pl-10 pr-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
        />
      </div>

      {/* Staff table */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--paper-line)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--paper)] border-b border-[var(--paper-line)]">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Staff Member</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Role & Department</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Contact</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Permissions</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-[var(--ink-faint)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--paper-line)]">
              {otherStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-[var(--paper)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center">
                        <Users style={{ color: 'var(--forest-deep)' }} size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-[var(--ink)]">{staff.name}</div>
                        <div className="text-sm text-[var(--ink-faint)]">Joined {staff.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-[var(--ink)]">{staff.role}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{staff.department}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm text-[var(--ink)]">{staff.phone}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{staff.email}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(staff.permissions)
                        .filter(([_, value]) => value === true)
                        .map(([key], index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded uppercase font-medium"
                            style={{ background: 'rgba(47,74,50,0.1)', color: 'var(--forest-deep)' }}
                          >
                            {key.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="px-2 py-1 text-sm rounded-full font-medium"
                      style={{ background: 'rgba(47,74,50,0.1)', color: 'var(--forest)' }}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditClick(staff)}
                        className="text-[var(--forest)] hover:text-[var(--forest-deep)] transition-colors"
                        title="Edit Staff"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handlePermissionsClick(staff)}
                        className="hover:opacity-75 transition-opacity"
                        style={{ color: 'var(--brass)' }}
                        title="Manage Permissions"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(staff)}
                        className="hover:opacity-75 transition-opacity"
                        style={{ color: 'var(--clay)' }}
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
          <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--paper-line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(47,74,50,0.1)' }}>
                  <Edit style={{ color: 'var(--forest)' }} size={20} />
                </div>
                <div>
                  <h3 className="cd-display text-xl font-semibold text-[var(--ink)]">Edit Staff Member</h3>
                  <p className="text-sm text-[var(--ink-soft)]">Update staff information</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
                    placeholder="Enter full name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
                    placeholder="e.g., Office Manager"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
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
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
                    placeholder="+1 234-567-8900"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
                    placeholder="staff@hospital.com"
                  />
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[var(--ink-soft)] mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 border border-[var(--paper-line)] bg-[var(--paper)] text-[var(--ink)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(47,74,50,0.15)] focus:border-[var(--forest)]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--paper-line)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--paper-line)] text-[var(--ink-soft)] rounded-lg hover:bg-[var(--paper)] transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[var(--forest)] text-white rounded-lg hover:bg-[var(--forest-deep)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.4)' }}
    onClick={(e) => { if (e.target === e.currentTarget) setShowPermissionsModal(false); }}
  >
    <div className="bg-[var(--card)] rounded-3xl w-full max-w-lg flex flex-col" style={{ maxHeight: '88vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--paper-line)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(47,74,50,0.1)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--forest)' }} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--ink)]">Manage permissions</p>
            <p className="text-[12px] text-[var(--ink-faint)] mt-0.5">{selectedStaff?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Enabled count badge */}
          <span
            className="text-[11px] font-semibold rounded-full px-2.5 py-1"
            style={{ background: 'rgba(47,74,50,0.1)', color: 'var(--forest-deep)' }}
          >
            {Object.values(permissionsForm).filter(Boolean).length} enabled
          </span>
          <button
            onClick={() => setShowPermissionsModal(false)}
            className="w-8 h-8 rounded-xl bg-[var(--paper)] hover:bg-[var(--paper-line)] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[var(--ink-faint)]" />
          </button>
        </div>
      </div>

      <p className="px-6 pt-3 pb-1 text-[12px] text-[var(--ink-faint)] flex-shrink-0">
        Toggle the permissions you want to grant to this staff member.
      </p>

      {/* Scrollable permissions list */}
      <form onSubmit={handlePermissionsSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-3 flex flex-col gap-2">
          {[
            { key: 'ALTER_ACCOUNT',         label: 'Alter account',         desc: 'View and edit account details',             icon: <User className="w-3.5 h-3.5" /> },
            {key: 'ALTER_FINANCE',          label: 'Alter Finance',         desc: 'Can record commission and floats',          icon: <Building2 className='w-3.5 h-3.5' />},
            { key: 'PROCESS_TRANSACTIONS',  label: 'Process transactions',  desc: 'Create deposits and withdrawals',           icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
            { key: 'VIEW_REPORTS',          label: 'View reports',          desc: 'Access system reports and analytics',       icon: <FileText className="w-3.5 h-3.5" /> },
            { key: 'MANAGE_CASHACCOUNTS',   label: 'Manage cash accounts',  desc: 'Transfer money between accounts',           icon: <CreditCard className="w-3.5 h-3.5" /> },
            { key: 'REVERSE_TRANSACTIONS',  label: 'Reverse transactions',  desc: 'Reverse deposits and withdrawals',          icon: <RefreshCcw className="w-3.5 h-3.5" /> },
            { key: 'CUSTOMER_EDIT',         label: 'Manage customer',       desc: 'View and edit customer details',            icon: <Users className="w-3.5 h-3.5" /> },
            { key: 'MANAGE_STAFF',          label: 'Manage staff',          desc: 'Add, edit and remove staff members',        icon: <UserCog className="w-3.5 h-3.5" /> },
            { key: 'APPROVE_LOANS',         label: 'Approve Loans',         desc: 'Can view and approve loan requests',        icon: <Verified className="w-3.5 h-3.5" />},
            { key: 'LOAN_PRIVILEGES',       label: 'Loan privileges',       desc: 'View and edit loan requests',               icon: <DollarSign className="w-3.5 h-3.5" /> },
            { key: 'TRANSACTION_CREATE',    label: 'Create transaction',    desc: 'Can create new transactions',               icon: <PlusCircle className="w-3.5 h-3.5" /> },
            { key: 'VIEW_BRIEFING',         label: 'View briefing',         desc: 'View company stat briefing',                icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { key: 'SETTINGS_ACCESS',       label: 'Access settings',       desc: 'Access company setting details',            icon: <Settings className="w-3.5 h-3.5" /> },
            { key: 'CUSTOMER_CREATE',       label: 'Create Customer',       descl: 'Can create new customers',                 icon: <User className='w-3.5 h-3.5' />},
            { key: 'DELETE_CUSTOMER',       label: 'Delete customer',       desc: 'Remove customers from the system',          icon: <Trash2 className="w-3.5 h-3.5" /> },
            { key: 'PROCESS_DEPOSITS',      label: 'Process Deposits',      desc: 'Stake amount into customer account',        icon: <DollarSign className="w-3.5 h-3.5" />},
            { key: 'PROCESS_WITHDRAWAL',    label: 'Process Withdrawals',   desc: 'Can withdraw from customer account',        icon: <DollarSign className="w-3.5 h-3.5" />}
          ].map((perm) => {
            const enabled = permissionsForm[perm.key] || false;
            return (
              <label
                key={perm.key}
                className="flex items-center justify-between px-4 py-3.5 border rounded-2xl cursor-pointer transition-all"
                style={
                  enabled
                    ? { borderColor: 'rgba(47,74,50,0.35)', background: 'rgba(47,74,50,0.05)' }
                    : { borderColor: 'var(--paper-line)', background: 'var(--card)' }
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                    style={
                      enabled
                        ? { background: 'rgba(47,74,50,0.14)', color: 'var(--forest)' }
                        : { background: 'var(--paper)', color: 'var(--ink-faint)' }
                    }
                  >
                    {perm.icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{perm.label}</p>
                    <p className="text-[11px] text-[var(--ink-faint)] mt-0.5">{perm.desc}</p>
                  </div>
                </div>

                {/* Toggle switch */}
                <div className="relative flex-shrink-0 ml-3">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={enabled}
                    onChange={(e) =>
                      setPermissionsForm({ ...permissionsForm, [perm.key]: e.target.checked })
                    }
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-colors"
                    style={{ background: enabled ? 'var(--forest)' : 'var(--paper-line)' }}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-[var(--paper-line)] flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowPermissionsModal(false)}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-[var(--paper-line)] rounded-2xl text-[13px] font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-3 bg-[var(--forest)] hover:bg-[var(--forest-deep)] text-white rounded-2xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                Updating…
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Update permissions
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
          <div className="bg-[var(--card)] rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--paper-line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(169,74,62,0.1)' }}>
                  <AlertTriangle style={{ color: 'var(--clay)' }} size={20} />
                </div>
                <h3 className="cd-display text-xl font-semibold text-[var(--ink)]">Delete Staff Member</h3>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-[var(--ink-soft)] mb-4">
                Are you sure you want to delete <strong className="text-[var(--ink)]">{selectedStaff?.name}</strong>? 
              </p>
              <div className="rounded-lg p-4 border" style={{ background: 'rgba(169,74,62,0.08)', borderColor: 'rgba(169,74,62,0.2)' }}>
                <p className="text-sm" style={{ color: 'var(--clay)' }}>
                  <strong>Warning:</strong> This action cannot be undone. All data associated with this staff member will be permanently removed from the system.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-[var(--paper-line)]">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-[var(--paper-line)] text-[var(--ink-soft)] rounded-lg hover:bg-[var(--paper)] transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--clay)' }}
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