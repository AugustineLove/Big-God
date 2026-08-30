import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  CreditCard,
  User2,
  CheckCircle,
  Code,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatDate } from '../../../../utils/Formatters';
import { CustomerViewData } from './Types';

interface ProfileTabProps {
  customerData: CustomerViewData;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ customerData }) => {
  const [showCode, setShowCode] = useState(false);

  const personalFields = [
    { icon: User, label: 'Full name', value: customerData.fullName },
    { icon: Mail, label: 'Email address', value: customerData.email },
    { icon: Phone, label: 'Phone number', value: customerData.phone },
    { icon: MapPin, label: 'Address', value: customerData.address },
    { icon: Calendar, label: 'Date of birth', value: formatDate(customerData.date_of_birth) },
    { icon: Users, label: 'Next of kin', value: customerData.next_of_kin },
    { icon: CreditCard, label: 'Ghana Card', value: customerData.id_card, mono: true },
    { icon: User2, label: 'Gender', value: customerData.gender },
  ];

  const Field = ({
    icon: Icon,
    label,
    value,
    mono,
    border,
  }: {
    icon: any;
    label: string;
    value?: string;
    mono?: boolean;
    border?: string;
  }) => (
    <div className={`flex items-start gap-3 p-4 ${border || ''}`}>
      <div className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[var(--ink-faint)]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[var(--ink-faint)] mb-0.5">{label}</p>
        <p
          className={`text-[13px] font-medium text-[var(--ink)] break-words leading-snug ${
            mono ? 'cd-mono tracking-wide text-[12px]' : ''
          }`}
        >
          {value || '—'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Personal Information */}
      <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-[var(--paper-line)]">
          <h3 className="cd-display text-sm font-semibold text-[var(--ink)]">Personal information</h3>
          <p className="text-xs text-[var(--ink-faint)] mt-0.5">Customer profile details</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-dashed divide-[var(--paper-line)]">
          {personalFields.map(({ icon, label, value, mono }, i, arr) => (
            <Field
              key={label}
              icon={icon}
              label={label}
              value={value}
              mono={mono}
              border={
                (i % 2 === 0 ? 'sm:border-r sm:border-[var(--paper-line)] ' : '') +
                (i < arr.length - 2 ? 'sm:border-b sm:border-dashed sm:border-[var(--paper-line)]' : '')
              }
            />
          ))}
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-[var(--card)] border border-[var(--paper-line)] rounded-2xl overflow-hidden">
        <div className="px-5 sm:px-6 py-5 border-b border-[var(--paper-line)]">
          <h3 className="cd-display text-sm font-semibold text-[var(--ink)]">Account information</h3>
          <p className="text-xs text-[var(--ink-faint)] mt-0.5">Membership &amp; banking details</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-dashed divide-[var(--paper-line)]">
          <Field
            icon={Calendar}
            label="Date joined"
            value={formatDate(customerData.date_of_registration)}
            border="sm:border-r sm:border-b sm:border-[var(--paper-line)] sm:border-b-dashed"
          />
          <Field
            icon={CreditCard}
            label="Account number"
            value={customerData.account_number}
            mono
            border="sm:border-b sm:border-dashed sm:border-[var(--paper-line)]"
          />

          <div className="flex items-start gap-3 p-4 sm:border-r sm:border-b sm:border-dashed sm:border-[var(--paper-line)]">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: customerData.status === 'Active' ? 'rgba(47,74,50,0.1)' : 'var(--clay-soft)' }}
            >
              <CheckCircle
                className="w-3.5 h-3.5"
                style={{ color: customerData.status === 'Active' ? 'var(--forest)' : 'var(--clay)' }}
              />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--ink-faint)] mb-1">Account status</p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: customerData.status === 'Active' ? 'rgba(47,74,50,0.1)' : 'var(--clay-soft)',
                  color: customerData.status === 'Active' ? 'var(--forest)' : 'var(--clay)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: customerData.status === 'Active' ? 'var(--forest)' : 'var(--clay)' }}
                />
                {customerData.status}
              </span>
            </div>
          </div>

          <Field
            icon={Phone}
            label="Mobile money"
            value={customerData.momo_number}
            border="sm:border-b sm:border-dashed sm:border-[var(--paper-line)]"
          />

          <div className="flex items-start gap-3 p-4 sm:border-r sm:border-[var(--paper-line)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--paper)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Code className="w-3.5 h-3.5 text-[var(--ink-faint)]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[var(--ink-faint)] mb-0.5">Withdrawal code</p>
              <div className="flex items-center gap-2">
                <p className="cd-mono text-[13px] font-medium tracking-[0.2em] text-[var(--ink)]">
                  {showCode ? customerData.withdrawal_code : '••••••'}
                </p>
                <button
                  onClick={() => setShowCode(!showCode)}
                  className="w-6 h-6 rounded-md bg-[var(--paper)] flex items-center justify-center hover:brightness-95 transition"
                >
                  {showCode ? (
                    <EyeOff className="w-3 h-3 text-[var(--ink-faint)]" />
                  ) : (
                    <Eye className="w-3 h-3 text-[var(--ink-faint)]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;