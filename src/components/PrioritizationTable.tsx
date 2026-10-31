import React, { useMemo, useState } from 'react';
import { InvoiceRecord, AgingBucket, RiskTier } from '../types';
import { formatMoney } from '../utils/money';
import { AlertCircle, ArrowUpDown, ChevronDown, ChevronRight, HelpCircle, Mail, Search, CalendarClock, DollarSign, LayoutGrid, List, ShieldAlert } from 'lucide-react';

interface PrioritizationTableProps {
  invoices: InvoiceRecord[];
  onOpenActionModal: (invoice: InvoiceRecord) => void;
  onOpenPaymentModal: (invoice: InvoiceRecord) => void;
  onOpenPromiseModal: (invoice: InvoiceRecord) => void;
  onToggleDispute: (invoice: InvoiceRecord) => void;
}

const TIER_STYLE: Record<RiskTier, string> = {
  Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  High: 'bg-[#E9AE57]/10 text-[#E9AE57] border-[#E9AE57]/20',
  Medium: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20',
  Low: 'bg-[#38C995]/10 text-[#38C995] border-[#38C995]/20',
};

const BUCKET_STYLE: Record<AgingBucket, string> = {
  '90+': 'bg-red-500/15 text-red-300 border-red-500/30',
  '61-90': 'bg-red-500/10 text-red-400 border-red-500/20',
  '31-60': 'bg-[#E9AE57]/10 text-[#E9AE57] border-[#E9AE57]/20',
  '1-30': 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20',
  Current: 'bg-white/5 text-[#9AAAC0] border-white/10',
};

/**
 * File de priorisation : tri par score de risque recalculé du jour,
 * filtres par tranche d'aging et niveau, tiroir d'explication du score.
 */
