import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  DollarSign,
  Eye,
  User,
} from 'lucide-react';
import { useStaff } from '../../contexts/dashboard/Staff';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import StaffDetailModal from './Components/staffDetailModal';
import OtherStaffTab from './Components/otherStaffTab';
import AllStaffTab from './Components/allStaffTab';
import { userRole } from '../../constants/appConstants';

// Adjust this path to wherever you keep the shared passbook theme —
// e.g. move theme.css into a shared '../../styles/' folder so both this
// page and CustomerDetailsPage import the same file instead of two copies.
import './Components/CustomerDetails/theme.css';

type TabId = 'mobile-bankers' | 'other-staff' | 'all-staff';

const StaffManagement = () => {
  const [activeTab, setActiveTab] = useState<TabId>('mobile-bankers');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExcessLossModal, setShowExcessLossModal] = useState(false);
  const { dashboardStaffList, dashboardLoading, fetchDashboardStaff } = useStaff();
  const { transactions } = useTransactions();

  const staffTransactions = transactions.filter(
    (tx) => tx.recorded_staff_id === selectedStaff?.id
  );

  useEffect(() => {
    fetchDashboardStaff();
  }, []);

  const mobileBankers = dashboardStaffList.filter(
    (staff) =>
      staff.role === 'mobile_banker' ||
      staff.role === 'teller' ||
      staff.role === 'accountant' ||
      staff.role === 'data_entry' ||
      staff.role === 'data entry'
  );
  const otherStaff = dashboardStaffList.filter((staff) => staff.role !== 'mobile_banker');

  const TABS: { id: TabId; label: string }[] = [
    { id: 'mobile-bankers', label: 'Bankers' },
    { id: 'other-staff', label: 'Other staff' },
    ...(userRole === 'Admin' ? [{ id: 'all-staff' as TabId, label: 'All staff' }] : []),
  ];

  const MobileBankersTab = () => (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="cd-display text-2xl font-semibold text-[var(--ink)]">Bankers</h2>
          <p className="text-[var(--ink-soft)] text-sm mt-0.5">Manage your field collection staff</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[var(--forest)] hover:bg-[var(--forest-deep)] text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <UserPlus size={16} />
          Add banker
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ink-faint)]"
            size={17}
          />
          <input
            type="text"
            placeholder="Search bankers..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card)] border border-[var(--paper-line)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)]"
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)]">
            <option>All locations</option>
          </select>
          <select className="bg-[var(--card)] border border-[var(--paper-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)]">
            <option>All status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Mobile bankers grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {mobileBankers?.map((banker) => {
          const isActive = banker.status === 'active';
          return (
            <div
              key={banker.id}
              className="bg-[var(--card)] border border-[var(--paper-line)] border-l-[3px] border-l-[var(--brass)] rounded-2xl p-5 sm:p-6 hover:shadow-[0_10px_24px_-16px_rgba(20,32,20,0.4)] transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[var(--forest)] flex items-center justify-center flex-shrink-0">
                    <Users className="text-white" size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="cd-display font-semibold text-[var(--ink)] truncate">{banker.name}</h3>
                    <p className="text-sm text-[var(--ink-faint)] truncate">{banker.location}</p>
                  </div>
                </div>
                <span
                  className="px-2 py-1 text-[11px] font-medium rounded-full flex-shrink-0"
                  style={{
                    background: isActive ? 'rgba(47,74,50,0.1)' : 'var(--clay-soft)',
                    color: isActive ? 'var(--forest)' : 'var(--clay)',
                  }}
                >
                  {banker.status}
                </span>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                  <Phone size={13} className="text-[var(--ink-faint)]" />
                  {banker.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                  <Mail size={13} className="text-[var(--ink-faint)]" />
                  {banker.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--ink-soft)] capitalize">
                  <User size={13} className="text-[var(--ink-faint)]" />
                  {banker.role}
                </div>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[var(--paper)] rounded-xl p-3">
                  <div className="cd-mono text-xl font-semibold text-[var(--ink)]">{banker.totalCustomers}</div>
                  <div className="text-[11px] text-[var(--ink-faint)] mt-0.5">Customers</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(47,74,50,0.08)' }}>
                  <div className="cd-mono text-xl font-semibold" style={{ color: 'var(--forest)' }}>
                    GHS {banker.totalDeposits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[var(--ink-faint)] mt-0.5">Total deposits</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: 'var(--brass-soft)' }}>
                  <div className="cd-mono text-sm font-semibold" style={{ color: '#8a6224' }}>
                    GHS {banker.todayDeposits.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[var(--ink-faint)] mt-0.5">Today's deposits</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--paper)' }}>
                  <div className="cd-mono text-sm font-semibold text-[var(--ink)]">{banker.performance}%</div>
                  <div className="text-[11px] text-[var(--ink-faint)] mt-0.5">Performance</div>
                </div>
              </div>

              {/* Account types */}
              <div className="mb-4">
                <div className="text-[11px] text-[var(--ink-faint)] mb-1.5">Account types</div>
                <div className="flex flex-wrap gap-1.5">
                  {banker.accounts.map((account, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[var(--paper)] text-[var(--ink-soft)] text-[11px] rounded-md capitalize"
                    >
                      {account}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-dashed border-[var(--paper-line)]">
                <button
                  onClick={() => setSelectedStaff(banker)}
                  className="flex-1 bg-[var(--forest)] hover:bg-[var(--forest-deep)] text-white px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                >
                  <Eye size={15} />
                  View details
                </button>
                <button
                  onClick={() => setShowExcessLossModal(true)}
                  className="px-3 py-2.5 rounded-xl flex items-center gap-2 transition-colors text-sm font-medium text-white"
                  style={{ background: 'var(--brass)' }}
                >
                  <DollarSign size={15} />
                  E&amp;L
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const ExcessLossModal = () => {
    if (!showExcessLossModal) return null;

    const fieldClass =
      'w-full bg-[var(--paper)] border border-[var(--paper-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--forest-mid)]';

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="cd-root bg-[var(--card)] rounded-2xl max-w-md w-full overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="cd-display text-xl font-semibold text-[var(--ink)]">Excess &amp; loss account</h2>
              <button
                onClick={() => setShowExcessLossModal(false)}
                className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-lg leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">
                  Transaction type
                </label>
                <select className={fieldClass}>
                  <option>Excess</option>
                  <option>Loss</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Amount (GHS)</label>
                <input type="number" placeholder="0.00" className={`${fieldClass} cd-mono`} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Description</label>
                <textarea rows={3} placeholder="Enter description or reason..." className={fieldClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--ink-soft)] mb-1.5">Date</label>
                <input type="date" className={fieldClass} />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--paper-line)]">
              <button
                onClick={() => setShowExcessLossModal(false)}
                className="flex-1 border border-[var(--paper-line)] text-[var(--ink-soft)] px-4 py-2.5 rounded-xl hover:bg-[var(--paper)] transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button className="flex-1 bg-[var(--forest)] hover:bg-[var(--forest-deep)] text-white px-4 py-2.5 rounded-xl transition-colors text-sm font-medium">
                Record transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cd-root min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Main header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="cd-display text-2xl sm:text-3xl font-semibold text-[var(--ink)] mb-1.5">
            Staff management
          </h1>
          <p className="text-[var(--ink-soft)] text-sm">Manage your microfinance staff and their activities</p>
        </div>

        {/* Navigation tabs — snap-scroll on mobile */}
        <div className="cd-scroller flex gap-1.5 overflow-x-auto -mx-1 px-1 mb-6 sm:mb-8">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 sm:px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors whitespace-nowrap border
                  ${
                    isActive
                      ? 'bg-[var(--forest)] text-white border-[var(--forest)] shadow-[0_4px_10px_-4px_rgba(47,74,50,0.5)]'
                      : 'bg-[var(--card)] text-[var(--ink-soft)] border-[var(--paper-line)] hover:text-[var(--ink)] hover:border-[var(--forest-mid)]'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'mobile-bankers' ? (
          <MobileBankersTab />
        ) : activeTab === 'other-staff' ? (
          <OtherStaffTab />
        ) : (
          <AllStaffTab />
        )}
      </div>

      {/* Modals */}
      <StaffDetailModal
        selectedStaff={selectedStaff}
        setSelectedStaff={setSelectedStaff}
        setShowExcessLossModal={setShowExcessLossModal}
        dashboardLoading={dashboardLoading}
        dashboardStaffList={dashboardStaffList}
      />
      <ExcessLossModal />
    </div>
  );
};

export default StaffManagement;