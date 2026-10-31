import React from 'react';
import { CheckCircle2, Circle, Clock, GitCommitHorizontal, TestTubeDiagonal, FileCode2, ShieldCheck, ArrowRight, HardDrive } from 'lucide-react';

interface ProgressDashboardProps {
  onNavigate: (path: string) => void;
}

type Status = 'done' | 'partial';

interface Phase {
  n: number;
  title: string;
  status: Status;
  summary: string;
  deliverables: string[];
}

/* Données figées au dernier passage de vérification (commit indiqué). */
const PHASES: Phase[] = [
  {
    n: 1, title: 'Audit préalable', status: 'done',
    summary: 'Cartographie complète avant toute modification.',
    deliverables: [
      'docs/AUDIT-PHASE1.md — 19 constats, risques D1–D10, plan M1–M8',
      'Preuves curl sur l’héritage API (faille de vérification de mot de passe)',
      'Preuves node sur la corruption de montants EU et dates figées',
    ],
  },
  {
    n: 2, title: 'Moteur de stockage', status: 'done',
    summary: 'Couche centralisée, aucun composant n’ouvre IndexedDB.',
    deliverables: [
      '7 modules src/storage/ (types, backend, idb, repository, backup, licence, seed)',
      'IndexedDB v1 : 11 stores, sessions PBKDF2, historique append-only',
      'Backend mémoire pour tests et démonstration éphémère',
      'repository.test.ts + backup.test.ts verts',
    ],
  },
  {
    n: 3, title: 'Fiabilité financière', status: 'done',
    summary: 'Montants, dates, aging, scoring, CRF, CSV — tout testé.',
    deliverables: [
      'Dates locales sans dérive UTC (régression D1 incluse)',
      'Montants EU/US avec ambiguïté signalée et rejets explicites',
      'Scoring 0–100 expliqué par facteur, courbe CRF documentée (ni IFRS 9 ni CECL)',
      'CSV RFC 4180, mapping FR/EN, doublons, rejets motivés',
    ],
  },
  {
    n: 4, title: 'Sauvegarde', status: 'done',
    summary: 'Export vérifiable, restauration jamais destructive d’un clic.',
    deliverables: [
      'Export JSON + empreinte SHA-256 (repli djb2 documenté)',
      'Aperçu du contenu avant toute restauration',
      'Confirmation « RESTAURER » obligatoire pour le remplacement',
      'Détection de corruption testée',
    ],
  },
  {
    n: 5, title: 'UX', status: 'done',
    summary: 'Public cosmique / privé sobre, entièrement en français.',
    deliverables: [
      'Landing, Fonctionnalités, Aperçu, Tarifs — univers FinTech cosmic',
      'Application privée sobre : 7 sections, modaux branchés au repository',
      'Module d’aperçu statique /apercu : lecture seule garantie',
      'Démonstration interactive isolée (base mémoire)',
    ],
  },
  {
    n: 6, title: 'Commercialisation', status: 'done',
    summary: 'Offres sous 100 €/mois, activation honnête.',
    deliverables: [
      'Essentiel 19 € · Pro 49 € · Cabinet 89 € (clés RRV locales)',
      'Licence séparée des données financières (stores distincts)',
      'Recopié noir sur blanc : activation locale, non inviolable',
      'Page Tarifs sans revendication réglementaire',
    ],
  },
  {
    n: 7, title: 'Déploiement', status: 'partial',
    summary: 'Build, routes SPA, HTTPS, SEO prêts — tests multi-navigateurs manuels restants.',
    deliverables: [
      'vercel.json : réécriture SPA, en-têtes de sécurité, cache assets',
      'SEO fr-FR : index.html, schema.org EUR, robots.txt, sitemap.xml',
      'README : procédures de sauvegarde et de déploiement',
      'Reste : passage manuel Chrome / Firefox / Safari (dont mode privé)',
    ],
  },
];

const VERIFICATIONS: Array<{ label: string; result: string; ok: boolean }> = [
  { label: 'TypeScript (tsc --noEmit)', result: '0 erreur', ok: true },
  { label: 'Tests unitaires (npm test)', result: '59 / 59 verts', ok: true },
  { label: 'Build production (vite build)', result: '423 kB — succès', ok: true },
  { label: 'Routes SPA (curl)', result: '/ · /apercu · /tarifs · /fonctionnalites → 200', ok: true },
  { label: 'Arbre Git', result: 'propre, 2 commits poussés sur la branche de session', ok: true },
  { label: 'Tests multi-navigateurs (manuel)', result: 'à faire — Chrome, Firefox, Safari, Edge', ok: false },
  { label: 'Tests E2E interface (Playwright/Cypress)', result: 'non implémentés', ok: false },
];

const REMAINING = [
  'Installer Playwright pour couvrir inscription → import → sauvegarde en navigation réelle.',
  'Unifier esbuild/vite pour supprimer l’obligation --legacy-peer-deps.',
  'Remplacer le domaine placeholder recovery-os.vercel.app (3 fichiers) au moment du déploiement.',
  'Intégrer un prestataire de paiement si la vente automatisée des licences est décidée.',
  'Benchmark à 10 000+ factures (non réalisé).',
];

const STATUS_META: Record<Status, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  done: { label: 'Livré & vérifié', icon: CheckCircle2, cls: 'text-[#38C995] bg-[#38C995]/10 border-[#38C995]/30' },
  partial: { label: 'En cours', icon: Clock, cls: 'text-[#E9AE57] bg-[#E9AE57]/10 border-[#E9AE57]/30' },
};

