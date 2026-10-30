import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { parseAmount } from '../utils/money';
import { X, DollarSign, AlertTriangle } from 'lucide-react';

interface PaymentModalProps {
  invoice: InvoiceRecord;
  onSubmit: (invoice: InvoiceRecord, amount: number, date: string, method: string, reference: string) => void;
  onClose: () => void;
}

/**
 * Enregistrement d'un encaissement : montant contrôlé sur l'encours,
 * référence et mode de paiement pour le journal financier.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onSubmit, onClose }) => {
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('virement');
  const [reference, setReference] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseAmount(amount);
    if (!parsed.ok) {
      setAmountError(parsed.reason ?? 'Montant illisible.');
      return;
    }
    if (parsed.value <= 0) {
      setAmountError('Le montant doit être strictement positif.');
      return;
    }
    if (parsed.value > invoice.outstandingAmount + 0.005) {
      setAmountError(`Le montant dépasse l'encours restant (${invoice.outstandingAmount.toFixed(2)} €).`);
      return;
    }
    setAmountError('');
    onSubmit(invoice, parsed.value, paymentDate, method, reference.trim());
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-[#111726] border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Enregistrer un encaissement"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#38C995]" />
            Encaissement — {invoice.invoiceNumber}
          </h3>
          <button onClick={onClose} className="text-[#6B7D98] hover:text-white" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4 text-xs">
          <p className="text-[#9AAAC0]">Client : <span className="text-white font-medium">{invoice.customerName}</span></p>
          <p className="text-[#9AAAC0] mt-0.5">Encours restant : <span className="text-[#E9AE57] font-mono font-bold">{invoice.outstandingAmount.toFixed(2)} €</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1">Montant encaissé (€) *</label>
            <input
              type="text" inputMode="decimal" required autoFocus
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmountError(''); }}
              placeholder="1500,50"
              className={`w-full bg-[#0B0F17] border rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none ${amountError ? 'border-red-500' : 'border-white/10 focus:border-[#38C995]'}`}
            />
            {amountError && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {amountError}</p>}
          </div>
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1">Date de l'encaissement *</label>
            <input
              type="date" required value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#38C995]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9AAAC0] block mb-1">Mode de paiement</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#38C995]">
                <option value="virement">Virement</option>
                <option value="cheque">Chèque</option>
                <option value="carte">Carte</option>
                <option value="especes">Espèces</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9AAAC0] block mb-1">Référence (N° opération)</label>
              <input
                type="text" value={reference} onChange={e => setReference(e.target.value)}
                placeholder="Ex. VIR-2026-0042"
                className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#38C995]"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#9AAAC0] bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            L'encaissement est écrit dans le journal financier ; le reste dû et les indicateurs sont recalculés immédiatement.
          </p>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm font-semibold hover:bg-white/10">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-[#38C995]/15 border border-[#38C995]/30 text-[#38C995] rounded-lg py-2.5 text-sm font-semibold hover:bg-[#38C995]/25">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
