import React from 'react';
import { FinancialMetrics } from '../types';
import { formatCurrency } from '../utils/financial';
import { 
  AlertTriangle, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  HelpCircle 
} from 'lucide-react';

interface MetricsHeaderProps {
  metrics: FinancialMetrics;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ metrics }) => {
  return (
    <div className="space-y-3 w-full max-w-full">
      {/* Top Warning Banner if Multi-Currency exists */}
      {metrics.currencySummary && Object.keys(metrics.currencySummary).length > 1 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs p-3 rounded-xl flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-relaxed">
              <strong>Multi-Currency Portfolio:</strong> Multiple currencies detected in current import (
              {Object.entries(metrics.currencySummary)
                .map(([cur, amt]) => `${cur} ${amt.toLocaleString()}`)
                .join(', ')}
              ). Metrics displayed in native currency balances without synthetic conversion.
            </span>
          </div>
        </div>
      )}

      {/* Primary 4-KPI Responsive Grid (selected sections removed per user request) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">

        {/* 5. Disputed Invoices */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 hover:border-slate-700 transition-colors min-w-0">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">In Dispute</span>
            <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-300 tracking-tight truncate font-mono">
            {formatCurrency(metrics.disputedAmount)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-purple-500/80 mt-1 truncate">
            {metrics.disputedCount} reconciliation holds
          </p>
        </div>

        {/* 6. Confirmed Cash Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 hover:border-slate-700 transition-colors min-w-0">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium truncate">Cash Collected</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-300 tracking-tight truncate font-mono">
            {formatCurrency(metrics.confirmedPayments)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-500/80 mt-1 truncate">
            {metrics.paidCount} settled in full
          </p>
        </div>
      </div>

      {/* DSO Summary Strip */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 sm:py-2.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="font-semibold text-slate-300">Days Sales Outstanding (DSO):</span>
          <span className="font-bold text-indigo-400 text-sm">
            {metrics.dsoValue !== null ? `${metrics.dsoValue} Days` : 'N/A'}
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="text-slate-400 text-[11px]">{metrics.dsoNotes}</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500">
          Strict segregation: Promises are never booked as collected cash.
        </div>
      </div>
    </div>
  );
};
