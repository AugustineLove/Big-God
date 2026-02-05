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
      item.type.toUpperCase(),
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