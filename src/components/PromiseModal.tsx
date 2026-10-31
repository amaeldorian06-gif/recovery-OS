import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { addDaysISO, todayISO } from '../utils/dates';
import { X, CalendarClock, AlertTriangle } from 'lucide-react';

interface PromiseModalProps {
  invoice: InvoiceRecord;
  onSubmit: (invoice: InvoiceRecord, date: string, amount: number) => void;
  onClose: () => void;
}

/**
 * Engagement de règlement (promesse de paiement) : date et montant,
 * archivé dans le suivi et intégré au score de risque.
 */
export const PromiseModal: React.FC<PromiseModalProps> = ({ invoice, onSubmit, onClose }) => {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState(invoice.outstandingAmount.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { setError('Choisissez une date.'); return; }
    if (date <= todayISO()) { setError('La date doit être postérieure à aujourd’hui.'); return; }
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) { setError('Le montant doit être positif.'); return; }
    setError('');
    onSubmit(invoice, date, parsedAmount);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-[#111726] border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Enregistrer un engagement de règlement"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#38BDF8]" />
            Engagement — {invoice.invoiceNumber}
          </h3>
          <button onClick={onClose} className="text-[#6B7D98] hover:text-white" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4 text-xs">
          <p className="text-[#9AAAC0]">Client : <span className="text-white font-medium">{invoice.customerName}</span></p>
          <p className="text-[#9AAAC0] mt-0.5">Encours : <span className="text-[#E9AE57] font-mono font-bold">{invoice.outstandingAmount.toFixed(2)} €</span></p>
          {invoice.promisedPaymentDate && (
            <p className="text-[#38BDF8] mt-0.5">Engagement en cours : {invoice.promisedPaymentDate}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1">Date convenue de règlement *</label>
            <input
              type="date" required value={date} min={addDaysISO(todayISO(), 1)} autoFocus
              onChange={e => { setDate(e.target.value); setError(''); }}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1">Montant promis (€) *</label>
            <input
              type="text" inputMode="decimal" required value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
          <p className="text-[11px] text-[#9AAAC0] bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Un engagement tenu améliore le profil de paiement du client ; un engagement rompu augmente fortement son score de risque.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm font-semibold hover:bg-white/10">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#38BDF8] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#2563EB]/25">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
