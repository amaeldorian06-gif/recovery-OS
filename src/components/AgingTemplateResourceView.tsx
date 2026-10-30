import React, { useState } from 'react';
import { Download, FileSpreadsheet, Copy, Check, Table, HelpCircle } from 'lucide-react';
import { SAMPLE_CSV_TEMPLATE } from '../data/sampleReceivables';

export const AgingTemplateResourceView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleDownloadTemplate = () => {
    const csvContent = SAMPLE_CSV_TEMPLATE;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Revenue_Recovery_AR_Aging_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyFormulas = () => {
    const formulas = `EXCEL / GOOGLE SHEETS AR AGING FORMULAS:
Reference Cells:
- Due Date: Column D (e.g. D2)
- Total Invoice Balance: Column E (e.g. E2)
- As-Of Reference Date: $Z$1 or TODAY()

1. Days Past Due:
=MAX(0, TODAY() - D2)

2. Current (Not Due Yet):
=IF(D2 >= TODAY(), E2, 0)

3. 1 - 30 Days Overdue:
=IF(AND(TODAY() - D2 >= 1, TODAY() - D2 <= 30), E2, 0)

4. 31 - 60 Days Overdue:
=IF(AND(TODAY() - D2 >= 31, TODAY() - D2 <= 60), E2, 0)

5. 61 - 90 Days Overdue:
=IF(AND(TODAY() - D2 >= 61, TODAY() - D2 <= 90), E2, 0)

6. 90+ Days Overdue:
=IF(TODAY() - D2 > 90, E2, 0)`;
    navigator.clipboard.writeText(formulas);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <span>Accounts Receivable Aging Spreadsheet Template & Formulas</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Free, production-grade template with tested Excel / Google Sheets formulas, structured fields, and sample data.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyFormulas}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Formulas Copied!' : 'Copy Formulas'}</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1.5 shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Preview Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-1.5">
          <Table className="w-4 h-4 text-indigo-400" />
          <span>Interactive Template Schema & Live Sample Data</span>
        </h3>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">A: Invoice #</th>
                <th className="py-2.5 px-3">B: Customer Name</th>
                <th className="py-2.5 px-3">C: Issue Date</th>
                <th className="py-2.5 px-3">D: Due Date</th>
                <th className="py-2.5 px-3">E: Total Amount</th>
                <th className="py-2.5 px-3">F: Current</th>
                <th className="py-2.5 px-3">G: 1-30d</th>
                <th className="py-2.5 px-3">H: 31-60d</th>
                <th className="py-2.5 px-3">I: 61-90d</th>
                <th className="py-2.5 px-3 text-rose-400">J: 90+d</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-indigo-300 font-semibold">INV-2026-881</td>
                <td className="py-2 px-3 text-slate-200 font-sans">Apex Logistics Global</td>
                <td className="py-2 px-3 text-slate-400">2026-06-15</td>
                <td className="py-2 px-3 text-slate-400">2026-07-15</td>
                <td className="py-2 px-3 font-bold text-slate-100">$34,500.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 font-bold text-rose-400">$34,500.00</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-indigo-300 font-semibold">INV-2026-904</td>
                <td className="py-2 px-3 text-slate-200 font-sans">Nexa Growth Partners</td>
                <td className="py-2 px-3 text-slate-400">2026-07-30</td>
                <td className="py-2 px-3 text-slate-400">2026-08-30</td>
                <td className="py-2 px-3 font-bold text-slate-100">$15,200.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 font-semibold text-amber-400">$15,200.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-indigo-300 font-semibold">INV-2026-945</td>
                <td className="py-2 px-3 text-slate-200 font-sans">Vanguard Advisory</td>
                <td className="py-2 px-3 text-slate-400">2026-09-02</td>
                <td className="py-2 px-3 text-slate-400">2026-10-02</td>
                <td className="py-2 px-3 font-bold text-slate-100">$14,800.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 font-semibold text-yellow-400">$14,800.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-indigo-300 font-semibold">INV-2026-982</td>
                <td className="py-2 px-3 text-slate-200 font-sans">Horizon Media Works</td>
                <td className="py-2 px-3 text-slate-400">2026-10-15</td>
                <td className="py-2 px-3 text-slate-400">2026-11-15</td>
                <td className="py-2 px-3 font-bold text-slate-100">$28,000.00</td>
                <td className="py-2 px-3 font-semibold text-emerald-400">$28,000.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
                <td className="py-2 px-3 text-slate-500">$0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula Documentation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-slate-200">Standard Formula Implementation Guide</h4>
          <p className="text-slate-400">
            Copy and paste these exact dynamic formulas into row 2 of your spreadsheet and drag downwards:
          </p>
          <div className="bg-slate-950 p-3 rounded-lg font-mono text-indigo-300 space-y-2 border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-500">Column F (Current Balance):</div>
              <code>=IF(D2 &gt;= TODAY(), E2, 0)</code>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Column G (1-30 Days Past Due):</div>
              <code>=IF(AND(TODAY()-D2 &gt;= 1, TODAY()-D2 &lt;= 30), E2, 0)</code>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Column H (31-60 Days Past Due):</div>
              <code>=IF(AND(TODAY()-D2 &gt;= 31, TODAY()-D2 &lt;= 60), E2, 0)</code>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Column J (90+ Days Delinquent):</div>
              <code>=IF(TODAY()-D2 &gt; 90, E2, 0)</code>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-slate-200">Why Spreadsheets Alone Break Down</h4>
          <p className="text-slate-400">
            While static spreadsheets group invoices by date, they fail to prioritize collection actions:
          </p>
          <ul className="space-y-2 text-slate-300 list-disc list-inside">
            <li>
              <strong>No concentration weighting:</strong> A $50,000 overdue invoice at 32 days carries far higher existential risk than a $200 invoice at 95 days.
            </li>
            <li>
              <strong>No broken promise tracking:</strong> Spreadsheets don't highlight when an AP manager promised payment on Friday and failed to wire.
            </li>
            <li>
              <strong>No communication workflow:</strong> Manual cut-and-paste into Gmail causes follow-up gaps and delayed recovery.
            </li>
          </ul>
          <div className="pt-2 text-indigo-400 font-semibold">
            Revenue Recovery OS transforms this static data into explainable, daily prioritized actions.
          </div>
        </div>
      </div>
    </div>
  );
};
