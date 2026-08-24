import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY_NAME, fmt, fmtDateLong } from "../pages/dashboard/Components/AccountingModule";

const INK = [26, 46, 26];
const ACCENT = [45, 90, 61];
const GREEN = [5, 150, 105];
const RED = [220, 38, 38];
const GRAY = [75, 85, 99];

function letterhead(doc, reportName, periodLabel) {
  doc.setFillColor(...INK);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, 14, 15);
  doc.setFontSize(10); doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 220, 220);
  doc.text(reportName, 14, 22);
  doc.setFontSize(9);
  doc.text(periodLabel, 196, 15, { align: "right" });
  doc.text(`Generated ${fmtDateLong(new Date().toISOString())}`, 196, 22, { align: "right" });
  doc.setTextColor(0, 0, 0);
}

function pill(doc, label, value, x, y, color) {
  doc.setFontSize(8); doc.setTextColor(...GRAY);
  doc.text(label, x, y);
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
  doc.text(String(value), x, y + 6);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
}

function footer(doc) {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...GRAY);
    doc.text(`Page ${i} of ${pages}`, 196, 289, { align: "right" });
    doc.text(`${COMPANY_NAME} — Confidential`, 14, 289);
  }
}

const commonTableOpts = {
  theme: "plain",
  headStyles: { fillColor: INK, textColor: 255, fontStyle: "bold" },
  styles: { fontSize: 9, cellPadding: 3 },
};

export function exportTrialBalancePDF({ rows, summary, startDate, endDate }) {
  const doc = new jsPDF();
  const period = `${startDate ? fmtDateLong(startDate) : "All dates"} – ${endDate ? fmtDateLong(endDate) : "Present"}`;
  letterhead(doc, "Trial Balance", period);
  pill(doc, "TOTAL DEBITS", fmt(summary.total_debits), 14, 46, ACCENT);
  pill(doc, "TOTAL CREDITS", fmt(summary.total_credits), 80, 46, GREEN);
  pill(doc, "STATUS", summary.is_balanced ? "Balanced" : "Out of balance", 146, 46, summary.is_balanced ? GREEN : RED);

  const body = [];
  ["asset", "liability", "equity", "income", "expense"].forEach(type => {
    const typeRows = rows.filter(r => r.account_type === type);
    if (!typeRows.length) return;
    body.push([{ content: type.toUpperCase(), colSpan: 4, styles: { fillColor: [229, 236, 230], fontStyle: "bold", textColor: ACCENT } }]);
    typeRows.forEach(r => body.push([
      r.account_code, r.account_name,
      Number(r.total_debits) > 0 ? fmt(r.total_debits) : "—",
      Number(r.total_credits) > 0 ? fmt(r.total_credits) : "—",
    ]));
  });

  autoTable(doc, {
    ...commonTableOpts, startY: 58,
    head: [["Code", "Account", "Debits", "Credits"]],
    body,
    columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    foot: [["", "Grand Total", fmt(summary.total_debits), fmt(summary.total_credits)]],
    footStyles: { fillColor: INK, textColor: 255, fontStyle: "bold" },
  });

  footer(doc);
  doc.save(`Trial-Balance-${endDate || "all"}.pdf`);
}

export function exportProfitLossPDF({ income, expenses, summary, startDate, endDate }) {
  const doc = new jsPDF();
  letterhead(doc, "Statement of Profit & Loss", `${fmtDateLong(startDate)} – ${fmtDateLong(endDate)}`);
  pill(doc, "TOTAL INCOME", fmt(summary.totalIncome), 14, 46, GREEN);
  pill(doc, "TOTAL EXPENSES", fmt(summary.totalExpenses), 80, 46, RED);
  pill(doc, `NET ${summary.netProfit >= 0 ? "PROFIT" : "LOSS"}`, fmt(summary.netProfit), 146, 46, summary.netProfit >= 0 ? GREEN : RED);

  autoTable(doc, {
    ...commonTableOpts, startY: 58,
    head: [["Code", "Income Account", "Amount"]],
    body: income.map(r => [r.code, r.name, fmt(r.amount)]),
    columnStyles: { 2: { halign: "right" } },
    foot: [["", "Total Income", fmt(summary.totalIncome)]],
    footStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold" },
  });

  autoTable(doc, {
    ...commonTableOpts, startY: doc.lastAutoTable.finalY + 8,
    head: [["Code", "Expense Account", "Amount"]],
    body: expenses.map(r => [r.code, r.name, fmt(r.amount)]),
    columnStyles: { 2: { halign: "right" } },
    foot: [["", "Total Expenses", fmt(summary.totalExpenses)]],
    footStyles: { fillColor: RED, textColor: 255, fontStyle: "bold" },
  });

  const y = doc.lastAutoTable.finalY + 12;
  doc.setFillColor(...INK); doc.rect(14, y, 182, 12, "F");
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
  doc.text(`Net ${summary.netProfit >= 0 ? "Profit" : "Loss"} for the Period`, 18, y + 8);
  doc.text(fmt(summary.netProfit), 192, y + 8, { align: "right" });

  footer(doc);
  doc.save(`Profit-Loss-${startDate}-to-${endDate}.pdf`);
}

