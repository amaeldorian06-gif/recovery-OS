import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRAFT_LABELS,
  EMPTY_DRAFT,
  EditorDraft,
  applicabilityFor,
  buildConfigFromDraft,
  draftIsUsable,
  identifierLabelFor,
  validateDraft,
} from './editorBuilder';
import {
  EditorConfig,
  HOST,
  STATE_HELPERS,
  editorAddressLine,
  toConfigLiteral,
  validateDocument,
  validationSummary,
} from './editor';
import { getJurisdiction } from './jurisdictions';

/* ------------------------------------------------------------------ */
/* Jeux de données                                                     */
/* ------------------------------------------------------------------ */

/** Saisie complète pour un éditeur personne physique au Cameroun. */
const completeIndividual: EditorDraft = {
  ...EMPTY_DRAFT,
  type: 'individual',
  countryCode: 'CM',
  legalName: 'Awa Ngo Bassa',
  address: 'Rue 3.142, quartier Baladji II',
  city: 'Ngaoundéré',
  phone: '+237 600 000 000',
  email: 'bonjour@exemple.cm',
  identifier: 'CM-NDE-2026-A-1234',
  taxNumber: 'M012345678901A',
};

/** Saisie complète pour une société immatriculée en France. */
const completeCompany: EditorDraft = {
  ...EMPTY_DRAFT,
  type: 'company',
  countryCode: 'FR',
  legalName: 'Exemple SAS',
  address: '12 rue de la Paix',
  postalCode: '75002',
  city: 'Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@exemple.fr',
  identifier: '123 456 789',
  taxNumber: 'FR12345678901',
  capital: '10 000 €',
  domesticRegistry: 'RCS Paris 123 456 789',
  publicationDirector: 'Camille Martin',
};

/* ------------------------------------------------------------------ */
/* Applicabilité conditionnelle                                        */
/* ------------------------------------------------------------------ */

test('Applicabilité : une personne physique au Cameroun n’a ni capital, ni greffe, ni code postal', () => {
  const draft = { type: 'individual' as const, countryCode: 'CM' };
  assert.equal(applicabilityFor('capital', draft).applicable, false);
  assert.equal(applicabilityFor('domesticRegistry', draft).applicable, false);
  assert.equal(applicabilityFor('postalCode', draft).applicable, false);
  assert.equal(applicabilityFor('publicationDirector', draft).applicable, false);
  assert.ok(applicabilityFor('postalCode', draft).reason?.includes('code postal'));
});

test('Applicabilité : une société en France doit fournir capital, RCS et directeur de publication', () => {
  const draft = { type: 'company' as const, countryCode: 'FR' };
  for (const key of ['capital', 'domesticRegistry', 'postalCode', 'publicationDirector'] as const) {
    assert.equal(applicabilityFor(key, draft).applicable, true, `${key} doit s’appliquer`);
  }
});

test('Applicabilité : une société au Cameroun garde le capital mais pas le greffe français', () => {
  const draft = { type: 'company' as const, countryCode: 'CM' };
  assert.equal(applicabilityFor('capital', draft).applicable, true);
  assert.equal(applicabilityFor('domesticRegistry', draft).applicable, false);
});

test('Applicabilité : les champs d’identité restent toujours applicables', () => {
  for (const type of ['individual', 'company', 'self_employed'] as const) {
    for (const key of ['legalName', 'address', 'city', 'phone', 'email', 'identifier', 'taxNumber'] as const) {
      assert.equal(applicabilityFor(key, { type, countryCode: 'CM' }).applicable, true);
    }
  }
});

test('Libellé : le numéro attendu est nommé selon le pays et le type', () => {
  const cm = getJurisdiction('CM');
  const fr = getJurisdiction('FR');
  assert.match(identifierLabelFor('individual', cm), /RCCM|déclaration/i);
  assert.match(identifierLabelFor('company', fr), /RCS/i);
});

