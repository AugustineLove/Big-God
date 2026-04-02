import React, { useState, useEffect, useRef } from 'react';
import {
  X, User, Phone, Mail, Users, Target, Calendar,
  TrendingUp, CreditCard, Receipt, Download, Edit,
  CheckCircle2, ChevronRight, Briefcase, Hash,
  ArrowDownRight, ArrowUpRight, Clock, AlertTriangle,
  BarChart2, Layers, Send, Shield, FileText,
  MoreHorizontal, Zap, Activity, PlusCircle, MinusCircle,
  ChevronDown, ChevronUp, Star, Info, Lock, RefreshCw
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GHS = (n) =>
  '₵' + Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const relativeTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return fmtDate(d);
};

const statusConfig = {
  active:   { bg: '#E1F5EE', color: '#085041', dot: '#0F6E56', label: 'Active' },
  pending:  { bg: '#FAEEDA', color: '#633806', dot: '#BA7517', label: 'Pending' },
  completed:{ bg: '#EEEDFE', color: '#3C3489', dot: '#534AB7', label: 'Completed' },
  defaulted:{ bg: '#FCEBEB', color: '#72243E', dot: '#A32D2D', label: 'Defaulted' },
  inactive: { bg: '#F1F0F8', color: '#5a5878', dot: '#9896b0', label: 'Inactive' },
};

const ACCENT = '#4A635D';

// ─── Sub-components ───────────────────────────────────────────────────────────

const Pill = ({ status }) => {
  const c = statusConfig[status?.toLowerCase()] || statusConfig.inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, letterSpacing: '.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }} />
      {c.label}
    </span>
  );
};

const Tab = ({ label, active, onClick, badge }) => (
  <button onClick={onClick} style={{
    padding: '9px 16px', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: active ? 700 : 500,
    color: active ? ACCENT : '#9896b0',
    borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
    transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6,
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  }}>
    {label}
    {badge != null && (
      <span style={{
        background: active ? ACCENT : '#e8e7f0', color: active ? '#fff' : '#9896b0',
        borderRadius: 100, fontSize: 10, fontWeight: 700, padding: '1px 7px',
      }}>{badge}</span>
    )}
  </button>
);

const SectionHead = ({ children, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
    <span style={{ fontSize: 10, fontWeight: 800, color: '#b8b6cc', letterSpacing: '.14em', textTransform: 'uppercase' }}>
      {children}
    </span>
    {action}
  </div>
);

const MetricCard = ({ label, value, sub, accent = '#4A635D', bg = '#F5F9F8', icon }) => (
  <div style={{
    background: bg, borderRadius: 14, padding: '14px 16px',
    border: '1px solid rgba(0,0,0,.05)', display: 'flex', flexDirection: 'column', gap: 6,
  }}>
    {icon && (
      <div style={{ color: accent, opacity: .7, marginBottom: 2 }}>{icon}</div>
    )}
    <div style={{ fontSize: 11, color: '#9896b0', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1830', letterSpacing: '-.02em' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#b8b6cc' }}>{sub}</div>}
  </div>
);

const InfoRow = ({ icon, label, value, mono }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #F5F4FC' }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8, background: '#F5F4FC',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#9896b0', flexShrink: 0,
    }}>
      {React.cloneElement(icon, { size: 14 })}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#b8b6cc', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1830', fontFamily: mono ? 'monospace' : 'inherit' }}>
        {value || '—'}
      </div>
    </div>
  </div>
);

// ─── Progress Arc ─────────────────────────────────────────────────────────────

const CircleProgress = ({ pct, size = 100, stroke = 8, color = ACCENT }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F0EFF8" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  );
};

// ─── Payment Modal ────────────────────────────────────────────────────────────

