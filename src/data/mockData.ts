export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  joinDate: string;
  status: 'active' | 'inactive';
  totalContributions: number;
  balance: number;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  createdAt?: any;
  two_factor_enabled?: boolean;
  companyName?: string;
  staffName?: string;
  address?: string;
  phone?: string;
  parentCompanyEmail?: string;
  parentPhone?: string;
};

export interface Commission {
  account_id: string;
  amount: number;
  created_by: string;
  created_by_type: string;
  transaction_id?: string;
  company_id: string;
}

export interface Account {
  // ─────────────────────────────────────
  // Core Account Info
  // ─────────────────────────────────────
  id?: string;
  created_at?: string;
  updated_at?: string;

  customer_id: string;
  company_id: string;

  created_by: string;
  created_by_type: string;

  account_number?: string;
  account_type: string;

  balance?: number;
  available_balance?: number;

  status?: 'Active' | 'Inactive' | 'Frozen' | 'Closed' | 'Dormant';

  customer_name?: string;
  customer_phone?: string;

  mobile_banker?: string;

  // ─────────────────────────────────────
  // Savings / Susu Settings
  // ─────────────────────────────────────
  susuAmount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  susuDuration?: number;
  startDate?: string;

  daily_rate?: number;

  initial_deposit?: number;

  minimumBalance?: number;
  minimum_balance?: number;

  interestRate?: number;
  interest_rate?: number;

  maintenanceFee?: number;
  maintenance_fee?: number;

  // ─────────────────────────────────────
  // Balance & Protection Controls
  // ─────────────────────────────────────
  allowNegativeBalance?: boolean;
  allow_negative_balance?: boolean;

  overdraftLimit?: number;
  overdraft_limit?: number;

  lowBalanceThreshold?: number;
  low_balance_threshold?: number;

  notifyOnLowBalance?: boolean;
  notify_on_low_balance?: boolean;

  sms_notifications_enabled?: boolean;
  email_notifications_enabled?: boolean;

  sms_number?: string;
  sms_numbers?: string[];

  // ─────────────────────────────────────
  // Card Management
  // ─────────────────────────────────────
  card_number?: string;

  card_status?: 'Active' | 'Blocked' | 'Expired' | 'Lost' | 'Damaged';

  card_issued_date?: string;
  card_expiry_date?: string;

  card_replacement_count?: number;
  last_card_replaced_at?: string;

  replacement_reason?: string;

  physical_card_issued?: boolean;

  pin_last_changed_at?: string;

  // ─────────────────────────────────────
  // Loan Specific
  // ─────────────────────────────────────
  interestrateloan?: number;

  loanterm?: number;

  collateral?: string;

  guarantor?: string;
  guarantorPhone?: string;

  loantype?: string;

  loanamount?: string;

  duration?: string;

  purpose?: string;

  disbursedamount?: string;

  disbursementDate?: string;

  maturityDate?: string;

  daysOverdue?: number;

  monthlypayment?: string;

  amountpaid?: string;

  outstandingbalance?: string;

  nextPaymentDate?: string;

  totalpayable?: string;

  interestmethod?: string;

  // ─────────────────────────────────────
  // Security & Compliance
  // ─────────────────────────────────────
  is_verified?: boolean;

  verified_at?: string;

  last_transaction_at?: string;

  inactive_at?: string;

  freeze_reason?: string;

  closed_at?: string;

  closed_reason?: string;

  // ─────────────────────────────────────
  // Audit / Tracking
  // ─────────────────────────────────────
  created_by_name?: string;

  updated_by?: string;

  updated_by_name?: string;

  deleted_at?: string;

  is_deleted?: boolean;

  // ─────────────────────────────────────
  // Extra Metadata
  // ─────────────────────────────────────
  notes?: string;

  description?: string;

  tags?: string[];

  currency?: string;

  branch?: string;
}

export interface AccountSummary{
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalBalance?: number;
  totalCommissions?: number;
  totalTransferIns?: number;
  totalTransferOuts?: number;
}
export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  account_number?: string;
  momo_number?: string;
  address: string;
  registered_by_name?: string;
  created_at: string; 
  location: string;
  daily_rate: string;
  total_balance: string;
  total_transactions: string;
  id_card?: string; 
  next_of_kin?: string;
  date_of_registration?: string; 
  date_of_birth?: string;
  gender?: string; 
  area?: string;
  city?: string;
  company_id?: string;
  registered_by: string;
  parentPhone?: string;
  customer_id?: string;
  withdrawal_code?: string;
  status?: string;
  send_sms?: boolean;
  sms_numbers?: string[];
}
// types/commission.ts
export interface Commission {
  id: string;
  account_id: string;
  customer_id: string;
  company_id: string;
  amount: number;
  status: "approved" | "reversed" | "pending";
  transaction_id?: string;
  reversed_at?: string | null;
  reversed_by?: string | null;
  created_at: string;
  date?: string;
}