/* ------------------------------------------------------------------ */
/* Validation de la saisie                                             */
/* ------------------------------------------------------------------ */

test('Saisie vide : seuls les champs réellement applicables sont réclamés', () => {
  const issues = validateDraft(EMPTY_DRAFT).filter(issue => issue.severity === 'error');
  const fields = issues.map(issue => issue.field);

  assert.ok(fields.includes('legalName'));
  assert.ok(fields.includes('email'));
  assert.ok(fields.includes('identifier'));
  assert.ok(!fields.includes('capital'), 'une personne physique n’a pas de capital');
  assert.ok(!fields.includes('postalCode'), 'le Cameroun n’a pas de code postal');
  assert.ok(!fields.includes('domesticRegistry'), 'aucun greffe français');
});

test('Saisie complète : aucun blocage', () => {
  assert.equal(draftIsUsable(completeIndividual), true);
  assert.equal(validateDraft(completeIndividual).filter(issue => issue.severity === 'error').length, 0);
  assert.equal(draftIsUsable(completeCompany), true);
});

test('Saisie : un courriel mal formé est refusé', () => {
  const issues = validateDraft({ ...completeIndividual, email: 'awa(at)exemple' });
  assert.ok(issues.some(issue => issue.field === 'email' && issue.severity === 'error'));
  assert.equal(draftIsUsable({ ...completeIndividual, email: 'awa(at)exemple' }), false);
});

test('Saisie : un courriel en .example est signalé sans être refusé', () => {
  const issues = validateDraft({ ...completeIndividual, email: 'awa@site.example' });
  assert.ok(issues.some(issue => issue.field === 'email' && issue.severity === 'warning'));
  assert.equal(draftIsUsable({ ...completeIndividual, email: 'awa@site.example' }), true);
});

test('Saisie : un téléphone sans chiffres suffisants est refusé', () => {
  assert.equal(draftIsUsable({ ...completeIndividual, phone: 'appelez-moi' }), false);
  assert.equal(draftIsUsable({ ...completeIndividual, phone: '+237 6 00 00 00 00' }), true);
});

test('Saisie : un emplacement de modèle non remplacé est refusé', () => {
  const issues = validateDraft({ ...completeIndividual, legalName: '[NOM À COMPLÉTER]' });
  assert.ok(issues.some(issue => issue.field === 'legalName' && issue.severity === 'error'));
});

test('Saisie : une valeur sans objet est signalée comme ignorée, sans bloquer', () => {
  const issues = validateDraft({ ...completeIndividual, postalCode: '55700' });
  const warning = issues.find(issue => issue.field === 'postalCode');
  assert.equal(warning?.severity, 'warning');
  assert.match(warning?.message ?? '', /ignorée/);
});

test('Saisie : le statut de l’entrepreneur est rappelé comme point de vigilance', () => {
  const issues = validateDraft(completeIndividual);
  assert.ok(issues.some(issue => issue.field === 'type' && issue.severity === 'warning'));
});

test('Saisie : aucune étiquette de champ n’est oubliée', () => {
  for (const label of Object.values(DRAFT_LABELS)) {
    assert.ok(label.length > 3);
  }
});

/* ------------------------------------------------------------------ */
/* Configuration produite                                              */
/* ------------------------------------------------------------------ */

test('Configuration produite : les champs sans objet portent une justification', () => {
  const config = buildConfigFromDraft(completeIndividual);
  assert.equal(config.registration.capital.state, 'not_applicable');
  assert.ok((config.registration.capital.note ?? '').length > 10);
  assert.equal(config.identity.postalCode.state, 'not_applicable');
  assert.equal(config.registration.domesticRegistry.state, 'not_applicable');
});

test('Configuration produite : aucun champ applicable ne reste vide après saisie complète', () => {
  const config = buildConfigFromDraft(completeIndividual);
  assert.equal(config.identity.legalName.state, 'provided');
  assert.equal(config.registration.identifier.value, 'CM-NDE-2026-A-1234');
  assert.ok(!validationSummary(config).missingFields.some(issue => issue.key === 'identity.legalName'));
});

