import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  User,
  Send,
  Phone,
  Calendar,
  Hash,
  Briefcase,
  Percent,
  Clock,
  Banknote,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';
import { userPermissions } from '../../../constants/appConstants';

const LoanApprovalModal = ({
  loan,
  isOpen,
  onClose,
  approveLoan,
  rejectLoan,
  getGroupLoanWithMembers,
  loading,
}) => {
  const [groupData, setGroupData] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!loan || !isOpen) return null;

  const loanType = (loan?.loantype || '').toLowerCase();

  const isGroup = loanType === 'group';
  const isP2P = loanType === 'p2p';
  const isIndividual = !isGroup && !isP2P;

  useEffect(() => {
    if (isGroup && loan?.id && getGroupLoanWithMembers) {
      fetchGroupData();
    }
  }, [loan?.id]);

  const fetchGroupData = async () => {
    setLoadingGroup(true);

    const res = await getGroupLoanWithMembers(loan.id);

    if (res) setGroupData(res);

    setLoadingGroup(false);
  };

  const handleApprove = async () => {
    setActionLoading(true);

    await approveLoan({ loanId: loan.id });

    setActionLoading(false);

    onClose();
  };

  const handleReject = async () => {
    setActionLoading(true);

    await rejectLoan({ loanId: loan.id });

    setActionLoading(false);

    onClose();
  };

  const DetailCard = ({ icon, label, value }) => (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
      <div className="flex items-center gap-1 text-gray-400 mb-1">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="text-sm font-black text-slate-900 break-words">
        {value || '—'}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[#FCFAF8] w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* HEADER */}
        <div className="bg-white px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center
                ${
                  isGroup
                    ? 'bg-emerald-50 text-emerald-700'
                    : isP2P
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-violet-50 text-violet-700'
                }`}
            >
              {isGroup ? (
                <Users size={28} />
              ) : isP2P ? (
                <Send size={28} />
              ) : (
                <User size={28} />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">
                  {isGroup
                    ? loan.group_name
                    : isP2P
                    ? loan.recipient_name || loan.customer_name
                    : loan.customer_name}
                </h2>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border
                    ${
                      isGroup
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isP2P
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200'
                    }`}
                >
                  {isGroup
                    ? 'GROUP LOAN'
                    : isP2P
                    ? 'P2P LOAN'
                    : 'INDIVIDUAL LOAN'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Review application before approval or rejection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TOP STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <DetailCard
              icon={<Banknote size={14} />}
              label="Loan Amount"
              value={`₵${Number(
                loan.loanamount || 0
              ).toLocaleString()}`}
            />

            <DetailCard
              icon={<Clock size={14} />}
              label="Duration"
              value={`${loan.loanterm} Months`}
            />

            <DetailCard
              icon={<Percent size={14} />}
              label="Interest"
              value={`${loan.interestrateloan}%`}
            />

            <DetailCard
              icon={
                isGroup ? (
                  <Users size={14} />
                ) : (
                  <User size={14} />
                )
              }
              label={isGroup ? 'Members' : 'Applicant'}
              value={
                isGroup
                  ? `${loan.member_count || 0} Members`
                  : loan.customer_name
              }
            />
          </div>

          {/* MAIN DETAILS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* LEFT */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5">
              <h3 className="text-sm font-black text-slate-800 mb-5">
                Loan Information
              </h3>

              <div className="space-y-4">
                <InfoRow
                  icon={<Hash size={14} />}
                  label="Loan ID"
                  value={loan.id}
                />

                <InfoRow
                  icon={<User size={14} />}
                  label={
                    isGroup
                      ? 'Group Leader'
                      : isP2P
                      ? 'Sender'
                      : 'Borrower'
                  }
                  value={loan.customer_name}
                />

                <InfoRow
                  icon={<Phone size={14} />}
                  label="Phone Number"
                  value={loan.customer_phone}
                />

                <InfoRow
                  icon={<Briefcase size={14} />}
                  label="Purpose"
                  value={loan.purpose}
                />

                <InfoRow
                  icon={<Calendar size={14} />}
                  label="Application Date"
                  value={
                    loan.created_at
                      ? new Date(
                          loan.created_at
                        ).toLocaleDateString('en-GH', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'
                  }
                />

                <InfoRow
                  icon={<Info size={14} />}
                  label="Status"
                  value={loan.status}
                  status
                />
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5">
              {isGroup ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-black text-slate-800">
                      Group Members
                    </h3>

                    <span className="text-xs bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-500">
                      {groupData?.members?.length || 0} Members
                    </span>
                  </div>

                  {loadingGroup ? (
                    <div className="flex justify-center py-20">
                      <Loader2
                        size={28}
                        className="animate-spin text-[#4A635D]"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {groupData?.members?.map((member, idx) => (
                        <div
                          key={member.id}
                          className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#F5F5DC]/40 border border-[#F5F5DC] flex items-center justify-center text-[#4A635D] font-black">
                              {idx + 1}
                            </div>

                            <div>
                              <p className="font-bold text-slate-800">
                                {member.customer_name}
                              </p>

                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Phone size={10} />

                                {member.customer_phone}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-gray-400">
                              Share Amount
                            </p>

                            <p className="font-black text-slate-900">
                              ₵
                              {Number(
                                member.loanamount || 0
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-sm font-black text-slate-800 mb-5">
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    {isP2P && (
                      <>
                        <InfoRow
                          icon={<User size={14} />}
                          label="Recipient"
                          value={
                            loan.recipient_name ||
                            loan.customer_name
                          }
                        />

                        <InfoRow
                          icon={<Phone size={14} />}
                          label="Recipient Phone"
                          value={
                            loan.recipient_phone ||
                            loan.customer_phone
                          }
                        />
                      </>
                    )}

                    <InfoRow
                      icon={<Calendar size={14} />}
                      label="Repayment Period"
                      value={`${loan.loanterm} Months`}
                    />

                    <InfoRow
                      icon={<Percent size={14} />}
                      label="Interest Rate"
                      value={`${loan.interestrateloan}%`}
                    />

                    <InfoRow
                      icon={<Banknote size={14} />}
                      label="Monthly Payment"
                      value={`₵${Number(
                        loan.monthlypayment || 0
                      ).toLocaleString()}`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-white border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          {
            userPermissions.APPROVE_LOANS && (
            <>
                 <button
            onClick={handleReject}
            disabled={actionLoading}
            className="px-6 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <XCircle size={16} />
            )}

            Reject Loan
          </button>

          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="px-6 py-3 rounded-2xl bg-[#4A635D] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#3b514c] transition-all disabled:opacity-50 shadow-lg shadow-[#4A635D]/20"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}

            Approve Loan
          </button>   
            </>
            )
          }
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value, status }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-2 bg-gray-50 rounded-xl text-gray-400">
      {icon}
    </div>

    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
        {label}
      </p>

      <p
        className={`text-sm font-bold ${
          status
            ? 'capitalize text-amber-600'
            : 'text-slate-800'
        }`}
      >
        {value || '—'}
      </p>
    </div>
  </div>
);

export default LoanApprovalModal;