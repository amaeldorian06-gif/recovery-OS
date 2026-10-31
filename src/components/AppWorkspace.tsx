import React, { useMemo, useState } from 'react';
import { InvoiceRecord } from '../types';
import { useApp } from '../app/AppContext';
import { MetricsHeader } from './MetricsHeader';
import { PrioritizationTable } from './PrioritizationTable';
import { CsvImportView } from './CsvImportView';
import { AgingReportView } from './AgingReportView';
import { OverdueCalculatorView } from './OverdueCalculatorView';
import { BackupView } from './BackupView';
import { PaymentModal } from './PaymentModal';
import { PromiseModal } from './PromiseModal';
import { ActionCenterModal } from './ActionCenterModal';
import { ActionsJournalView } from './ActionsJournalView';
import { calculateFinancialMetrics } from '../utils/financial';
import { exportInvoicesToCsv } from '../utils/csv';
import { PLAN_DETAILS } from '../storage/license';
import {
  BarChart3, UploadCloud, FileText, Calculator, Send, HardDrive, Settings as SettingsIcon,
  Download, LogOut, Building, Users, KeyRound, ExternalLink, Menu, X, ShieldCheck, History,
} from 'lucide-react';

export type WorkspaceSection =
  | 'dashboard' | 'import' | 'aging' | 'calculator' | 'actions' | 'backup' | 'settings';

interface AppWorkspaceProps {
  section: WorkspaceSection;
  onNavigateSection: (section: WorkspaceSection) => void;
  onExitToPublic: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'import', label: 'Importer un CSV', icon: UploadCloud },
  { id: 'aging', label: 'Balance âgée', icon: FileText },
  { id: 'actions', label: 'Actions de recouvrement', icon: Send },
  { id: 'calculator', label: 'Coût du retard', icon: Calculator },
  { id: 'backup', label: 'Sauvegarde', icon: HardDrive },
  { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
];

/**
 * Coquille de l'application privée.
 * Décision UX : sobre, structurée, orientée productivité (fond plat #0B0F17,
 * cartes denses, aucune animation décorative). L'habillage « cosmic glass »
 * est réservé au site public.
 */
