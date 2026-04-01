import React, { useEffect, useState } from 'react';
import { 
  X, Users, Calendar, Hash, Info, 
  ArrowDownCircle, User, Phone, CheckCircle2 
} from 'lucide-react';
import { useLoanApplications, useLoans } from '../../../contexts/dashboard/Loan';

const GroupLoanBreakdownModal = ({ groupId, isOpen, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getGroupLoanWithMembers } = useLoans()

  useEffect(() => {
    if (isOpen && groupId) {
      fetchData();
    }
  }, [isOpen, groupId]);

  const fetchData = async () => {
    setLoading(true);
    // Assuming getGroupLoanWithMembers is imported from your api service
    const result = await getGroupLoanWithMembers(groupId);
    if (result) setData(result);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-[#FCFAF8] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-[#4A635D]" />
              Loan Breakdown
            </h2>
            <p className="text-sm text-gray-500 mt-1">Reviewing group distribution and member standing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          
          {/* Sidebar: Group Summary */}
          <aside className="w-full lg:w-80 bg-white p-6 border-r border-gray-50 overflow-y-auto">
            <h4 className="text-[10px] font-bold text-[#4A635D] uppercase tracking-[0.2em] mb-4">Group Overview</h4>
            
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#F5F5DC]/30 rounded-2xl border border-[#F5F5DC]">
                  <p className="text-xs text-gray-500 mb-1">Total Loan Amount</p>
                  <p className="text-2xl font-black text-slate-900">₵{data?.group_loan.loanamount.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <DetailItem icon={<Hash size={14}/>} label="Group Name" value={data?.group_loan.group_name} />
                  <DetailItem icon={<User size={14}/>} label="Leader" value={data?.group_loan.customer_name} />
                  <DetailItem icon={<Phone size={14}/>} label="Leader Contact" value={data?.group_loan.customer_phone} />
                  <DetailItem icon={<Calendar size={14}/>} label="Start Date" value={new Date(data?.group_loan.request_date).toLocaleDateString()} />
                  <DetailItem icon={<Info size={14}/>} label="Duration" value={`${data?.group_loan.loanterm} Months`} />
                  <DetailItem icon={<CheckCircle2 size={14}/>} label="Status" value={data?.group_loan.status} isStatus />
                </div>
              </div>
            )}
          </aside>

          {/* Main Content: Member List */}
          <main className="flex-1 p-6 overflow-y-auto bg-[#FCFAF8]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-700">Individual Member Shares</h4>
              <span className="text-xs bg-white px-3 py-1 rounded-full border text-gray-500 font-medium">
                {data?.members.length || 0} Members Total
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/50 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.members.map((member, idx) => (
                  <div key={member.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-[#4A635D]/30 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#4A635D] font-bold border border-gray-100">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.customer_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {member.customer_phone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Share Amount</p>
                      <p className="font-bold text-slate-900 text-lg">₵{member.loanamount.toLocaleString()}</p>
                      <p className="text-[10px] text-[#4A635D] font-medium">
                        Monthly: ₵{member.monthlypayment.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#4A635D] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#4A635D]/20 hover:scale-[1.02] transition-transform"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Component for UI consistency
const DetailItem = ({ icon, label, value, isStatus }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 p-1.5 bg-gray-50 rounded-lg text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className={`text-sm font-semibold ${isStatus ? 'text-amber-600 capitalize' : 'text-slate-700'}`}>
        {value || 'N/A'}
      </p>
    </div>
  </div>
);

export default GroupLoanBreakdownModal;