export const printStatement = (statement) => {
  if (!statement) return;

  const printWindow = window.open('', '_blank');
  
  // Get company logo (you can replace this with your actual logo URL or base64)
  const logoUrl = localStorage.getItem('company_logo') || '/logo.png';
  const companyName = statement.bank_info?.company_name || 'Financial Institution';
  
  // Generate all transactions (not just current page)
  const allTransactions = statement.transactions || [];
  
  // Calculate how many pages needed (assuming ~20 transactions per page)
  const transactionsPerPage = 20;
  const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
  
  // Generate HTML for all pages
  let allPagesHtml = '';
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const startIdx = pageNum * transactionsPerPage;
    const endIdx = Math.min(startIdx + transactionsPerPage, allTransactions.length);
    const pageTransactions = allTransactions.slice(startIdx, endIdx);
    const isFirstPage = pageNum === 0;
    const isLastPage = pageNum === totalPages - 1;
    
    // Calculate page-specific balances
    let pageOpeningBalance = 0;
    if (isFirstPage) {
      pageOpeningBalance = parseFloat(statement.balances.opening_balance);
    } else {
      // Get balance from last transaction of previous page
      const prevPageLastTx = allTransactions[startIdx - 1];
      pageOpeningBalance = prevPageLastTx ? parseFloat(prevPageLastTx.balance) : 0;
    }
    
    let runningBalance = pageOpeningBalance;
    const pageTransactionsWithBalance = pageTransactions.map(tx => {
      const amount = parseFloat(tx.debit !== '0.00' ? tx.debit : tx.credit);
      let newBalance = runningBalance;
      
      if (tx.debit !== '0.00') {
        newBalance = runningBalance - amount;
      } else if (tx.credit !== '0.00') {
        newBalance = runningBalance + amount;
      }
      runningBalance = newBalance;
      
      return { ...tx, calculatedBalance: newBalance.toFixed(2) };
    });
    
    const pageClosingBalance = runningBalance;
    
    allPagesHtml += `
      <div class="statement-page" style="page-break-after: ${isLastPage ? 'auto' : 'always'};">
        
        <!-- Watermark on ALL pages -->
        <div class="watermark">${companyName}</div>
        
        ${isFirstPage ? `
          <!-- ONLY FIRST PAGE: Letterhead -->
          <div class="letterhead">
            <div class="letterhead-left">
              <img src="${logoUrl}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'">
            </div>
            <div class="letterhead-center">
              <h1 class="company-name">${companyName}</h1>
              <p class="company-address">Agona Nkwanta</p>
              <p class="company-contact">
                Tel: 0542384752
                Email: bigodsusuenterprise@gmail.com
              </p>
            </div>
            <div class="letterhead-right">
              <div class="statement-badge">OFFICIAL STATEMENT</div>
            </div>
          </div>
          
          <!-- ONLY FIRST PAGE: Statement Title -->
          <div class="statement-title-section">
            <h2>ACCOUNT STATEMENT</h2>
            <p>Generated on: ${new Date(statement.statement_period.generated_on).toLocaleString()}</p>
          </div>
          
          <!-- ONLY FIRST PAGE: Account Information -->
          <div class="info-section">
            <h3>Account Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Customer Name:</span>
                <span class="info-value">${statement.account_info.customer_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Account Number:</span>
                <span class="info-value">${statement.account_info.account_number}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Account Type:</span>
                <span class="info-value">${statement.account_info.account_type}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Account Status:</span>
                <span class="info-value status-${statement.account_info.account_status.toLowerCase()}">${statement.account_info.account_status}</span>
              </div>
            </div>
          </div>
          
          <!-- ONLY FIRST PAGE: Statement Period -->
          <div class="period-section">
            <div class="period-dates">
              <strong>Statement Period:</strong> 
              ${statement.statement_period.start_date 
                ? `${new Date(statement.statement_period.start_date).toLocaleDateString()} to ${new Date(statement.statement_period.end_date).toLocaleDateString()}`
                : `Up to ${new Date(statement.statement_period.end_date).toLocaleDateString()}`}
            </div>
            <div class="balance-summary">
              <div class="balance-item">
                <span>Opening Balance:</span>
                <strong>¢${statement.balances.opening_balance}</strong>
              </div>
            </div>
          </div>
          
          <!-- ONLY FIRST PAGE: Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card deposits">
              <div class="summary-label">Total Deposits</div>
              <div class="summary-amount">¢${statement.summary.total_deposits}</div>
            </div>
            <div class="summary-card withdrawals">
              <div class="summary-label">Total Withdrawals</div>
              <div class="summary-amount">¢${statement.summary.total_withdrawals}</div>
            </div>
            <div class="summary-card transfers">
              <div class="summary-label">Total Transfers</div>
              <div class="summary-amount">¢${(parseFloat(statement.summary.total_transfer_ins) + parseFloat(statement.summary.total_transfer_outs)).toFixed(2)}</div>
            </div>
            <div class="summary-card net-change">
              <div class="summary-label">Net Change</div>
              <div class="summary-amount">¢${statement.summary.net_change}</div>
            </div>
          </div>
        ` : `
          <!-- OTHER PAGES: Just a simple header with page number -->
          <div class="simple-header">
            <div class="simple-header-left">
              <strong>${companyName}</strong> - Account Statement (Continued)
            </div>
            <div class="simple-header-right">
              Page ${pageNum + 1} of ${totalPages}
            </div>
          </div>
        `}
        
        <!-- Transactions Table (continues on every page) -->
        <table class="transactions-table">
          <thead>
            <tr>
              <th class="col-date">Date</th>
              <th class="col-desc">Description</th>
              <th class="col-type">Type</th>
              <th class="col-debit">Debit (¢)</th>
              <th class="col-credit">Credit (¢)</th>
              <th class="col-balance">Balance (¢)</th>
              <th class="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            ${pageTransactionsWithBalance.map(tx => `
              <tr>
                <td class="col-date">${new Date(tx.date).toLocaleDateString()}</td>
                <td class="col-desc">
                  ${tx.description}
                  ${tx.reversed ? '<span class="reversed-badge">REVERSED</span>' : ''}
                </td>
                <td class="col-type">${tx.transaction_type_display}</td>
                <td class="col-debit ${tx.debit !== '0.00' ? 'debit-amount' : ''}">
                  ${tx.debit !== '0.00' ? `¢${tx.debit}` : '-'}
                </td>
                <td class="col-credit ${tx.credit !== '0.00' ? 'credit-amount' : ''}">
                  ${tx.credit !== '0.00' ? `¢${tx.credit}` : '-'}
                </td>
                <td class="col-balance">¢${tx.calculatedBalance}</td>
                <td class="col-status">
                  <span class="status-badge status-${tx.status}">${tx.status}</span>
                </td>
              </tr>
            `).join('')}
            ${pageTransactions.length === 0 ? `
              <tr>
                <td colspan="7" class="no-transactions">No transactions found for this period</td>
              </tr>
            ` : ''}
          </tbody>
          ${!isLastPage ? `
            <tfoot>
              <tr class="page-continue-row">
                <td colspan="6" class="page-continue">... continued on next page ...</td>
                <td class="page-balance">¢${pageClosingBalance.toFixed(2)}</td>
              </tr>
            </tfoot>
          ` : `
            <tfoot>
              <tr class="closing-balance-row">
                <td colspan="5" class="closing-label"><strong>CLOSING BALANCE</strong></td>
                <td class="closing-amount"><strong>¢${pageClosingBalance.toFixed(2)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          `}
        </table>
        
        <!-- Page Footer -->
        <div class="page-footer">
          <div class="footer-left">${companyName}</div>
          <div class="footer-center">Customer Service: ${statement.bank_info?.company_phone || 'N/A'}</div>
          <div class="footer-right">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    `;
  }
  
  // Complete HTML document with styles
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Account Statement - ${statement.account_info.account_number}</title>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #f0f0f0;
            margin: 0;
            padding: 20px;
          }
          
          .statement-page {
            background: white;
            width: 1100px;
            max-width: 100%;
            margin: 0 auto 20px auto;
            padding: 40px;
            position: relative;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            page-break-after: always;
          }
          
          /* Watermark */
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(0,0,0,0.05);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            font-weight: bold;
            letter-spacing: 10px;
          }
          
          /* Letterhead - First Page Only */
          .letterhead {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            margin-bottom: 20px;
            border-bottom: 3px solid #4f46e5;
            position: relative;
            z-index: 1;
          }
          
          .letterhead-left {
            flex: 1;
          }
          
          .company-logo {
            max-height: 80px;
            max-width: 150px;
            object-fit: contain;
          }
          
          .letterhead-center {
            flex: 2;
            text-align: center;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 5px;
          }
          
          .company-address {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
          }
          
          .company-contact {
            font-size: 11px;
            color: #888;
          }
          
          .letterhead-right {
            flex: 1;
            text-align: right;
          }
          
          .statement-badge {
            background: #4f46e5;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
          }
          
          /* Simple Header for Subsequent Pages */
          .simple-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            margin-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            color: #666;
            position: relative;
            z-index: 1;
          }
          
          .simple-header-left {
            font-weight: 500;
          }
          
          .simple-header-right {
            color: #4f46e5;
            font-weight: 600;
          }
          
          /* Statement Title - First Page Only */
          .statement-title-section {
            text-align: center;
            margin-bottom: 25px;
            position: relative;
            z-index: 1;
          }
          
          .statement-title-section h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 5px;
          }
          
          .statement-title-section p {
            color: #666;
            font-size: 12px;
          }
          
          /* Info Sections - First Page Only */
          .info-section, .period-section {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            position: relative;
            z-index: 1;
          }
          
          .info-section h3, .period-section h3 {
            font-size: 14px;
            color: #4f46e5;
            margin-bottom: 10px;
            border-left: 3px solid #4f46e5;
            padding-left: 10px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          
          .info-item {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }
          
          .info-label {
            color: #666;
            font-weight: 500;
          }
          
          .info-value {
            color: #333;
            font-weight: 600;
          }
          
          .status-active {
            color: #10b981;
          }
          
          .status-inactive {
            color: #ef4444;
          }
          
          .period-section {
            background: #eef2ff;
          }
          
          .period-dates {
            margin-bottom: 10px;
            font-size: 13px;
          }
          
          .balance-summary {
            display: flex;
            justify-content: flex-start;
            padding-top: 10px;
            border-top: 1px solid #c7d2fe;
          }
          
          .balance-item span {
            color: #666;
            font-size: 13px;
          }
          
          .balance-item strong {
            color: #4f46e5;
            font-size: 16px;
            margin-left: 10px;
          }
          
          /* Summary Cards - First Page Only */
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 25px;
            position: relative;
            z-index: 1;
          }
          
          .summary-card {
            padding: 12px;
            border-radius: 8px;
            text-align: center;
          }
          
          .summary-card.deposits {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
          }
          
          .summary-card.withdrawals {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
          }
          
          .summary-card.transfers {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: white;
          }
          
          .summary-card.net-change {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
          }
          
          .summary-label {
            font-size: 11px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          
          .summary-amount {
            font-size: 18px;
            font-weight: bold;
          }
          
          /* Transactions Table */
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
            position: relative;
            z-index: 1;
          }
          
          .transactions-table th {
            background: #4f46e5;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: 600;
          }
          
          .transactions-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .transactions-table tr:hover {
            background: #f9fafb;
          }
          
          .col-date { width: 10%; }
          .col-desc { width: 30%; }
          .col-type { width: 12%; }
          .col-debit { width: 12%; text-align: right; }
          .col-credit { width: 12%; text-align: right; }
          .col-balance { width: 12%; text-align: right; }
          .col-status { width: 12%; text-align: center; }
          
          .debit-amount {
            color: #ef4444;
            font-weight: 600;
          }
          
          .credit-amount {
            color: #10b981;
            font-weight: 600;
          }
          
          .reversed-badge {
            display: inline-block;
            background: #ef4444;
            color: white;
            font-size: 9px;
            padding: 2px 5px;
            border-radius: 3px;
            margin-left: 8px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .status-approved, .status-completed {
            background: #d1fae5;
            color: #065f46;
          }
          
          .status-pending {
            background: #fed7aa;
            color: #92400e;
          }
          
          .status-rejected, .status-reversed {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .no-transactions {
            text-align: center;
            padding: 40px;
            color: #999;
          }
          
          .page-continue-row {
            background: #f9fafb;
          }
          
          .page-continue {
            text-align: center;
            font-style: italic;
            color: #6b7280;
            padding: 10px;
          }
          
          .page-balance {
            text-align: right;
            font-weight: bold;
            color: #4f46e5;
          }
          
          .closing-balance-row {
            background: #eef2ff;
            font-weight: bold;
          }
          
          .closing-label {
            text-align: right;
            font-size: 14px;
          }
          
          .closing-amount {
            text-align: right;
            font-size: 16px;
            color: #4f46e5;
          }
          
          /* Page Footer */
          .page-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
            position: relative;
            z-index: 1;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
              margin: 0;
            }
            
            .statement-page {
              box-shadow: none;
              margin: 0;
              padding: 20px;
              page-break-after: always;
            }
            
            .watermark {
              position: fixed;
              opacity: 0.1;
              print-color-adjust: exact;
            }
            
            .transactions-table td, 
            .transactions-table th {
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        ${allPagesHtml}
        <script>
          // Auto-trigger print after loading
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};