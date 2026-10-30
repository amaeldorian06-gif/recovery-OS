import React from 'react';
import { FileSpreadsheet, Calculator, Shield, HardDrive, ArrowRight, LayoutDashboard, Archive } from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (path: string) => void;
}

/**
 * Présentation des fonctionnalités — univers « dark structuré »,
 * ton clair et factuel, sans promesses non vérifiées.
 */
export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  const sections = [
    {
      id: 'pilotage',
      icon: <LayoutDashboard className="w-5 h-5" />,
      title: 'Tableau de pilotage quotidien',
      body: 'Quatre indicateurs vivants — encours total, impayés hors litiges, litiges, encaissements du jour — recalculés à chaque écriture. Le DSO courant et les alertes multi-devises s’affichent en clair, sans arrondi trompeur.',
      points: [
        'Recalcul immédiat après import, encaissement ou engagement',
        'Rappels d’engagements de règlement à échoir',
        'Journal des opérations récentes traçable',
      ],
    },
    {
      id: 'import',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      title: 'Import CSV de vos factures clients',
      body: 'Déposez l’export de votre ERP ou de votre compta. Colonnes françaises et anglaises reconnues, montants « 1 234,56 » interprétés correctement, aperçu ligne à ligne avant validation.',
      points: [
        'Trois modes : fusion, mise à jour, remplacement assisté',
        'Lignes invalides rejetées avec motif — jamais perdues en silence',
        'Doublons de facture détectés avant écriture',
        'Modèle CSV FR téléchargeable en un clic',
      ],
    },
    {
      id: 'analyse',
      icon: <Calculator className="w-5 h-5" />,
      title: 'Balance âgée, scoring et courbe CRF',
      body: 'Chaque créance est positionnée dans une tranche d’impayé (1-30, 31-60, 61-90, 90+) et reçoit un score de risque de 0 à 100 basé sur l’ancienneté, la concentration client, les engagements tenus ou rompus et les litiges.',
      points: [
        'Détail expliqué du score par facture (audit drawer)',
        'Courbe CRF de recouvrement interne — estimation, pas une provision IFRS 9 / CECL',
        'Calculateur what-if : simulatez l’impact d’un encaissement',
      ],
    },
    {
      id: 'actions',
      icon: <Shield className="w-5 h-5" />,
      title: 'Journal des relances et engagements',
      body: 'Chaque relance, appel ou mise en demeure est journalisée avec son canal, ses notes structurées et sa date de suivi. Les promesses de paiement sont suivies jusqu’à leur tenue ou leur rupture — qui pèse sur le score client.',
      points: [
        'Actions regroupées par facture et par client',
        'Engagements rompus remontés automatiquement',
        'Litiges visibles et exclus de la balance âgée',
      ],
    },
    {
      id: 'sauvegarde',
      icon: <Archive className="w-5 h-5" />,
      title: 'Sauvegarde et restauration vérifiées',
      body: 'Export JSON de l’intégralité de l’espace (factures, encaissements, engagements, litiges, actions, historique, paramètres) avec empreinte de contrôle. La restauration passe par un aperçu et une confirmation explicite.',
      points: [
        'Empreinte SHA-256 du contenu exporté',
        'Aperçu avant remplacement — aucune restauration à l’aveugle',
        'Confirmation « RESTAURER » exigée pour les opérations destructrices',
      ],
    },
    {
      id: 'souverainete',
      icon: <HardDrive className="w-5 h-5" />,
      title: 'Souveraineté des données par conception',
      body: 'Vos données vivent dans IndexedDB de votre navigateur. Aucun serveur n’est contacted pour les stocker ou les lire. Le mode démonstration s’appuie sur un jeu de données d’exemple éphémère qui ne touche jamais à votre portefeuille réel.',
      points: [
        'Aucun compte obligatoire pour utiliser l’application localement',
        'Hors ligne une fois chargée',
        'Séparation stricte entre licence et données financières',
      ],
    },
  ];

  return (
    <div className="min-h-full text-[#E6EAF2]">
      <main className="max-w-5xl mx-auto px-5 py-14">
        <p className="text-xs uppercase tracking-[0.2em] text-[#38BDF8] font-semibold mb-3">Fonctionnalités</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
          Tout le cycle de recouvrement, dans une seule interface sobre
        </h1>
        <p className="text-[#9AAAC0] max-w-2xl leading-relaxed mb-12">
          De l’import de vos factures au journal des relances : chaque module est conçu pour la fiabilité
          chiffrée, la traçabilité et la confidentialité. Voici exactement ce que fait le produit — rien de plus.
        </p>

        <div className="space-y-5">
          {sections.map((s, idx) => (
            <section key={s.id} className="rounded-xl border border-white/10 bg-[#0B0F17] p-6 md:p-8 grid md:grid-cols-[64px_1fr] gap-5">
              <div className="flex md:flex-col items-center gap-3">
                <span className="text-xs font-mono text-[#6B7D98]">{String(idx + 1).padStart(2, '0')}</span>
                <div className="w-11 h-11 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/25 flex items-center justify-center text-[#38BDF8]">
                  {s.icon}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">{s.title}</h2>
                <p className="text-sm text-[#9AAAC0] leading-relaxed mb-4">{s.body}</p>
                <ul className="space-y-1.5">
                  {s.points.map(p => (
                    <li key={p} className="text-sm flex items-start gap-2.5">
                      <span className="text-[#38C995] mt-1">▸</span>
                      <span className="text-[#C7D2E5]">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-xl border border-[#E9AE57]/25 bg-[#E9AE57/5] p-6">
          <h3 className="font-bold text-[#E9AE57] mb-2 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> Ce que le produit ne prétend pas faire
          </h3>
          <ul className="text-sm text-[#C7D2E5] space-y-1.5">
            <li>• La courbe CRF est une heuristique interne de recouvrement — ce n’est pas une provision IFRS 9 ni CECL.</li>
            <li>• La licence locale est une protection honnête de commercialisation, pas un verrou technique inviolable.</li>
            <li>• Aucune donnée financière n’est hébergée : la déconnexion emporte l’accès, la sauvegarde reste votre affaire.</li>
          </ul>
        </section>

        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('/inscription')}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] font-bold"
          >
            Démarrer l’essai de 14 jours
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-[#6B7D98]">
        Revenue Recovery OS · Recouvrement d’impayés souverain
      </footer>
    </div>
  );
};
