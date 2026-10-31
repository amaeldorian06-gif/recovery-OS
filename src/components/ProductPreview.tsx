import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../app/AppContext';
import { buildDemoInvoices } from '../storage/seed';
import { calculateFinancialMetrics } from '../utils/financial';
import { ActionRecord } from '../storage/types';
import { MetricsHeader } from './MetricsHeader';
import { PrioritizationTable } from './PrioritizationTable';
import { AgingReportView } from './AgingReportView';
import { ActionsJournalView } from './ActionsJournalView';
import { OverdueCalculatorView } from './OverdueCalculatorView';
import {
  BarChart3, FileText, Send, UploadCloud, Calculator, HardDrive,
  Eye, ArrowRight, Lock, MonitorPlay, X, CalendarClock,
} from 'lucide-react';

interface ProductPreviewProps {
  onNavigate: (path: string) => void;
}

type PreviewTab = 'dashboard' | 'aging' | 'actions' | 'import' | 'calculator' | 'backup';

const TABS: Array<{ id: PreviewTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { id: 'aging', label: 'Balance âgée', icon: FileText },
  { id: 'actions', label: 'Journal des relances', icon: Send },
  { id: 'import', label: 'Import CSV', icon: UploadCloud },
  { id: 'calculator', label: 'Coût du retard', icon: Calculator },
  { id: 'backup', label: 'Sauvegarde', icon: HardDrive },
];

/**
 * Module d'aperçu public du produit.
 *
 * Garantie de conception (directive « la démo ne doit jamais modifier les
 * données réelles ») :
 *  - Aucun accès au Repository, à IndexedDB ni aux sessions ;
 *  - Données = jeu d'exemple construit à la volée (pur, non persisté) ;
 *  - Les commandes de l'application sont neutralisées : toute action tente
 *    d'ouvrir un compte ou la démonstration interactive complète ;
 *  - Le calculateur est actif car il est 100 % pur (aucune persistance).
 */