export const PrioritizationTable: React.FC<PrioritizationTableProps> = ({
  invoices, onOpenActionModal, onOpenPaymentModal, onOpenPromiseModal, onToggleDispute,
}) => {
  const [search, setSearch] = useState('');
  const [bucket, setBucket] = useState('all');
  const [tier, setTier] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'amount' | 'days'>('score');
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter(inv => {
        if (q && !inv.customerName.toLowerCase().includes(q) && !inv.invoiceNumber.toLowerCase().includes(q)) return false;
        if (bucket !== 'all' && inv.agingBucket !== bucket) return false;
        if (tier !== 'all' && inv.riskTier !== tier) return false;
        return true;
      })
      .sort((a, b) => {
        const diff =
          sortBy === 'score' ? a.riskScore - b.riskScore
          : sortBy === 'amount' ? a.outstandingAmount - b.outstandingAmount
          : a.daysPastDue - b.daysPastDue;
        return sortDesc ? -diff : diff;
      });
  }, [invoices, search, bucket, tier, sortBy, sortDesc]);

  const toggleSort = (col: 'score' | 'amount' | 'days') => {
    if (sortBy === col) setSortDesc(v => !v);
    else { setSortBy(col); setSortDesc(true); }
  };

  const cardList = (
    <div className={`p-3 space-y-3 ${viewMode === 'table' ? 'hidden' : 'block md:hidden'}`}>
      {rows.length === 0 ? (
        <EmptyState />
      ) : rows.map((inv, idx) => (
        <div key={inv.id} className={`rounded-xl border p-3.5 space-y-3 bg-[#0B0F17] ${inv.riskTier === 'Critical' ? 'border-red-500/30' : 'border-white/10'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono font-bold text-[#6B7D98]">#{idx + 1}</span>
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">{inv.customerName}</h4>
                <p className="text-[11px] text-[#9AAAC0] font-mono">#{inv.invoiceNumber} · échéance {inv.dueDate}</p>
              </div>
            </div>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${TIER_STYLE[inv.riskTier]}`}>
              {inv.riskTier} ({inv.riskScore})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-lg border border-white/5 text-xs">
            <div>
              <span className="text-[#9AAAC0] text-[10px] block">Encours</span>
              <span className="font-bold font-mono">{formatMoney(inv.outstandingAmount, inv.currency)}</span>
            </div>
            <div>
              <span className="text-[#9AAAC0] text-[10px] block">Retard</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[11px] px-1.5 py-0.5 rounded border ${BUCKET_STYLE[inv.agingBucket]}`}>{inv.agingBucket}</span>
                <span className="text-[#9AAAC0] text-[11px]">{inv.daysPastDue > 0 ? `${inv.daysPastDue} j` : 'à jour'}</span>
              </div>
            </div>
          </div>

          {inv.promisedPaymentDate && (
            <div className="text-[11px] text-[#38BDF8] flex items-center gap-1 bg-[#38BDF8]/5 px-2 py-1 rounded border border-[#38BDF8]/20">
              <CalendarClock className="w-3.5 h-3.5" /> Engagement de règlement : {inv.promisedPaymentDate}
            </div>
          )}
          {inv.status === 'disputed' && (
            <div className="text-[11px] text-[#D946EF] flex items-center gap-1 bg-[#D946EF]/5 px-2 py-1 rounded border border-[#D946EF]/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Litige : {inv.disputeReason || 'à clarifier'}
            </div>
          )}

          <button
            onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
            className="w-full text-left text-[11px] text-[#38BDF8] hover:underline flex items-center justify-between py-1"
          >
            <span>{expandedId === inv.id ? 'Masquer le détail' : 'Pourquoi ce rang ? (détail du score)'}</span>
            {expandedId === inv.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {expandedId === inv.id && <AuditDrawer inv={inv} onToggleDispute={onToggleDispute} />}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button onClick={() => onOpenActionModal(inv)} className="py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1 min-h-[40px]">
              <Mail className="w-3.5 h-3.5" /> Relancer
            </button>
            <button onClick={() => onOpenPaymentModal(inv)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1 min-h-[40px]">
              <DollarSign className="w-3.5 h-3.5" /> Encaisser
            </button>
            <button onClick={() => onOpenPromiseModal(inv)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-1 min-h-[40px]">
              <CalendarClock className="w-3.5 h-3.5" /> Promesse
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const table = (
    <div className={`overflow-x-auto ${viewMode === 'cards' ? 'hidden' : 'hidden md:block'}`}>
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#0B0F17] text-[11px] uppercase text-[#9AAAC0]">
              <th className="py-2.5 px-3 text-center w-12">Rang</th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('score')}>
                <span className="flex items-center gap-1">Score <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-2.5 px-3">Client / facture</th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('amount')}>
                <span className="flex items-center gap-1">Encours <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('days')}>
                <span className="flex items-center gap-1">Retard <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="py-2.5 px-3">Engagement / litige</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          {rows.map((inv, idx) => (
            <tbody key={inv.id} className="border-b border-white/5">
              <tr
                className="hover:bg-white/5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
              >
                <td className="py-2.5 px-3 text-center text-xs font-mono font-bold text-[#6B7D98]">#{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold w-8 text-right">{inv.riskScore}</span>
                    <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full ${inv.riskScore >= 75 ? 'bg-red-500' : inv.riskScore >= 50 ? 'bg-[#E9AE57]' : inv.riskScore >= 25 ? 'bg-[#38BDF8]' : 'bg-[#38C995]'}`}
                        style={{ width: `${inv.riskScore}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${TIER_STYLE[inv.riskTier]}`}>{inv.riskTier}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 min-w-[180px]">
                  <div className="font-semibold flex items-center gap-1.5 flex-wrap">
                    <span className="truncate max-w-[200px]">{inv.customerName}</span>
                    {inv.status === 'disputed' && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#D946EF]/15 text-[#D946EF] border border-[#D946EF]/30">Litige</span>}
                    {inv.status === 'paid' && <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#38C995]/15 text-[#38C995] border border-[#38C995]/30">Soldée</span>}
                  </div>
                  <div className="text-xs text-[#9AAAC0] font-mono">{inv.invoiceNumber} · éch. {inv.dueDate}</div>
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <div className="font-bold font-mono">{formatMoney(inv.outstandingAmount, inv.currency)}</div>
                  {inv.paidAmount > 0 && <div className="text-[11px] text-[#38C995] font-mono">{formatMoney(inv.paidAmount, inv.currency)} réglé</div>}
                </td>
                <td className="py-2.5 px-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-0.5 rounded border ${BUCKET_STYLE[inv.agingBucket]}`}>{inv.agingBucket}</span>
                  <span className="text-xs text-[#9AAAC0] ml-1.5 font-mono">{inv.daysPastDue > 0 ? `${inv.daysPastDue} j` : 'à jour'}</span>
                </td>
                <td className="py-2.5 px-3 text-xs max-w-[180px]">
                  {inv.promisedPaymentDate && <div className="text-[#38BDF8] flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {inv.promisedPaymentDate}</div>}
                  {inv.disputeReason && <div className="text-[#D946EF] truncate" title={inv.disputeReason}>{inv.disputeReason}</div>}
                  {!inv.promisedPaymentDate && !inv.disputeReason && <span className="text-[#6B7D98]">—</span>}
                </td>
                <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => onOpenActionModal(inv)} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> Relancer
                    </button>
                    <button onClick={() => onOpenPaymentModal(inv)} title="Enregistrer un encaissement" className="p-1.5 rounded-lg border border-white/10 hover:text-[#38C995]">
                      <DollarSign className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onOpenPromiseModal(inv)} title="Enregistrer une promesse" className="p-1.5 rounded-lg border border-white/10 hover:text-[#38BDF8]">
                      <CalendarClock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedId === inv.id && (
                <tr>
                  <td colSpan={7} className="p-3 pl-10">
                    <AuditDrawer inv={inv} onToggleDispute={onToggleDispute} />
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </table>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#111726] overflow-hidden">
      <div className="p-3 border-b border-white/10 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7D98]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client ou un numéro de facture…"
            className="w-full bg-[#0B0F17] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#0B0F17] border border-white/10 rounded-lg p-0.5">
            {(['auto', 'cards', 'table'] as const).map(mode => (
              <button
                key={mode} onClick={() => setViewMode(mode)}
                className={`px-2 py-1 rounded text-xs ${viewMode === mode ? 'bg-white/10 text-[#38BDF8]' : 'text-[#9AAAC0]'}`}
              >
                {mode === 'auto' ? 'Auto' : mode === 'cards' ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
          <select value={bucket} onChange={e => setBucket(e.target.value)} aria-label="Tranche d'aging"
            className="bg-[#0B0F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#2563EB]">
            <option value="all">Toutes tranches</option>
            <option value="Current">À jour</option>
            <option value="1-30">1 à 30 jours</option>
            <option value="31-60">31 à 60 jours</option>
            <option value="61-90">61 à 90 jours</option>
            <option value="90+">Plus de 90 jours</option>
          </select>
          <select value={tier} onChange={e => setTier(e.target.value)} aria-label="Niveau de risque"
            className="bg-[#0B0F17] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#2563EB]">
            <option value="all">Tous niveaux</option>
            <option value="Critical">Critique (75-100)</option>
            <option value="High">Élevé (50-74)</option>
            <option value="Medium">Modéré (25-49)</option>
            <option value="Low">Faible (0-24)</option>
          </select>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center justify-between text-xs text-[#9AAAC0] bg-[#0B0F17] border-b border-white/10">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
          Classement recalculé aujourd'hui : ancienneté de l'impayé, concentration, engagements tenus ou rompus, litiges.
        </span>
        <span className="font-mono">{rows.length} / {invoices.length}</span>
      </div>

      {cardList}
      {table}
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="py-12 text-center text-[#9AAAC0]">
    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#6B7D98]" />
    <p className="font-medium">Aucune créance correspondante</p>
    <p className="text-xs text-[#6B7D98] mt-1">Importez un fichier CSV ou ajustez les filtres.</p>
  </div>
);

const AuditDrawer: React.FC<{ inv: InvoiceRecord; onToggleDispute: (inv: InvoiceRecord) => void }> = ({ inv, onToggleDispute }) => (
  <div className="p-3 rounded-lg bg-[#111726] border border-white/10 text-xs space-y-2">
    <div className="flex items-center justify-between border-b border-white/10 pb-2">
      <span className="font-semibold">Détail du score ({inv.riskScore} / 100)</span>
      <span className="text-[#9AAAC0] font-mono">#{inv.invoiceNumber}</span>
    </div>
    <ul className="space-y-1">
      {inv.riskFactors.length === 0 && <li className="text-[#9AAAC0]">Aucun facteur de risque actif.</li>}
      {inv.riskFactors.map((factor, i) => (
        <li key={i} className="flex items-start gap-2 text-[#E6EAF2]">
          <span className="text-[#38BDF8] font-mono">•</span><span>{factor}</span>
        </li>
      ))}
    </ul>
    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[#9AAAC0]">
      <span>Contact : <span className="font-mono">{inv.customerEmail || '—'}</span></span>
      <button onClick={() => onToggleDispute(inv)} className="text-[#D946EF] hover:underline cursor-pointer">
        {inv.status === 'disputed' ? 'Clôturer le litige' : 'Déclarer un litige'}
      </button>
    </div>
  </div>
);
