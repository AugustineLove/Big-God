import * as XLSX from "xlsx";
import { Contribution, Transaction } from "../data/mockData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { TransactionType } from "../contexts/dashboard/Transactions";
import { formatDate, parentCompanyName } from "../constants/appConstants";

export const handleCsvExport = (filteredContributions: TransactionType[] ) => {
  // 1. Prepare table data
  const data = filteredContributions.map((item) => ({
    "Customer Name": item.customer_name,
    "Contribution Type": item.type,
    "Amount": item.amount,
    "Date": item.transaction_date,
  }));

  // 2. Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 3. Add header info (company, staff, etc.)
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [
      ["MY COMPANY NAME"],
      ["Address: Accra, Ghana"],
      ["Staff: Admin"],
      ["Generated on:", new Date().toLocaleDateString()],
      [],
    ],
    { origin: "A1" }
  );

  // 4. Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contributions");

  // 5. Download
  XLSX.writeFile(workbook, "Filtered_Contributions.xlsx");
};

export const handlePdfExport = (
  filteredContributions: TransactionType[],
  dateRange?: { from: string; to: string }
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const mobileBankerName = filteredContributions[0]?.recorded_staff_name || 
                           filteredContributions[0]?.mobile_banker_name || 
                           "Unknown Mobile Banker";
                           // Calculate totals
  const totalDeposits = filteredContributions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => Number(sum) + Number(t.amount), 0);
  
  const totalWithdrawals = filteredContributions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => Number(sum) + Number(t.amount), 0);
  
  const totalCommissions = filteredContributions
    .filter(t => t.type === 'commission')
    .reduce((sum, t) => Number(sum) + Number(t.amount), 0);
  
  const netAmount = totalDeposits - totalWithdrawals - totalCommissions;

  // ===== HEADER SECTION =====
  doc.setFillColor(41, 128, 185); // Professional blue
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(parentCompanyName, pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("CONTRIBUTIONS RETURN FORM", pageWidth / 2, 24, { align: 'center' });

  // ===== FORM INFO SECTION =====
  doc.setTextColor(0, 0, 0);
  let yPos = 45;

  // Left column - Mobile Banker Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("MOBILE BANKER:", 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(mobileBankerName.toUpperCase(), 50, yPos);

  // Right column - Form Number
  doc.setFont('helvetica', 'bold');
  doc.text("FORM NO:", pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  const formNumber = `RET-${Date.now().toString().slice(-8)}`;
  doc.text(formNumber, pageWidth - 35, yPos);

  yPos += 7;

  // Date range
  doc.setFont('helvetica', 'bold');
  doc.text("PERIOD:", 14, yPos);
  doc.setFont('helvetica', 'normal');
  const periodText = dateRange 
    ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`
    : "All Transactions";
  doc.text(periodText, 50, yPos);

  // Generated date
  doc.setFont('helvetica', 'bold');
  doc.text("DATE:", pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(), pageWidth - 35, yPos);

  yPos += 7;

  // Total transactions
  doc.setFont('helvetica', 'bold');
  doc.text("TOTAL TRANSACTIONS:", 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(filteredContributions.length.toString(), 50, yPos);

  // Recorded by
  doc.setFont('helvetica', 'bold');
  doc.text("PREPARED BY:", pageWidth - 60, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(filteredContributions[0]?.recorded_staff_name || "System", pageWidth - 35, yPos);

  yPos += 10;

  // ===== TRANSACTIONS TABLE =====
  autoTable(doc, {
    startY: yPos,
    head: [[
      "DATE",
      "CUSTOMER NAME",
      "ACCOUNT NO.",
      "TYPE",
      "DEPOSITS",
      "WITHDRAWALS",
      "COMMISSION"
    ]],
    body: filteredContributions.map(item => [
      new Date(item.transaction_date).toLocaleDateString('en-GB'),
      item.customer_name,
      item.account_number,
      item.type,
      item.type === 'deposit' ? `GHS ${Number(item.amount).toFixed(2)}` : '-',
      item.type === 'withdrawal' ? `GHS ${Number(item.amount).toFixed(2)}` : '-',
      item.type === 'commission' ? `GHS ${Number(item.amount).toFixed(2)}` : '-',
    ]),
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: (data) => {
      // Footer on each page
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // ===== SUMMARY SECTION =====
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Summary box
  doc.setDrawColor(52, 73, 94);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 85, finalY, 71, 40);

  // Summary header
  doc.setFillColor(52, 73, 94);
  doc.rect(pageWidth - 85, finalY, 71, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("SUMMARY", pageWidth - 50, finalY + 5.5, { align: 'center' });

  // Summary details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  let summaryY = finalY + 14;

  doc.setFont('helvetica', 'normal');
  doc.text("Total Deposits:", pageWidth - 82, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.text(`GHS ${Number(totalDeposits).toFixed(2)}`, pageWidth - 18, summaryY, { align: 'right' });

  summaryY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text("Total Withdrawals:", pageWidth - 82, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.text(`GHS ${Number(totalWithdrawals).toFixed(2)}`, pageWidth - 18, summaryY, { align: 'right' });

  summaryY += 6;
  doc.setFont('helvetica', 'normal');
  doc.text("Total Commissions:", pageWidth - 82, summaryY);
  doc.setFont('helvetica', 'bold');
  doc.text(`GHS ${Number(totalCommissions).toFixed(2)}`, pageWidth - 18, summaryY, { align: 'right' });

  // Net amount line
  summaryY += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 83, summaryY, pageWidth - 16, summaryY);

  summaryY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text("NET AMOUNT:", pageWidth - 82, summaryY);
  doc.setTextColor(41, 128, 185);
  doc.text(`GHS ${netAmount.toFixed(2)}`, pageWidth - 18, summaryY, { align: 'right' });

  // ===== SIGNATURE SECTION =====
  const sigY = finalY + 55;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Mobile Banker signature
  doc.line(14, sigY, 70, sigY);
  doc.text("Mobile Banker Signature", 14, sigY + 5);
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(mobileBankerName, 14, sigY + 9);

  // Supervisor signature
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.line(pageWidth - 70, sigY, pageWidth - 14, sigY);
  doc.text("Supervisor Signature", pageWidth - 70, sigY + 5);
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 70, sigY + 9);

  // Save with meaningful filename
  const fileName = `Return_Form_${mobileBankerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

interface DailyCollectionExport {
  transaction_id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  transaction_date: string;
  payment_method: string;
  unique_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  account_number: string;
  recorded_staff_name: string;
  mobile_banker_name: string;
}

interface DailyCollectionExportSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  byPaymentMethod: Record<
    string,
    {
      count: number;
      total: number;
    }
  >;
}

export const handleDailyCollectionPdfExport = (
  collections: DailyCollectionExport[],
  summary: DailyCollectionExportSummary | null,
  selectedDate: string,
  staffName?: string
) => {
  if (!collections || collections.length === 0) {
    return;
  }

  // ============================================================
  // PDF SETUP
  // ============================================================

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ============================================================
  // THEME COLORS
  // Matching DailyCollectionReport
  // ============================================================

  const forest: [number, number, number] = [47, 74, 50];
  const forestDeep: [number, number, number] = [36, 59, 39];
  const brass: [number, number, number] = [173, 127, 58];

  const ink: [number, number, number] = [38, 42, 39];
  const inkSoft: [number, number, number] = [100, 105, 100];
  const inkFaint: [number, number, number] = [145, 148, 145];

  const paper: [number, number, number] = [248, 247, 243];
  const line: [number, number, number] = [225, 223, 216];
  const white: [number, number, number] = [255, 255, 255];

  // ============================================================
  // HELPERS
  // ============================================================

  const formatMoney = (amount: number) => {
    return `GHS ${Number(amount || 0).toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    // Handle YYYY-MM-DD safely without timezone shifting
    const parts = date.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    const d = new Date(date);

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    const d = new Date(date);

    return d.toLocaleTimeString("en-GH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      mobile_money: "Mobile Money",
      momo: "MoMo",
      bank_transfer: "Bank Transfer",
      transfer: "Transfer",
    };

    return labels[method] || method || "Cash";
  };

  // ============================================================
  // SORT COLLECTIONS
  // Earliest transaction first
  // ============================================================

  const sortedCollections = [...collections].sort(
    (a, b) =>
      new Date(a.transaction_date).getTime() -
      new Date(b.transaction_date).getTime()
  );

  // ============================================================
  // CALCULATE TOTALS
  // ============================================================

  const calculatedTotal = sortedCollections.reduce(
    (sum, collection) => sum + Number(collection.amount || 0),
    0
  );

  const totalAmount =
    summary?.totalAmount !== undefined
      ? Number(summary.totalAmount)
      : calculatedTotal;

  const totalCount =
    summary?.totalCount !== undefined
      ? Number(summary.totalCount)
      : sortedCollections.length;

  const averageAmount =
    summary?.averageAmount !== undefined
      ? Number(summary.averageAmount)
      : totalCount > 0
        ? totalAmount / totalCount
        : 0;

  // ============================================================
  // PAYMENT METHOD SUMMARY
  // ============================================================

  const paymentMethods =
    summary?.byPaymentMethod &&
    Object.keys(summary.byPaymentMethod).length > 0
      ? summary.byPaymentMethod
      : sortedCollections.reduce(
          (
            acc: Record<
              string,
              {
                count: number;
                total: number;
              }
            >,
            collection
          ) => {
            const method = collection.payment_method || "cash";

            if (!acc[method]) {
              acc[method] = {
                count: 0,
                total: 0,
              };
            }

            acc[method].count += 1;
            acc[method].total += Number(collection.amount || 0);

            return acc;
          },
          {}
        );

  // ============================================================
  // STAFF NAME
  // ============================================================

  const reportStaff =
    staffName ||
    sortedCollections[0]?.recorded_staff_name ||
    sortedCollections[0]?.mobile_banker_name ||
    "Staff";

  // ============================================================
  // HEADER
  // ============================================================

  doc.setFillColor(...forest);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Main title
  doc.setTextColor(...white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  doc.text(
    "DAILY COLLECTIONS",
    pageWidth / 2,
    14,
    {
      align: "center",
    }
  );

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    "Daily Collection Report",
    pageWidth / 2,
    21,
    {
      align: "center",
    }
  );

  // Generated date
  doc.setFontSize(8);

  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB")}`,
    pageWidth / 2,
    27,
    {
      align: "center",
    }
  );

  // ============================================================
  // REPORT INFORMATION
  // ============================================================

  let y = 44;

  doc.setTextColor(...ink);

  // Collection date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    "COLLECTION DATE",
    14,
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    formatDate(selectedDate),
    14,
    y + 6
  );

  // Staff
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    "STAFF",
    70,
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    reportStaff,
    70,
    y + 6
  );

  // Transaction count
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    "TRANSACTIONS",
    130,
    y
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  doc.text(
    String(totalCount),
    130,
    y + 6
  );

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  doc.text(
    "TOTAL COLLECTED",
    pageWidth - 58,
    y
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...forest);

  doc.text(
    formatMoney(totalAmount),
    pageWidth - 14,
    y + 6,
    {
      align: "right",
    }
  );

  y += 17;

  // Divider
  doc.setDrawColor(...line);
  doc.setLineWidth(0.4);

  doc.line(
    14,
    y,
    pageWidth - 14,
    y
  );

  y += 7;

  // ============================================================
  // TRANSACTIONS TABLE
  // ============================================================

  autoTable(doc, {
    startY: y,

    head: [
      [
        "CUSTOMER",
        "ACCOUNT NO.",
        "PHONE",
        "AMOUNT",
        "METHOD",
        "TIME",
      ],
    ],

    body: sortedCollections.map((collection) => [
      collection.customer_name || "Unknown Customer",

      collection.account_number || "-",

      collection.customer_phone || "-",

      formatMoney(Number(collection.amount || 0)),

      getMethodLabel(collection.payment_method),

      formatTime(collection.transaction_date),
    ]),

    theme: "grid",

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      textColor: ink,
      cellPadding: 3,
      lineColor: line,
      lineWidth: 0.2,
      valign: "middle",
      overflow: "linebreak",
    },

    headStyles: {
      fillColor: forestDeep,
      textColor: white,
      fontSize: 7,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: 3.5,
    },

    bodyStyles: {
      minCellHeight: 8,
    },

    alternateRowStyles: {
      fillColor: paper,
    },

    columnStyles: {
      // Customer
      0: {
        cellWidth: 39,
        halign: "left",
      },

      // Account number
      1: {
        cellWidth: 29,
        halign: "center",
      },

      // Phone
      2: {
        cellWidth: 27,
        halign: "center",
      },

      // Amount
      3: {
        cellWidth: 29,
        halign: "right",
      },

      // Payment method
      4: {
        cellWidth: 32,
        halign: "center",
      },

      // Time
      5: {
        cellWidth: 25,
        halign: "center",
      },
    },

    didParseCell: (data) => {
      // Make amount column slightly stronger
      if (
        data.section === "body" &&
        data.column.index === 3
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = forest;
      }

      // Payment method
      if (
        data.section === "body" &&
        data.column.index === 4
      ) {
        data.cell.styles.fontStyle = "bold";
      }
    },

    didDrawPage: (data) => {
      // Footer divider
      doc.setDrawColor(...line);
      doc.setLineWidth(0.3);

      doc.line(
        14,
        pageHeight - 17,
        pageWidth - 14,
        pageHeight - 17
      );

      // Footer left
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...inkFaint);

      doc.text(
        "Daily Collection Report",
        14,
        pageHeight - 10
      );

      // Footer right
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - 14,
        pageHeight - 10,
        {
          align: "right",
        }
      );
    },
  });

  // ============================================================
  // SUMMARY
  // ============================================================

  let finalY =
    (doc as any).lastAutoTable.finalY + 10;

  // Check if there is enough space
  if (finalY > pageHeight - 75) {
    doc.addPage();
    finalY = 20;
  }

  // Summary heading
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);

  doc.text(
    "Collection Summary",
    14,
    finalY
  );

  finalY += 7;

  // Summary container
  doc.setFillColor(...paper);
  doc.setDrawColor(...line);
  doc.setLineWidth(0.4);

  doc.roundedRect(
    14,
    finalY,
    pageWidth - 28,
    36,
    3,
    3,
    "FD"
  );

  // ============================================================
  // SUMMARY — TOTAL
  // ============================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...inkSoft);

  doc.text(
    "TOTAL COLLECTIONS",
    21,
    finalY + 9
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...forest);

  doc.text(
    formatMoney(totalAmount),
    21,
    finalY + 18
  );

  // ============================================================
  // SUMMARY — TRANSACTIONS
  // ============================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...inkSoft);

  doc.text(
    "TRANSACTIONS",
    82,
    finalY + 9
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ink);

  doc.text(
    String(totalCount),
    82,
    finalY + 18
  );

  // ============================================================
  // SUMMARY — AVERAGE
  // ============================================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...inkSoft);

  doc.text(
    "AVERAGE COLLECTION",
    124,
    finalY + 9
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ink);

  doc.text(
    formatMoney(averageAmount),
    124,
    finalY + 18
  );

  // ============================================================
  // PAYMENT METHOD BREAKDOWN
  // ============================================================

  finalY += 46;

  if (finalY > pageHeight - 70) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ink);

  doc.text(
    "Payment Method Breakdown",
    14,
    finalY
  );

  finalY += 6;

  const paymentRows = Object.entries(paymentMethods);

  if (paymentRows.length > 0) {
    autoTable(doc, {
      startY: finalY,

      head: [
        [
          "PAYMENT METHOD",
          "TRANSACTIONS",
          "TOTAL AMOUNT",
        ],
      ],

      body: paymentRows.map(
        ([method, data]) => [
          getMethodLabel(method),
          String(data.count),
          formatMoney(data.total),
        ]
      ),

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        textColor: ink,
        cellPadding: 3,
        lineColor: line,
        lineWidth: 0.2,
        valign: "middle",
      },

      headStyles: {
        fillColor: brass,
        textColor: white,
        fontSize: 7.5,
        fontStyle: "bold",
        halign: "center",
      },

      bodyStyles: {
        minCellHeight: 8,
      },

      alternateRowStyles: {
        fillColor: paper,
      },

      columnStyles: {
        0: {
          cellWidth: 70,
        },

        1: {
          cellWidth: 45,
          halign: "center",
        },

        2: {
          cellWidth: 55,
          halign: "right",
        },
      },

      didDrawPage: (data) => {
        // Footer divider
        doc.setDrawColor(...line);
        doc.setLineWidth(0.3);

        doc.line(
          14,
          pageHeight - 17,
          pageWidth - 14,
          pageHeight - 17
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...inkFaint);

        doc.text(
          "Daily Collection Report",
          14,
          pageHeight - 10
        );

        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth - 14,
          pageHeight - 10,
          {
            align: "right",
          }
        );
      },
    });

    finalY =
      (doc as any).lastAutoTable.finalY + 8;
  }

  // ============================================================
  // FINAL TOTAL BOX
  // ============================================================

  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }

  const totalBoxWidth = 82;
  const totalBoxHeight = 19;
  const totalBoxX =
    pageWidth - 14 - totalBoxWidth;

  // Box
  doc.setFillColor(...forest);

  doc.roundedRect(
    totalBoxX,
    finalY,
    totalBoxWidth,
    totalBoxHeight,
    2.5,
    2.5,
    "F"
  );

  // Label
  doc.setTextColor(...white);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  doc.text(
    "TOTAL COLLECTED",
    totalBoxX + 7,
    finalY + 7
  );

  // Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text(
    formatMoney(totalAmount),
    totalBoxX + totalBoxWidth - 7,
    finalY + 14.5,
    {
      align: "right",
    }
  );

  // ============================================================
  // SAVE PDF
  // ============================================================

  const safeStaffName = reportStaff
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");

  const safeDate = selectedDate.replace(/-/g, "");

  const fileName =
    `Daily_Collections_${safeDate}_${safeStaffName}.pdf`;

  doc.save(fileName);
};