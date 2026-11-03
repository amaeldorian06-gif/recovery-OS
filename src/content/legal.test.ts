import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_LEGAL_DOCUMENTS,
  LEGAL_NOTICE_SECTIONS,
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  WITHDRAWAL_SECTIONS,
  documentText,
} from './legal';
import { PLAN_DETAILS } from '../storage/license';

const mentions = documentText(LEGAL_NOTICE_SECTIONS);
const cgv = documentText(TERMS_SECTIONS);
const privacy = documentText(PRIVACY_SECTIONS);
const withdrawal = documentText(WITHDRAWAL_SECTIONS);
const all = [mentions, cgv, privacy, withdrawal].join('\n');

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

test('Documents : les quatre documents attendus existent', () => {
  const ids = ALL_LEGAL_DOCUMENTS.map(d => d.id);
  assert.deepEqual(ids.sort(), ['cgv', 'confidentialite', 'mentions-legales', 'retractation']);
  for (const doc of ALL_LEGAL_DOCUMENTS) {
    assert.match(doc.path, /^\//);
    assert.ok(doc.sections.length >= 5, `${doc.id} doit compter au moins 5 sections`);
  }
});

test('Documents : chaque section a un titre et du contenu', () => {
  for (const doc of ALL_LEGAL_DOCUMENTS) {
    const ids = new Set<string>();
    for (const section of doc.sections) {
      assert.ok(section.title.length > 3, `titre vide dans ${doc.id}`);
      assert.ok(!ids.has(section.id), `identifiant de section dupliqué : ${section.id} dans ${doc.id}`);
      ids.add(section.id);
      const content = (section.paragraphs ?? []).join('') + (section.list ?? []).join('');
      assert.ok(content.length > 40, `section ${doc.id}/${section.id} trop pauvre (${content.length} caractères)`);
    }
  }
});

test('Documents : aucun texte de remplissage ni placeholder vide', () => {
  assert.ok(!/lorem ipsum/i.test(all), 'aucun brouillon ne doit subsister');
  assert.ok(!/\[\s*\]/.test(all), 'aucun crochet vide');
  assert.ok(!/\bTODO\b|\bFIXME\b/i.test(all));
  assert.ok(!/\{\{|\}\}/.test(all), 'aucune syntaxe de gabarit non résolue');
});

/* ------------------------------------------------------------------ */
/* Exactitude des références — c’est ici que se joue la conformité     */
/* ------------------------------------------------------------------ */

test('Mentions légales : référence LCEN art. 1-1 et jamais 6-III présenté comme le fondement', () => {
  assert.ok(mentions.includes('article 1-1'), 'la référence à l’article 1-1 de la LCEN doit être citée');

  // Citer l'article 6-III pour expliquer son abrogation est utile ; le citer
  // comme fondement de l'obligation serait une erreur (loi SREN, mai 2024).
  const sentences = mentions.split(/(?<=[.!?])\s+/);
  const obsolete = sentences.filter(sentence => /6[-\s]?III/i.test(sentence));
  for (const sentence of obsolete) {
    assert.match(
      sentence,
      /ne figure plus|abrog|obsol|désormais|périmé/i,
      `l’article 6-III ne peut apparaître que pour signaler son obsolescence : « ${sentence.slice(0, 90)}… »`
    );
  }
});

test('Mentions légales : l’hébergeur, le directeur de publication et l’éditeur sont identifiés', () => {
  assert.match(mentions, /Hébergement/);
  assert.match(mentions, /Vercel Inc\./);
  assert.match(mentions, /Directeur de la publication/i);
  assert.match(mentions, /Éditeur du site/i);
});

test('Aucun document ne renvoie vers la plateforme RLL/ODR (fermée le 20 juillet 2025)', () => {
  assert.ok(!/ec\.europa\.eu\/consumers\/odr/i.test(all), 'le lien ODR est mort depuis le 20 juillet 2025');
  assert.ok(!/\bODR\b/.test(all.replace(/RLL\/ODR\)? a été fermée[^.]*\./g, '')), 'aucun renvoi actif à l’ODR');
  assert.match(cgv, /20 juillet 2025/, 'la fermeture de la plateforme doit être expliquée, pas passée sous silence');
});

test('CGV : les mentions B2B du Code de commerce sont présentes', () => {
  assert.match(cgv, /L441-1/, 'communication des CGV à l’acheteur professionnel');
  assert.match(cgv, /L441-10/, 'pénalités et délais de paiement');
  assert.match(cgv, /D441-5/, 'indemnité forfaitaire de recouvrement');
  assert.match(cgv, /40 €/, 'montant de l’indemnité forfaitaire');
  assert.match(cgv, /soixante jours|45 jours|quarante-cinq jours/i, 'plafonds légaux de paiement');
});

