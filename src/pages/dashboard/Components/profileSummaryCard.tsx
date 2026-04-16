export const SummaryCard = ({ label, value, color }) => {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <div className={`p-3 rounded-xl border ${styles[color]}`}>
      <p className="text-[11px] font-medium">{label}</p>
      <h2 className="text-sm font-semibold mt-1">
        GHS {value?.toLocaleString()}
      </h2>
    </div>
  );
};

export const Stat = ({ label, value, color }) => {
  const styles = {
    green: "text-emerald-600",
    red: "text-red-500",
    default: "text-gray-700",
  };

  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${styles[color] || styles.default}`}>
        GHS {value?.toLocaleString()}
      </p>
    </div>
  );
};