/**
 * Suivi de progression du projet (interne).
 * Page non référencée (robots : Disallow /suivi) — elle affiche uniquement
 * des résultats de vérification réellement exécutés, datés du dernier commit.
 */
export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ onNavigate }) => {
  const done = PHASES.filter(p => p.status === 'done').length;

  return (
    <div className="min-h-full text-[#E6EAF2]">
      <main className="max-w-5xl mx-auto px-5 py-12">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-xs text-[#38BDF8] font-semibold mb-4">
              <GitCommitHorizontal className="w-3.5 h-3.5" /> Suivi interne · non référencé
            </span>
            <h1 className="text-3xl font-black tracking-tight">Progression du projet</h1>
            <p className="text-sm text-[#9AAAC0] mt-2 max-w-xl">
              État des 7 phases du directive de cadrage. Seuls figurent ici des résultats
              réellement exécutés et vérifiables — aucun statut déclaré sans preuve.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B0F17] p-5 min-w-[190px]">
            <span className="text-xs text-[#9AAAC0]">Phases livrées</span>
            <div className="text-4xl font-black font-mono mt-1">
              {done}<span className="text-[#6B7D98] text-2xl"> / {PHASES.length}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#38C995]"
                style={{ width: `${(done / PHASES.length) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[#E9AE57] mt-2">Phase 7 : partie déploiement prête, validation navigateur restante</p>
          </div>
        </div>

        {/* Vérifications */}
        <section className="rounded-xl border border-white/10 bg-[#0B0F17] p-5 mb-6">
          <h2 className="font-bold text-sm flex items-center gap-2 mb-4">
            <TestTubeDiagonal className="w-4 h-4 text-[#38BDF8]" /> Dernières vérifications exécutées
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {VERIFICATIONS.map(v => (
              <li key={v.label} className="flex items-start gap-2.5 text-[13px] p-2.5 rounded-lg bg-[#111726] border border-white/5">
                {v.ok
                  ? <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0 mt-0.5" />
                  : <Circle className="w-4 h-4 text-[#E9AE57] shrink-0 mt-0.5" />}
                <span>
                  <span className="font-medium">{v.label}</span>
                  <span className={`block text-xs ${v.ok ? 'text-[#9AAAC0]' : 'text-[#E9AE57]'}`}>{v.result}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Phases */}
        <section className="space-y-4 mb-6">
          {PHASES.map(phase => {
            const meta = STATUS_META[phase.status];
            return (
              <article key={phase.n} className="rounded-xl border border-white/10 bg-[#0B0F17] p-5 grid md:grid-cols-[56px_1fr] gap-4">
                <div className="flex md:flex-col items-center gap-3">
                  <span className="text-xs font-mono text-[#6B7D98]">PHASE</span>
                  <span className="text-2xl font-black font-mono text-[#38BDF8]">{phase.n}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-bold">{phase.title}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${meta.cls}`}>
                      <meta.icon className="w-3.5 h-3.5" /> {meta.label}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#9AAAC0] mb-3">{phase.summary}</p>
                  <ul className="space-y-1.5">
                    {phase.deliverables.map(d => (
                      <li key={d} className="text-[13px] flex items-start gap-2.5">
                        <span className="text-[#38C995] mt-0.5">▸</span>
                        <span className="text-[#C7D2E5]">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </section>

        {/* Reste à faire */}
        <section className="rounded-xl border border-[#E9AE57]/30 bg-[#E9AE57]/5 p-5 mb-8">
          <h2 className="font-bold text-sm text-[#E9AE57] flex items-center gap-2 mb-3">
            <Circle className="w-4 h-4" /> Points restants (non validés ou non réalisés)
          </h2>
          <ul className="space-y-2 text-[13px] text-[#C7D2E5]">
            {REMAINING.map(r => (
              <li key={r} className="flex items-start gap-2.5">
                <span className="text-[#E9AE57] mt-0.5">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Chiffres du dépôt */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: GitCommitHorizontal, k: 'Commits de session', v: '2', s: '3b263bb · 5bc939a' },
            { icon: FileCode2, k: 'Fichiers suivis', v: '128', s: 'dont 47 sources TS/TSX' },
            { icon: TestTubeDiagonal, k: 'Fichiers de test', v: '8', s: '59 cas exécutés' },
            { icon: ShieldCheck, k: 'Données en cloud', v: '0', s: 'par conception' },
          ].map(c => (
            <div key={c.k} className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
              <c.icon className="w-4 h-4 text-[#38BDF8] mb-2" />
              <div className="text-2xl font-black font-mono">{c.v}</div>
              <div className="text-xs text-[#9AAAC0] mt-0.5">{c.k}</div>
              <div className="text-[10px] text-[#6B7D98] font-mono mt-0.5">{c.s}</div>
            </div>
          ))}
        </section>

        {/* Raccourcis */}
        <div className="flex flex-wrap gap-3 pb-6">
          <button
            onClick={() => onNavigate('/apercu')}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold flex items-center gap-2"
          >
            Voir le produit en aperçu <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-[#C7D2E5] hover:bg-white/10"
          >
            Retour au site
          </button>
        </div>

        <p className="text-[11px] text-[#6B7D98] flex items-center gap-1.5 pb-4">
          <HardDrive className="w-3.5 h-3.5" />
          Documents détaillés : docs/AUDIT-PHASE1.md (audit) · docs/RAPPORT-V1.md (rapport complet) · README.md (procédures).
        </p>
      </main>
    </div>
  );
};
