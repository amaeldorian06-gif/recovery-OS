import React from 'react';
import { FinancialMetrics } from '../types';
import { formatMoney } from '../utils/money';
import { AlertTriangle, CheckCircle, CalendarClock, ShieldAlert } from 'lucide-react';

interface MetricsHeaderProps {
  metrics: FinancialMetrics;
}

/**
 * Bandeau de KPI — 4 indicateurs principaux + DSO.
 * Décision produit : l'encours total et l'encours en retard sont de retour,
 * ils constituent les repères primaires d'un responsable recouvrement.
 */
export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ metrics }) => {
  const currencies = Object.keys(metrics.currencySummary || {});

  const cards = [
    {
      label: 'Encours total',
      value: formatMoney(metrics.totalReceivables),
      detail: `${metrics.invoiceCount - metrics.paidCount} facture(s) non soldée(s)`,
      icon: ShieldAlert,
      tone: 'text-[#38BDF8]',
      bg: 'bg-[#38BDF8]/10',
    },
    {
      label: 'Impayés (hors litiges)',
      value: formatMoney(metrics.totalOverdue),
      detail: `${metrics.overdueCount} facture(s) en retard`,
      icon: AlertTriangle,
      tone: 'text-[#E9AE57]',
      bg: 'bg-[#E9AE57]/10',
    },
    {
      label: 'Litiges en cours',
      value: formatMoney(metrics.disputedAmount),
      detail: `${metrics.disputedCount} réconciliation(s)`,
      icon: ShieldAlert,
      tone: 'text-[#D946EF]',
      bg: 'bg-[#D946EF]/10',
    },
    {
      label: 'Encaissements confirmés',
      value: formatMoney(metrics.confirmedPayments),
      detail: `${metrics.paidCount} facture(s) soldée(s)`,
      icon: CheckCircle,
      tone: 'text-[#38C995]',
      bg: 'bg-[#38C995]/10',
    },
  ];

  return (
    <div className="space-y-3">
      {currencies.length > 1 && (
        <div className="bg-[#E9AE57]/10 border border-[#E9AE57]/20 text-[#E9AE57] text-[13px] p-3 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Portefeuille multi-devises : {currencies.map(c => `${c} ${Math.round(metrics.currencySummary[c]).toLocaleString('fr-FR')}`).join(' · ')}.
            Les totaux ne sont jamais additionnés entre devises.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-white/10 bg-[#111726] p-4 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[#9AAAC0] truncate">{card.label}</span>
                <span className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.tone}`} />
                </span>
              </div>
              <div className={`text-xl font-bold font-mono tracking-tight truncate ${card.tone}`}>{card.value}</div>
              <p className="text-[11px] text-[#6B7D98] mt-1 truncate">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111726] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[13px]">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarClock className="w-4 h-4 text-[#38BDF8]" />
          <span className="font-semibold">DSO (Days Sales Outstanding) :</span>
          <span className="font-bold text-[#38BDF8]">{metrics.dsoValue !== null ? `${metrics.dsoValue} jours` : 'N/A'}</span>
          <span className="text-[#6B7D98] text-xs">{metrics.dsoNotes}</span>
        </div>
        <span className="text-[11px] text-[#6B7D98]">
          Promesses de règlement suivies séparément : {formatMoney(metrics.promisedPayments)} — jamais comptées comme du cash.
        </span>
      </div>
    </div>
  );
};
