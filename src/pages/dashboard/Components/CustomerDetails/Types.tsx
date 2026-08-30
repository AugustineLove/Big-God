export interface CustomerViewData {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  momo_number?: string;
  address?: string;
  date_of_registration?: string;
  lastLogin?: string;
  date_of_birth?: string;
  account_number?: string;
  gender?: string;
  registered_by?: string;
  id_card?: string;
  staff_name?: string;
  next_of_kin?: string;
  customer_id?: string;
  city?: string;
  withdrawal_code?: string;
  status?: string;
  send_sms?: boolean;
  sms_numbers?: string[];
  profileImage?: string | null;
  dailyRate?: string;
  totalBalance: number;
  monthlyContribution: number;
}

export type TabId = 'overview' | 'accounts' | 'transactions' | 'profile';