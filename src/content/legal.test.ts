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

test('CGV : la vente est expressément réservée aux professionnels', () => {
  assert.match(cgv, /réservé aux professionnels/i, 'le périmètre B2B doit être explicite');
  assert.match(cgv, /ne sont pas proposées aux consommateurs/i);
  assert.match(cgv, /Code de la consommation/, 'les exclusions applicables doivent être nommées');
  assert.match(cgv, /L221-18/, 'le droit de rétractation est cité pour être écarté en B2B');
  assert.match(cgv, /aucun droit de rétractation/i);
});

test('CGV : une garantie commerciale de 14 jours est offerte au-delà du droit commun', () => {
  assert.match(cgv, /garantie commerciale/i);
  assert.match(cgv, /quatorze jours/);
  assert.match(cgv, /ne crée pas un droit de rétractation au sens du Code de la consommation/, 'la garantie ne doit pas être présentée comme légale');
  assert.match(cgv, /désactivation de la clé/i, 'l’effet sur la licence doit être décrit');
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

test('Rétractation : le régime B2B est expliqué sans ambiguïté', () => {
  assert.match(withdrawal, /L221-18/, 'le fondement du droit écarté est cité');
  assert.match(withdrawal, /réservé aux consommateurs/i);
  assert.match(withdrawal, /exclusivement auprès de professionnels/i);
  assert.match(withdrawal, /aucun droit de rétractation légal/i);
});

test('Rétractation : la garantie commerciale de 14 jours est présentée comme volontaire', () => {
  assert.match(withdrawal, /garantie commerciale d’annulation/i);
  assert.match(withdrawal, /ne constitue pas un droit de rétractation au sens du Code de la consommation/);
  assert.match(withdrawal, /quatorze jours/);
  assert.match(withdrawal, /formulaire type/i, 'un formulaire doit rester disponible');
  assert.match(withdrawal, /remboursement/i, 'les effets financiers doivent être décrits');
});

test('Rétractation : les données locales ne sont pas affectées par la désactivation', () => {
  assert.match(withdrawal, /ni consultées, ni modifiées, ni supprimées/);
});

test('Médiation : l’exclusion du régime consommateur est motivée, pas silencieuse', () => {
  assert.match(cgv, /L616-1/, 'le texte écarté doit être cité');
  assert.match(cgv, /ne s’applique qu’aux litiges opposant un professionnel à un consommateur/);
  assert.match(cgv, /Aucun médiateur de la consommation n’est désigné/);
  assert.match(cgv, /n’étant pas requise pour les ventes entre professionnels/);
});

test('TVA : la franchise en base est répercutée dans les CGV', () => {
  assert.match(cgv, /293 B/, 'la mention de l’article 293 B du CGI est obligatoire en franchise');
  assert.match(cgv, /TVA non applicable/);
  assert.match(cgv, /aucune taxe n’est ajoutée/i, 'le prix affiché doit être le prix dû');
});

test('Mentions légales : le numéro de l’hébergeur est qualifié, sans laisser croire à un standard', () => {
  assert.match(mentions, /559 288 7060/);
  assert.match(mentions, /DMCA\/abus/, 'la nature de la ligne doit être indiquée');
  assert.match(mentions, /dmca@vercel\.com/, 'un contact écrit vérifiable doit être fourni');
});