export const AppWorkspace: React.FC<AppWorkspaceProps> = ({ section, onNavigateSection, onExitToPublic }) => {
  const {
    user, organization, invoices, actions, history, settings, license, mode, busy,
    recordPayment, recordPromise, setDispute, saveAction, signOut,
  } = useApp();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRecord | null>(null);
  const [promiseInvoice, setPromiseInvoice] = useState<InvoiceRecord | null>(null);
  const [actionInvoice, setActionInvoice] = useState<InvoiceRecord | null>(null);

  const metrics = useMemo(
    () => calculateFinancialMetrics(invoices, { periodCreditSales: settings?.creditSales90d }),
    [invoices, settings?.creditSales90d]
  );

  const handleExport = () => {
    if (invoices.length === 0) return;
    const csv = exportInvoicesToCsv(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recovery-os-${organization?.id ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const TONE_BY_TYPE: Record<string, 'courteous' | 'firm' | 'formal' | 'legal'> = {
    relance_courtoise: 'courteous',
    relance_formelle: 'firm',
    appel_telephonique: 'courteous',
    mise_en_demeure: 'legal',
    autre: 'firm',
  };

  const handleAction = async (
    invoice: InvoiceRecord,
    actionType: string,
    notes: string,
    channel: string,
    scheduledDate: string,
  ) => {
    await saveAction({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      actionType,
      tone: TONE_BY_TYPE[actionType] ?? 'firm',
      subject: `Relance ${actionType.replace(/_/g, ' ')} — ${invoice.invoiceNumber}`,
      body: notes,
      recipient: invoice.customerEmail || invoice.customerName,
      outcome: `Action ${channel} journalisée`,
      followUpDate: scheduledDate || undefined,
    });
    setActionInvoice(null);
  };

  const nav = (
    <>
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-wider text-[#38BDF8] uppercase font-semibold">
            Espace local
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/5 text-[#9AAAC0] border border-white/10">
            {mode === 'demo' ? 'démo' : user?.role}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#151B2B] border border-white/10 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
            {(organization?.name ?? '??').substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold truncate">{organization?.name}</div>
            <div className="text-[11px] text-[#9AAAC0] truncate">{user?.fullName}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onNavigateSection(item.id); setMobileNavOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors cursor-pointer ${
                active ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#9AAAC0] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#6B7D98]'}`} />
              <span>{item.label}</span>
              {item.id === 'dashboard' && invoices.length > 0 && (
                <span className={`ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-white/10 text-[#9AAAC0]'}`}>
                  {invoices.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/10 space-y-1">
        <button
          onClick={handleExport}
          disabled={invoices.length === 0 || busy}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#9AAAC0] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exporter en CSV
        </button>
        <button
          onClick={onExitToPublic}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#9AAAC0] hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Site public
        </button>
        {mode !== 'demo' && (
          <button
            onClick={() => { void signOut().then(onExitToPublic); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[#9AAAC0] hover:text-rose-400 hover:bg-white/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0F17] text-[#E6EAF2]">
      <aside className="hidden md:flex flex-col w-60 border-r border-white/10 shrink-0 select-none">
        {nav}
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 flex">
          <div className="w-72 bg-[#0B0F17] border-r border-white/15 h-full flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="font-bold text-sm">Menu</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-1 text-[#9AAAC0]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">{nav}</div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="md:hidden flex items-center justify-between p-3 border-b border-white/10">
          <button onClick={() => setMobileNavOpen(true)} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs">
            <Menu className="w-4 h-4" /> Navigation
          </button>
          <span className="text-xs text-[#9AAAC0] truncate max-w-[50%]">{organization?.name}</span>
        </div>

        <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto w-full">

          {section === 'dashboard' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Portefeuille de créances</h1>
                  <p className="text-[13px] text-[#9AAAC0] mt-0.5">
                    Priorisation recalculée aujourd'hui · tranche d'encours · engagements et litiges suivis
                  </p>
                </div>
                <button
                  onClick={() => onNavigateSection('import')}
                  className="px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Importer un fichier
                </button>
              </div>
              <MetricsHeader metrics={metrics} />
              <PrioritizationTable
                invoices={invoices}
                onOpenActionModal={setActionInvoice}
                onOpenPaymentModal={setPaymentInvoice}
                onOpenPromiseModal={setPromiseInvoice}
                onToggleDispute={(inv) => { void setDispute(inv.id, inv.status !== 'disputed'); }}
              />
            </>
          )}

          {section === 'import' && (
            <CsvImportView onDone={() => onNavigateSection('dashboard')} />
          )}

          {section === 'aging' && <AgingReportView invoices={invoices} />}

          {section === 'actions' && <ActionsJournalView actions={actions} invoices={invoices} onOpenAction={setActionInvoice} />}

          {section === 'calculator' && <OverdueCalculatorView />}

          {section === 'backup' && <BackupView />}

          {section === 'settings' && (
            <div className="space-y-5 max-w-3xl">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-[13px] text-[#9AAAC0] mt-0.5">Organisation, licence locale et journal d'activité.</p>
              </div>

              <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Building className="w-4 h-4 text-[#38BDF8]" /> Organisation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/5">
                    <span className="text-[#6B7D98] block text-xs">Nom</span>
                    <span className="font-medium">{organization?.name}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/5">
                    <span className="text-[#6B7D98] block text-xs">Identifiant local</span>
                    <span className="font-mono text-xs">{organization?.id}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/5">
                    <span className="text-[#6B7D98] block text-xs">Utilisateur</span>
                    <span className="font-medium">{user?.fullName} ({user?.email})</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/5">
                    <span className="text-[#6B7D98] block text-xs">Devise par défaut</span>
                    <span className="font-medium">{settings?.defaultCurrency ?? 'EUR'}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-[#38C995]" /> Licence</h3>
                {license ? (
                  <div className="text-[13px] space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#38C995]/15 text-[#38C995] border border-[#38C995]/30 text-xs font-semibold">
                        {license.label}
                      </span>
                      <span className="font-mono text-xs text-[#9AAAC0]">{license.key}</span>
                    </div>
                    <p className="text-xs text-[#9AAAC0]">
                      Activée le {license.activatedAt} · {license.seats} poste(s) · {PLAN_DETAILS[license.plan].priceMonthly} €/mois après l'essai.
                    </p>
                    <p className="text-xs text-[#6B7D98] flex items-start gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Activation locale de confort : cette clé vérifie sa propre cohérence et mémorise votre plan.
                      Ce n'est pas un contrôle serveur inviolable — nos offres fonctionnent sans vérification en ligne.
                    </p>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#9AAAC0]">Aucune licence active.</p>
                )}
              </section>

              <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4 text-[#D946EF]" /> Journal d'activité</h3>
                {history.length === 0 ? (
                  <p className="text-[13px] text-[#9AAAC0]">Aucune activité enregistrée.</p>
                ) : (
                  <ul className="space-y-1.5 text-[13px] max-h-72 overflow-y-auto">
                    {history.map(h => (
                      <li key={h.id} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-[#0B0F17] border border-white/5">
                        <span>{h.summary}</span>
                        <span className="text-[11px] text-[#6B7D98] font-mono shrink-0">{h.at.slice(0, 16).replace('T', ' ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-[#E9AE57]" /> Données locales</h3>
                <p className="text-[13px] text-[#9AAAC0]">
                  {invoices.length} facture(s) · {actions.length} action(s) de recouvrement · stockage IndexedDB de cet appareil.
                  {mode === 'demo' && ' Mode démonstration actif : rien n\'est persisté.'}
                </p>
              </section>
            </div>
          )}
        </div>
      </main>

      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSubmit={async (invoice, amount, date, method, reference) => {
            const ref = reference ? `${reference} (${method})` : method;
            await recordPayment(invoice.id, { amount, paidDate: date, reference: ref });
            setPaymentInvoice(null);
          }}
        />
      )}

      {promiseInvoice && (
        <PromiseModal
          invoice={promiseInvoice}
          onClose={() => setPromiseInvoice(null)}
          onSubmit={async (invoice, date, amount) => {
            await recordPromise(invoice.id, { promisedDate: date, notes: `Engagement de ${amount.toFixed(2)} €` });
            setPromiseInvoice(null);
          }}
        />
      )}

      {actionInvoice && (
        <ActionCenterModal
          invoice={actionInvoice}
          onClose={() => setActionInvoice(null)}
          onSubmit={(invoice, actionType, notes, channel, scheduledDate) =>
            void handleAction(invoice, actionType, notes, channel, scheduledDate)}
        />
      )}
    </div>
  );
};
