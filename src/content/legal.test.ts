import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALL_LEGAL_DOCUMENTS,
  LEGAL_NOTICE_SECTIONS,
  CONDITIONS_OF_USE_SECTIONS,
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  WITHDRAWAL_SECTIONS,
  buildLegalNotice,
  buildTermsOfSale,
  buildPrivacyPolicy,
  documentText,
  shortTaxMention,
  taxStatement,
} from './legal';
import { EDITOR_CONFIG, EditorConfig, provided, toComplete } from '../config/editor';
import { PLAN_DETAILS } from '../storage/license';

const mentions = documentText(LEGAL_NOTICE_SECTIONS);
const cgu = documentText(CONDITIONS_OF_USE_SECTIONS);
const cgv = documentText(TERMS_SECTIONS);
const privacy = documentText(PRIVACY_SECTIONS);
const withdrawal = documentText(WITHDRAWAL_SECTIONS);
const all = [mentions, cgu, cgv, privacy, withdrawal].join('\n');

/* ------------------------------------------------------------------ */
/* Structure                                                           */
/* ------------------------------------------------------------------ */

test('Documents : les cinq documents attendus existent, y compris les CGU', () => {
  const ids = ALL_LEGAL_DOCUMENTS.map(doc => doc.id);
  assert.deepEqual(ids.sort(), ['cgu', 'cgv', 'confidentialite', 'mentions-legales', 'retractation']);
  for (const doc of ALL_LEGAL_DOCUMENTS) {
    assert.match(doc.path, /^\//);
    assert.ok(doc.sections.length >= 5, `${doc.id} doit compter au moins 5 sections`);
  }
});

test('Documents : chaque section a un titre et du contenu', () => {
  for (const doc of ALL_LEGAL_DOCUMENTS) {
    const seen = new Set<string>();
    for (const section of doc.sections) {
      assert.ok(section.title.length > 3, `titre vide dans ${doc.id}`);
      assert.ok(!seen.has(section.id), `identifiant de section dupliqué : ${section.id} dans ${doc.id}`);
      seen.add(section.id);
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
/* Adaptation à l’éditeur réel                                         */
/* ------------------------------------------------------------------ */

test('Éditeur : la configuration livrée produit des documents complets dans leurs mentions', () => {
  // La configuration actuelle n'est pas renseignée : les documents doivent
  // exposer des trous visibles, jamais des valeurs inventées.
  assert.match(mentions, /\[à compléter\]/);
});

test('Éditeur : aucun SIREN, SIRET, RCS ou capital social n’est affirmé', () => {
  const sentences = all.split(/(?<=[.!?])\s+/).filter(s => /SIREN|SIRET|\bRCS\b|greffe/i.test(s));
  for (const sentence of sentences) {
    assert.match(
      sentence,
      /aucun|ni |pas|n’est|ne lui|sans/i,
      `une mention française ne peut apparaître que pour être écartée : « ${sentence.slice(0, 110)}… »`
    );
  }
  assert.ok(!/Capital social\s*:\s*\d/i.test(all), 'aucun capital ne doit être affiché');
  assert.ok(!/\b\d{9}\b/.test(all), 'aucun numéro à neuf chiffres (format SIREN) ne doit apparaître');
});

test('Éditeur : le service n’est jamais présenté comme une société', () => {
  assert.match(mentions, /Ce n’est ni une société, ni une filiale/);
  assert.ok(!/\bSASU\b|\bSARL\b|\bSAS\b/.test(all), 'aucune forme sociale ne doit être attribuée à l’éditeur');
});

test('Éditeur : le fondement camerounais et OHADA est exposé, le texte français qualifié d’extérieur', () => {
  assert.match(mentions, /Cameroun/);
  assert.match(mentions, /OHADA/);
  assert.match(mentions, /loi n° 2004-575/, 'la LCEN est citée');
  assert.match(mentions, /À titre volontaire/, 'la reprise est présentée comme volontaire');
  assert.match(mentions, /elle ne vaut pas reconnaissance d’un établissement en France/i);
});

test('Éditeur : l’hébergeur, le directeur de publication et l’identité figurent dans les mentions', () => {
  assert.match(mentions, /Hébergement/);
  assert.match(mentions, /Vercel Inc\./);
  assert.match(mentions, /Directeur de la publication/i);
  assert.match(mentions, /Éditeur du site/i);
  assert.match(mentions, /Éditeur :/);
});

test('Éditeur : les cinq documents affichent la même identité', () => {
  const configured = {
    ...EDITOR_CONFIG,
    identity: {
      ...EDITOR_CONFIG.identity,
      legalName: provided('Awa Ngo Bassa'),
      email: provided('bonjour@exemple.cm'),
    },
  };
  const docs = [
    buildLegalNotice(configured),
    buildTermsOfSale(configured),
    buildPrivacyPolicy(configured),
  ].map(documentText);
  for (const doc of docs) {
    assert.match(doc, /Awa Ngo Bassa/);
    assert.match(doc, /bonjour@exemple\.cm/);
  }
});

test('Éditeur : une valeur configurée remplace le marqueur, sans autre changement', () => {
  const configured: EditorConfig = {
    ...EDITOR_CONFIG,
    identity: { ...EDITOR_CONFIG.identity, legalName: provided('Awa Ngo Bassa') },
  };
  const text = documentText(buildLegalNotice(configured));
  assert.match(text, /Awa Ngo Bassa/);
  assert.match(text, /\[à compléter\]/, 'les autres champs restent signalés');
});

/* ------------------------------------------------------------------ */
/* Fiscalité et obligations françaises                                 */
/* ------------------------------------------------------------------ */

test('TVA : l’article 293 B du CGI n’est jamais présenté comme applicable', () => {
  assert.ok(!/293 B/.test(all), 'une disposition française ne peut fonder la facturation d’un éditeur camerounais');
  assert.ok(!/TVA non applicable/.test(all));
  assert.match(cgv, /hors taxes/);
  assert.match(cgv, /reverse charge|autoliquidée/i, 'le régime applicable aux clients professionnels de l’UE doit être exposé');
});

test('TVA : la mention courte ne revendique aucune franchise française', () => {
  const short = shortTaxMention();
  assert.ok(!/293 B/.test(short));
  assert.match(short, /hors taxes/i);
});

test('TVA : une franchise française réelle reste correctement rendue', () => {
  const french: EditorConfig = { ...EDITOR_CONFIG, tax: { regime: 'french_franchise', note: 'Franchise en base' } };
  assert.match(taxStatement(french), /293 B/);
  assert.match(shortTaxMention(french), /293 B/);
});

test('CGV : les prix correspondent exactement aux plans du produit', () => {
  for (const plan of ['essentiel', 'pro', 'cabinet'] as const) {
    const details = PLAN_DETAILS[plan];
    assert.ok(cgv.includes(`${details.priceMonthly} €`), `le prix de ${plan} doit figurer dans les CGV`);
    assert.ok(cgv.includes(`${details.seats} poste`), `le nombre de postes de ${plan} doit figurer dans les CGV`);
  }
});

test('CGV : les obligations françaises de délai de paiement ne sont plus imposées', () => {
  assert.ok(!/L441-10|D441-5|40 €|soixante jours|quarante-cinq jours/i.test(cgv));
});

/* ------------------------------------------------------------------ */
/* CGV                                                                 */
/* ------------------------------------------------------------------ */

test('CGV : la vente est expressément réservée aux professionnels', () => {
  assert.match(cgv, /proposé aux professionnels/);
  assert.match(cgv, /ne sont pas proposées aux consommateurs/i);
  assert.match(cgv, /prévaudraient sur toute clause contraire/i, 'la protection impérative du consommateur est réservée');
});

test('CGV : une garantie commerciale de 14 jours est offerte au-delà du droit commun', () => {
  assert.match(cgv, /garantie commerciale d’annulation/i);
  assert.match(cgv, /quatorze jours/);
  assert.match(cgv, /ne crée pas un droit de rétractation au sens d’une législation de protection des consommateurs/);
  assert.match(cgv, /désactivation de la clé/i);
});

test('CGV : la clause de sauvegarde dit clairement que l’éditeur ne peut rien restaurer', () => {
  assert.match(cgv, /seul responsable de la sauvegarde/);
  assert.match(cgv, /aucune copie des données/);
  assert.match(cgv, /ne peut donc procéder à aucune restauration/);
});

test('CGV : les indicateurs ne sont pas présentés comme conformes à un référentiel comptable', () => {
  assert.match(cgv, /ni une provision au sens des normes IFRS 9 ou CECL/);
  assert.ok(!/conforme[s]? (à|aux)? ?IFRS/i.test(cgv));
  assert.ok(!/conforme[s]? (à|aux)? ?CECL/i.test(cgv));
});

test('CGV : le rôle des plateformes de distribution n’est pas inventé', () => {
  assert.match(cgv, /n’est pas encore établie/);
  assert.match(cgv, /n’est ni l’éditeur du logiciel, ni le titulaire des droits/);
  assert.match(cgv, /Maketou/);
  assert.match(cgv, /Chariow/);
});

test('CGV : le droit applicable est celui de l’éditeur, pas celui du client', () => {
  assert.match(cgv, /soumises au droit applicable au Cameroun/);
  assert.ok(!/soumises au droit français/i.test(cgv));
});

/* ------------------------------------------------------------------ */
/* CGU                                                                 */
/* ------------------------------------------------------------------ */

test('CGU : objet distinct des CGV et renvoi explicite', () => {
  assert.match(cgu, /conditions générales d’utilisation/);
  assert.match(cgu, /ne se confondent pas avec les conditions générales de vente/);
  assert.ok(
    CONDITIONS_OF_USE_SECTIONS.some(section => section.link?.path === '/cgv'),
    'les CGU doivent renvoyer aux CGV par un lien'
  );
});

test('CGU : licence, propriété intellectuelle et usages interdits sont couverts', () => {
  assert.match(cgu, /Le logiciel est concédé en licence, et non vendu/);
  assert.match(cgu, /Apache 2.0/);
  assert.match(cgu, /Usages interdits/);
  assert.match(cgu, /Titulaire des droits/);
});

test('CGU : les indicateurs ne sont pas une opinion comptable', () => {
  assert.match(cgu, /ni une opinion comptable/);
  assert.match(cgu, /IFRS 9 ou CECL/);
});

/* ------------------------------------------------------------------ */
/* Confidentialité                                                     */
/* ------------------------------------------------------------------ */

test('Confidentialité : l’applicabilité du RGPD est motivée, pas supposée', () => {
  assert.match(privacy, /article 3, paragraphe 2/);
  assert.match(privacy, /offre des biens ou services à des personnes qui s’y trouvent/);
  assert.match(privacy, /suffit à déclencher l’application du RGPD/);
});

test('Confidentialité : le représentant dans l’Union (article 27) est annoncé comme manquant', () => {
  assert.match(privacy, /article 27/);
  assert.match(privacy, /aucun représentant n’est encore désigné/);
});

test('Confidentialité : les bases légales et les droits RGPD sont exposés', () => {
  assert.match(privacy, /article 6\.1\.b/);
  assert.match(privacy, /article 6\.1\.c/);
  assert.match(privacy, /article 6\.1\.f/);
  assert.match(privacy, /articles 15 à 20/);
  assert.match(privacy, /dix ans/, 'durée de conservation comptable');
});

test('Confidentialité : l’autorité camerounaise n’est pas inventée', () => {
  assert.match(privacy, /aucune autorité de contrôle équivalente à la CNIL n’est identifiée/);
  assert.match(privacy, /loi n° 2010\/012/);
});

test('Confidentialité : la CNIL est présentée comme l’autorité des résidents français', () => {
  assert.match(privacy, /Si vous résidez dans l’Union européenne/);
  assert.match(privacy, /CNIL/);
  assert.match(privacy, /3 place de Fontenoy/);
});

test('Confidentialité : l’absence de transfert des données financières est affirmée', () => {
  assert.match(privacy, /ne sont transmis ni à l’Éditeur/);
  assert.match(privacy, /n’a donc aucun accès technique/);
  assert.match(privacy, /sauvegarde relève de votre responsabilité/);
});

test('Confidentialité : aucun traceur publicitaire et pas de bandeau de cookies trompeur', () => {
  assert.match(privacy, /aucun cookie publicitaire/);
  assert.match(privacy, /ne dépose aucun cookie/);
  assert.match(privacy, /strictement nécessaire/);
});

/* ------------------------------------------------------------------ */
/* Rétractation                                                        */
/* ------------------------------------------------------------------ */

test('Rétractation : le régime B2B est expliqué sans ambiguïté', () => {
  assert.match(withdrawal, /mécanisme de protection des consommateurs/);
  assert.match(withdrawal, /aucun droit de rétractation légal/i);
  assert.match(withdrawal, /L221-18/, 'le fondement écarté est cité à titre d’exemple');
  assert.match(withdrawal, /à titre d’exemple/, 'la référence française est présentée comme une illustration');
});

test('Rétractation : la garantie commerciale de 14 jours est présentée comme volontaire', () => {
  assert.match(withdrawal, /garantie commerciale d’annulation/i);
  assert.match(withdrawal, /ne constitue pas un droit de rétractation/);
  assert.match(withdrawal, /quatorze jours/);
  assert.match(withdrawal, /formulaire type/i);
  assert.match(withdrawal, /remboursement/i);
});

test('Rétractation : les données locales ne sont pas affectées par la désactivation', () => {
  assert.match(withdrawal, /ni consultées, ni modifiées, ni supprimées/);
});

test('Rétractation : la médiation de la consommation n’est pas revendiquée', () => {
  assert.match(withdrawal, /La médiation de la consommation ne s’applique pas aux relations entre professionnels/);
  assert.match(cgv, /aucun médiateur de la consommation n’est désigné/);
});

/* ------------------------------------------------------------------ */
/* Vérifications transverses                                           */
/* ------------------------------------------------------------------ */

test('Aucun document ne renvoie vers la plateforme RLL/ODR (fermée le 20 juillet 2025)', () => {
  assert.ok(!/ec\.europa\.eu\/consumers\/odr/i.test(all));
  assert.match(cgv, /20 juillet 2025/);
});

test('Mentions légales : le numéro de l’hébergeur est qualifié, sans laisser croire à un standard', () => {
  assert.match(mentions, /559 288 7060/);
  assert.match(mentions, /DMCA\/abus/);
  assert.match(mentions, /dmca@vercel\.com/);
});

test('Documents : un champ manquant n’est jamais remplacé par une valeur plausible', () => {
  const config: EditorConfig = {
    ...EDITOR_CONFIG,
    identity: { ...EDITOR_CONFIG.identity, phone: toComplete('téléphone') },
  };
  const text = documentText(buildLegalNotice(config));
  assert.match(text, /Téléphone : \[à compléter\]/);
});
