import React from 'react';
import { FileSpreadsheet, Shield, Lock, HardDrive, ArrowRight, Calculator, AlertTriangle } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Landing publique — univers « FinTech Cosmic Glassmorphism ».
 * Porte d'entrée marketing : aucun accès aux données locales de l'app.
 * La barre de navigation globale (Navbar) est rendue par App shell.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="text-white">
      {/* Voile cosmique léger (le fond animé vient de FintechCosmicBackground) */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-5 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-[#C7D2E5] mb-6 backdrop-blur-xl">
            <Lock className="w-3.5 h-3.5 text-[#38C995]" />
            Vos données financières ne quittent jamais votre ordinateur
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08]">
            Transformez vos impayés en{' '}
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#7C3AED] to-[#38C995] bg-clip-text text-transparent">
              trésorerie récupérée
            </span>
          </h1>
          <p className="mt-6 text-lg text-[#9AAAC0] max-w-2xl mx-auto leading-relaxed">
            Le poste de pilotage du recouvrement pour PME, cabinets et directions financières.
            Balance âgée, scoring de risque, relances structurées et estimation de recouvrement —
            sans cloud, sans abonnement caché, sans fuite de données clients.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/inscription')}
              className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#7C3AED] font-bold shadow-xl shadow-[#2563EB]/25 hover:shadow-[#2563EB]/40 transition-all flex items-center gap-2"
            >
              Démarrer l'essai de 14 jours
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('/fonctionnalites')}
              className="px-7 py-3.5 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl font-semibold text-[#C7D2E5] hover:bg-white/10"
            >
              Voir le produit
            </button>
          </div>
          <div className="mt-4">
            <button
              onClick={() => onNavigate('/apercu')}
              className="group inline-flex items-center gap-1.5 text-sm text-[#38BDF8] hover:text-[#7DD3FC] font-medium"
            >
              Prévisualiser l'interface (aucune donnée requise)
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <p className="mt-3 text-xs text-[#6B7D98]">
            Sans carte bancaire · Licence locale · Fonctionne hors ligne
          </p>
        </section>

        {/* Problème */}
        <section className="max-w-6xl mx-auto px-5 pb-16">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">Chaque semaine d'attente coûte de la trésorerie</h2>
              <p className="text-[#9AAAC0] leading-relaxed text-sm">
                Les études situent la perte moyenne liée aux impayés entre 5 % et 10 % du chiffre d'affaires
                annuel des PME. Le vrai coût n'est pas seulement le capital perdu : c'est le temps de vos équipes
                à traquer des factures, l'absence de vue consolidée, et les décisions prises sur des tableurs figés.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  'Aucune vue unique de qui doit quoi, et depuis quand',
                  'Relances irrégulières, mal documentées, non rejouables',
                  'Estimations de recouvrement basées sur l’intuition',
                  'Données clients hébergées chez des tiers sans necessity',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[#C7D2E5]">
                    <AlertTriangle className="w-4 h-4 text-[#E9AE57] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0B0F17]/80 p-5 space-y-3">
              <p className="text-xs uppercase tracking-wider text-[#6B7D98] font-semibold">Aperçu du poste de pilotage</p>
              {[
                { label: 'Encours total', value: '128 450 €', tone: 'text-white' },
                { label: 'Impayés hors litiges', value: '87 900 €', tone: 'text-[#E9AE57]' },
                { label: 'Estimation CRF', value: '73 214 €', tone: 'text-[#38C995]' },
                { label: 'DSO', value: '42 jours', tone: 'text-[#38BDF8]' },
              ].map(k => (
                <div key={k.label} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-xs text-[#9AAAC0]">{k.label}</span>
                  <span className={`font-mono font-bold ${k.tone}`}>{k.value}</span>
                </div>
              ))}
              <p className="text-[10px] text-[#6B7D98] text-center pt-1">Données d'illustration — l'aperçu ne modifie rien.</p>
            </div>
          </div>
        </section>

        {/* Piliers */}
        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <FileSpreadsheet className="w-5 h-5" />, title: 'Import CSV maîtrisé',
                body: 'Colonnes FR/EN détectées automatiquement, aperçu avant validation, rejets explicites. Aucune ligne silencieusement perdue.',
              },
              {
                icon: <Calculator className="w-5 h-5" />, title: 'Analyse de recouvrement',
                body: 'Balance âgée, score de risque multicritère et courbe CRF interne — une estimation honnête, jamais présentée comme une provision réglementaire.',
              },
              {
                icon: <Shield className="w-5 h-5" />, title: 'Souveraineté totale',
                body: 'IndexedDB dans votre navigateur, export JSON chiffrable, restauration vérifiée. Zéro serveur de données. Par conception, pas par promesse.',
              },
            ].map(card => (
              <div key={card.title} className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-[#2563EB]/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/20 to-[#7C3AED]/20 border border-white/10 flex items-center justify-center text-[#38BDF8] mb-4">
                  {card.icon}
                </div>
                <h3 className="font-bold mb-2">{card.title}</h3>
                <p className="text-sm text-[#9AAAC0] leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="max-w-4xl mx-auto px-5 pb-24 text-center">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2563EB]/10 to-[#7C3AED]/10 backdrop-blur-xl p-10">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Reprenez le contrôle de votre poste clients</h2>
            <p className="text-[#9AAAC0] text-sm mb-7 max-w-lg mx-auto">
              Essai de 14 jours, puis à partir de 19 €/mois. Vos données restent chez vous, y compris après l'essai.
            </p>
            <button
              onClick={() => onNavigate('/inscription')}
              className="px-8 py-3.5 rounded-xl bg-white text-[#0B0F17] font-bold hover:bg-[#E6EAF2] shadow-xl"
            >
              Créer mon espace local
            </button>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-[#6B7D98]">
          <p>Revenue Recovery OS · Recouvrement d'impayés souverain · Hébergement des pages : Vercel — aucune donnée financière n'y transite.</p>
        </footer>
      </div>
    </div>
  );
};
