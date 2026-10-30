import React, { useState } from 'react';
import { InvoiceRecord } from '../types';
import { formatCurrency } from '../utils/financial';
import { CalendarClock, X, Check, AlertCircle } from 'lucide-react';

interface PromiseModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onSavePromise: (invoiceId: string, promisedDate: string, notes: string) => void;
}

export const PromiseModal: React.FC<PromiseModalProps> = ({
  invoice,
  onClose,
  onSavePromise,
}) => {
  const [promisedDate, setPromisedDate] = useState(invoice.promisedPaymentDate || '2026-11-15');
  const [promiseNotes, setPromiseNotes] = useState(
    invoice.notes ? `Promised payment: ${invoice.notes}` : 'Client controller verbally committed to remit payment.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePromise(invoice.id, promisedDate, promiseNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarClock className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 truncate">Record Promise-to-Pay</h3>
              <p className="text-xs text-slate-400 truncate">{invoice.customerName} • {formatCurrency(invoice.outstandingAmount, invoice.currency)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Promised Settlement Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={promisedDate}
              onChange={e => setPromisedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Debtor Commitment Notes
            </label>
            <textarea
              rows={3}
              value={promiseNotes}
              onChange={e => setPromiseNotes(e.target.value)}
              placeholder="e.g. Discussed with AP supervisor; check queued for release on next Friday run."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-lg text-sky-300 text-[11px] flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
            <div>
              <strong>Financial Segregation Rule:</strong> This promise will be tracked under Promised Commitments. It will <em>never</em> be counted as cash collected until an actual payment receipt is recorded.
            </div>
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
              className="px-4 py-2 sm:py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center justify-center space-x-1 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Save Commitment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
