import React, { useEffect, useMemo, useState } from 'react';
// import { Asset, Budget, Expense } from '../../data/mockData';
import { companyId, formatDate, userPermissions, userUUID } from '../../constants/appConstants';
import { Account, Asset, Budget, Commission, Customer, Expense } from '../../data/mockData';
import Reports from './Reports';
import AccountantReports from './AccountantReports';
import SalesManagerDashboard from './SalesReports';
import { useSearchParams } from 'react-router-dom';
import DayEndPage from './Components/DayEndPage';
import DayEndLogsPage from './SpoolDayEnd';

export interface FormDataState {
  name?: string;
  category?: string;
  description?: string;
  amount?: number;
  value?: number;
  type?: string;
  date?: string;
  depreciation_rate?: string;
  purchase_date?: string;
  allocated?: number;
  method?: string;
  recorded_by?: string;
  source?: string;
  account_id?: string;
  transactionId?: string;
  teller_id?: string;
}

// Main Component
const DayEndDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'overview';
  
  useEffect(() => {
    setActiveTab(tabFromUrl)
  }, [companyId, tabFromUrl]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="px-6 py-8">
        {activeTab === 'dayend' && <DayEndPage />}
        {activeTab === 'spool' && <DayEndLogsPage />}
      </div>
    </div>
  );
};

export default DayEndDashboard;
                 

