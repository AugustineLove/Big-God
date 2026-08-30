import React from 'react';
import { TabId } from './Types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'profile', label: 'Profile' },
];

interface TabNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TabNav: React.FC<TabNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="cd-scroller flex gap-1.5 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
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
  );
};

export default TabNav;