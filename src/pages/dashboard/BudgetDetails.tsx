import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { companyId, formatDate } from "../../constants/appConstants";
import { Budget } from "../../data/mockData";
import { useFloatActivity } from "../../contexts/dashboard/FloatActivity";
import BuyCashModal from "./Components/buyCashModal";
import SellCashModal from "./Components/sellCashModal";
import { useFinance } from "../../contexts/dashboard/Finance";

const BudgetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const [budget, setBudget] = useState<Budget | null>(state?.budget || null);

  const [isBuyCashOpen, setIsBuyCashOpen] = useState(false);
  const [isSellCashOpen, setIsSellCashOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const { addBudget, reduceBudget } = useFinance();
  const { activities, loading: activitiesLoading, fetchFloatActivity } = useFloatActivity();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "withdrawal" | "expense">("all");

  const isClosed = budget?.status === "Closed";

  // Fetch budget & activity
  useEffect(() => {
    if (id) {
      fetchBudget(id);
      fetchFloatActivity(id);
    }
  }, [id]);

  const fetchBudget = async (budgetId: string) => {
    try {
      const res = await fetch(`https://susu-pro-backend.onrender.com/api/budgets/${budgetId}`);
      const data = await res.json();
      if (res.ok) setBudget(data.data);
    } catch (e) {
      console.error("Error fetching budget:", e);
    }
  };

  const handleBuyCash = async (amount: number) => {
    if (isClosed) return; // Prevent if float closed
    setLoading(true);
    try {
      await addBudget(companyId, { date: budget?.date, allocated: amount } as Budget);
      if (id) {
        await fetchBudget(id);
        await fetchFloatActivity(id);
      }
      setIsBuyCashOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReduceCash = async (amount: number) => {
    if (isClosed) return; // Prevent if float closed
    setLoading(true);
    try {
      await reduceBudget(companyId, { date: budget?.date, allocated: amount });
      if (id) {
        await fetchBudget(id);
        await fetchFloatActivity(id);
      }
      setIsSellCashOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = activities.filter((item) => {
    const text =
      item.customer_name ||
      item.recorded_staff_name ||
      item.expense_staff_name ||
      item.mobile_banker_name ||
      item.withdrawal_staff_name ||
      item.expense_description ||
      "";
    const matchesSearch = text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || item.source_type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    if (type === "withdrawal") return "bg-red-100 text-red-700";
    if (type === "expense") return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-600";
  };

  const getRemainingColor = (remaining: number) => {
    if (remaining > 5000) return "text-green-600 font-semibold";
    if (remaining > 1000) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER + ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-3 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-800">Float Activity</h1>
        <div className="space-x-2">
          <button
            onClick={() => setIsBuyCashOpen(true)}
            disabled={isClosed || isLoading}
            className={`px-4 py-2 rounded-lg text-white ${
              isClosed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Buy Cash
          </button>
          <BuyCashModal
            isOpen={isBuyCashOpen}
            onClose={() => setIsBuyCashOpen(false)}
            onSubmit={handleBuyCash}
            loading={isLoading}
          />

          <button
            onClick={() => setIsSellCashOpen(true)}
            disabled={isClosed || isLoading}
            className={`px-4 py-2 rounded-lg text-white ${
              isClosed
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Sell Cash
          </button>
          <SellCashModal
            isOpen={isSellCashOpen}
            onClose={() => setIsSellCashOpen(false)}
            onSubmit={handleReduceCash}
            loading={isLoading}
          />
        </div>
      </div>

      {/* FLOAT STATUS BANNER */}
      {isClosed && (
        <div className="bg-gray-100 border-l-4 border-gray-400 text-gray-800 px-4 py-2 mb-6">
          This float is currently <strong>Closed</strong>. All actions are disabled.
        </div>
      )}

      {/* FLOAT SUMMARY */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-gray-500 text-sm">Date Allocated</p>
            <p className="font-semibold">{formatDate(budget?.date)}</p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Total Allocated</p>
            <p className="text-emerald-600 font-semibold">
              ₵{budget?.allocated.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Used Amount</p>
            <p className="text-blue-600 font-semibold">
              ₵{budget?.spent.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500 text-sm">Float Balance</p>
            <p className={getRemainingColor(Number(budget?.allocated - budget?.spent))}>
              ₵{(budget?.allocated - budget?.spent).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by customer, staff, description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="w-full md:w-1/5 px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="expense">Expenses</option>
        </select>
      </div>

      {/* FLOAT ACTIVITIES TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-700 text-xs uppercase">
            <tr>
              <th className="p-4">Staff</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {activitiesLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  Loading float activity...
                </td>
              </tr>
            ) : filteredActivities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No activity found.
                </td>
              </tr>
            ) : (
              filteredActivities.map((item) => (
                <tr
                  key={item.movement_id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4">{item.recorded_staff_name || item.expense_staff_name || "—"}</td>
                  <td className="p-4 font-semibold">₵{Number(item.amount).toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(item.source_type)}`}>
                      {item.source_type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{item.expense_description || "—"}</td>
                  <td className="p-4">{item.customer_name || "—"}</td>
                  <td className="p-4">{item.transaction_status || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetDetails;