export const ProductPreview: React.FC<ProductPreviewProps> = ({ onNavigate }) => {
  const { startDemo } = useApp();
  const [tab, setTab] = useState<PreviewTab>('dashboard');
  const [notice, setNotice] = useState<string | null>(null);

  const invoices = useMemo(() => buildDemoInvoices(), []);
  const metrics = useMemo(() => calculateFinancialMetrics(invoices), [invoices]);

  const demoActions = useMemo<ActionRecord[]>(() => {
    const day = 86_400_000;
    const iso = (offsetDays: number) => new Date(Date.now() - offsetDays * day).toISOString();
    const futureIso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString().slice(0, 10);
    const pick = (num: string) => invoices.find(i => i.invoiceNumber === num)!;
    const base = (inv: (typeof invoices)[number], extra: Partial<ActionRecord>): ActionRecord => ({
      id: `prev-${inv.id}-${extra.actionType}`,
      organizationId: 'org-apercu',
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName,
      actionType: 'relance_courtoise',
      tone: 'courteous',
      subject: `Relance — ${inv.invoiceNumber}`,
      body: 'Rappel d’échéance envoyé au service comptable.',
      recipient: inv.customerEmail,
      outcome: 'E-mail de relance envoyé.',
      createdAt: iso(3),
      ...extra,
    });
    return [
      base(pick('FA-2026-0142'), {
        actionType: 'relance_formelle', tone: 'firm',
        subject: 'Relance formelle — FA-2026-0142',
        outcome: 'Courrier formel envoyé, accusé de réception attendu.',
        createdAt: iso(6),
      }),
      base(pick('FA-2026-0142'), {
        actionType: 'appel_telephonique', tone: 'courteous',
        subject: 'Appel — FA-2026-0142',
        outcome: 'Le client promet un virement sous 8 jours.',
        createdAt: iso(2), followUpDate: futureIso(4),
      }),
      base(pick('FA-2026-0171'), {
        actionType: 'mise_en_demeure', tone: 'legal',
        subject: 'Mise en demeure — FA-2026-0171',
        outcome: 'Mise en demeure remise en main propre.',
        createdAt: iso(1), followUpDate: futureIso(10),
      }),
      base(pick('FA-2026-0158'), {
        actionType: 'relance_courtoise', tone: 'courteous',
        subject: 'Relance courtoise — FA-2026-0158',
        outcome: 'E-mail envoyé, en attente du solde de 15 200 €.',
        createdAt: iso(1), followUpDate: futureIso(2),
      }),
    ];
  }, [invoices]);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const blocked = (message: string) => setNotice(message);

  const startInteractiveDemo = () => {
    startDemo();
    onNavigate('/app/dashboard');
  };

  return (
    <div className="text-[#E6EAF2]">
      <div className="max-w-6xl mx-auto px-5 pt-12 pb-6">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#38C995]/30 bg-[#38C995]/10 text-xs text-[#38C995] font-semibold mb-5">
          <Eye className="w-3.5 h-3.5" /> Aperçu statique · aucune donnée réelle
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          Prenez le poste de pilotage en main
        </h1>
        <p className="text-[#9AAAC0] max-w-2xl leading-relaxed text-sm md:text-base">
          Explorez les écrans de l'application sur un portefeuille d'exemple calculé à la volée.
          Rien n'est lu ni écrit sur cet appareil : les commandes de l'application sont
          neutralisées dans cet aperçu.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigate('/inscription')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] font-bold shadow-lg shadow-[#2563EB]/25 flex items-center justify-center gap-2 hover:opacity-95"
          >
            Créer mon espace local <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={startInteractiveDemo}
            className="px-6 py-3 rounded-xl border border-white/15 bg-white/5 font-semibold text-[#C7D2E5] hover:bg-white/10 flex items-center justify-center gap-2"
          >
            <MonitorPlay className="w-4 h-4" /> Ouvrir la démonstration interactive
          </button>
        </div>
        <p className="mt-3 text-xs text-[#6B7D98] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          La démonstration interactive utilise une base mémoire éphémère — vos données éventuelles restent intactes.
        </p>
      </div>

      {/* Fenêtre produit */}
      <div className="max-w-6xl mx-auto px-5 pb-16">
        <div className="rounded-2xl border border-white/10 bg-[#070912] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          {/* Chrome de navigateur */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0B0F17] border-b border-white/10">
            <div className="flex gap-1.5 shrink-0" aria-hidden>
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex-1 min-w-0 flex justify-center">
              <span className="text-[11px] font-mono px-3 py-1 rounded-md bg-[#070B20] border border-white/10 text-[#6B7D98] truncate max-w-full">
                recovery-os.fr/apercu — aperçu du produit
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E9AE57]/15 border border-[#E9AE57]/30 text-[#E9AE57] shrink-0">
              Lecture seule
            </span>
          </div>

          <div className="flex min-h-[620px]">
            {/* Rail latéral (reflet du rail applicatif) */}
            <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-white/10 bg-[#0B0F17] py-3">
              <div className="px-4 pb-3 mb-1 border-b border-white/10">
                <span className="text-[10px] font-mono tracking-wider text-[#38BDF8] uppercase font-semibold">
                  Espace d'exemple
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-lg bg-[#151B2B] border border-white/10 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                    EX
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">Cabinet Exemple SARL</div>
                    <div className="text-[11px] text-[#9AAAC0] truncate">jeu de démonstration</div>
                  </div>
                </div>
              </div>
              <nav className="px-2 space-y-0.5">
                {TABS.map(item => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30 font-semibold'
                          : 'text-[#9AAAC0] hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto px-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-[#6B7D98] leading-relaxed">
                  Aperçu fidèle de l'interface. Les actions y sont neutralisées.
                </p>
              </div>
            </aside>

            {/* Zone de contenu */}
            <div className="flex-1 min-w-0 bg-[#070B20] p-4 md:p-6">
              {/* Sélecteur mobile */}
              <div className="md:hidden mb-4">
                <select
                  value={tab}
                  onChange={e => setTab(e.target.value as PreviewTab)}
                  aria-label="Section de l'aperçu"
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-lg px-3 py-2.5 text-sm"
                >
                  {TABS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {tab === 'dashboard' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold tracking-tight">Portefeuille de créances</h2>
                      <p className="text-[12px] text-[#9AAAC0] mt-0.5">
                        Priorisation recalculée aujourd'hui sur le portefeuille d'exemple
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('/inscription')}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
                    >
                      Importer un fichier (dans votre espace)
                    </button>
                  </div>
                  <MetricsHeader metrics={metrics} />
                  <PrioritizationTable
                    invoices={invoices}
                    onOpenActionModal={() => blocked('Aperçu statique : créez votre espace pour journaliser une relance.')}
                    onOpenPaymentModal={() => blocked('Aperçu statique : créez votre espace pour enregistrer un encaissement.')}
                    onOpenPromiseModal={() => blocked('Aperçu statique : créez votre espace pour enregistrer un engagement.')}
                    onToggleDispute={() => blocked('Aperçu statique : les litiges ne sont pas modifiables ici.')}
                  />
                </div>
              )}

              {tab === 'aging' && <AgingReportView invoices={invoices} />}

              {tab === 'actions' && (
                <ActionsJournalView
                  actions={demoActions}
                  invoices={invoices}
                  onOpenAction={() => blocked('Aperçu statique : créez votre espace pour lancer une relance.')}
                />
              )}

              {tab === 'calculator' && <OverdueCalculatorView />}

              {tab === 'import' && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <h2 className="text-lg font-bold">Import de factures (CSV)</h2>
                    <p className="text-[12px] text-[#9AAAC0] mt-0.5">
                      Trois étapes, aperçu obligatoire, aucune ligne perdue en silence.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { n: '1', t: 'Dépôt du fichier', d: 'Colonnes FR/EN détectées automatiquement (« Client », « Date d’échéance », « Montant total »…).' },
                      { n: '2', t: 'Mapping & aperçu', d: 'Correspondance des colonnes, rendu ligne à ligne avant toute écriture.' },
                      { n: '3', t: 'Mode d’écriture', d: 'Fusion, mise à jour ou remplacement assisté — les rejets affichent leur motif.' },
                    ].map(s => (
                      <div key={s.n} className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
                        <span className="w-7 h-7 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#38BDF8] font-bold text-xs flex items-center justify-center">
                          {s.n}
                        </span>
                        <h3 className="font-semibold text-sm mt-3">{s.t}</h3>
                        <p className="text-xs text-[#9AAAC0] mt-1.5 leading-relaxed">{s.d}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
                    <span className="text-xs uppercase tracking-wider text-[#6B7D98] font-semibold">
                      Modèle CSV francophone fourni
                    </span>
                    <pre className="mt-2 text-[11px] font-mono text-[#38C995] overflow-x-auto leading-relaxed">{`Numéro de facture;Client;Email;Date d'émission;Date d'échéance;Montant total;Montant réglé;Devise;Notes
FA-2026-1001;Dupont Menuiserie;compta@dupont-menuiserie.fr;16/09/2026;15/10/2026;12450,00;0,00;EUR;Impayé ancien
FA-2026-1002;Marseille Froid Industrie;achats@marseille-froid.fr;03/10/2026;31/10/2026;"8.750,50";"2.500,00";EUR;Acompte versé`}</pre>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#2563EB]/30 bg-[#2563EB]/5 px-4 py-3">
                    <p className="text-xs text-[#C7D2E5]">
                      Importez vos propres factures — elles resteront sur cet appareil.
                    </p>
                    <button
                      onClick={() => onNavigate('/inscription')}
                      className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shrink-0"
                    >
                      Commencer
                    </button>
                  </div>
                </div>
              )}

              {tab === 'backup' && (
                <div className="space-y-4">
                  <div className="border-b border-white/10 pb-3">
                    <h2 className="text-lg font-bold">Sauvegarde & restauration</h2>
                    <p className="text-[12px] text-[#9AAAC0] mt-0.5">
                      Vos données ne vivent que sur cet appareil : la sauvegarde est votre assurance.
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { icon: HardDrive, t: 'Export JSON complet', d: 'Factures, encaissements, engagements, litiges, actions, historique et paramètres — empreinte SHA-256 incluse.' },
                      { icon: Eye, t: 'Aperçu avant restauration', d: 'Le contenu et l’intégrité du fichier sont vérifiés avant toute écriture.' },
                      { icon: Lock, t: 'Confirmation « RESTAURER »', d: 'Le remplacement exige la saisie explicite du mot de confirmation. Aucun clic unique ne détruit vos données.' },
                    ].map(c => (
                      <div key={c.t} className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
                        <c.icon className="w-5 h-5 text-[#38C995]" />
                        <h3 className="font-semibold text-sm mt-3">{c.t}</h3>
                        <p className="text-xs text-[#9AAAC0] mt-1.5 leading-relaxed">{c.d}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4 font-mono text-[11px] text-[#9AAAC0] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#E6EAF2]">recovery-os-backup-2026-10-30.json</span>
                      <span className="px-2 py-0.5 rounded bg-[#38C995]/10 border border-[#38C995]/30 text-[#38C995] font-sans font-semibold text-[10px]">
                        SHA-256 vérifié
                      </span>
                    </div>
                    <div>8 factures · 3 encaissements · 1 engagement · 4 actions · 12 entrées d’historique</div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[#38C995]/30 bg-[#38C995]/5 px-4 py-3">
                    <p className="text-xs text-[#C7D2E5]">
                      Exportez et restaurez votre portefeuille réel depuis votre espace.
                    </p>
                    <button
                      onClick={() => onNavigate('/inscription')}
                      className="px-4 py-2 rounded-lg bg-[#38C995]/15 border border-[#38C995]/40 text-[#38C995] text-xs font-semibold shrink-0 hover:bg-[#38C995]/25"
                    >
                      Créer mon espace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pied d'aperçu */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
          <p className="text-sm text-[#C7D2E5] text-center md:text-left">
            Cet aperçu n'a ni lu ni écrit la moindre donnée. Passez à l'essai de 14 jours pour
            travailler sur votre propre portefeuille.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onNavigate('/tarifs')}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-[#C7D2E5] hover:bg-white/10"
            >
              Voir les tarifs
            </button>
            <button
              onClick={() => onNavigate('/inscription')}
              className="px-4 py-2.5 rounded-xl bg-white text-[#0B0F17] text-sm font-bold hover:bg-[#E6EAF2]"
            >
              Essai gratuit
            </button>
          </div>
        </div>
      </div>

      {/* Notice d'action neutralisée */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111726] border border-[#E9AE57]/40 shadow-2xl text-sm text-[#E6EAF2]"
        >
          <CalendarClock className="w-4 h-4 text-[#E9AE57] shrink-0" />
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Fermer" className="text-[#6B7D98] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
