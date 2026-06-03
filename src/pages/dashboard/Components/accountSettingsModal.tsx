import React, { useEffect, useState } from 'react';
import {
  X, DollarSign, AlertTriangle, Save, Settings, TrendingDown,
  Shield, Bell, CreditCard, RefreshCw, Lock, Phone, Mail,
  Smartphone, Clock, ChevronDown, ChevronUp, Eye, EyeOff,
  Activity, RotateCcw, Banknote, Wifi, WifiOff, CheckCircle
} from 'lucide-react';

const SectionHeader = ({ icon: Icon, title, subtitle, color = 'blue', isOpen, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex items-center justify-between p-4 rounded-xl transition-all"
    style={{ background: isOpen ? '#EFF6FF' : '#F9FAFB', border: '1.5px solid', borderColor: isOpen ? '#BFDBFE' : '#E5E7EB' }}
  >
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center`}
        style={{ background: isOpen ? '#DBEAFE' : '#F3F4F6' }}>
        <Icon size={18} style={{ color: isOpen ? '#2563EB' : '#6B7280' }} />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
  </button>
);

const Toggle = ({ checked, onChange, color = 'blue' }) => {
  const colors = {
    blue: { on: '#2563EB', off: '#D1D5DB' },
    yellow: { on: '#D97706', off: '#D1D5DB' },
    red: { on: '#DC2626', off: '#D1D5DB' },
    green: { on: '#16A34A', off: '#D1D5DB' },
  };
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
      style={{ background: checked ? colors[color].on : colors[color].off }}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
};

const FieldRow = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const GhsInput = ({ value, onChange, min = 0, required = false, placeholder = '0.00', disabled = false }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">GHS</span>
    <input
      type="number" step="0.01" min={min} required={required}
      value={value} onChange={onChange} disabled={disabled}
      placeholder={placeholder}
      className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-50"
    />
  </div>
);

const Badge = ({ label, color }) => {
  const map = {
    active: { bg: '#DCFCE7', text: '#15803D', label: 'Active' },
    inactive: { bg: '#FEF9C3', text: '#A16207', label: 'Inactive' },
    blocked: { bg: '#FEE2E2', text: '#B91C1C', label: 'Blocked' },
    closed: { bg: '#F3F4F6', text: '#374151', label: 'Closed' },
  };
  const s = map[color] || map.active;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
};

const CARD_STATUSES = ['ACTIVE', 'BLOCKED', 'EXPIRED', 'LOST', 'STOLEN', 'INACTIVE'];

const AccountSettingsModal = ({ account, isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openSections, setOpenSections] = useState({
    balance: true, card: false, notifications: false, risk: false, lifecycle: false,
  });

  const [settings, setSettings] = useState({
    // Balance
    minimumBalance: 0,
    allowNegativeBalance: false,
    overdraftLimit: 0,
    lowBalanceThreshold: 100,
    dailyWithdrawalLimit: '',
    // Card
    cardStatus: 'ACTIVE',
    cardExpiryDate: '',
    // Notifications
    smsEnabled: true,
    smsNumbers: '',
    emailNotifications: true,
    pushNotifications: true,
    // Risk / Security
    transactionPinEnabled: true,
    failedPinAttempts: 0,
    lockedUntil: '',
    // Lifecycle
    status: 'Active',
    description: '',
    interestRate: '',
    dailyRate: '',
    frequency: '',
  });

  useEffect(() => {
    if (account) {
      setSettings({
        minimumBalance: parseFloat(account.minimum_balance) || 0,
        allowNegativeBalance: account.allow_negative_balance || false,
        overdraftLimit: parseFloat(account.overdraft_limit) || 0,
        lowBalanceThreshold: parseFloat(account.low_balance_threshold) || 100,
        dailyWithdrawalLimit: account.daily_withdrawal_limit || '',
        cardStatus: account.card_status || 'ACTIVE',
        cardExpiryDate: account.card_expiry_date ? account.card_expiry_date.split('T')[0] : '',
        smsEnabled: account.sms_enabled ?? true,
        smsNumbers: (account.sms_numbers || []).join(', '),
        emailNotifications: account.email_notifications ?? true,
        pushNotifications: account.push_notifications ?? true,
        transactionPinEnabled: account.transaction_pin_enabled ?? true,
        failedPinAttempts: account.failed_pin_attempts || 0,
        lockedUntil: account.locked_until ? account.locked_until.split('T')[0] : '',
        status: account.status || 'Active',
        description: account.description || '',
        interestRate: account.interest_rate || '',
        dailyRate: account.daily_rate || '',
        frequency: account.frequency || '',
      });
    }
  }, [account]);

  const toggleSection = (key) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const set = (key, val) => setSettings((s) => ({ ...s, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (settings.minimumBalance < 0) return setErrorMessage('Minimum balance cannot be negative.');
    if (settings.allowNegativeBalance && settings.overdraftLimit < 0) return setErrorMessage('Overdraft limit cannot be negative.');
    if (settings.lowBalanceThreshold < 0) return setErrorMessage('Low balance threshold cannot be negative.');

    const parsedSmsNumbers = settings.smsNumbers
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    const body = {
      minimum_balance: settings.minimumBalance,
      allow_negative_balance: settings.allowNegativeBalance,
      overdraft_limit: settings.allowNegativeBalance ? settings.overdraftLimit : 0,
      low_balance_threshold: settings.lowBalanceThreshold,
      daily_withdrawal_limit: settings.dailyWithdrawalLimit !== '' ? parseFloat(settings.dailyWithdrawalLimit) : null,
      card_status: settings.cardStatus,
      card_expiry_date: settings.cardExpiryDate || null,
      sms_enabled: settings.smsEnabled,
      sms_numbers: parsedSmsNumbers,
      email_notifications: settings.emailNotifications,
      push_notifications: settings.pushNotifications,
      transaction_pin_enabled: settings.transactionPinEnabled,
      locked_until: settings.lockedUntil || null,
      status: settings.status,
      description: settings.description,
      interest_rate: settings.interestRate !== '' ? parseFloat(settings.interestRate) : null,
      daily_rate: settings.dailyRate !== '' ? parseFloat(settings.dailyRate) : null,
      frequency: settings.frequency || null,
    };

    setIsSubmitting(true);
    try {
      const accountId = account.id
      console.log(`Account id: ${accountId}`)
      const res = await fetch(`http://localhost:5050/api/accounts/${accountId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('susupro_token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update settings');
      }

      const updated = await res.json();
      setSuccessMessage('Settings saved successfully!');
      if (onSave) onSave(updated);
      setTimeout(onClose, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplaceCard = async () => {
    if (!window.confirm('Request a physical card replacement for this account?')) return;
    try {
      const res = await fetch(`http://localhost:5050/api/accounts/${account.id}/card/replace`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('susupro_token')}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuccessMessage(`Card replacement #${data.card_replacement_count} requested.`);
      if (onSave) onSave(data);
    } catch {
      setErrorMessage('Failed to request card replacement.');
    }
  };

  const handleUnlockAccount = async () => {
    try {
      const res = await fetch(`http://localhost:5050/api/accounts/${account.id}/unlock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('susupro_token')}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set('failedPinAttempts', 0);
      set('lockedUntil', '');
      setSuccessMessage('Account PIN lock cleared.');
      if (onSave) onSave(data);
    } catch {
      setErrorMessage('Failed to unlock account.');
    }
  };

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n || 0);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const isLocked = settings.lockedUntil && new Date(settings.lockedUntil) > new Date();
  const balanceBelowMin = Number(account?.balance) < settings.minimumBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Settings className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Account Settings</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{account?.account_type} · {account?.account_number}</span>
                <Badge color={account?.status?.toLowerCase()} label={account?.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
            <p className="text-green-800 text-sm font-medium">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={18} />
            <p className="text-red-800 text-sm font-medium">{errorMessage}</p>
          </div>
        )}
        {balanceBelowMin && (
          <div className="mx-6 mt-3 bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-orange-700 text-xs">
              Current balance ({formatCurrency(account?.balance)}) is below the minimum you're setting ({formatCurrency(settings.minimumBalance)}).
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-3 flex-1">

          {/* Balance Summary */}
          <div className="rounded-xl p-4 flex items-center justify-between mb-4"
            style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #EDE9FE 100%)', border: '1px solid #BFDBFE' }}>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Current balance</p>
              <p className={`text-2xl font-bold ${Number(account?.balance) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(account?.balance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">Card</p>
              <p className="text-sm font-medium text-gray-700">{account?.card_number || '— no card —'}</p>
              <p className="text-xs text-gray-500">
                {account?.card_replacement_count > 0
                  ? `Replaced ${account.card_replacement_count}×`
                  : 'Original card'}
                {account?.card_last_replaced_at && ` · ${formatDate(account.card_last_replaced_at)}`}
              </p>
            </div>
          </div>

          {/* ── SECTION: Balance & Limits ── */}
          <SectionHeader
            icon={DollarSign} title="Balance & Limits" subtitle="Minimum, overdraft, and withdrawal limits"
            isOpen={openSections.balance} onToggle={() => toggleSection('balance')}
          />
          {openSections.balance && (
            <div className="px-1 pt-2 pb-4 space-y-4">
              <FieldRow label="Minimum balance required" hint="Account must maintain at least this amount">
                <GhsInput value={settings.minimumBalance} onChange={(e) => set('minimumBalance', parseFloat(e.target.value) || 0)} required />
              </FieldRow>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingDown size={15} className="text-orange-500" />
                      <span className="text-sm font-medium text-gray-700">Allow negative balance (overdraft)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-5">Let the balance go below zero</p>
                  </div>
                  <Toggle
                    checked={settings.allowNegativeBalance}
                    onChange={() => set('allowNegativeBalance', !settings.allowNegativeBalance)}
                    color="blue"
                  />
                </div>
                {settings.allowNegativeBalance && (
                  <div className="pt-3 border-t border-gray-200">
                    <FieldRow label="Overdraft limit" hint="Max negative balance allowed (e.g. 500 → balance can reach −500)">
                      <GhsInput value={settings.overdraftLimit} onChange={(e) => set('overdraftLimit', parseFloat(e.target.value) || 0)} required />
                    </FieldRow>
                  </div>
                )}
              </div>

              <FieldRow label="Daily withdrawal limit" hint="Leave blank for no limit">
                <GhsInput value={settings.dailyWithdrawalLimit} onChange={(e) => set('dailyWithdrawalLimit', e.target.value)} placeholder="No limit" />
              </FieldRow>

              <FieldRow label="Low balance threshold" hint="Trigger a notification when balance drops here">
                <GhsInput value={settings.lowBalanceThreshold} onChange={(e) => set('lowBalanceThreshold', parseFloat(e.target.value) || 0)} />
              </FieldRow>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Interest rate (%)" hint="Annual rate, if applicable">
                  <div className="relative">
                    <input type="number" step="0.01" min="0" value={settings.interestRate}
                      onChange={(e) => set('interestRate', e.target.value)} placeholder="e.g. 12.5"
                      className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </FieldRow>
                <FieldRow label="Daily rate" hint="Flat daily contribution">
                  <GhsInput value={settings.dailyRate} onChange={(e) => set('dailyRate', e.target.value)} placeholder="0.00" />
                </FieldRow>
              </div>

              <FieldRow label="Contribution frequency" hint="How often deposits are expected">
                <select value={settings.frequency} onChange={(e) => set('frequency', e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Not set</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </FieldRow>

              <FieldRow label="Account description / notes">
                <textarea value={settings.description} onChange={(e) => set('description', e.target.value)} rows={2}
                  placeholder="Optional internal notes about this account..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              </FieldRow>
            </div>
          )}

          {/* ── SECTION: Card Management ── */}
          <SectionHeader
            icon={CreditCard} title="Card management" subtitle="Status, expiry, replacement history"
            isOpen={openSections.card} onToggle={() => toggleSection('card')}
          />
          {openSections.card && (
            <div className="px-1 pt-2 pb-4 space-y-4">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 -right-8 w-36 h-36 rounded-full bg-white/5" />
                <p className="text-xs text-slate-300 mb-3 font-medium tracking-widest uppercase">Physical card</p>
                <p className="text-xl font-mono tracking-widest mb-4">{account?.card_number || '•••• •••• •••• ••••'}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Expires</p>
                    <p className="text-sm font-medium">{formatDate(account?.card_expiry_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Replacements</p>
                    <p className="text-sm font-medium">{account?.card_replacement_count || 0}×</p>
                  </div>
                </div>
                {account?.card_last_replaced_at && (
                  <p className="text-xs text-slate-400 mt-2">Last replaced: {formatDate(account.card_last_replaced_at)}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Card status">
                  <select value={settings.cardStatus} onChange={(e) => set('cardStatus', e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                    {CARD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FieldRow>
                <FieldRow label="Card expiry date">
                  <input type="date" value={settings.cardExpiryDate} onChange={(e) => set('cardExpiryDate', e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </FieldRow>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-medium text-blue-800 mb-1">Request card replacement</p>
                <p className="text-xs text-blue-600 mb-3">
                  This will log a replacement event, increment the count, and mark the old card as replaced.
                  {account?.card_replacement_count > 0 && ` This would be replacement #${(account.card_replacement_count || 0) + 1}.`}
                </p>
                <button
                  type="button"
                  onClick={handleReplaceCard}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={14} />
                  Replace card
                </button>
              </div>
            </div>
          )}

          {/* ── SECTION: Notifications ── */}
          <SectionHeader
            icon={Bell} title="Notifications" subtitle="SMS, email, and push alert preferences"
            isOpen={openSections.notifications} onToggle={() => toggleSection('notifications')}
          />
          {openSections.notifications && (
            <div className="px-1 pt-2 pb-4 space-y-4">
              {[
                { key: 'smsEnabled', icon: Smartphone, label: 'SMS notifications', desc: 'Send transaction alerts via SMS', color: 'green' },
                { key: 'emailNotifications', icon: Mail, label: 'Email notifications', desc: 'Send account updates by email', color: 'blue' },
                { key: 'pushNotifications', icon: Bell, label: 'Push notifications', desc: 'Mobile push alerts for this account', color: 'blue' },
              ].map(({ key, icon: Icon, label, desc, color }) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                  <Toggle checked={settings[key]} onChange={() => set(key, !settings[key])} color={color} />
                </div>
              ))}

              {settings.smsEnabled && (
                <FieldRow
                  label="SMS numbers"
                  hint="Comma-separated. These override the customer's default number for this account."
                >
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text" value={settings.smsNumbers}
                      onChange={(e) => set('smsNumbers', e.target.value)}
                      placeholder="+233244000001, +233205000002"
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </FieldRow>
              )}
            </div>
          )}

          {/* ── SECTION: Risk & Security ── */}
          <SectionHeader
            icon={Shield} title="Risk & security" subtitle="PIN, lock status, account security"
            isOpen={openSections.risk} onToggle={() => toggleSection('risk')}
          />
          {openSections.risk && (
            <div className="px-1 pt-2 pb-4 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Lock size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Transaction PIN</p>
                    <p className="text-xs text-gray-400">Require PIN to authorise transactions</p>
                  </div>
                </div>
                <Toggle checked={settings.transactionPinEnabled} onChange={() => set('transactionPinEnabled', !settings.transactionPinEnabled)} color="blue" />
              </div>

              {isLocked ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Lock className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Account PIN locked</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        Locked until {formatDate(settings.lockedUntil)} · {settings.failedPinAttempts} failed attempts
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={handleUnlockAccount}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex-shrink-0">
                    <RotateCcw size={12} /> Unlock
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-500" />
                  <p className="text-sm text-green-700">
                    Account is not PIN-locked
                    {settings.failedPinAttempts > 0 && ` · ${settings.failedPinAttempts} failed attempts on record`}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Failed PIN attempts</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">{settings.failedPinAttempts}</p>
                </div>
                <FieldRow label="Manual lock until">
                  <input type="datetime-local" value={settings.lockedUntil} onChange={(e) => set('lockedUntil', e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </FieldRow>
              </div>
            </div>
          )}

          {/* ── SECTION: Account Lifecycle ── */}
          <SectionHeader
            icon={Activity} title="Account lifecycle" subtitle="Status, opened, closed, and activity dates"
            isOpen={openSections.lifecycle} onToggle={() => toggleSection('lifecycle')}
          />
          {openSections.lifecycle && (
            <div className="px-1 pt-2 pb-4 space-y-4">
              <FieldRow label="Account status">
                <select value={settings.status} onChange={(e) => set('status', e.target.value)}
                  className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Closed">Closed</option>
                  <option value="Dormant">Dormant</option>
                </select>
              </FieldRow>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Opened', value: formatDate(account?.opened_at) },
                  { label: 'Closed', value: formatDate(account?.closed_at) },
                  { label: 'Last activity', value: formatDate(account?.last_activity_at) },
                  { label: 'Branch', value: account?.branch_id ? account.branch_id.slice(0, 8) + '…' : '— (none)' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSettingsModal;