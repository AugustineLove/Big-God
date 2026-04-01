// import React from 'react';
// import { 
//   X, User, Phone, Mail, Users, Target, Calendar, 
//   TrendingUp, CreditCard, Receipt, Calculator, 
//   Download, Edit, CheckCircle2, ChevronRight, Briefcase
// } from 'lucide-react';

// const LoanDetailModal = ({ selectedLoan, setSelectedLoan, setShowRepaymentModal }) => {
//   if (!selectedLoan) return null;

//   const isGroupLoan = selectedLoan.loantype === 'group';
//   const paid = parseFloat(selectedLoan.amountpaid ?? "0");
//   const total = parseFloat(selectedLoan.totalpayable ?? "0");
//   const progress = total > 0 ? (paid / total) * 100 : 0;

//   return (
//     <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
//       <div className="bg-[#FCFAF8] rounded-[2rem] max-w-5xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
//         {/* TOP BANNER / HEADER */}
//         <div className="relative bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
//           <div className="flex items-center gap-5">
//             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
//               isGroupLoan ? 'bg-purple-50 text-purple-600' : 'bg-[#F5F5DC] text-[#4A635D]'
//             }`}>
//               {isGroupLoan ? <Users size={28} /> : <User size={28} />}
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <h2 className="text-xl font-black text-slate-800 tracking-tight">
//                   {isGroupLoan ? selectedLoan.group_name : selectedLoan.customer_name}
//                 </h2>
//                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
//                   selectedLoan.status === 'active' 
//                     ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
//                     : 'bg-amber-50 text-amber-700 border-amber-100'
//                 }`}>
//                   {selectedLoan.status}
//                 </span>
//               </div>
//               <p className="text-xs font-mono text-gray-400 mt-1">
//                 REF: {selectedLoan.id} • {selectedLoan.loantype.toUpperCase()}
//               </p>
//             </div>
//           </div>
          
//           <button 
//             onClick={() => setSelectedLoan(null)}
//             className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-slate-800"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
//           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
//             {/* LEFT COLUMN: PRIMARY STATS (Progress & Financials) */}
//             <div className="lg:col-span-7 space-y-6">
              
//               {/* Repayment Progress Card */}
//               <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
//                 <div className="flex justify-between items-end mb-4">
//                   <div>
//                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Repayment Standing</p>
//                     <h3 className="text-3xl font-black text-slate-900">₵{paid.toLocaleString()}</h3>
//                     <p className="text-xs text-gray-500 mt-1">out of ₵{total.toLocaleString()} total payable</p>
//                   </div>
//                   <div className="text-right">
//                     <p className="text-2xl font-bold text-[#4A635D]">{progress.toFixed(1)}%</p>
//                     <p className="text-[10px] font-bold text-gray-400 uppercase">Complete</p>
//                   </div>
//                 </div>
//                 <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
//                   <div 
//                     className="bg-[#4A635D] h-full rounded-full shadow-[0_0_12px_rgba(74,99,93,0.3)] transition-all duration-700" 
//                     style={{ width: `${progress}%` }}
//                   />
//                 </div>
//               </div>

//               {/* Financial Breakdown Grid */}
//               <div className="grid grid-cols-2 gap-4">
//                 <StatBox label="Principal" value={`₵${(selectedLoan.disbursedamount ?? 0).toLocaleString()}`} icon={<TrendingUp size={16}/>} />
//                 <StatBox label="Monthly Due" value={`₵${(selectedLoan.monthlypayment ?? 0).toLocaleString()}`} icon={<CreditCard size={16}/>} color="bg-blue-50 text-blue-600" />
//                 <StatBox label="Interest Rate" value={`${selectedLoan.interestrateloan}%`} icon={<Target size={16}/>} />
//                 <StatBox label="Loan Tenure" value={`${selectedLoan.loanterm} Months`} icon={<Calendar size={16}/>} />
//               </div>

//               {/* Payment History (Dynamic) */}
//               <div className="bg-white border border-gray-100 rounded-3xl p-6">
//                 <div className="flex justify-between items-center mb-4">
//                   <h4 className="font-bold text-slate-800">Recent Transactions</h4>
//                   <button className="text-xs text-[#4A635D] font-bold hover:underline">View All</button>
//                 </div>
//                 <div className="space-y-3">
//                    {/* This would map over an actual transactions array if available */}
//                    <TransactionItem date="Sep 15, 2024" amount={selectedLoan.monthlypayment} />
//                    <TransactionItem date="Aug 15, 2024" amount={selectedLoan.monthlypayment} />
//                 </div>
//               </div>
//             </div>

