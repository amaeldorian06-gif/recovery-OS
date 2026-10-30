import React, { useState, useMemo } from 'react';
import { 
  InvoiceRecord, 
  AgingBucket, 
  RiskTier 
} from '../types';
import { formatCurrency } from '../utils/financial';
import { 
  AlertCircle, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronRight, 
  HelpCircle, 
  Mail, 
  Search, 
  CalendarClock,
  DollarSign,
  Layers,
  LayoutGrid,
  List
} from 'lucide-react';

interface PrioritizationTableProps {
  invoices: InvoiceRecord[];
  onOpenActionModal: (invoice: InvoiceRecord) => void;
  onOpenPaymentModal: (invoice: InvoiceRecord) => void;
  onOpenPromiseModal: (invoice: InvoiceRecord) => void;
  onToggleDispute: (invoice: InvoiceRecord) => void;
}

export const PrioritizationTable: React.FC<PrioritizationTableProps> = ({
  invoices,
  onOpenActionModal,
  onOpenPaymentModal,
  onOpenPromiseModal,
  onToggleDispute,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'days'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [forceViewMode, setForceViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  // Filter & Sort Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(inv => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = inv.customerName.toLowerCase().includes(q);
          const matchInv = inv.invoiceNumber.toLowerCase().includes(q);
          if (!matchName && !matchInv) return false;
        }
        if (selectedBucket !== 'all' && inv.agingBucket !== selectedBucket) {
          return false;
        }
        if (selectedTier !== 'all' && inv.riskTier !== selectedTier) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'score') {
          diff = a.riskScore - b.riskScore;
        } else if (sortBy === 'amount') {
          diff = a.outstandingAmount - b.outstandingAmount;
        } else if (sortBy === 'days') {
          diff = a.daysPastDue - b.daysPastDue;
        }
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [invoices, searchQuery, selectedBucket, selectedTier, sortBy, sortOrder]);

  const toggleSort = (col: 'score' | 'amount' | 'days') => {
    if (sortBy === col) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const getTierBadge = (tier: RiskTier) => {
    switch (tier) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const getBucketBadge = (bucket: AgingBucket) => {
    switch (bucket) {
      case '90+':
        return 'bg-rose-900/40 text-rose-300 border-rose-700/40';
      case '61-90':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case '31-60':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case '1-30':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg w-full max-w-full">
      {/* Control & Search Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by debtor company or invoice #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher (Visible on all devices for user choice) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setForceViewMode('auto')}
                title="Automatic responsive mode"
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  forceViewMode === 'auto' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Auto
              </button>
              <button
                onClick={() => setForceViewMode('cards')}
                title="Cards representation"
                className={`p-1 rounded transition-colors ${
                  forceViewMode === 'cards' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setForceViewMode('table')}
                title="Table representation"
                className={`p-1 rounded transition-colors ${
                  forceViewMode === 'table' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Aging Filter */}
            <select
              value={selectedBucket}
              onChange={e => setSelectedBucket(e.target.value)}
              aria-label="Filter by Aging Bracket"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Aging Brackets</option>
              <option value="Current">Current (0d)</option>
              <option value="1-30">1-30 Days</option>
              <option value="31-60">31-60 Days</option>
              <option value="61-90">61-90 Days</option>
              <option value="90+">90+ Days Delinquent</option>
            </select>

            {/* Risk Tier Filter */}
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              aria-label="Filter by Risk Tier"
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Risk Tiers</option>
              <option value="Critical">Critical (75-100)</option>
              <option value="High">High (50-74)</option>
              <option value="Medium">Medium (25-49)</option>
              <option value="Low">Low (0-24)</option>
            </select>
          </div>
        </div>

        {/* Explainability Callout Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 bg-slate-950/70 p-2.5 sm:p-3 rounded-lg border border-slate-800/80 gap-2">
          <div className="flex items-start space-x-2 min-w-0">
            <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Algorithmic Ranking:</strong> Prioritized by overdue velocity, portfolio concentration, broken commitments, and disputes.
            </p>
          </div>
          <span className="font-semibold text-slate-300 whitespace-nowrap text-right text-[11px]">
            {filteredInvoices.length} of {invoices.length} Invoices
          </span>
        </div>
      </div>

      {/* 1. MOBILE RESPONSIVE CARD VIEW (Active on mobile or when cards mode selected) */}
      <div className={`p-3 space-y-3 ${forceViewMode === 'table' ? 'hidden' : forceViewMode === 'cards' ? 'block' : 'block md:hidden'}`}>
        {filteredInvoices.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="font-medium text-slate-300">No matching receivables found</p>
          </div>
        ) : (
          filteredInvoices.map((inv, idx) => {
            const isExpanded = expandedInvoiceId === inv.id;
            return (
              <div 
                key={`card-${inv.id}`}
                className={`bg-slate-950 border rounded-xl p-3.5 space-y-3 transition-colors ${
                  inv.riskTier === 'Critical' ? 'border-rose-900/60' : 'border-slate-800'
                }`}
              >
                {/* Card Top: Rank, Name, Tier */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-100 text-sm truncate">{inv.customerName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">Inv #{inv.invoiceNumber} • Due {inv.dueDate}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getTierBadge(inv.riskTier)}`}>
                      {inv.riskTier} ({inv.riskScore})
                    </span>
                  </div>
                </div>

                {/* Card Middle: Balance and Aging */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Outstanding Balance</span>
                    <span className="font-bold text-slate-100 font-mono text-sm">
                      {formatCurrency(inv.outstandingAmount, inv.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Aging / Delinquency</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className={`text-[11px] px-1.5 py-0.2 rounded font-medium border ${getBucketBadge(inv.agingBucket)}`}>
                        {inv.agingBucket}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {inv.daysPastDue > 0 ? `${inv.daysPastDue}d` : 'Current'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status notes & promised date if present */}
                {inv.promisedPaymentDate && (
                  <div className="text-[11px] text-sky-400 flex items-center space-x-1 bg-sky-950/20 px-2 py-1 rounded border border-sky-800/30">
                    <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                    <span>Promised Date: {inv.promisedPaymentDate}</span>
                  </div>
                )}

                {/* Expandable explainable factors toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                  className="w-full text-left text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center justify-between py-1"
                >
                  <span>{isExpanded ? 'Hide point audit breakdown' : 'Why is this ranked here? (Audit Breakdown)'}</span>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {isExpanded && (
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] space-y-1.5">
                    <span className="font-semibold text-slate-200">Point Score Factors:</span>
                    {inv.riskFactors.map((f, fIdx) => (
                      <div key={fIdx} className="text-slate-300 flex items-start space-x-1.5">
                        <span className="text-indigo-400 font-mono">•</span>
                        <span>{f}</span>
                      </div>
                    ))}
                    <div className="pt-1.5 border-t border-slate-800 flex justify-between text-slate-400 text-[10px]">
                      <span>Contact: {inv.customerEmail}</span>
                      <button
                        onClick={() => onToggleDispute(inv)}
                        className="text-purple-400 underline"
                      >
                        {inv.status === 'disputed' ? 'Clear Dispute' : 'Flag Dispute'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Touch-Friendly Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => onOpenActionModal(inv)}
                    className="py-2 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-1 shadow min-h-[40px]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Notice</span>
                  </button>

                  <button
                    onClick={() => onOpenPaymentModal(inv)}
                    className="py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-emerald-400 font-semibold text-xs flex items-center justify-center space-x-1 min-h-[40px]"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Payment</span>
                  </button>

                  <button
                    onClick={() => onOpenPromiseModal(inv)}
                    className="py-2 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-sky-400 font-semibold text-xs flex items-center justify-center space-x-1 min-h-[40px]"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Promise</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. DESKTOP RICH DATA TABLE (Active on >= md or when table mode selected) */}
      <div className={`overflow-x-auto min-w-0 custom-scrollbar ${forceViewMode === 'cards' ? 'hidden' : forceViewMode === 'table' ? 'block' : 'hidden md:block'}`}>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">Rank</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => toggleSort('score')}
              >
                <div className="flex items-center space-x-1">
                  <span>Priority Risk Score</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">Debtor Account & Invoice #</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => toggleSort('amount')}
              >
                <div className="flex items-center space-x-1">
                  <span>Outstanding Balance</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => toggleSort('days')}
              >
                <div className="flex items-center space-x-1">
                  <span>Aging / Overdue</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </div>
              </th>
              <th className="py-3 px-4">Status & Notes</th>
              <th className="py-3 px-4 text-right min-w-[190px]">Recommended Action</th>
            </tr>
          </thead>

          {filteredInvoices.length === 0 ? (
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="font-medium text-slate-300">No matching receivables found</p>
                  <p className="text-xs text-slate-500 mt-1">Adjust search parameters or clear filters above.</p>
                </td>
              </tr>
            </tbody>
          ) : (
            filteredInvoices.map((inv, idx) => {
              const isExpanded = expandedInvoiceId === inv.id;
              return (
                <tbody key={`tbl-${inv.id}`} className="divide-y divide-slate-800/60">
                  <tr 
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      inv.riskTier === 'Critical' ? 'bg-rose-950/10' : ''
                    }`}
                    onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                  >
                    {/* Priority Rank # */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                    </td>

                    {/* Risk Score Pill with Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 text-right font-mono font-bold text-slate-200">
                          {inv.riskScore}
                        </div>
                        <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full ${
                              inv.riskScore >= 75 ? 'bg-rose-500' :
                              inv.riskScore >= 50 ? 'bg-amber-500' :
                              inv.riskScore >= 25 ? 'bg-yellow-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${inv.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${getTierBadge(inv.riskTier)}`}>
                          {inv.riskTier}
                        </span>
                      </div>
                    </td>

                    {/* Debtor Name & Invoice # */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-semibold text-slate-100 flex items-center space-x-1.5 flex-wrap">
                        <span className="truncate">{inv.customerName}</span>
                        {inv.status === 'disputed' && (
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Disputed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        <span>•</span>
                        <span>Due {inv.dueDate}</span>
                      </div>
                    </td>

                    {/* Outstanding Balance */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100 font-mono">
                        {formatCurrency(inv.outstandingAmount, inv.currency)}
                      </div>
                      {inv.paidAmount > 0 && (
                        <div className="text-[11px] text-emerald-400">
                          {formatCurrency(inv.paidAmount, inv.currency)} paid
                        </div>
                      )}
                    </td>

                    {/* Aging Bracket */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getBucketBadge(inv.agingBucket)}`}>
                          {inv.agingBucket} Days
                        </span>
                        <span className="text-xs text-slate-400">
                          ({inv.daysPastDue > 0 ? `${inv.daysPastDue}d overdue` : 'Current'})
                        </span>
                      </div>
                      {inv.promisedPaymentDate && (
                        <div className="text-[11px] text-sky-400 flex items-center space-x-1 mt-1">
                          <CalendarClock className="w-3 h-3" />
                          <span>Promised: {inv.promisedPaymentDate}</span>
                        </div>
                      )}
                    </td>

                    {/* Status / Notes */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-slate-300 truncate" title={inv.notes || 'No recent notes'}>
                        {inv.disputeReason ? `Dispute: ${inv.disputeReason}` : (inv.notes || 'Standard terms')}
                      </p>
                      <p className="text-[11px] text-indigo-400 mt-0.5 flex items-center space-x-1">
                        <span>View audit breakdown</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </p>
                    </td>

                    {/* Action Triggers */}
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onOpenActionModal(inv)}
                          title="Generate collection notice email/letter"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center space-x-1 shrink-0"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Action Notice</span>
                        </button>

                        <button
                          onClick={() => onOpenPaymentModal(inv)}
                          title="Record full or partial payment"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenPromiseModal(inv)}
                          title="Record promise-to-pay commitment"
                          className="p-1.5 rounded-lg text-slate-300 hover:text-sky-400 hover:bg-slate-800 border border-slate-800 transition-colors shrink-0"
                        >
                          <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Explainability Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-950/90 border-b border-slate-800">
                      <td colSpan={7} className="p-4 pl-12 text-xs">
                        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="font-semibold text-slate-200">
                              Explainable Priority Score Calculation ({inv.riskScore} / 100)
                            </span>
                            <span className="text-slate-400 font-mono">Invoice #{inv.invoiceNumber}</span>
                          </div>
                          <div className="space-y-1.5">
                            {inv.riskFactors.map((factor, fIdx) => (
                              <div key={fIdx} className="flex items-start space-x-2 text-slate-300">
                                <span className="text-indigo-400 font-mono">•</span>
                                <span>{factor}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-slate-400 text-[11px] gap-2">
                            <div>
                              Customer Contact: <span className="text-slate-200 font-mono">{inv.customerEmail}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => onToggleDispute(inv)}
                                className="text-purple-400 hover:underline"
                              >
                                {inv.status === 'disputed' ? 'Clear Dispute Hold' : 'Flag Commercial Dispute'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })
          )}
        </table>
      </div>
    </div>
  );
};