test('Configuration produite : une saisie incomplète laisse les documents bloqués', () => {
  const config = buildConfigFromDraft(EMPTY_DRAFT);
  const summary = validationSummary(config);
  assert.equal(summary.structurallyComplete, false);
  assert.ok(summary.documents.every(doc => doc.status === 'incomplete'));
});

test('Configuration produite : une saisie complète ne déclare jamais la conformité acquise', () => {
  const summary = validationSummary(buildConfigFromDraft(completeIndividual));
  assert.equal(summary.structurallyComplete, true);
  assert.equal(summary.legalReviewRequired, true, 'les points de droit restent ouverts');
  assert.ok(summary.documents.every(doc => doc.status !== 'incomplete'));
});

test('Configuration produite : une société exige un directeur de publication distinct', () => {
  const withoutDirector = { ...completeCompany, publicationDirector: '' };
  assert.equal(draftIsUsable(withoutDirector), false);
  const config = buildConfigFromDraft({ ...withoutDirector, publicationDirector: '' });
  const mentions = validateDocument(config, 'mentions-legales');
  assert.equal(mentions.status, 'incomplete');
});

test('Configuration produite : l’adresse d’une personne physique camerounaise ignore le code postal', () => {
  const line = editorAddressLine(buildConfigFromDraft(completeIndividual));
  assert.match(line, /Ngaoundéré/);
  assert.match(line, /Cameroun$/);
  assert.ok(!line.includes('sans objet'));
});

test('Configuration produite : une société française conserve son code postal', () => {
  const line = editorAddressLine(buildConfigFromDraft(completeCompany));
  assert.match(line, /75002/);
  assert.match(line, /Paris/);
});

test('Configuration produite : les canaux non qualifiés restent non qualifiés', () => {
  const config = buildConfigFromDraft(completeIndividual);
  assert.ok(config.channels.every(channel => !channel.roleVerified));
  assert.equal(config.salesScope, 'b2b', 'la décision produit ne dépend pas de la saisie');
});

/* ------------------------------------------------------------------ */
/* Bloc de configuration copiable                                      */
/* ------------------------------------------------------------------ */

test('Bloc copiable : seules les fonctions d’aide existantes sont émises', () => {
  // Régression : `to_complete(...)` était émis à la place de `toComplete(...)`,
  // donc le bloc collé ne compilait pas.
  const literal = toConfigLiteral(buildConfigFromDraft(completeIndividual));
  const calls = literal.match(/^\s*\w+\(/gm) ?? [];
  const names = new Set(calls.map(call => call.trim().replace('(', '')));
  const allowed = new Set(Object.values(STATE_HELPERS));
  for (const name of names) {
    assert.ok(allowed.has(name), `fonction inconnue émise : ${name}`);
  }
  assert.ok(!/to_complete\(|not_applicable\(|legal_review_required\(/.test(literal));
});

test('Bloc copiable : les états non renseignés sont bien émis', () => {
  const literal = toConfigLiteral(buildConfigFromDraft(EMPTY_DRAFT));
  assert.match(literal, /toComplete\(/);
  assert.match(literal, /notApplicable\(/);
  assert.ok(!literal.includes('undefined'));
});

test('Bloc copiable : la configuration produite reste sérialisable pour un pays hors référentiel', () => {
  const config: EditorConfig = buildConfigFromDraft({ ...completeIndividual, countryCode: 'ZZ' });
  const summary = validationSummary(config);
  assert.ok(Array.isArray(summary.documents));
  assert.ok(!toConfigLiteral(config).includes('undefined'));
});

test('Hébergement : inchangé quelle que soit la saisie', () => {
  assert.equal(HOST.name, 'Vercel Inc.');
});