//             {/* RIGHT COLUMN: ENTITY INFO (Customer/Group Details) */}
//             <div className="lg:col-span-5 space-y-6">
              
//               {/* Profile/Group Section */}
//               <div className="bg-white border border-gray-100 rounded-3xl p-6">
//                 <h4 className="text-[10px] font-bold text-[#4A635D] uppercase tracking-[0.2em] mb-4">
//                   {isGroupLoan ? 'Group Details' : 'Customer Profile'}
//                 </h4>
                
//                 <div className="space-y-4">
//                   <InfoRow icon={<User />} label="Primary Holder" value={selectedLoan.customer_name} />
//                   <InfoRow icon={<Phone />} label="Phone Number" value={selectedLoan.customer_phone} />
//                   <InfoRow icon={<Mail />} label="Email Address" value={selectedLoan.email || 'N/A'} />
//                   <InfoRow icon={<Briefcase />} label="Purpose" value={selectedLoan.purpose} />
                  
//                   {isGroupLoan && (
//                     <div className="pt-4 border-t border-gray-50 mt-4">
//                        <div className="flex justify-between items-center bg-[#F5F5DC]/40 p-3 rounded-xl border border-[#F5F5DC]">
//                           <div className="flex items-center gap-2">
//                              <Users size={16} className="text-[#4A635D]" />
//                              <span className="text-xs font-bold text-slate-700">Group Members</span>
//                           </div>
//                           <span className="text-xs font-black text-[#4A635D]">{selectedLoan.member_count || '8'} Active</span>
//                        </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Staff/Admin Context */}
//               <div className="bg-[#4A635D] rounded-3xl p-6 text-white shadow-xl shadow-[#4A635D]/20">
//                 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-3">Management</p>
//                 <div className="space-y-3">
//                    <div className="flex justify-between text-sm">
//                       <span className="opacity-70">Assigned Banker</span>
//                       <span className="font-bold">{selectedLoan.mobilebanker || 'Not Assigned'}</span>
//                    </div>
//                    <div className="flex justify-between text-sm">
//                       <span className="opacity-70">Next Due Date</span>
//                       <span className="font-bold text-amber-300 underline underline-offset-4">
//                         {selectedLoan.nextPaymentDate || 'Pending'}
//                       </span>
//                    </div>
//                 </div>
//               </div>

//             </div>
//           </div>
//         </div>

//         {/* FOOTER ACTIONS */}
//         <div className="px-8 py-5 bg-white border-t border-gray-100 flex flex-wrap gap-3">
//           {selectedLoan.status === 'active' && (
//             <button 
//               onClick={() => setShowRepaymentModal(true)}
//               className="px-6 py-2.5 bg-[#4A635D] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#3d524d] transition-all shadow-lg shadow-[#4A635D]/20"
//             >
//               <Receipt size={18} /> Record Payment
//             </button>
//           )}
//           <button className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
//             <Download size={18} /> Statement
//           </button>
//           <button className="px-5 py-2.5 bg-white border border-gray-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
//             <Edit size={18} /> Edit
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* --- HELPER SUB-COMPONENTS --- */

// const StatBox = ({ label, value, icon, color = "bg-gray-50 text-gray-500" }) => (
//   <div className="bg-white border border-gray-50 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
//     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
//       {icon}
//     </div>
//     <div>
//       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
//       <p className="text-lg font-bold text-slate-800 leading-tight">{value}</p>
//     </div>
//   </div>
// );

// const InfoRow = ({ icon, label, value }) => (
//   <div className="flex items-start gap-3 group">
//     <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-[#4A635D] transition-colors">
//       {React.cloneElement(icon, { size: 16 })}
//     </div>
//     <div>
//       <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{label}</p>
//       <p className="text-sm font-semibold text-slate-700">{value || '---'}</p>
//     </div>
//   </div>
// );

// const TransactionItem = ({ date, amount }) => (
//   <div className="flex items-center justify-between p-3 bg-[#FCFAF8] rounded-xl border border-gray-50 hover:border-[#F5F5DC] transition-all">
//     <div className="flex items-center gap-3">
//       <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
//         <CheckCircle2 size={16} />
//       </div>
//       <div>
//         <p className="text-xs font-bold text-slate-800">Repayment Received</p>
//         <p className="text-[10px] text-gray-400">{date}</p>
//       </div>
//     </div>
//     <p className="text-sm font-black text-emerald-600">₵{(amount ?? 0).toLocaleString()}</p>
//   </div>
// );

// export default LoanDetailModal;