export interface CommissionStats {
  total_commissions: number;

  total_amount: number;
  approved_amount: number;
  reversed_amount: number;
  pending_amount: number;

  approved_count: number;
  reversed_count: number;
  pending_count: number;

  today_amount: number;
  this_month_amount: number;
}


export interface Transaction {
  id?: string;
  account_id: string;
  amount: number;
  transaction_type: string;
  description?: string;
  transaction_date?: string;
  staked_by: string;
  company_id: string;
  status: string;
  unique_code: string;
}

export interface Contribution {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  method: 'cash' | 'bank_transfer' | 'mobile_money';
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
}

export interface Withdrawal {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  requestDate: string;
  approvalDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason: string;
  approvedBy?: string;
  processing_status?: string;
  process_by?: string;
  payment_reference?: string;
  agent_note?: string;
  payment_method?: string;
}

export interface StaffLite {
  id: string;
  name: string;
  avatarUrl?: string;
};

export interface LastMessage {
  text?: string;
  type: 'text' | 'image' | 'file';
  senderId: string;
  createdAt: any; // Timestamp
};

export interface Conversation {
  id: string;
  participants: string[];
  participantProfiles: Record<string, StaffLite>;
  unread: Record<string, number>;
  typing: Record<string, boolean>;
  lastMessage?: LastMessage;
  updatedAt: any; // Timestamp
};

export interface Message {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'file';
  senderId: string;
  createdAt: any; // Timestamp
  readBy?: Record<string, any>; 
  storagePath?: string;
  downloadURL?: string;
};

export interface Expense {
  id: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  recorded_by?: string;
}
export interface Payment {
  id: string;
  type: string;
  description: string;
  method: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  recorded_by?: string;
}

export interface Asset {
  id: string;
  category: string;
  name: string;
  type: string;
  value: number;
  purchase_date: string;
  depreciation_rate: number;
  status: 'active' | 'disposed' | 'maintenance';
}

export interface Budget {
  id: string;
  allocated: number;
  spent: number;
  remaining: number;
  date: string;
  status?: string;
  teller_name?: string;
  teller_id?: string;
}

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@email.com',
    phone: '+233 24 123 4567',
    address: '123 Main St, Accra',
    joinDate: '2024-01-15',
    status: 'active',
    totalContributions: 2500.00,
    balance: 2500.00
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@email.com',
    phone: '+233 24 234 5678',
    address: '456 Oak Ave, Kumasi',
    joinDate: '2024-02-01',
    status: 'active',
    totalContributions: 1800.00,
    balance: 1600.00
  },
  {
    id: '3',
    name: 'Carol Williams',
    email: 'carol@email.com',
    phone: '+233 24 345 6789',
    address: '789 Pine St, Tamale',
    joinDate: '2024-01-20',
    status: 'active',
    totalContributions: 3200.00,
    balance: 3200.00
  },
  {
    id: '4',
    name: 'David Brown',
    email: 'david@email.com',
    phone: '+233 24 456 7890',
    address: '321 Elm St, Cape Coast',
    joinDate: '2024-03-01',
    status: 'inactive',
    totalContributions: 1200.00,
    balance: 800.00
  }
];

export const mockContributions: Contribution[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'Alice Johnson',
    amount: 500.00,
    date: '2024-12-01',
    method: 'mobile_money',
    status: 'completed',
    notes: 'Monthly contribution'
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Bob Smith',
    amount: 300.00,
    date: '2024-12-01',
    method: 'cash',
    status: 'completed'
  },
  {
    id: '3',
    clientId: '3',
    clientName: 'Carol Williams',
    amount: 800.00,
    date: '2024-12-02',
    method: 'bank_transfer',
    status: 'pending',
    notes: 'Bulk payment for Q4'
  },
  {
    id: '4',
    clientId: '1',
    clientName: 'Alice Johnson',
    amount: 500.00,
    date: '2024-11-01',
    method: 'mobile_money',
    status: 'completed'
  }
];

export const mockWithdrawals: Withdrawal[] = [
  {
    id: '1',
    clientId: '2',
    clientName: 'Bob Smith',
    amount: 200.00,
    requestDate: '2024-11-15',
    approvalDate: '2024-11-16',
    status: 'completed',
    reason: 'Emergency medical expenses',
    approvedBy: 'John Doe'
  },
  {
    id: '2',
    clientId: '4',
    clientName: 'David Brown',
    amount: 400.00,
    requestDate: '2024-11-20',
    status: 'pending',
    reason: 'Business investment'
  },
  {
    id: '3',
    clientId: '1',
    clientName: 'Alice Johnson',
    amount: 1000.00,
    requestDate: '2024-12-01',
    status: 'pending',
    reason: 'Home renovation'
  }
];