test('CGV : le droit de rétractation et son exception numérique sont correctement articulés', () => {
  assert.match(cgv, /L221-18/, 'délai de quatorze jours');
  assert.match(cgv, /L221-28, 13°/, 'exception pour contenu numérique sans support matériel');
  assert.match(cgv, /quatorze jours/);
  assert.match(cgv, /professionnels n’ouvrent pas de droit de rétractation/, 'le B2B doit être exclu explicitement');
});

test('CGV : la garantie légale de conformité du numérique est visée', () => {
  assert.match(cgv, /L224-25-12/, 'garantie de conformité des contenus et services numériques');
});

test('CGV : la clause de sauvegarde dit clairement que l’éditeur ne peut rien restaurer', () => {
  assert.match(cgv, /seul responsable de la sauvegarde/);
  assert.match(cgv, /aucune copie des données/);
  assert.match(cgv, /ne peut donc procéder à aucune restauration/);
});

test('CGV : les indicateurs ne sont pas présentés comme conformes à un référentiel comptable', () => {
  assert.match(cgv, /ni une provision au sens des normes IFRS 9 ou CECL/, 'la mise en garde doit être explicite');
  assert.ok(!/conforme[s]? (à|aux)? ?IFRS/i.test(cgv), 'aucune revendication de conformité IFRS');
  assert.ok(!/conforme[s]? (à|aux)? ?CECL/i.test(cgv));
});

test('CGV : les prix correspondent exactement aux plans du produit', () => {
  for (const plan of ['essentiel', 'pro', 'cabinet'] as const) {
    const details = PLAN_DETAILS[plan];
    assert.ok(
      cgv.includes(`${details.priceMonthly} €`),
      `le prix de ${plan} (${details.priceMonthly} €) doit figurer dans les CGV`
    );
    assert.ok(
      cgv.includes(`${details.seats} poste`),
      `le nombre de postes de ${plan} (${details.seats}) doit figurer dans les CGV`
    );
  }
});

test('Confidentialité : les bases légales et les droits RGPD sont exposés', () => {
  assert.match(privacy, /article 6\.1\.b/, 'base légale : exécution du contrat');
  assert.match(privacy, /article 6\.1\.c/, 'base légale : obligation légale');
  assert.match(privacy, /article 6\.1\.f/, 'base légale : intérêt légitime');
  assert.match(privacy, /articles 15 à 20/, 'droits des personnes');
  assert.match(privacy, /CNIL/, 'voie de recours');
  assert.match(privacy, /3 place de Fontenoy/, 'adresse de la CNIL');
  assert.match(privacy, /dix ans/, 'durée de conservation comptable');
});

test('Confidentialité : l’absence de transfert des données financières est affirmée sans ambiguïté', () => {
  assert.match(privacy, /ne quittent pas votre appareil|ne sont jamais transmises/);
  assert.match(privacy, /aucun accès technique|n’a donc aucun accès/i);
  assert.match(privacy, /sauvegarde relève de votre responsabilité/);
});

test('Confidentialité : aucun traceur publicitaire et pas de bandeau de cookies trompeur', () => {
  assert.match(privacy, /aucun cookie publicitaire/);
  assert.match(privacy, /ne dépose aucun cookie/);
  assert.match(privacy, /strictement nécessaire/);
});

test('Rétractation : la fonctionnalité en ligne de 2026 est expliquée', () => {
  assert.match(withdrawal, /L221-21/, 'fonction de rétractation en ligne');
  assert.match(withdrawal, /ordonnance n° 2026-2/, 'texte d’origine');
  assert.match(withdrawal, /19 juin 2026/, 'date d’entrée en vigueur');
  assert.match(withdrawal, /renoncer au contrat ici|Renoncer au contrat ici/i, 'formulation attendue par le décret');
  assert.match(withdrawal, /L221-28, 13°/, 'exception numérique rappelée');
  assert.match(withdrawal, /L221-18/, 'délai de quatorze jours');
  assert.match(withdrawal, /formulaire type/i, 'formulaire de rétractation fourni');
});

test('Rétractation : l’exception numérique est présentée comme conditionnelle, jamais automatique', () => {
  assert.match(withdrawal, /ne s’applique jamais d’office/);
  assert.match(withdrawal, /Si vous ne l’avez pas donnée, le délai de quatorze jours s’applique/);
});

test('Médiation : la défaillance de médiateur est annoncée explicitement plutôt que masquée', () => {
  assert.match(cgv, /L616-1/, 'recours au médiateur de la consommation');
  // Tant qu'aucun médiateur n'est désigné, le document doit le dire.
  if (!/Médiateur compétent :/.test(cgv)) {
    assert.match(cgv, /n’est pas encore désigné/, 'l’absence de médiateur doit être visible, pas silencieuse');
  }
});
