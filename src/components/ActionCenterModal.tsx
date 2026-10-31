import React, { useState, useEffect } from 'react';
import { InvoiceRecord } from '../types';
import { X, Mail, CalendarClock, AlertTriangle } from 'lucide-react';

interface ActionCenterModalProps {
  invoice: InvoiceRecord;
  onSubmit: (invoice: InvoiceRecord, type: string, notes: string, channel: string, scheduledDate: string) => void;
  onClose: () => void;
}

const ACTION_TYPES: { value: string; label: string }[] = [
  { value: 'relance_courtoise', label: 'Relance courtoise' },
  { value: 'relance_formelle', label: 'Relance formelle' },
  { value: 'appel_telephonique', label: 'Appel téléphonique' },
  { value: 'mise_en_demeure', label: 'Mise en demeure' },
  { value: 'autre', label: 'Autre' },
];

const CHANNELS: { value: string; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'courrier', label: 'Courrier' },
  { value: 'interne', label: 'Note interne' },
];

/**
 * Relance client : type d'action, canal, notes structurées, date d'échéance
 * de suivi. Chaque action est journalisée et rejouable dans l'historique.
 */
export const ActionCenterModal: React.FC<ActionCenterModalProps> = ({ invoice, onSubmit, onClose }) => {
  const [actionType, setActionType] = useState('relance_courtoise');
  const [notes, setNotes] = useState('');
  const [channel, setChannel] = useState('email');
  const [scheduledDate, setScheduledDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) { setError('Décrivez le motif ou le contenu de la relance.'); return; }
    setError('');
    onSubmit(invoice, actionType, notes.trim(), channel, scheduledDate);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-[#111726] border border-white/10 rounded-xl p-5 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Programmer une relance"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2563EB]" />
            Relance — {invoice.invoiceNumber}
          </h3>
          <button onClick={onClose} className="text-[#6B7D98] hover:text-white" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 mb-4 text-xs space-y-0.5">
          <p className="text-[#9AAAC0]">Client : <span className="text-white font-medium">{invoice.customerName}</span></p>
          {invoice.customerEmail && (
            <p className="text-[#9AAAC0]">Contact : <span className="font-mono">{invoice.customerEmail}</span></p>
          )}
          <p className="text-[#E9AE57] font-mono">Encours {invoice.outstandingAmount.toFixed(2)} € · {invoice.daysPastDue} jours de retard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9AAAC0] block mb-1">Type d'action *</label>
              <select value={actionType} onChange={e => setActionType(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]">
                {ACTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#9AAAC0] block mb-1">Canal</label>
              <select value={channel} onChange={e => setChannel(e.target.value)}
                className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]">
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1">Motif / notes structurées *</label>
            <textarea
              rows={4} required value={notes} autoFocus
              onChange={e => { setNotes(e.target.value); setError(''); }}
              placeholder="Objet : facture FA-2026-014 · Rappel d'échéance du JJ/MM/AAAA · Demande de date de règlement..."
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2563EB] resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-[#9AAAC0] block mb-1 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> Date de suivi (optionnel)
            </label>
            <input
              type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#2563EB]"
            />
            {scheduledDate && (
              <p className="text-[11px] text-[#38BDF8] mt-1">
                Un rappel apparaîtra sur le tableau de bord tant que l'action n'est pas soldée.
              </p>
            )}
          </div>
          {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2.5 text-sm font-semibold hover:bg-white/10">
              Annuler
            </button>
            <button type="submit" className="flex-1 bg-[#2563EB] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#1D4ED8]">
              Journaliser l'action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
