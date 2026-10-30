import React, { useState, useMemo } from 'react';
import { InvoiceRecord } from '../types';
import { formatCurrency } from '../utils/financial';
import { FileText, Download, ChevronRight, ChevronDown, PieChart } from 'lucide-react';
import { sanitizeCsvCell } from '../utils/csv';

interface AgingReportViewProps {
  invoices: InvoiceRecord[];
}

export const AgingReportView: React.FC<AgingReportViewProps> = ({ invoices }) => {
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Group by customer and compute aging buckets
  const customerAging = useMemo(() => {
    const map = new Map<string, {
      customerName: string;
      email: string;
      current: number;
      b1_30: number;
      b31_60: number;
      b61_90: number;
      b90Plus: number;
      totalOutstanding: number;
      invoices: InvoiceRecord[];
    }>();

    invoices.forEach(inv => {
      if (inv.status === 'paid') return;
      const outstanding = inv.outstandingAmount;
      if (outstanding <= 0) return;

      const existing = map.get(inv.customerName) || {
        customerName: inv.customerName,
        email: inv.customerEmail,
        current: 0,
        b1_30: 0,
        b31_60: 0,
        b61_90: 0,
        b90Plus: 0,
        totalOutstanding: 0,
        invoices: [],
      };

      existing.totalOutstanding += outstanding;
      existing.invoices.push(inv);

      switch (inv.agingBucket) {
        case 'Current':
          existing.current += outstanding;
          break;
        case '1-30':
          existing.b1_30 += outstanding;
          break;
        case '31-60':
          existing.b31_60 += outstanding;
          break;
        case '61-90':
          existing.b61_90 += outstanding;
          break;
        case '90+':
          existing.b90Plus += outstanding;
          break;
      }

      map.set(inv.customerName, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalOutstanding - a.totalOutstanding);
  }, [invoices]);

  // Totals across all customers
  const portfolioTotals = useMemo(() => {
    const totals = {
      current: 0,
      b1_30: 0,
      b31_60: 0,
      b61_90: 0,
      b90Plus: 0,
      totalOutstanding: 0,
    };
    customerAging.forEach(c => {
      totals.current += c.current;
      totals.b1_30 += c.b1_30;
      totals.b31_60 += c.b31_60;
      totals.b61_90 += c.b61_90;
      totals.b90Plus += c.b90Plus;
      totals.totalOutstanding += c.totalOutstanding;
    });
    return totals;
  }, [customerAging]);

  const handleExportAgingCsv = () => {
    const headers = ['Customer Name', 'Current (0d)', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total Outstanding'];
    const rows = customerAging.map(c => [
      sanitizeCsvCell(c.customerName),
      c.current.toFixed(2),
      c.b1_30.toFixed(2),
      c.b31_60.toFixed(2),
      c.b61_90.toFixed(2),
      c.b90Plus.toFixed(2),
      c.totalOutstanding.toFixed(2),
    ]);

    rows.push([
      'TOTAL PORTFOLIO',
      portfolioTotals.current.toFixed(2),
      portfolioTotals.b1_30.toFixed(2),
      portfolioTotals.b31_60.toFixed(2),
      portfolioTotals.b61_90.toFixed(2),
      portfolioTotals.b90Plus.toFixed(2),
      portfolioTotals.totalOutstanding.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AR_Aging_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pct = (val: number) => {
    if (portfolioTotals.totalOutstanding <= 0) return '0%';
    return `${Math.round((val / portfolioTotals.totalOutstanding) * 100)}%`;
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>AR Aging Matrix (Audit Standard)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classified across 5 aging brackets per accounting standards (ASC 310 / CECL framework).
          </p>
        </div>
        <button
          onClick={handleExportAgingCsv}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center space-x-1.5 shadow transition-colors w-full sm:w-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Aging Matrix CSV</span>
        </button>
      </div>

      {/* Portfolio Aging Composition Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-1">
          <span className="font-semibold flex items-center space-x-1.5">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Portfolio Aging Distribution</span>
          </span>
          <span className="font-bold text-slate-100">
            Total Outstanding: {formatCurrency(portfolioTotals.totalOutstanding)}
          </span>
        </div>

        {/* Multi-Segment Color Bar */}
        <div className="w-full h-3 sm:h-4 rounded-lg bg-slate-950 overflow-hidden flex">
          <div style={{ width: pct(portfolioTotals.current) }} className="bg-emerald-500" title={`Current: ${pct(portfolioTotals.current)}`} />
          <div style={{ width: pct(portfolioTotals.b1_30) }} className="bg-yellow-500" title={`1-30d: ${pct(portfolioTotals.b1_30)}`} />
          <div style={{ width: pct(portfolioTotals.b31_60) }} className="bg-amber-500" title={`31-60d: ${pct(portfolioTotals.b31_60)}`} />
          <div style={{ width: pct(portfolioTotals.b61_90) }} className="bg-rose-500" title={`61-90d: ${pct(portfolioTotals.b61_90)}`} />
          <div style={{ width: pct(portfolioTotals.b90Plus) }} className="bg-rose-800" title={`90+d: ${pct(portfolioTotals.b90Plus)}`} />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs pt-1">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
            <span className="text-slate-400 truncate">Current: {formatCurrency(portfolioTotals.current)} ({pct(portfolioTotals.current)})</span>
          </div>
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 shrink-0" />
            <span className="text-slate-400 truncate">1-30d: {formatCurrency(portfolioTotals.b1_30)} ({pct(portfolioTotals.b1_30)})</span>
          </div>
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
            <span className="text-slate-400 truncate">31-60d: {formatCurrency(portfolioTotals.b31_60)} ({pct(portfolioTotals.b31_60)})</span>
          </div>
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" />
            <span className="text-slate-400 truncate">61-90d: {formatCurrency(portfolioTotals.b61_90)} ({pct(portfolioTotals.b61_90)})</span>
          </div>
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-800 shrink-0" />
            <span className="text-slate-400 truncate">90+d: {formatCurrency(portfolioTotals.b90Plus)} ({pct(portfolioTotals.b90Plus)})</span>
          </div>
        </div>
      </div>

      {/* MOBILE AGING CARDS (< md) */}
      <div className="md:hidden space-y-3">
        {customerAging.map(c => {
          const isExpanded = expandedCustomer === c.customerName;
          return (
            <div key={`mobile-aging-${c.customerName}`} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedCustomer(isExpanded ? null : c.customerName)}
              >
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{c.customerName}</h4>
                  <p className="text-[11px] text-slate-400">{c.invoices.length} Invoices</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-100 text-sm block">
                    {formatCurrency(c.totalOutstanding)}
                  </span>
                  <span className="text-[10px] text-indigo-400 flex items-center justify-end">
                    {isExpanded ? 'Hide' : 'Details'}
                    {isExpanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronRight className="w-3 h-3 ml-0.5" />}
                  </span>
                </div>
              </div>

              {/* Bucket chips */}
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                {c.current > 0 && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Current: {formatCurrency(c.current)}
                  </span>
                )}
                {c.b1_30 > 0 && (
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    1-30d: {formatCurrency(c.b1_30)}
                  </span>
                )}
                {c.b31_60 > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    31-60d: {formatCurrency(c.b31_60)}
                  </span>
                )}
                {c.b61_90 > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    61-90d: {formatCurrency(c.b61_90)}
                  </span>
                )}
                {c.b90Plus > 0 && (
                  <span className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-300 border border-rose-700/50 font-bold">
                    90+d: {formatCurrency(c.b90Plus)}
                  </span>
                )}
              </div>

              {/* Expanded invoices drawer */}
              {isExpanded && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                  {c.invoices.map(inv => (
                    <div key={inv.id} className="bg-slate-950 p-2 rounded flex justify-between text-slate-300">
                      <span>Inv #{inv.invoiceNumber} (Due {inv.dueDate})</span>
                      <span className="font-bold text-slate-100 font-mono">{formatCurrency(inv.outstandingAmount, inv.currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP AGING TABLE (>= md) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
        <div className="overflow-x-auto min-w-0 custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-4 text-right">Current (0d)</th>
                <th className="py-3 px-4 text-right">1-30 Days</th>
                <th className="py-3 px-4 text-right">31-60 Days</th>
                <th className="py-3 px-4 text-right">61-90 Days</th>
                <th className="py-3 px-4 text-right text-rose-400">90+ Days</th>
                <th className="py-3 px-4 text-right font-bold text-slate-200">Total Outstanding</th>
              </tr>
            </thead>
            {customerAging.map(c => {
              const isExpanded = expandedCustomer === c.customerName;
              return (
                <tbody key={`desktop-aging-${c.customerName}`} className="divide-y divide-slate-800/60 font-mono">
                  <tr
                    onClick={() => setExpandedCustomer(isExpanded ? null : c.customerName)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-sans font-medium text-slate-100 flex items-center space-x-2">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{c.customerName}</span>
                      <span className="text-[11px] text-slate-500">({c.invoices.length} inv)</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{c.current > 0 ? formatCurrency(c.current) : '-'}</td>
                    <td className="py-3 px-4 text-right text-yellow-400/90">{c.b1_30 > 0 ? formatCurrency(c.b1_30) : '-'}</td>
                    <td className="py-3 px-4 text-right text-amber-400/90">{c.b31_60 > 0 ? formatCurrency(c.b31_60) : '-'}</td>
                    <td className="py-3 px-4 text-right text-rose-400/90">{c.b61_90 > 0 ? formatCurrency(c.b61_90) : '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400">{c.b90Plus > 0 ? formatCurrency(c.b90Plus) : '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100">{formatCurrency(c.totalOutstanding)}</td>
                  </tr>

                  {/* Customer Invoices Sub-table */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80">
                      <td colSpan={7} className="p-3 pl-10">
                        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                              <tr>
                                <th className="py-1.5 px-3">Invoice #</th>
                                <th className="py-1.5 px-3">Issue Date</th>
                                <th className="py-1.5 px-3">Due Date</th>
                                <th className="py-1.5 px-3">Days Past Due</th>
                                <th className="py-1.5 px-3 text-right">Outstanding</th>
                                <th className="py-1.5 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {c.invoices.map(inv => (
                                <tr key={inv.id}>
                                  <td className="py-1.5 px-3 font-semibold text-slate-300">{inv.invoiceNumber}</td>
                                  <td className="py-1.5 px-3 text-slate-400">{inv.issueDate}</td>
                                  <td className="py-1.5 px-3 text-slate-400">{inv.dueDate}</td>
                                  <td className="py-1.5 px-3 text-slate-300">{inv.daysPastDue > 0 ? `${inv.daysPastDue}d overdue` : 'Current'}</td>
                                  <td className="py-1.5 px-3 text-right font-bold text-slate-200">{formatCurrency(inv.outstandingAmount, inv.currency)}</td>
                                  <td className="py-1.5 px-3 text-center">
                                    <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                      {inv.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
            {/* Table Footer Totals */}
            <tfoot className="bg-slate-950 border-t-2 border-slate-800 font-mono font-bold text-slate-200">
              <tr>
                <td className="py-3 px-4 font-sans uppercase">Total AR Portfolio</td>
                <td className="py-3 px-4 text-right text-emerald-400">{formatCurrency(portfolioTotals.current)}</td>
                <td className="py-3 px-4 text-right text-yellow-400">{formatCurrency(portfolioTotals.b1_30)}</td>
                <td className="py-3 px-4 text-right text-amber-400">{formatCurrency(portfolioTotals.b31_60)}</td>
                <td className="py-3 px-4 text-right text-rose-400">{formatCurrency(portfolioTotals.b61_90)}</td>
                <td className="py-3 px-4 text-right text-rose-400">{formatCurrency(portfolioTotals.b90Plus)}</td>
                <td className="py-3 px-4 text-right text-slate-100 text-sm font-extrabold">{formatCurrency(portfolioTotals.totalOutstanding)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
