import React, { useState } from 'react';
import { InvoiceRecord } from '../types';
import { formatCurrency } from '../utils/financial';
import { DollarSign, X, CheckCircle2 } from 'lucide-react';

interface PaymentModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onRecordPayment: (invoiceId: string, amount: number, reference: string, date: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  onClose,
  onRecordPayment,
}) => {
  const [amount, setAmount] = useState<number>(invoice.outstandingAmount);
  const [reference, setReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-10-29');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Payment amount must be greater than $0');
      return;
    }
    onRecordPayment(invoice.id, amount, reference || 'Bank Wire / ACH Settlement', paymentDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 truncate">Record Confirmed Payment</h3>
              <p className="text-xs text-slate-400 truncate">{invoice.customerName} • Inv #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">Payment Amount Received</label>
              <span className="text-slate-500">
                Outstanding: {formatCurrency(invoice.outstandingAmount, invoice.currency)}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.outstandingAmount}
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setAmount(invoice.outstandingAmount)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white"
              >
                Pay in Full (100%)
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.round((invoice.outstandingAmount / 2) * 100) / 100)}
                className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 hover:text-white"
              >
                50% Installment
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payment Method / Remittance Reference</label>
            <input
              type="text"
              placeholder="e.g. Wire Ref #883921 / Check #4401"
              value={reference}
              onChange={e => setReference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Settlement Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-300 text-[11px]">
            Confirmed payments directly increase collected cash metrics and reduce balance exposure.
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 sm:py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-1 shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Record Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