const PaymentModal = ({ open, onClose, onConfirm, maxAmount, recipientLabel, loading }) => {
  const [amount_paid, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('cash');

  if (!open) return null;

  console.log(`Amount paid ${amount_paid}`)
  const pct = maxAmount > 0 ? Math.min(100, (parseFloat(amount_paid || 0) / maxAmount) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(10,5,30,.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420,
        padding: '28px 28px 24px', boxShadow: '0 40px 80px rgba(0,0,0,.25)',
        fontFamily: 'inherit',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1830' }}>Record Payment</div>
            <div style={{ fontSize: 12, color: '#9896b0', marginTop: 2 }}>{recipientLabel}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9896b0', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Amount with inline progress */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#9896b0', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            Amount (₵)
          </label>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#9896b0', fontWeight: 700 }}>₵</span>
            <input
              type="number" value={amount_paid}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" min="0" step="0.01"
              style={{
                width: '100%', padding: '12px 12px 12px 28px', fontSize: 20, fontWeight: 800,
                border: '2px solid #E2E0EE', borderRadius: 12, outline: 'none', color: '#1a1830',
                fontFamily: 'inherit', boxSizing: 'border-box',
                borderColor: amount_paid && parseFloat(amount_paid) > maxAmount ? '#F09595' : '#E2E0EE',
              }}
            />
          </div>
          {maxAmount > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9896b0', marginBottom: 4 }}>
                <span>Balance due: {GHS(maxAmount)}</span>
                <span style={{ fontWeight: 700, color: ACCENT }}>{pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 4, background: '#F0EFF8', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3, transition: 'width .3s' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[0.25, 0.5, 1].map((f) => (
                  <button key={f} onClick={() => setAmount((maxAmount * f).toFixed(2))} style={{
                    flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 700,
                    border: '1px solid #E2E0EE', borderRadius: 7, background: '#F8F7FF',
                    color: ACCENT, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {f === 1 ? 'Full' : `${f * 100}%`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9896b0', textTransform: 'uppercase', letterSpacing: '.1em' }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{
              width: '100%', marginTop: 6, padding: '9px 11px', fontSize: 13,
              border: '1.5px solid #E2E0EE', borderRadius: 10, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1830',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9896b0', textTransform: 'uppercase', letterSpacing: '.1em' }}>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{
              width: '100%', marginTop: 6, padding: '9px 11px', fontSize: 13,
              border: '1.5px solid #E2E0EE', borderRadius: 10, outline: 'none',
              fontFamily: 'inherit', background: '#fff', color: '#1a1830', boxSizing: 'border-box',
            }}>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#9896b0', textTransform: 'uppercase', letterSpacing: '.1em' }}>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Month 3 repayment" style={{
            width: '100%', marginTop: 6, padding: '9px 11px', fontSize: 13,
            border: '1.5px solid #E2E0EE', borderRadius: 10, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', color: '#1a1830',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', border: '1.5px solid #E2E0EE', borderRadius: 12,
            background: '#fff', color: '#5a5878', fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button
            disabled={!amount_paid || parseFloat(amount_paid) <= 0 || loading}
            onClick={() => onConfirm({ amount_paid: parseFloat(amount_paid), date, note, method })}
            style={{
              flex: 2, padding: '11px', border: 'none', borderRadius: 12,
              background: !amount_paid || parseFloat(amount_paid) <= 0 ? '#E2E0EE' : ACCENT,
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: !amount_paid || parseFloat(amount_paid) <= 0 ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background .15s',
              opacity: loading ? .65 : 1,
            }}
          >
            {loading ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Individual Loan View ─────────────────────────────────────────────────────

const IndividualView = ({ loan, onPayment }) => {
  const [tab, setTab] = useState('overview');
  const paid = parseFloat(loan.amountpaid ?? 0);
  const total = parseFloat(loan.totalpayable ?? 0);
  const balance = Math.max(0, total - paid);
  const principal = parseFloat(loan.disbursedamount ?? loan.loanamount ?? 0);
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const monthly = parseFloat(loan.monthlypayment ?? 0);
  const rate = parseFloat(loan.interestrateloan ?? loan.interest_rate ?? 0);
  const term = parseInt(loan.loanterm ?? 0);
  const paymentsCount = Math.round(paid / monthly) || 0;
  const remainingPayments = Math.max(0, term - paymentsCount);

  const mockSchedule = Array.from({ length: term }, (_, i) => {
    const month = i + 1;
    const isPaid = month <= paymentsCount;
    const isCurrent = month === paymentsCount + 1;
    return { month, payment: monthly, isPaid, isCurrent };
  });

  return (
    <div>
      {/* Top metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        <MetricCard label="Disbursed" value={GHS(principal)} bg="#F5F9F8" accent={ACCENT} icon={<TrendingUp size={16}/>} />
        <MetricCard label="Total Payable" value={GHS(total)} bg="#F8F7FF" accent="#534AB7" icon={<BarChart2 size={16}/>} />
        <MetricCard label="Amount Paid" value={GHS(paid)} bg="#E1F5EE" accent="#0F6E56" icon={<CheckCircle2 size={16}/>} />
        <MetricCard label="Balance Due" value={GHS(balance)} bg={balance > 0 ? "#FCEBEB" : "#E1F5EE"} accent={balance > 0 ? "#A32D2D" : "#0F6E56"} icon={<CreditCard size={16}/>} />
      </div>

      {/* Progress + tabs */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '20px',
        border: '1px solid #E2E0EE', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <CircleProgress pct={pct} size={90} stroke={7} color={pct >= 100 ? '#0F6E56' : ACCENT} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1a1830' }}>{pct.toFixed(0)}%</span>
              <span style={{ fontSize: 9, color: '#9896b0', fontWeight: 700, textTransform: 'uppercase' }}>Paid</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#5a5878', marginBottom: 8 }}>
              <strong style={{ color: '#1a1830', fontSize: 16 }}>{GHS(paid)}</strong> paid of {GHS(total)}
            </div>
            <div style={{ height: 6, background: '#F0EFF8', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: ACCENT, borderRadius: 3, transition: 'width .6s' }} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ fontSize: 11, color: '#9896b0' }}>
                <span style={{ fontWeight: 700, color: '#1a1830' }}>{paymentsCount}</span> / {term} payments
              </div>
              <div style={{ fontSize: 11, color: '#9896b0' }}>
                <span style={{ fontWeight: 700, color: '#BA7517' }}>{remainingPayments}</span> remaining
              </div>
              <div style={{ fontSize: 11, color: '#9896b0' }}>
                Monthly: <span style={{ fontWeight: 700, color: '#534AB7' }}>{GHS(monthly)}</span>
              </div>
            </div>
          </div>
          {balance > 0 && (
            <button onClick={onPayment} style={{
              padding: '10px 20px', background: ACCENT, color: '#fff', border: 'none',
              borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: `0 4px 14px ${ACCENT}40`,
            }}>
              <Receipt size={16} /> Pay
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F0EFF8', marginBottom: 16, gap: 0 }}>
          {['overview', 'schedule', 'history'].map((t) => (
            <Tab key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={tab===t} onClick={()=>setTab(t)} />
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <InfoRow icon={<User />} label="Borrower" value={loan.customer_name} />
            <InfoRow icon={<Phone />} label="Phone" value={loan.customer_phone} />
            <InfoRow icon={<Briefcase />} label="Category" value={loan.loan_category || loan.loantype} />
            <InfoRow icon={<Target />} label="Interest Rate" value={`${rate}% p.a.`} />
            <InfoRow icon={<Calendar />} label="Start Date" value={fmtDate(loan.request_date || loan.startdate)} />
            <InfoRow icon={<Calendar />} label="Maturity" value={fmtDate(loan.maturity_date || loan.enddate)} />
            <InfoRow icon={<Layers />} label="Interest Method" value={loan.interest_method || 'Fixed'} />
            <InfoRow icon={<Shield />} label="Collateral" value={loan.collateral || 'None'} />
            <InfoRow icon={<User />} label="Guarantor" value={loan.guarantor_name} />
            <InfoRow icon={<Phone />} label="Guarantor Phone" value={loan.guarantor_phone} />
            <InfoRow icon={<Briefcase />} label="Purpose" value={loan.purpose} />
            <InfoRow icon={<Hash />} label="Loan ID" value={loan.id} mono />
          </div>
        )}

        {tab === 'schedule' && (
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
              {mockSchedule.map((row) => (
                <div key={row.month} style={{
                  borderRadius: 10, padding: '8px 6px', textAlign: 'center', fontSize: 11,
                  background: row.isPaid ? '#E1F5EE' : row.isCurrent ? '#EEEDFE' : '#F8F7FF',
                  border: `1.5px solid ${row.isPaid ? '#9FE1CB' : row.isCurrent ? '#CECBF6' : '#E2E0EE'}`,
                  color: row.isPaid ? '#0F6E56' : row.isCurrent ? '#534AB7' : '#9896b0',
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>M{row.month}</div>
                  {row.isPaid
                    ? <CheckCircle2 size={14} style={{ margin: '0 auto' }} />
                    : row.isCurrent
                    ? <span style={{ fontSize: 9, fontWeight: 700 }}>DUE</span>
                    : <span style={{ fontSize: 9 }}>{GHS(row.payment)}</span>
                  }
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#9896b0' }}>
              <span><span style={{ color: '#0F6E56', fontWeight: 700 }}>■</span> Paid</span>
              <span><span style={{ color: '#534AB7', fontWeight: 700 }}>■</span> Current</span>
              <span><span style={{ color: '#b8b6cc', fontWeight: 700 }}>■</span> Upcoming</span>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {paymentsCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#b8b6cc', fontSize: 13 }}>
                No payments recorded yet
              </div>
            ) : (
              Array.from({ length: paymentsCount }).map((_, i) => {
                const d = new Date(loan.request_date || new Date());
                d.setMonth(d.getMonth() + i + 1);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid #F5F4FC',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F6E56' }}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1830' }}>Repayment #{i+1}</div>
                        <div style={{ fontSize: 11, color: '#9896b0' }}>{fmtDate(d.toISOString())}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0F6E56' }}>+{GHS(monthly)}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Loan health */}
      <div style={{
        background: 'linear-gradient(135deg, #4A635D 0%, #2d3e3a 100%)',
        borderRadius: 16, padding: '18px 20px', color: '#fff',
        display: 'flex', gap: 20, alignItems: 'center',
      }}>
        <Activity size={28} style={{ opacity: .6, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .6, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 3 }}>Loan Health</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {pct >= 100 ? '✓ Fully repaid' : pct >= 75 ? 'On track — nearly done' : pct >= 40 ? 'In progress' : 'Early stage'}
          </div>
        </div>
        {balance > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, opacity: .6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Balance</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{GHS(balance)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Group Loan View ──────────────────────────────────────────────────────────

const GroupView = ({ loan, groupData, logRepayment, loadingGroupData }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [expandedMember, setExpandedMember] = useState(null);
  const [payingMemberId, setPayingMemberId] = useState(null);

  const members = groupData?.members || [];
  const groupLoan = groupData?.group_loan || loan;

  const totalDisbursed = members.reduce((s, m) => s + parseFloat(m.loanamount ?? 0), 0);
  const totalPaid = members.reduce((s, m) => s + parseFloat(m.amountpaid ?? 0), 0);
  const totalBalance = Math.max(0, totalDisbursed - totalPaid);
  const groupPct = totalDisbursed > 0 ? Math.min(100, (totalPaid / totalDisbursed) * 100) : 0;

  const avatarColors = [
    { bg: '#EEEDFE', text: '#3C3489' }, { bg: '#E1F5EE', text: '#085041' },
    { bg: '#FAEEDA', text: '#633806' }, { bg: '#E6F1FB', text: '#0C447C' },
    { bg: '#FBEAF0', text: '#72243E' }, { bg: '#F5F5DC', text: '#3d3a10' },
  ];

  const initials = (name) => (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (loadingGroupData) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <RefreshCw size={24} style={{ color: '#b8b6cc', animation: 'spin 1s linear infinite' }} />
      <div style={{ fontSize: 13, color: '#9896b0', marginTop: 10 }}>Loading group data…</div>
    </div>
  );

  return (
    <div>
      {/* Group summary strip */}
      <div style={{
        background: 'linear-gradient(135deg, #0F6E56 0%, #085041 100%)',
        borderRadius: 16, padding: '18px 20px', color: '#fff', marginBottom: 16,
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .65, textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 5 }}>
            Group · {members.length} members
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.02em' }}>{groupLoan.group_name || loan.group_name}</div>
          <div style={{ fontSize: 12, opacity: .7, marginTop: 3 }}>
            Led by {groupLoan.customer_name || loan.customer_name} · {fmtDate(groupLoan.request_date || loan.request_date)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, opacity: .6, textTransform: 'uppercase', letterSpacing: '.1em' }}>Group Total</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{GHS(parseFloat(groupLoan.loanamount ?? loan.loanamount))}</div>
        </div>
      </div>

      {/* Group metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Total Disbursed" value={GHS(totalDisbursed)} bg="#E1F5EE" accent="#0F6E56" />
        <MetricCard label="Total Collected" value={GHS(totalPaid)} bg="#E6F1FB" accent="#185FA5" />
        <MetricCard label="Outstanding" value={GHS(totalBalance)} bg={totalBalance > 0 ? "#FCEBEB" : "#E1F5EE"} accent={totalBalance > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      {/* Group progress */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E0EE', padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5a5878' }}>Group Repayment Progress</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>{groupPct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 8, background: '#F0EFF8', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${groupPct}%`, background: '#0F6E56', borderRadius: 4, transition: 'width .6s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9896b0', marginTop: 5 }}>
          <span>{GHS(totalPaid)} collected</span>
          <span>{GHS(totalBalance)} remaining</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E0EE', marginBottom: 16 }}>
        <Tab label="Members" active={activeTab==='members'} onClick={()=>setActiveTab('members')} badge={members.length} />
        <Tab label="Group Info" active={activeTab==='info'} onClick={()=>setActiveTab('info')} />
      </div>

      {activeTab === 'members' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {members.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#b8b6cc', fontSize: 13 }}>No members loaded</div>
          )}
          {members.map((m, idx) => {
            const mPaid = parseFloat(m.amountpaid ?? 0);
            const mTotal = parseFloat(m.totalpayable ?? (parseFloat(m.loanamount) * 1.2) ?? 0);
            const mBalance = Math.max(0, mTotal - mPaid);
            const mPct = mTotal > 0 ? Math.min(100, (mPaid / mTotal) * 100) : 0;
            const monthly = parseFloat(m.monthlypayment ?? 0);
            const ac = avatarColors[idx % avatarColors.length];
            const isExpanded = expandedMember === m.id;

            return (
              <div key={m.id} style={{
                background: '#fff', borderRadius: 14, border: `1.5px solid ${isExpanded ? ACCENT+'40' : '#E2E0EE'}`,
                overflow: 'hidden', transition: 'border-color .2s',
              }}>
                {/* Member header row */}
                <div
                  onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: ac.bg, color: ac.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                  }}>{initials(m.customer_name || m.name)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1830', marginBottom: 3 }}>
                      {m.customer_name || m.name}
                    </div>
                    <div style={{ height: 4, background: '#F0EFF8', borderRadius: 3, overflow: 'hidden', maxWidth: 200 }}>
                      <div style={{ height: '100%', width: `${mPct}%`, background: mPct >= 100 ? '#0F6E56' : ACCENT, borderRadius: 3 }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1830' }}>{GHS(m.loanamount)}</div>
                    <div style={{ fontSize: 10, color: mBalance > 0 ? '#A32D2D' : '#0F6E56', fontWeight: 700, marginTop: 1 }}>
                      {mBalance > 0 ? `${GHS(mBalance)} left` : '✓ Settled'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {mBalance > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setPayingMemberId(m.id); }}
                        style={{
                          padding: '6px 12px', background: ACCENT, color: '#fff', border: 'none',
                          borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >Pay</button>
                    )}
                    {isExpanded ? <ChevronUp size={16} color="#9896b0" /> : <ChevronDown size={16} color="#9896b0" />}
                  </div>
                </div>

                {/* Expanded member detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F5F4FC', padding: '14px 16px', background: '#FAFAF8' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                      <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #E2E0EE' }}>
                        <div style={{ fontSize: 10, color: '#9896b0', fontWeight: 600, marginBottom: 3 }}>Share Amount</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1830' }}>{GHS(m.loanamount)}</div>
                      </div>
                      <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#085041', fontWeight: 600, marginBottom: 3 }}>Paid</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F6E56' }}>{GHS(mPaid)}</div>
                      </div>
                      <div style={{ background: mBalance > 0 ? '#FCEBEB' : '#E1F5EE', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: mBalance > 0 ? '#72243E' : '#085041', fontWeight: 600, marginBottom: 3 }}>Balance</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: mBalance > 0 ? '#A32D2D' : '#0F6E56' }}>{GHS(mBalance)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#9896b0' }}>
                      <span><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{m.customer_phone || '—'}</span>
                      <span>Monthly: <strong style={{ color: '#534AB7' }}>{GHS(monthly)}</strong></span>
                      <span>{mPct.toFixed(0)}% complete</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'info' && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E0EE', padding: '16px 18px' }}>
          <InfoRow icon={<Users />} label="Group Name" value={groupLoan.group_name || loan.group_name} />
          <InfoRow icon={<User />} label="Group Leader" value={groupLoan.customer_name || loan.customer_name} />
          <InfoRow icon={<Phone />} label="Leader Contact" value={groupLoan.customer_phone || loan.customer_phone} />
          <InfoRow icon={<Calendar />} label="Start Date" value={fmtDate(groupLoan.request_date || loan.request_date)} />
          <InfoRow icon={<Clock />} label="Duration" value={`${groupLoan.loanterm || loan.loanterm} Months`} />
          <InfoRow icon={<Target />} label="Interest Rate" value={`${groupLoan.interestrateloan || 20}%`} />
          <InfoRow icon={<Hash />} label="Group ID" value={loan.id || loan.group_id} mono />
        </div>
      )}

      {/* Member payment modals */}
      {members.map((m) => {
        const mBalance = Math.max(0, parseFloat(m.totalpayable ?? parseFloat(m.loanamount)*1.2) - parseFloat(m.amountpaid ?? 0));
        return (
          <PaymentModal
            key={m.id}
            open={payingMemberId === m.id}
            onClose={() => setPayingMemberId(null)}
            maxAmount={mBalance}
            recipientLabel={`${m.customer_name || m.name} — individual share`}
            loading={false}
            onConfirm={(data) => { logRepayment(data, m.id); setPayingMemberId(null); }}
          />
        );
      })}
    </div>
  );
};

// ─── P2P View ─────────────────────────────────────────────────────────────────

const P2PView = ({ loan, onPayment }) => {
  const [tab, setTab] = useState('overview');
  const sent = parseFloat(loan.amount ?? loan.loanamount ?? 0);
  const paid = parseFloat(loan.amountpaid ?? 0);
  const balance = Math.max(0, sent - paid);
  const pct = sent > 0 ? Math.min(100, (paid / sent) * 100) : 0;

  return (
    <div>
      {/* P2P Header card */}
      <div style={{
        background: 'linear-gradient(135deg, #BA7517 0%, #8B5013 100%)',
        borderRadius: 16, padding: '20px', color: '#fff', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <CircleProgress pct={pct} size={80} stroke={6} color="rgba(255,255,255,.9)" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 900 }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .7, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>P2P Lending</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{GHS(sent)} sent</div>
          <div style={{ fontSize: 12, opacity: .75, marginTop: 2 }}>
            {GHS(paid)} recovered · {GHS(balance)} outstanding
          </div>
        </div>
        {balance > 0 && (
          <button onClick={onPayment} style={{
            padding: '10px 18px', background: 'rgba(255,255,255,.2)', color: '#fff',
            border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 12,
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            backdropFilter: 'blur(4px)',
          }}>
            Log Return
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Amount Sent" value={GHS(sent)} bg="#FAEEDA" accent="#BA7517" />
        <MetricCard label="Recovered" value={GHS(paid)} bg="#E1F5EE" accent="#0F6E56" />
        <MetricCard label="Outstanding" value={GHS(balance)} bg={balance > 0 ? "#FCEBEB" : "#E1F5EE"} accent={balance > 0 ? "#A32D2D" : "#0F6E56"} />
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E2E0EE', padding: '16px 18px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #F0EFF8', marginBottom: 14 }}>
          <Tab label="Details" active={tab==='overview'} onClick={()=>setTab('overview')} />
          <Tab label="Payments" active={tab==='payments'} onClick={()=>setTab('payments')} />
        </div>

        {tab === 'overview' && (
          <>
            <InfoRow icon={<User />} label="Recipient" value={loan.recipient_name || loan.customer_name} />
            <InfoRow icon={<Phone />} label="Phone" value={loan.recipient_phone || loan.customer_phone} />
            <InfoRow icon={<Send />} label="Reason" value={loan.reason || loan.purpose} />
            <InfoRow icon={<Users />} label="Relationship" value={loan.relationship} />
            <InfoRow icon={<Calendar />} label="Date Sent" value={fmtDate(loan.date_sent || loan.request_date)} />
            <InfoRow icon={<Hash />} label="Entry ID" value={loan.id} mono />
            {loan.notes && <InfoRow icon={<FileText />} label="Notes" value={loan.notes} />}
          </>
        )}

        {tab === 'payments' && (
          <div>
            {paid === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#b8b6cc', fontSize: 13 }}>
                No repayments logged yet
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#9896b0', fontSize: 12 }}>
                {GHS(paid)} logged across {Math.ceil(paid / 100)} transactions
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const LoanDetailModal = ({
  selectedLoan,
  setSelectedLoan,
  getGroupLoanWithMembers,
  logRepayment,
  updateP2PStatus,
}) => {
  const [groupData, setGroupData] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const loan = selectedLoan;
  const loanType = (loan?.loantype || '').toLowerCase();
  const isGroup = loanType === 'group';
  const isP2P = loanType === 'p2p';
  const isIndividual = !isGroup && !isP2P;
  const balance = Math.max(0, parseFloat(loan?.totalpayable ?? loan?.loanamount ?? 0) - parseFloat(loan?.amountpaid ?? 0));

  
  useEffect(() => {
    console.log(`isGroup ${isGroup}. Loan id: ${loan?.id} ${getGroupLoanWithMembers} ${logRepayment}`)
    if (isGroup && loan?.id && getGroupLoanWithMembers) {
      console.log(`isGroup j ${isGroup}`);
      setLoadingGroup(true);
      getGroupLoanWithMembers(loan.id).then((d) => {
        setGroupData(d);
        setLoadingGroup(false);
      });
    }
  }, [loan?.id, isGroup]);
  
  if (!loan) return null;

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePayment = async (data) => {
    console.log(`Handle payment: ${data}`)
    setPayLoading(true);
    try {
      console.log('log repayment')
      if (logRepayment) {
        console.log({ loanId: loan.id, amount_paid: data.amount_paid, payment_date: data.date, note: data.note })
        const ok = await logRepayment({ loanId: loan.id, amount_paid: data.amount_paid, payment_date: data.date, note: data.note });
        if (ok) showToast('Payment recorded successfully');
        else showToast('Payment failed', false);
      } else {
        showToast('Payment logged (demo mode)');
      }
    } catch {
      showToast('Something went wrong', false);
    }
    setPayLoading(false);
    setShowPayModal(false);
  };

  const handleGroupMemberPayment = async (memberId, data) => {
    setPayLoading(true);
    try {
      if (logRepayment) {
        const ok = await logRepayment({ loanId: memberId, amount_paid: data.amount, payment_date: data.date, note: data.note });
        if (ok) showToast(`Payment logged for member`);
        else showToast('Payment failed', false);
      } else {
        showToast('Member payment logged (demo)');
      }
    } catch {
      showToast('Something went wrong', false);
    }
    setPayLoading(false);
  };

  const handleStatusUpdate = async (status) => {
    if (updateP2PStatus) {
      const ok = await updateP2PStatus(loan.id, status);
      if (ok) showToast(`Status updated to ${status}`);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(10,5,30,.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedLoan(null); }}>

        <div style={{
          background: '#F8F7FF', borderRadius: 24, width: '100%',
          maxWidth: isGroup ? 820 : 680, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.1)',
        }}>

          {/* ── Header ── */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E2E0EE', padding: '20px 24px', borderRadius: '24px 24px 0 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: isGroup ? '#E1F5EE' : isP2P ? '#FAEEDA' : '#F5F9F8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isGroup ? '#0F6E56' : isP2P ? '#BA7517' : ACCENT,
                }}>
                  {isGroup ? <Users size={24}/> : isP2P ? <Send size={24}/> : <User size={24}/>}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1a1830', letterSpacing: '-.02em' }}>
                      {isGroup ? (loan.group_name || 'Group Loan') : (loan.customer_name || loan.recipient_name)}
                    </h2>
                    <Pill status={loan.status} />
                    <span style={{
                      background: isGroup ? '#E1F5EE' : isP2P ? '#FAEEDA' : '#EEEDFE',
                      color: isGroup ? '#085041' : isP2P ? '#633806' : '#3C3489',
                      fontSize: 10, fontWeight: 800, padding: '2px 8px',
                      borderRadius: 6, textTransform: 'uppercase', letterSpacing: '.08em',
                    }}>
                      {isGroup ? 'Group' : isP2P ? 'P2P' : 'Individual'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9896b0', marginTop: 3, fontFamily: 'monospace' }}>
                    #{loan.id} · {fmtDate(loan.request_date || loan.date_sent)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{
                  padding: '7px 14px', border: '1px solid #E2E0EE', borderRadius: 10,
                  background: '#fff', color: '#5a5878', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Download size={14}/> Export
                </button>
                <button style={{
                  padding: '7px 14px', border: '1px solid #E2E0EE', borderRadius: 10,
                  background: '#fff', color: '#5a5878', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Edit size={14}/> Edit
                </button>
                <button onClick={() => setSelectedLoan(null)} style={{
                  width: 36, height: 36, border: '1px solid #E2E0EE', borderRadius: 10,
                  background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9896b0',
                }}>
                  <X size={18}/>
                </button>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
            {isIndividual && (
              <IndividualView
                loan={loan}
                onPayment={() => setShowPayModal(true)}
              />
            )}
            {isGroup && (
              <GroupView
                loan={loan}
                groupData={groupData}
                loadingGroupData={loadingGroup}
                logRepayment={logRepayment}
              />
            )}
            {isP2P && (
              <P2PView
                loan={loan}
                onPayment={() => setShowPayModal(true)}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{
            background: '#fff', borderTop: '1px solid #E2E0EE',
            padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          }}>
            {!isGroup && balance > 0 && (
              <button onClick={() => setShowPayModal(true)} style={{
                padding: '10px 20px', background: ACCENT, color: '#fff', border: 'none',
                borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: `0 4px 14px ${ACCENT}50`,
              }}>
                <Receipt size={16}/> {isP2P ? 'Log Repayment' : 'Record Payment'}
              </button>
            )}

            {/* {isGroup && (
              <button onClick={() => setShowPayModal(true)} style={{
                padding: '10px 20px', background: '#0F6E56', color: '#fff', border: 'none',
                borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 14px #0F6E5650',
              }}>
                <Receipt size={16}/> Record Group Payment
              </button>
            )} */}

            {isP2P && (
              <>
                {loan.status !== 'ended' && (
                  <button onClick={() => handleStatusUpdate('ended')} style={{
                    padding: '10px 16px', border: '1px solid #F7C1C1', background: '#FCEBEB',
                    color: '#A32D2D', borderRadius: 12, fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Mark Ended
                  </button>
                )}
                {loan.status === 'ended' && (
                  <button onClick={() => handleStatusUpdate('active')} style={{
                    padding: '10px 16px', border: '1px solid #9FE1CB', background: '#E1F5EE',
                    color: '#0F6E56', borderRadius: 12, fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Reactivate
                  </button>
                )}
              </>
            )}

            <button style={{
              padding: '10px 16px', border: '1px solid #E2E0EE', background: '#fff',
              color: '#5a5878', borderRadius: 12, fontWeight: 600, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FileText size={14}/> Statement
            </button>

            <div style={{ marginLeft: 'auto', fontSize: 11, color: '#b8b6cc' }}>
              {loan.mobilebanker && `Banker: ${loan.mobilebanker}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment modal (individual / group total / P2P) ── */}
      <PaymentModal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        maxAmount={balance}
        recipientLabel={
          isGroup
            ? `${loan.group_name} — full group payment`
            : isP2P
            ? `${loan.recipient_name || loan.customer_name}`
            : `${loan.customer_name}`
        }
        loading={payLoading}
        onConfirm={handlePayment}
      />

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
          background: toast.ok ? '#1a1830' : '#A32D2D',
          color: '#fff', padding: '12px 18px', borderRadius: 14,
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'fadeIn .2s ease',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {toast.ok ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
        @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </>
  );
};

export default LoanDetailModal;