export function exportBalanceSheetPDF({ assets, liabilities, equity, summary, asOf }) {
  const doc = new jsPDF();
  letterhead(doc, "Balance Sheet", `As of ${fmtDateLong(asOf)}`);
  pill(doc, "ASSETS", fmt(summary.totalAssets), 14, 46, ACCENT);
  pill(doc, "LIABILITIES", fmt(summary.totalLiabilities), 65, 46, RED);
  pill(doc, "EQUITY", fmt(summary.totalEquity), 116, 46, [124, 58, 237]);
  pill(doc, "STATUS", summary.isBalanced ? "Balanced" : "Unbalanced", 167, 46, summary.isBalanced ? GREEN : RED);

  const section = (title, rows, color) => ({
    title, color,
    body: rows.map(r => [r.code, r.name, r.category?.replace(/_/g," ")||"", fmt(r.amount)]),
  });

  let y = 58;
  [section("Assets", assets, ACCENT), section("Liabilities", liabilities, RED), section("Equity", equity, [124,58,237])]
    .forEach(s => {
      autoTable(doc, {
        ...commonTableOpts, startY: y,
        head: [[{ content: s.title, colSpan: 4, styles: { fillColor: s.color, textColor: 255 } }], ["Code","Account","Category","Amount"]],
        body: s.body,
        columnStyles: { 3: { halign: "right" } },
      });
      y = doc.lastAutoTable.finalY + 8;
    });

  doc.setFillColor(...INK); doc.rect(14, y, 182, 14, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10);
  doc.text(summary.isBalanced ? "✓ Assets = Liabilities + Equity" : "✕ Statement does not balance", 18, y+9);
  doc.text(`${fmt(summary.totalAssets)} = ${fmt(summary.totalLiabilities + summary.totalEquity)}`, 192, y+9, { align:"right" });

  footer(doc);
  doc.save(`Balance-Sheet-${asOf}.pdf`);
}

export function exportCashFlowPDF({ operating, investing, financing, summary, startDate, endDate }) {
  const doc = new jsPDF();
  letterhead(doc, "Statement of Cash Flows", `${fmtDateLong(startDate)} – ${fmtDateLong(endDate)}`);
  pill(doc, "OPERATING", fmt(operating.total), 14, 46, ACCENT);
  pill(doc, "INVESTING", fmt(investing.total), 65, 46, GRAY);
  pill(doc, "FINANCING", fmt(financing.total), 116, 46, [124,58,237]);
  pill(doc, "NET CHANGE", fmt(summary.netCashFlow), 167, 46, summary.netCashFlow >= 0 ? GREEN : RED);

  let y = 58;
  const block = (title, rows, total, color) => {
    autoTable(doc, {
      ...commonTableOpts, startY: y,
      head: [[{ content: title, colSpan: 3, styles: { fillColor: color, textColor: 255 } }], ["Code","Item","Amount"]],
      body: rows.map(r => [r.code, r.name, fmt(r.amount)]),
      columnStyles: { 2: { halign: "right" } },
      foot: [["", `Net cash from ${title.toLowerCase()}`, fmt(total)]],
      footStyles: { fillColor: [229,236,230], textColor: [26,46,26], fontStyle: "bold" },
    });
    y = doc.lastAutoTable.finalY + 8;
  };

  block("Operating Activities", [
    { code:"—", name:"Net income", amount: operating.netIncome },
    { code:"—", name:"Add back: Depreciation", amount: operating.depreciation },
    ...(operating.adjustments||[]),
  ], operating.total, ACCENT);
  block("Investing Activities", investing.items, investing.total, GRAY);
  block("Financing Activities", financing.items, financing.total, [124,58,237]);

  doc.setFillColor(...INK); doc.rect(14, y, 182, 14, "F");
  doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(10);
  doc.text("Cash: Beginning → Ending", 18, y+9);
  doc.text(`${fmt(summary.cashBegin)} → ${fmt(summary.cashEnd)}`, 192, y+9, { align:"right" });

  footer(doc);
  doc.save(`Cash-Flow-${startDate}-to-${endDate}.pdf`);
}