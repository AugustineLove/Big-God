import React, { createContext, useContext, useEffect, useState } from 'react';
import { companyId } from '../../constants/appConstants';

export interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  email: string;
  role?: string;
  phone_number?: string;
  created_at?: string;
  company_id: string;
  account_number?: string;
}

export interface DashboardStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  role?: string;
  created_at?: string;
  company_id: string;
  totalCustomers: number;
  totalDeposits: number;
  todayDeposits: number;
  lastActivity: string | null;
  status: string;
  permissions: string[];
  accounts: string[];
}

interface StaffContextType {
  staffList: Staff[];
  dashboardStaffList: DashboardStaff[];
  loading: boolean;
  dashboardLoading: boolean;
  refreshStaff: () => void;
  fetchDashboardStaff: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export const StaffProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [dashboardStaffList, setDashboardStaffList] = useState<DashboardStaff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(true);

  // Existing fetch staff function (keep unchanged)
  const fetchStaff = async () => {
    setLoading(true);
    try {
      if (!companyId) return;
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/staff/?company_id=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.data);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch staff:", errorText);
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
    } finally {
      setLoading(false);
    }
  };

  // NEW function: fetch staff dashboard data
  const fetchDashboardStaff = async () => {
    setDashboardLoading(true);
    try {
      if (!companyId) return;

      const res = await fetch(
        `https://susu-pro-backend.onrender.com/api/staff/dashboard?company_id=${companyId}`
      );

      if (res.ok) {
        const { data } = await res.json();

        const mappedDashboardStaff: DashboardStaff[] = data.map((staff: any) => ({
          id: staff.id,
          name: staff.name || staff.full_name,
          phone: staff.phone,
          email: staff.email,
          role: staff.role,
          created_at: staff.created_at,
          performance: staff.performance,
          company_id: staff.company_id,
          totalCustomers: Number(staff.totalCustomers) || 0,
          totalDeposits: Number(staff.totalDeposits) || 0,
          todayDeposits: Number(staff.todayDeposits) || 0,
          lastActivity: staff.lastActivity ? new Date(staff.lastActivity).toLocaleString() : null,
          status: staff.status || 'active',
          permissions: staff.permissions || [],
          accounts: staff.accounts || [],
        }));
         setDashboardStaffList(mappedDashboardStaff);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch dashboard staff:", errorText);
      }
    } catch (err) {
      console.error("Error fetching dashboard staff:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchDashboardStaff(); // optional: fetch dashboard data on mount too
  }, []);

  return (
    <StaffContext.Provider
      value={{
        staffList,
        dashboardStaffList,
        loading,
        dashboardLoading,
        refreshStaff: fetchStaff,
        fetchDashboardStaff,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
};

export const useStaff = () => {
  const context = useContext(StaffContext);
  if (!context) throw new Error("useStaff must be used within a StaffProvider");
  return context;
};
