import { useLocation } from "react-router-dom";
import { formatDate } from "../../constants/appConstants";
import { useTransactions } from "../../contexts/dashboard/Transactions";
import { useMemo } from "react";
import { useCommissionStats } from "../../contexts/dashboard/Commissions";

export const CommissionDay = () => {
  const { state } = useLocation();
  const { transactions, totals, approveTransaction, refreshTransactions, rejectTransaction } = useTransactions();
  const { commissions } = useCommissionStats();
  const date = state?.date;  

  const approvedCommissions = useMemo(() => {
  if (!date) return [];

  return commissions
    .filter(t => {
      if (t.status === "reversed") return false;
      if (!t.commission_date) return false;

      const txDate = new Date(t.commission_date)
        .toISOString()
        .split("T")[0];

      return txDate === date;
    })
    .sort(
      (a, b) =>
        new Date(b.commission_date) - new Date(a.commission_date)
    );
}, [transactions, date]);

  if (!commissions) return <p>No data available</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        Commissions for {formatDate(state?.date)}
      </h2>
      <h2>
        Total Commissions: ₵{commissions.reduce((sum, c) => sum + Number(c.commission_amount), 0).toLocaleString() || "0"}
      </h2>

      {commissions.map((c) => {
  const isReversed = c.commission_status === "reversed";

  return (
    <div
      key={c.commission_id}
      className={`rounded-xl border p-4 space-y-3 transition
        ${isReversed ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}
      `}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold">
            ₵{Number(c.commission_amount).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">
            Commission on ₵{Number(c.transaction_amount).toLocaleString()}
          </p>
        </div>

        <span
          className={`text-xs px-2 py-1 rounded-full font-medium
            ${
              isReversed
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }
          `}
        >
          {c.commission_status.toUpperCase()}
        </span>
      </div>

      {/* Customer */}
      <div className="text-sm">
        <p className="font-medium">{c.customer_name || "Unknown Customer"}</p>
        {c.customer_phone && (
          <p className="text-gray-500">{c.customer_phone}</p>
        )}
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
        <div>
          <p className="uppercase tracking-wide">Created By</p>
          <p className="text-gray-700 font-medium">
            {c.staff_name || "System"}
          </p>
        </div>

        <div>
          <p className="uppercase tracking-wide">Date</p>
          <p className="text-gray-700 font-medium">
            {new Date(c.commission_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-400 border-t pt-2">
        <p>TX ID: {c.transaction_id.slice(0, 8)}...</p>

        {isReversed && (
          <p className="text-red-500 font-medium">Reversed</p>
        )}
      </div>
    </div>
  );
})}

    </div>
  );
};
