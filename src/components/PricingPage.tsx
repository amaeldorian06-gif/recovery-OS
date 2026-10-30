import React from 'react';
import { Check, HardDrive, ShieldCheck } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (path: string) => void;
}

const PLANS = [
  {
    key: 'essentiel', name: 'Essentiel', price: '19 €', period: '/mois',
    desc: 'Indépendants et TPE qui suivent leurs impayés sans friction.',
    features: [
      'Jusqu’à 150 factures actives',
      'Import / export CSV',
      'Balance âgée et scoring de risque',
      'Journal des relances',
      'Sauvegarde et restauration locale',
    ],
    highlight: false,
  },
  {
    key: 'pro', name: 'Pro', price: '49 €', period: '/mois',
    desc: 'PME et directions financières avec portefeuilles clients multiples.',
    features: [
      'Factures actives illimitées',
      'Engagements de règlement suivis',
      'Calculateur what-if de recouvrement',
      'Courbe CRF d’estimation interne',
      'Journal d’historique complet',
      'Priorité sur les évolutions produit',
    ],
    highlight: true,
  },
  {
    key: 'cabinet', name: 'Cabinet', price: '89 €', period: '/mois',
    desc: 'Cabinets comptables et sociétés de recouvrement multi-dossiers.',
    features: [
      'Tout le plan Pro',
      'Plusieurs espaces clients sur un poste',
      'Modèles de relances avancés',
      'Assistance prioritaire',
    ],
    highlight: false,
  },
];

/**
 * Tarifs — offre < 100 €/mois, présentation sobre et honnête
 * de l'activation locale de la licence.
 */
export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-full text-[#E6EAF2]">
      <main className="max-w-5xl mx-auto px-5 py-14">
        <p className="text-xs uppercase tracking-[0.2em] text-[#38BDF8] font-semibold mb-3">Tarification</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
          Des offres claires, sous 100 € par mois
        </h1>
        <p className="text-[#9AAAC0] max-w-2xl leading-relaxed mb-10">
          Un seul prix visible, essai de 14 jours sans carte bancaire. La licence s’active sur votre poste ;
          elle ne remplace jamais une sauvegarde de vos données.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-[#2563EB]/50 bg-gradient-to-b from-[#2563EB]/10 to-transparent relative'
                  : 'border-white/10 bg-[#0B0F17]'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#2563EB] text-white">
                  Recommandé
                </span>
              )}
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-xs text-[#9AAAC0] mt-1 mb-4 min-h-[32px]">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3xl font-black font-mono">{plan.price}</span>
                <span className="text-sm text-[#9AAAC0]">{plan.period}</span>
              </div>
              <ul className="space-y-2 text-sm flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#38C995] shrink-0 mt-0.5" />
                    <span className="text-[#C7D2E5]">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate('/inscription')}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold ${
                  plan.highlight
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                Choisir {plan.name}
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-6 md:p-8">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#38BDF8]" /> Comment fonctionne l’activation — sans faux-semblants
          </h2>
          <div className="grid md:grid-cols-3 gap-5 text-sm">
            <div>
              <h3 className="font-semibold text-[#38BDF8] mb-1.5">1. Clé de licence</h3>
              <p className="text-[#9AAAC0] leading-relaxed">
                Après votre commande, vous recevez une clé au format <span className="font-mono text-xs">RRV-PRO-XXXX-…</span>,
                vérifiable hors ligne sur votre poste.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#38BDF8] mb-1.5">2. Activation locale</h3>
              <p className="text-[#9AAAC0] leading-relaxed">
                La clé est validée dans votre navigateur. Aucune donnée de facturation n’est associée à vos données clients :
                licence et portefeuille sont stockés séparément.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[#E9AE57] mb-1.5">3. Honnêteté du modèle</h3>
              <p className="text-[#9AAAC0] leading-relaxed">
                Cette protection est dissuasive, pas inviolable : un utilisateur technique pourrait l’outreaper.
                Nous comptons sur votre éthique et votre engagement — le produit reste utilisable pour sauvegarder
                et exporter vos données en permanence.
              </p>
            </div>
          </div>
          <p className="mt-5 text-xs text-[#6B7D98] border-t border-white/10 pt-4">
            Les données financières ne sont jamais hébergées : la licence ne déverrouille qu’un indicateur local.
            Vous restez libre d’exporter l’intégralité de votre espace à tout moment, y compris après résiliation.
          </p>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => onNavigate('/inscription')}
            className="px-8 py-3.5 rounded-xl bg-white text-[#0B0F17] font-bold hover:bg-[#E6EAF2]"
          >
            Démarrer l’essai gratuit de 14 jours
          </button>
          <p className="mt-3 text-xs text-[#6B7D98]">Prix TTC · Résiliable à tout moment · Sans engagement</p>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-[#6B7D98]">
        Revenue Recovery OS · Recouvrement d’impayés souverain
      </footer>
    </div>
  );
};
