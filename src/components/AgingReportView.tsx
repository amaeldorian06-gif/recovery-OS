import React, { useMemo } from 'react';
import { InvoiceRecord, AgingBucket } from '../types';
import { formatMoney } from '../utils/money';
import { getCollectionRecoveryFactor } from '../utils/financial';
import { formatDisplayDate, todayISO } from '../utils/dates';
import { FileText, AlertTriangle } from 'lucide-react';

interface AgingReportViewProps {
  invoices: InvoiceRecord[];
}

const BUCKET_ORDER: { key: AgingBucket; label: string; color: string; bar: string; refDays: number }[] = [
  { key: '1-30', label: '1 à 30 jours', color: 'text-[#38BDF8]', bar: 'bg-[#38BDF8]', refDays: 30 },
  { key: '31-60', label: '31 à 60 jours', color: 'text-[#E9AE57]', bar: 'bg-[#E9AE57]', refDays: 60 },
  { key: '61-90', label: '61 à 90 jours', color: 'text-orange-400', bar: 'bg-orange-400', refDays: 90 },
  { key: '90+', label: 'Plus de 90 jours', color: 'text-red-400', bar: 'bg-red-400', refDays: 120 },
];

/**
 * Balance âgée : montants et parts par tranche, estimation CRF explicite,
 * point de contrôle, détail par client.
 */
export const AgingReportView: React.FC<AgingReportViewProps> = ({ invoices }) => {
  const data = useMemo(() => {
    const rows = invoices.filter(i => i.status !== 'paid' && i.daysPastDue > 0 && !i.disputeReason);
    const totals = {} as Record<AgingBucket, number>;
    BUCKET_ORDER.forEach(b => { totals[b.key] = 0; });
    rows.forEach(inv => { totals[inv.agingBucket] += inv.outstandingAmount; });
    const total = rows.reduce((s, i) => s + i.outstandingAmount, 0);

    const crf = BUCKET_ORDER.reduce((s, b) => s + totals[b.key] * getCollectionRecoveryFactor(b.refDays), 0);

    const byCustomer = new Map<string, { name: string; total: number; count: number }>();
    rows.forEach(inv => {
      const cur = byCustomer.get(inv.customerName) ?? { name: inv.customerName, total: 0, count: 0 };
      cur.total += inv.outstandingAmount;
      cur.count += 1;
      byCustomer.set(inv.customerName, cur);
    });
    const topCustomers = [...byCustomer.values()].sort((a, b) => b.total - a.total).slice(0, 5);

    return { rows, totals, total, crf, topCustomers };
  }, [invoices]);

  if (data.rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111726] p-10 text-center text-[#9AAAC0]">
        <FileText className="w-8 h-8 mx-auto mb-2 text-[#6B7D98]" />
        <p className="font-medium text-white">Aucun impayé en cours</p>
        <p className="text-xs mt-1">La balance âgée s'affichera dès qu'une créance dépassera son échéance.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BUCKET_ORDER.map(b => {
          const amount = data.totals[b.key];
          const share = data.total > 0 ? (amount / data.total) * 100 : 0;
          return (
            <div key={b.key} className="rounded-xl border border-white/10 bg-[#111726] p-4">
              <p className="text-xs text-[#9AAAC0]">{b.label}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${b.color}`}>{formatMoney(amount, 'EUR')}</p>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${b.bar}`} style={{ width: `${share}%` }} />
              </div>
              <p className="text-[11px] text-[#6B7D98] mt-1 font-mono">{share.toFixed(1)} % de l'impayé</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-[#9AAAC0]">Total impayé hors litiges</p>
            <p className="text-2xl font-bold font-mono text-red-400">{formatMoney(data.total, 'EUR')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#9AAAC0]">Estimation de recouvrement CRF (heuristique)</p>
            <p className="text-2xl font-bold font-mono text-[#38C995]">{formatMoney(data.crf, 'EUR')}</p>
          </div>
          <p className="text-xs text-[#6B7D98] font-mono">Arrêté au {formatDisplayDate(todayISO())}</p>
        </div>
        <p className="text-[11px] text-[#9AAAC0] bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-[#E9AE57] shrink-0 mt-0.5" />
          L'estimation CRF est une courbe de recouvrement interne (non IFRS 9 / CECL) : elle traduit une expérience
          historique de recouvrement par tranche d'impayé et ne constitue ni une provision réglementaire ni un conseil comptable.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111726] p-5">
        <h3 className="font-semibold text-sm mb-3">Principaux débiteurs</h3>
        <div className="space-y-2">
          {data.topCustomers.map(c => (
            <div key={c.name} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
              <div className="min-w-0">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-[11px] text-[#9AAAC0] font-mono">{c.count} facture{c.count > 1 ? 's' : ''}</p>
              </div>
              <span className="font-mono font-bold">{formatMoney(c.total, 'EUR')}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#111726] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase text-[#9AAAC0]">
              <th className="py-2.5 px-3">Client</th>
              <th className="py-2.5 px-3">Facture</th>
              <th className="py-2.5 px-3">Échéance</th>
              <th className="py-2.5 px-3">Jours de retard</th>
              <th className="py-2.5 px-3">Tranche</th>
              <th className="py-2.5 px-3 text-right">Encours</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map(inv => (
              <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-2 px-3 font-medium">{inv.customerName}</td>
                <td className="py-2 px-3 font-mono">{inv.invoiceNumber}</td>
                <td className="py-2 px-3 font-mono">{inv.dueDate}</td>
                <td className="py-2 px-3 font-mono">{inv.daysPastDue}</td>
                <td className="py-2 px-3">
                  <span className={`px-1.5 py-0.5 rounded border ${
                    inv.agingBucket === '90+' ? 'border-red-500/30 text-red-400 bg-red-500/10'
                    : inv.agingBucket === '61-90' ? 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                    : inv.agingBucket === '31-60' ? 'border-[#E9AE57]/30 text-[#E9AE57] bg-[#E9AE57]/10'
                    : 'border-[#38BDF8]/30 text-[#38BDF8] bg-[#38BDF8]/10'
                  }`}>{inv.agingBucket}</span>
                </td>
                <td className="py-2 px-3 text-right font-mono font-bold">{formatMoney(inv.outstandingAmount, inv.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
