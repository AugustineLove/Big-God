import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, Users, PiggyBank, FileText, BarChart3, Filter, Loader2, CheckCircle, XCircle, Eye, TrendingUpIcon, PlusCircle } from 'lucide-react';
import { useStats } from '../../contexts/dashboard/DashboardStat';
import { useTransactions } from '../../contexts/dashboard/Transactions';
import { useCustomers } from '../../contexts/dashboard/Customers';
import { companyId } from '../../constants/appConstants';
import autoTable from 'jspdf-autotable';
import { useCommissionStats } from '../../contexts/dashboard/Commissions';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { commissionStats, commissions } = useCommissionStats();
  const [showPreview, setShowPreview] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ 
    type: null, 
    message: '' 
  });

  const { stats } = useStats();
  const { transactions } = useTransactions();
  const { customers } = useCustomers();

  // Calculate metrics from real data
  const totalClients = customers.length;
  const activeClients = customers.filter(c => c.status === 'Active').length;
  const contributions = transactions.filter(t => t.type === 'deposit');
  const withdrawals = transactions.filter(t => t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'approved'));
  const totalContributions = contributions.reduce((sum, t) => Number(sum) + Number(t.amount), 0);
  const totalWithdrawals = withdrawals.reduce((sum, t) => Number(sum) + Number(t.amount), 0);
  const totalCommissions = commissionStats?.total_amount;
  const totalBalance = stats?.totalBalance || totalContributions - totalWithdrawals;

  const reportTypes = [
    { id: 'overview', name: 'Business Overview', description: 'Comprehensive summary', icon: BarChart3 },
    { id: 'contributions', name: 'Contributions Report', description: 'Contribution analysis', icon: PiggyBank },
    { id: 'clients', name: 'Client Analysis', description: 'Client demographics', icon: Users },
    { id: 'financial', name: 'Financial Summary', description: 'Income and balances', icon: TrendingUp }
  ];

  // Get monthly data from transactions
  const getMonthlyData = () => {
    const months: { [key: string]: number } = {};
    contributions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthYear = date.toLocaleDateString('en', { month: 'short', year: 'numeric' });
      months[monthYear] = (months[monthYear] || 0) + Number(t.amount);
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount })).slice(-6);
  };

  const monthlyData = getMonthlyData();
  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);

  type StatusColor = 'green' | 'yellow' | 'red';
  const colorClassMap = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const statusItems = [
    { status: 'Approved', count: transactions.filter(t => t.status === 'approved').length, color: 'green' as StatusColor },
    { status: 'Completed', count: transactions.filter(t => t.status === 'completed').length, color: 'green' as StatusColor },
    { status: 'Pending', count: transactions.filter(t => t.status === 'pending').length, color: 'yellow' as StatusColor },
    { status: 'Reversed', count: transactions.filter(t => t.status === 'reversed').length, color: 'red' as StatusColor },
  ];

  // Filter transactions by date range
  const filterTransactionsByDateRange = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter(t => new Date(t.transaction_date) >= startDate);
  };

  const filterCommissionsByDate = () => {
    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return commissions.filter(c => new Date(c.created_at) >= startDate);
  };
  
  const filteredTransactions = filterTransactionsByDateRange();
  const filteredCommissions = filterCommissionsByDate();
  // Export to PDF using jsPDF
  const exportToPDF = async () => {
    try {
      // @ts-ignore - Dynamic import
      const { jsPDF } = await import('jspdf');
      // @ts-ignore - Dynamic import
      await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      const reportNames: { [key: string]: string } = {
        'overview': 'Business Overview Report',
        'contributions': 'Contributions Analysis Report',
        'clients': 'Client Analysis Report',
        'financial': 'Financial Summary Report'
      };

      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text(reportNames[selectedReport] || 'Business Report', pageWidth / 2, 20, { align: 'center' });

      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Date Range: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`, pageWidth / 2, 34, { align: 'center' });

      // Key Metrics Table
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Key Performance Metrics', 14, 45);

      // @ts-ignore - autoTable plugin
      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value']],
        body: [
          ['Total Clients', totalClients.toString()],
          ['Active Clients', activeClients.toString()],
          ['Total Contributions', `¢${totalContributions.toLocaleString()}.00`],
          ['Total Commissions', `¢${commissionStats?.total_amount}`],
          ['Total Withdrawals', `¢${totalWithdrawals.toLocaleString()}.00`],
          ['Customer Balance', `¢${totalBalance.toLocaleString()}.00`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 11 },
        styles: { fontSize: 10 }
      });

      // @ts-ignore - autoTable plugin
      let finalY = doc.lastAutoTable.finalY + 10;

      // Monthly Contributions
      if (monthlyData.length > 0) {
        doc.setFontSize(14);
        doc.text('Monthly Contributions', 14, finalY);
        
        // @ts-ignore - autoTable plugin
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Month', 'Amount']],
          body: monthlyData.map(d => [d.month, `¢${d.amount.toLocaleString()}`]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          styles: { fontSize: 10 }
        });

        // @ts-ignore - autoTable plugin
        finalY = doc.lastAutoTable.finalY + 10;
      }

      // Add new page for transactions
      doc.addPage();

      // Transaction Status
      doc.setFontSize(14);
      doc.text('Transaction Status Summary', 14, 20);

      // @ts-ignore - autoTable plugin
      autoTable(doc, {
        startY: 25,
        head: [['Status', 'Count', 'Percentage']],
        body: statusItems.map(item => {
          const percentage = transactions.length > 0 ? ((item.count / transactions.length) * 100).toFixed(1) : '0.0';
          return [item.status, item.count.toString(), `${percentage}%`];
        }),
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { fontSize: 10 }
      });

      // @ts-ignore - autoTable plugin
      finalY = doc.lastAutoTable.finalY + 10;

      // Recent Transactions
      doc.setFontSize(14);
      doc.text('Recent Transactions', 14, finalY);

      // @ts-ignore - autoTable plugin
      autoTable(doc, {
        startY: finalY + 5,
        head: [['Date', 'Type', 'Amount', 'Status']],
        body: filteredTransactions.slice(0, 20).map(t => [
          new Date(t.transaction_date).toLocaleDateString(),
          t.type.charAt(0).toUpperCase() + t.type.slice(1),
          `¢${Number(t.amount).toLocaleString()}`,
          t.status.charAt(0).toUpperCase() + t.status.slice(1)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        styles: { fontSize: 9 }
      });

      // Save PDF
      doc.save(`${selectedReport}-report-${Date.now()}.pdf`);
      return true;
    } catch (error) {
      console.error('PDF Error:', error);
      throw error;
    }
  };

  // Export to Excel using xlsx
  const exportToExcel = async () => {
    try {
      // @ts-ignore - Dynamic import
      const XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['Business Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Date Range: ${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)}`],
        [],
        ['Key Performance Metrics'],
        ['Metric', 'Value'],
        ['Total Clients', totalClients],
        ['Active Clients', activeClients],
        ['Total Contributions', `¢${totalContributions.toLocaleString()}`],
        ['Total Commissions', `${commissionStats?.total_amount.toLocaleString()}`],
        ['Total Withdrawals', `¢${totalWithdrawals.toLocaleString()}`],
        ['Current Balance', `¢${totalBalance.toLocaleString()}`]
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Monthly Data Sheet
      if (monthlyData.length > 0) {
        const monthlySheetData = [
          ['Monthly Contributions'],
          [],
          ['Month', 'Amount'],
          ...monthlyData.map(d => [d.month, d.amount])
        ];
        const monthlySheet = XLSX.utils.aoa_to_sheet(monthlySheetData);
        XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Data');
      }

      // Transaction Status Sheet
      const statusSheetData = [
        ['Transaction Status Summary'],
        [],
        ['Status', 'Count', 'Percentage'],
        ...statusItems.map(item => {
          const percentage = transactions.length > 0 ? ((item.count / transactions.length) * 100).toFixed(1) : '0.0';
          return [item.status, item.count, `${percentage}%`];
        })
      ];
      const statusSheet = XLSX.utils.aoa_to_sheet(statusSheetData);
      XLSX.utils.book_append_sheet(wb, statusSheet, 'Status');

      // Transactions Sheet
      const transactionsSheetData = [
        ['Recent Transactions'],
        [],
        ['Date', 'Type', 'Amount', 'Status', 'Account ID'],
        ...filteredTransactions.slice(0, 100).map(t => [
          new Date(t.transaction_date).toLocaleDateString(),
          t.type,
          Number(t.amount),
          t.status,
          t.account_id || 'N/A'
        ])
      ];
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsSheetData);
      XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Transactions');

      // Save Excel file
      XLSX.writeFile(wb, `${selectedReport}-report-${Date.now()}.xlsx`);
      return true;
    } catch (error) {
      console.error('Excel Error:', error);
      throw error;
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = '';

    // Header
    csvContent += `Report Type: ${selectedReport}\n`;
    csvContent += `Date Range: ${dateRange}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Metrics
    csvContent += 'Key Metrics\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Clients,${totalClients}\n`;
    csvContent += `Active Clients,${activeClients}\n`;
    csvContent += `Total Contributions,${totalContributions}\n`;
    csvContent += `Total Commissions,${commissionStats?.total_amount}`
    csvContent += `Total Withdrawals,${totalWithdrawals}\n`;
    csvContent += `Total Balance,${totalBalance}\n\n`;

    // Monthly Data
    if (monthlyData.length > 0) {
      csvContent += 'Monthly Contributions\n';
      csvContent += 'Month,Amount\n';
      monthlyData.forEach(d => {
        csvContent += `${d.month},${d.amount}\n`;
      });
      csvContent += '\n';
    }

    // Transactions
    csvContent += 'Recent Transactions\n';
    csvContent += 'Date,Type,Amount,Status,Account\n';
    filteredTransactions.slice(0, 100).forEach(t => {
      csvContent += `${new Date(t.transaction_date).toLocaleDateString()},${t.type},${t.amount},${t.status},${t.account_id || 'N/A'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport}-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // GENERATE REPORT - Shows preview/refreshes data
  const handleGenerate = async () => {
    setIsGenerating(true);
    setExportStatus({ type: null, message: '' });

    try {
      // Simulate data refresh/validation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Show the preview section
      setShowPreview(true);
      
      // Scroll to preview
      setTimeout(() => {
        const previewElement = document.getElementById('report-preview');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      setExportStatus({ 
        type: 'success', 
        message: `Report generated! Review the data below and click "Export Report" to download.` 
      });
    } catch (error) {
      setExportStatus({ 
        type: 'error', 
        message: 'Failed to generate report. Please try again.' 
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setExportStatus({ type: null, message: '' }), 8000);
    }
  };

  // EXPORT - Downloads the file
  const handleExport = async () => {
    if (!showPreview) {
      setExportStatus({ 
        type: 'error', 
        message: 'Please generate the report first before exporting.' 
      });
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000);
      return;
    }

    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      if (exportFormat === 'pdf') {
        await exportToPDF();
      } else if (exportFormat === 'xlsx') {
        await exportToExcel();
      } else if (exportFormat === 'csv') {
        exportToCSV();
      }

      setExportStatus({ 
        type: 'success', 
        message: `Report exported successfully as ${exportFormat.toUpperCase()}! Check your downloads folder.` 
      });
    } catch (error) {
      setExportStatus({ 
        type: 'error', 
        message: 'Failed to export report. Please try again.' 
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus({ type: null, message: '' }), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports and analyze your data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Eye className="h-5 w-5 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !showPreview}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isExporting ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {exportStatus.type && (
        <div
          className={`flex items-center p-4 rounded-lg animate-fade-in ${
            exportStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}
        >
          {exportStatus.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
          )}
          <p className={exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>{exportStatus.message}</p>
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={selectedReport}
              onChange={(e) => {
                setSelectedReport(e.target.value);
                setShowPreview(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              {reportTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setShowPreview(false);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel (XLSX)</option>
              <option value="csv">CSV</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => {
              setSelectedReport(type.id);
              setShowPreview(false);
            }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all hover:shadow-md ${
              selectedReport === type.id ? 'border-indigo-500 bg-indigo-50 transform scale-105' : 'border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className={`p-3 rounded-lg mb-4 transition-colors ${selectedReport === type.id ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              <type.icon className={`h-8 w-8 ${selectedReport === type.id ? 'text-indigo-600' : 'text-gray-600'}`} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </div>
        ))}
      </div>

      {/* Report Preview Section */}
      {showPreview && (
        <div id="report-preview" className="space-y-6 animate-fade-in">
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-indigo-600 mr-2" />
              <p className="text-sm text-indigo-800 font-medium">
                Report Preview - This data will be included in your export
              </p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Clients', value: totalClients, detail: `${activeClients} active`, icon: Users, bg: 'bg-indigo-100', textColor: 'text-indigo-600' },
              { label: 'Overall Contributions', value: `${totalContributions.toLocaleString()}`, detail: '↑ Growth', icon: PiggyBank, bg: 'bg-green-100', textColor: 'text-green-600' },
              { label: 'Current Balance Due', value: `${totalBalance.toLocaleString()}`, detail: 'Available', icon: TrendingUp, bg: 'bg-blue-100', textColor: 'text-blue-600' },
              { label: 'Total Commissions', value: `${totalCommissions?.toLocaleString()}`, detail: 'Paid', icon: PlusCircle, bg: 'bg-green-100', textColor: 'text-green-600' },
              { label: 'Total Withdrawals', value: `${totalWithdrawals.toLocaleString()}`, detail: 'Completed', icon: Download, bg: 'bg-orange-100', textColor: 'text-orange-600' }
            ].map((metric, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">¢{metric.value}</p>
                    <p className={`text-sm ${metric.textColor} mt-1`}>{metric.detail}</p>
                  </div>
                  <div className={`${metric.bg} p-3 rounded-lg`}>
                    <metric.icon className={`h-8 w-8 ${metric.textColor}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Monthly Contributions Trend</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Last 6 months</span>
              </div>
            </div>
            <div className="space-y-4">
              {monthlyData.length > 0 ? (
                monthlyData.map((data, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium text-gray-600">{data.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-600 to-teal-600 h-6 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((data.amount / maxAmount) * 100, 5)}%` }}
                      >
                        {(data.amount / maxAmount) * 100 > 20 && (
                          <span className="text-white text-xs font-medium">¢{data.amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-28 text-sm font-medium text-gray-900 text-right">¢{data.amount.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No data available for the selected period</div>
              )}
            </div>
          </div>

          {/* Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Top Contributing Clients
              </h3>
              <div className="space-y-4">
                {customers
                  .sort((a, b) => (b.total_balance_across_all_accounts || 0) - (a.total_balance_across_all_accounts || 0))
                  .slice(0, 5)
                  .map((client, idx) => (
                    <div key={client.id} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-bold text-gray-400">#{idx + 1}</div>
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {client.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{client.email || 'No email'}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-indigo-600">¢{(client.total_balance_across_all_accounts || 0).toLocaleString()}</div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
                Transaction Status Overview
              </h3>
              <div className="space-y-4">
                {statusItems.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      <span className="text-sm text-gray-600 font-semibold">
                        {item.count} ({transactions.length > 0 ? Math.round((item.count / transactions.length) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 w-full overflow-hidden">
                      <div
                        className={`${colorClassMap[item.color]} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${transactions.length > 0 ? (item.count / transactions.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;