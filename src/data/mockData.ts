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
  id?: string;
  created_at?: string;
  customer_id: string;
  account_type: string;
  balance?: Number;
  company_id: string;
  created_by: string;
  account_number?: string;

  // Susu specific
  susuAmount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly';
  susuDuration?: number; // in months
  startDate?: string;
  daily_rate?: number;
  // Savings specific
  initial_deposit?: number;
  minimumBalance?: number;
  interestRate?: number;
  // Loan specific
  interestrateloan?: number;
  loanterm?: number; // in months
  collateral?: string;
  guarantor?: string;
  guarantorPhone?: string;
  created_by_type: string;
  loantype?: string;
  loanamount?: string;
  duration?: string;
  purpose?: string;
  disbursedamount?: string;
  disbursementDate?: string;
  maturityDate?: string;
  daysOverdue?: number;
  status?: string;
  monthlypayment?: string;
  amountpaid?: string;
  outstandingbalance?: string;
  nextPaymentDate?: string;
  totalpayable?:string;
  customer_name?: string;
  customer_phone?: string;
  mobile_banker?: string;
  interestmethod?: string;
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
  date: string;
  allocated: number;
  spent?: number;
  remaining?: number;
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
