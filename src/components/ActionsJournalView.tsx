import React from 'react';
import { ActionRecord } from '../storage/types';
import { InvoiceRecord } from '../types';
import { Send, CalendarClock, Mail } from 'lucide-react';

interface ActionsJournalViewProps {
  actions: ActionRecord[];
  invoices: InvoiceRecord[];
  onOpenAction: (invoice: InvoiceRecord) => void;
}

const TONE_LABEL: Record<ActionRecord['tone'], string> = {
  courteous: 'Courtois',
  firm: 'Ferme',
  formal: 'Formel',
  legal: 'Légal',
};

/**
 * Journal des actions de recouvrement : historique complet + relances programmées.
 * Comble le vide historique du produit (les actions étaient enregistrées
 * mais jamais affichées).
 */
export const ActionsJournalView: React.FC<ActionsJournalViewProps> = ({ actions, invoices, onOpenAction }) => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = actions.filter(a => a.followUpDate && a.followUpDate >= today);
  const overdueFollowUps = actions.filter(a => a.followUpDate && a.followUpDate < today);

  const groupByInvoice = new Map<string, ActionRecord[]>();
  for (const action of actions) {
    const list = groupByInvoice.get(action.invoiceId) ?? [];
    list.push(action);
    groupByInvoice.set(action.invoiceId, list);
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Actions de recouvrement</h1>
        <p className="text-[13px] text-[#9AAAC0] mt-0.5">
          Historique complet des relances et échéances de suivi programmées.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-[#111726] p-4">
          <span className="text-[13px] text-[#9AAAC0]">Actions enregistrées</span>
          <div className="text-xl font-bold font-mono mt-1">{actions.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111726] p-4">
          <span className="text-[13px] text-[#9AAAC0]">Suivis programmés</span>
          <div className="text-xl font-bold font-mono mt-1 text-[#38BDF8]">{upcoming.length}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111726] p-4">
          <span className="text-[13px] text-[#9AAAC0]">Suivis à faire aujourd'hui</span>
          <div className={`text-xl font-bold font-mono mt-1 ${overdueFollowUps.length > 0 ? 'text-[#E9AE57]' : 'text-[#38C995]'}`}>
            {overdueFollowUps.length}
          </div>
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111726] p-10 text-center space-y-3">
          <Send className="w-8 h-8 text-[#6B7D98] mx-auto" />
          <p className="text-sm text-[#9AAAC0]">
            Aucune action enregistrée pour l'instant. Ouvrez une facture depuis le tableau de bord
            et générez une relance pour alimenter le journal.
          </p>
          {invoices.length > 0 && (
            <button
              onClick={() => onOpenAction(invoices[0])}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
            >
              Relancer « {invoices[0].customerName} »
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#111726] divide-y divide-white/5">
          {Array.from(groupByInvoice.entries()).map(([invoiceId, list]) => {
            const invoice = invoices.find(i => i.id === invoiceId);
            return (
              <div key={invoiceId} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-sm">{list[0].customerName}</span>
                    <span className="text-xs text-[#6B7D98] font-mono ml-2">#{list[0].invoiceNumber}</span>
                  </div>
                  {invoice && (
                    <button
                      onClick={() => onOpenAction(invoice)}
                      className="text-xs text-[#38BDF8] hover:underline cursor-pointer"
                    >
                      Nouvelle relance
                    </button>
                  )}
                </div>
                <ul className="space-y-2">
                  {list.map(action => (
                    <li key={action.id} className="p-3 rounded-lg bg-[#0B0F17] border border-white/5 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#6B7D98]" />
                          <span className="font-medium">{action.subject}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#9AAAC0]">
                            {TONE_LABEL[action.tone]}
                          </span>
                        </span>
                        <span className="text-[11px] font-mono text-[#6B7D98]">{action.createdAt.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      {action.followUpDate && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8]">
                          <CalendarClock className="w-3.5 h-3.5" />
                          Suivi prévu le {action.followUpDate}
                        </span>
                      )}
                      <p className="text-xs text-[#9AAAC0]">{action.outcome}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
