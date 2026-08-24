export const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:           #f5f6fa;
    --bg2:          #ffffff;
    --bg3:          #f0f2f0;
    --bg4:          #e5ece6;
    --border:       #e2e5e2;
    --border2:      #c9d0ca;
    --text:         #111827;
    --text2:        #4b5563;
    --text3:        #9ca3af;
    --ink:          #1a2e1a;
    --accent:       #2d5a3d;
    --accent-d:     #1a2e1a;
    --accent-light: #eaf4ee;
    --accent-mid:   #b7d9c2;
    --green:        #059669;
    --green-light:  #d1fae5;
    --red:          #dc2626;
    --red-light:    #fee2e2;
    --amber:        #d97706;
    --amber-light:  #fef3c7;
    --purple:       #7c3aed;
    --purple-light: #ede9fe;
    --sky:          #0284c7;
    --sky-light:    #e0f2fe;
    --slate:        #475569;
    --radius:       8px;
    --radius-lg:    12px;
    --shadow-sm:    0 1px 2px 0 rgba(0,0,0,0.05);
    --shadow:       0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
    --shadow-md:    0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    --shadow-lg:    0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
    --font:         'Inter', system-ui, sans-serif;
    --mono:         'JetBrains Mono', 'Fira Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  .acc { min-height: auto; background: transparent; font-family: var(--font); }

  /* ── Page header ── */
  .acc-page-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 2px 2px 16px;
    flex-wrap: wrap;
    gap: 10px;
  }
  .acc-page-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 4px;
  }
  .acc-page-title {
    font-size: 21px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.3px;
  }
  .acc-page-date {
    font-size: 12px;
    font-weight: 500;
    color: var(--text2);
    background: var(--bg3);
    padding: 6px 13px;
    border-radius: 99px;
    border: 1px solid var(--border);
  }

  /* ── Tab bar (replaces the old nested sidebar nav) ── */
  .acc-tabbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 2px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .acc-tab {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 10px 15px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 13.5px;
    font-weight: 500;
    font-family: var(--font);
    color: var(--text2);
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    transition: all .15s;
    margin-bottom: -1px;
    border-radius: 8px 8px 0 0;
  }
  .acc-tab svg { flex-shrink: 0; opacity: .8; }
  .acc-tab:hover { color: var(--accent); background: var(--accent-light); }
  .acc-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    font-weight: 600;
    background: var(--accent-light);
  }
  .acc-tab.active svg { opacity: 1; }
  .acc-tab-sep {
    width: 1px;
    height: 18px;
    background: var(--border2);
    margin: 0 6px;
    flex-shrink: 0;
  }

  .acc-body { padding: 0 2px 8px; }

  /* ── KPI cards ── */
  .acc-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  .acc-kpi {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: box-shadow .2s;
  }
  .acc-kpi:hover { box-shadow: var(--shadow-md); }
  .acc-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .acc-kpi.asset::before   { background: var(--sky); }
  .acc-kpi.liability::before { background: var(--red); }
  .acc-kpi.equity::before  { background: var(--purple); }
  .acc-kpi.income::before  { background: var(--green); }
  .acc-kpi.expense::before { background: var(--amber); }
  .acc-kpi.net.positive::before { background: var(--green); }
  .acc-kpi.net.negative::before { background: var(--red); }
  .acc-kpi-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text3);
    margin-bottom: 10px;
  }
  .acc-kpi-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .acc-kpi-value.green  { color: var(--green); }
  .acc-kpi-value.red    { color: var(--red); }
  .acc-kpi-value.blue   { color: var(--accent); }
  .acc-kpi-value.purple { color: var(--purple); }
  .acc-kpi-sub {
    font-size: 12px;
    color: var(--text3);
    margin-top: 4px;
  }

  /* ── Panel ── */
  .acc-panel {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
  }
  .acc-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  .acc-panel-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .acc-panel-title .count {
    font-size: 11px;
    background: var(--bg3);
    color: var(--text2);
    padding: 2px 8px;
    border-radius: 99px;
    font-weight: 600;
  }

  /* ── Toolbar / filters ── */
  .acc-toolbar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--bg3);
    align-items: center;
  }
  .acc-input {
    background: var(--bg2);
    border: 1px solid var(--border2);
    border-radius: var(--radius);
    color: var(--text);
    font-size: 13px;
    font-family: var(--font);
    padding: 7px 12px;
    outline: none;
    transition: all .2s;
    height: 34px;
  }
  .acc-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(45,90,61,0.12); }
  .acc-input::placeholder { color: var(--text3); }
  .acc-input.wide { flex: 1; min-width: 200px; }
  select.acc-input { cursor: pointer; padding-right: 28px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239ca3af' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }

  /* ── Buttons ── */
  .acc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 16px;
    height: 34px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font);
    cursor: pointer;
    border: 1px solid transparent;
    transition: all .15s;
    white-space: nowrap;
  }
  .acc-btn:disabled { opacity: .5; cursor: not-allowed; }
  .acc-btn.primary { background: var(--accent); color: white; border-color: var(--accent-d); }
  .acc-btn.primary:hover:not(:disabled) { background: var(--accent-d); }
  .acc-btn.ghost { background: var(--bg2); color: var(--text2); border-color: var(--border2); }
  .acc-btn.ghost:hover:not(:disabled) { background: var(--bg3); color: var(--text); border-color: var(--border2); }
  .acc-btn.danger { background: var(--red-light); color: var(--red); border-color: var(--red); }
  .acc-btn.danger:hover:not(:disabled) { background: var(--red); color: white; }
  .acc-btn.sm { height: 28px; padding: 0 10px; font-size: 12px; }
  .acc-btn.icon { padding: 0 8px; }

  /* ── Table ── */
  .acc-tbl-wrap { overflow-x: auto; }
  .acc-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }
  .acc-tbl th {
    padding: 10px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: var(--text3);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
    background: var(--bg3);
    position: sticky; top: 0;
  }
  .acc-tbl th.r, .acc-tbl td.r { text-align: right; }
  .acc-tbl th.c, .acc-tbl td.c { text-align: center; }
  .acc-tbl td {
    padding: 11px 16px;
    border-bottom: 1px solid var(--border);
    color: var(--text);
    vertical-align: middle;
  }
  .acc-tbl tr:last-child td { border-bottom: none; }
  .acc-tbl tbody tr:hover td { background: var(--bg3); }
  .acc-tbl .grp-row td {
    background: var(--bg4);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--accent);
    padding: 8px 16px;
    border-top: 1px solid var(--border);
  }
  .acc-tbl .sub-row td {
    background: var(--accent-light);
    font-weight: 600;
    font-size: 13px;
    border-top: 1px solid var(--accent-mid);
  }
  .acc-tbl .grand-row td {
    background: var(--ink);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
  }
  .acc-tbl .exp-row td { background: var(--bg3); }

  /* ── Badges ── */
  .acc-chip {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    padding: 3px 9px;
    border-radius: 99px;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .chip-asset     { background: var(--sky-light); color: var(--sky); }
  .chip-liability { background: var(--red-light); color: var(--red); }
  .chip-equity    { background: var(--purple-light); color: var(--purple); }
  .chip-income    { background: var(--green-light); color: var(--green); }
  .chip-expense   { background: var(--amber-light); color: var(--amber); }
  .chip-posted    { background: var(--green-light); color: var(--green); }
  .chip-draft     { background: var(--bg4); color: var(--text2); }
  .chip-reversed  { background: var(--red-light); color: var(--red); }
  .chip-debit     { background: var(--sky-light); color: var(--sky); }
  .chip-credit    { background: var(--green-light); color: var(--green); }
  .chip-active    { background: var(--green-light); color: var(--green); }
  .chip-inactive  { background: var(--red-light); color: var(--red); }

  /* ── Mono ── */
  .mono { font-family: var(--mono); font-size: 12.5px; }

  /* ── Empty / Loading ── */
  .acc-empty {
    text-align: center;
    padding: 56px 20px;
    color: var(--text3);
  }
  .acc-empty-icon { font-size: 42px; margin-bottom: 12px; }
  .acc-empty-text { font-size: 14px; margin-bottom: 6px; color: var(--text2); font-weight: 500; }
  .acc-empty-sub  { font-size: 13px; }

  .acc-loading {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; padding: 56px 20px;
    color: var(--text3); font-size: 13px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .acc-spinner {
    width: 18px; height: 18px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }

  /* ── Pagination ── */
  .acc-pager {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    font-size: 12.5px;
    color: var(--text3);
    background: var(--bg3);
  }

  /* ── Modal ── */
  .acc-modal-bg {
    position: fixed; inset: 0;
    background: rgba(17,24,39,0.55);
    backdrop-filter: blur(3px);
    z-index: 200;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
  }
  .acc-modal {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    width: 100%; max-width: 640px;
    max-height: 92vh; overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }
  .acc-modal.wide { max-width: 900px; }
  .acc-modal-hdr {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 22px;
    border-bottom: 1px solid var(--border);
    background: var(--bg2);
    position: sticky; top: 0; z-index: 5;
  }
  .acc-modal-title { font-size: 16px; font-weight: 700; color: var(--text); }
  .acc-modal-close {
    background: none; border: none; color: var(--text3); font-size: 20px;
    cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: all .15s;
    line-height: 1;
  }
  .acc-modal-close:hover { background: var(--bg3); color: var(--text); }
  .acc-modal-body { padding: 22px; }
  .acc-modal-ftr {
    padding: 14px 22px;
    border-top: 1px solid var(--border);
    display: flex; gap: 10px; justify-content: flex-end;
    background: var(--bg3);
  }

  /* ── Form ── */
  .f-row { display: flex; flex-direction: column; gap: 5px; }
  .f-row label { font-size: 12px; font-weight: 600; color: var(--text2); letter-spacing: 0.3px; }
  .f-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .f-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .f-sep { border: none; border-top: 1px solid var(--border); margin: 6px 0; }

  /* ── Alert ── */
  .acc-alert {
    padding: 10px 14px;
    border-radius: var(--radius);
    font-size: 13px;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 12px;
  }
  .acc-alert.ok  { background: var(--green-light); color: var(--green); border: 1px solid #6ee7b7; }
  .acc-alert.err { background: var(--red-light); color: var(--red); border: 1px solid #fca5a5; }

  /* ── Report gate (date picker before data loads) ── */
  .acc-gate {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 24px;
    padding: 80px 40px;
    text-align: center;
  }
  .acc-gate-icon { font-size: 56px; }
  .acc-gate-title { font-size: 22px; font-weight: 700; color: var(--text); }
  .acc-gate-sub { font-size: 14px; color: var(--text2); max-width: 400px; line-height: 1.6; }
  .acc-gate-form {
    display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
    justify-content: center; width: 100%;
  }
  .acc-gate-field { display: flex; flex-direction: column; gap: 6px; text-align: left; }
  .acc-gate-field label { font-size: 12px; font-weight: 600; color: var(--text2); }

  /* ── Professional report layout ── */
  .acc-report {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
  }
  .acc-report-cover {
    background: var(--ink);
    padding: 32px 40px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .acc-report-co { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .acc-report-name { font-size: 14px; color: rgba(255,255,255,0.6); }
  .acc-report-meta { text-align: right; }
  .acc-report-meta-label { font-size: 11px; color: rgba(255,255,255,0.45); margin-bottom: 2px; }
  .acc-report-meta-val { font-size: 14px; font-weight: 500; }

  .acc-report-section { margin: 0; }
  .acc-report-section-hdr {
    background: var(--bg4);
    padding: 10px 24px;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--accent);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .acc-report-row {
    display: grid;
    grid-template-columns: 80px 1fr 1fr auto;
    gap: 0;
    padding: 10px 24px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
    align-items: center;
    transition: background .1s;
  }
  .acc-report-row:hover { background: var(--bg3); }
  .acc-report-row.indent { padding-left: 40px; }
  .acc-report-row.sub {
    background: var(--accent-light);
    font-weight: 700;
    border-top: 2px solid var(--accent-mid);
    font-size: 13px;
  }
  .acc-report-row.sub:hover { background: var(--accent-light); }
  .acc-report-row.grand {
    background: var(--ink);
    color: white;
    font-weight: 700;
    font-size: 14px;
    border-top: none;
  }
  .acc-report-row.grand:hover { background: var(--ink); }
  .acc-report-row .code { font-family: var(--mono); font-size: 12px; color: var(--text3); }
  .acc-report-row .name { color: var(--text); }
  .acc-report-row.sub .name, .acc-report-row.grand .name { font-weight: 700; }
  .acc-report-row .cat { font-size: 11px; color: var(--text3); }
  .acc-report-row .amt {
    text-align: right;
    font-family: var(--mono);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text);
  }
  .acc-report-row.sub .amt { color: var(--accent); }
  .acc-report-row.grand .amt { color: #a7d7b6; }

  /* ── Balance indicator ── */
  .bal-pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600;
    padding: 4px 12px; border-radius: 99px;
  }
  .bal-pill.ok  { background: var(--green-light); color: var(--green); }
  .bal-pill.bad { background: var(--red-light); color: var(--red); }

  /* ── Journal entry table in modal ── */
  .je-lines-tbl {
    width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;
  }
  .je-lines-tbl th {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text3);
    padding: 8px 10px; background: var(--bg3);
    border-bottom: 1px solid var(--border);
    text-align: left;
  }
  .je-lines-tbl th.r { text-align: right; }
  .je-lines-tbl td { padding: 6px 6px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .je-lines-tbl tfoot td {
    background: var(--bg3); font-weight: 700; font-size: 13px;
    padding: 10px 10px; border-top: 2px solid var(--border);
  }
  .je-lines-tbl .acc-input { height: 32px; font-size: 12.5px; }

  .je-balance-bar {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg3); border-radius: var(--radius);
    padding: 10px 14px; margin-top: 10px;
    border: 1px solid var(--border);
    font-size: 13px;
  }
  .je-balance-bar .side { display: flex; align-items: center; gap: 8px; }
  .je-balance-bar .label { color: var(--text2); }
  .je-balance-bar .val { font-family: var(--mono); font-weight: 700; }
  .je-balance-bar .dr { color: var(--sky); }
  .je-balance-bar .cr { color: var(--green); }
  .je-balance-bar .diff.ok { color: var(--green); }
  .je-balance-bar .diff.bad { color: var(--red); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 7px; height: 7px; }
  ::-webkit-scrollbar-track { background: var(--bg3); }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text3); }

  /* ── Account detail breadcrumb ── */
  .acc-breadcrumb {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: var(--text2);
    margin-bottom: 16px;
  }
  .acc-breadcrumb a { color: var(--accent); cursor: pointer; text-decoration: none; font-weight: 500; }
  .acc-breadcrumb a:hover { text-decoration: underline; }

  /* ── Divider with label ── */
  .acc-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 6px 0;
    font-size: 12px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.6px; color: var(--text3);
  }
  .acc-divider::before, .acc-divider::after {
    content: ''; flex: 1; border-top: 1px solid var(--border);
  }
`;
