import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EDITOR_CONFIG,
  EditorConfig,
  HOST,
  contactEmail,
  displayField,
  editorAddressLine,
  editorCountry,
  hasValue,
  isBlocking,
  localRequiredMention,
  missingLegalFields,
  needsLegalReview,
  notApplicable,
  provided,
  legalReview,
  toComplete,
  toConfigLiteral,
  validateDocument,
  validationSummary,
} from './editor';

/* ------------------------------------------------------------------ */
/* Configuration de test : un éditeur complet, sans valeur inventée     */
/* ------------------------------------------------------------------ */

const completeConfig = (overrides: Partial<EditorConfig> = {}): EditorConfig => ({
  ...EDITOR_CONFIG,
  identity: {
    legalName: provided('Awa Ngo Bassa'),
    tradeName: provided('Revenue Recovery OS'),
    address: provided('Rue 3.142, quartier Baladji II'),
    postalCode: notApplicable('Le Cameroun n’attribue pas de code postal généralisé.'),
    city: provided('Ngaoundéré'),
    phone: provided('+237 600 000 000'),
    email: provided('bonjour@exemple.cm'),
  },
  registration: {
    identifier: provided('CM-NDE-2026-A-1234'),
    identifierLabel: 'Numéro de déclaration d’activité (RCCM)',
    identifierCountry: provided('Cameroun'),
    taxNumber: provided('M012345678901A'),
    capital: notApplicable('Une personne physique n’a pas de capital social.'),
    domesticRegistry: notApplicable('Aucune immatriculation française.'),
  },
  publication: {
    directorIsEditor: true,
    directorName: notApplicable('Le directeur de publication est l’éditeur.'),
    directorContact: notApplicable('Le contact est l’adresse e-mail de l’éditeur.'),
  },
  tax: { regime: 'no_french_vat', note: 'Aucune TVA française facturée.' },
  salesScope: 'b2b',
  ...overrides,
});

/* ------------------------------------------------------------------ */
/* 1. Configuration livrée                                             */
/* ------------------------------------------------------------------ */

test('Config livrée : personne physique établie au Cameroun, sans société', () => {
  assert.equal(EDITOR_CONFIG.type, 'individual');
  assert.equal(EDITOR_CONFIG.countryCode, 'CM');
  assert.equal(editorCountry().legalSystem, 'ohada');
});

test('Config livrée : aucune valeur française n’est simulée', () => {
  // Régression de l'étape 2 : la configuration réclamait un SIREN, un greffe et
  // un capital social — trois champs qui n'existent pas pour cet éditeur.
  const capital = EDITOR_CONFIG.registration.capital;
  const registry = EDITOR_CONFIG.registration.domesticRegistry;
  const postal = EDITOR_CONFIG.identity.postalCode;

  assert.equal(capital.state, 'not_applicable');
  assert.equal(registry.state, 'not_applicable');
  assert.equal(postal.state, 'not_applicable');
  assert.ok(!missingLegalFields().some(label => /SIREN|SIRET|greffe|capital/i.test(label)));
});

test('Config livrée : les identifiants réellement exigés restent demandés', () => {
  const missing = missingLegalFields();
  assert.ok(missing.some(label => /nom/i.test(label)), 'le nom légal doit être exigé');
  assert.ok(missing.some(label => /téléphone/i.test(label)), 'le téléphone doit être exigé');
  assert.ok(missing.some(label => /déclaration|RCCM|immatriculation/i.test(label)));
});

test('Config livrée : aucune valeur fournie n’est vide ni inventée', () => {
  const all = [
    EDITOR_CONFIG.identity.legalName,
    EDITOR_CONFIG.identity.tradeName,
    EDITOR_CONFIG.identity.address,
    EDITOR_CONFIG.identity.postalCode,
    EDITOR_CONFIG.identity.city,
    EDITOR_CONFIG.identity.phone,
    EDITOR_CONFIG.identity.email,
    EDITOR_CONFIG.registration.identifier,
    EDITOR_CONFIG.registration.taxNumber,
    EDITOR_CONFIG.registration.capital,
    EDITOR_CONFIG.registration.domesticRegistry,
  ];
  for (const field of all) {
    if (field.state === 'provided') {
      assert.ok((field.value ?? '').length > 0, 'un champ « renseigné » doit porter une valeur');
      assert.ok(!/\[[^\]]{2,}\]/.test(field.value ?? ''), 'aucun placeholder ne doit subsister');
    }
  }
});

/* ------------------------------------------------------------------ */
/* 2. Sémantique des quatre états                                      */
/* ------------------------------------------------------------------ */

test('États : « renseigné » porte une valeur exploitable', () => {
  const field = provided('Awa Ngo Bassa');
  assert.equal(field.state, 'provided');
  assert.equal(hasValue(field), true);
  assert.equal(isBlocking(field), false);
  assert.equal(needsLegalReview(field), false);
});

test('États : « non applicable » n’est jamais bloquant', () => {
  const field = notApplicable('Pas de code postal au Cameroun.');
  assert.equal(field.state, 'not_applicable');
  assert.equal(hasValue(field), false);
  assert.equal(isBlocking(field), false);
  assert.equal(needsLegalReview(field), false);
});

test('États : « à compléter » est bloquant', () => {
  const field = toComplete('nom légal');
  assert.equal(field.state, 'to_complete');
  assert.equal(isBlocking(field), true);
  assert.equal(displayField(field), '[à compléter]');
});

test('États : « à vérifier juridiquement » exige une revue, sans bloquer techniquement', () => {
  const field = legalReview('Rôle de la plateforme à établir');
  assert.equal(field.state, 'legal_review_required');
  assert.equal(needsLegalReview(field), true);
  assert.equal(isBlocking(field), false);
  assert.match(displayField(field), /à vérifier juridiquement/);
});

test('États : une valeur renseignée n’est jamais tronquée à l’affichage', () => {
  assert.equal(displayField(provided('Ngaoundéré')), 'Ngaoundéré');
});

/* ------------------------------------------------------------------ */
/* 3. Validation conditionnelle par type d’éditeur                     */
/* ------------------------------------------------------------------ */

test('Validation : une personne physique au Cameroun n’a pas à fournir de capital', () => {
  const cgv = validateDocument(completeConfig(), 'cgv');
  assert.ok(!cgv.missing.some(issue => /capital/i.test(issue.label)));
});

test('Validation : une société doit fournir son capital dans les CGV', () => {
  const company = completeConfig({
    type: 'company',
    registration: {
      ...completeConfig().registration,
      capital: toComplete('capital social'),
    },
  });
  const cgv = validateDocument(company, 'cgv');
  assert.ok(cgv.missing.some(issue => issue.key === 'registration.capital'));
  assert.equal(cgv.status, 'incomplete');
});

test('Validation : une société ne peut pas se déclarer sans immatriculation', () => {
  const company = completeConfig({
    type: 'company',
    registration: {
      ...completeConfig().registration,
      identifier: toComplete('numéro RCCM'),
    },
  });
  const mentions = validateDocument(company, 'mentions-legales');
  assert.equal(mentions.status, 'incomplete');
  assert.ok(mentions.missing.some(issue => issue.key === 'registration.identifier'));
});

test('Validation : l’entreprenant relève du même registre déclaratif que la personne physique', () => {
  const entrepreneur = completeConfig({ type: 'self_employed' });
  assert.equal(validateDocument(entrepreneur, 'mentions-legales').missing.length, 0);
  assert.equal(validateDocument(entrepreneur, 'cgv').missing.length, 0);
});

test('Validation : une configuration complète n’est pas déclarée conforme pour autant', () => {
  const summary = validationSummary(completeConfig());
  assert.equal(summary.structurallyComplete, true, 'aucun champ ne doit manquer');
  assert.equal(summary.legalReviewRequired, true, 'des points de droit restent ouverts');
  assert.ok(summary.documents.every(doc => doc.status !== 'incomplete'));
  assert.ok(
    summary.documents.some(doc => doc.status === 'legal_review_required'),
    'au moins un document doit rester en attente de validation juridique'
  );
});

test('Validation : un champ manquant bloque le document concerné, pas les autres', () => {
  const partial = completeConfig({
    identity: { ...completeConfig().identity, phone: toComplete('téléphone') },
  });
  assert.equal(validateDocument(partial, 'mentions-legales').status, 'incomplete');
  assert.notEqual(validateDocument(partial, 'confidentialite').status, 'incomplete');
});

test('Validation : le résumé agrège les champs manquants sans doublon', () => {
  const summary = validationSummary();
  const keys = summary.missingFields.map(issue => issue.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(summary.structurallyComplete, false);
});

/* ------------------------------------------------------------------ */
/* 4. Champs dérivés                                                   */
/* ------------------------------------------------------------------ */

test('Adresse : aucun code postal n’est affiché lorsque le pays n’en attribue pas', () => {
  const line = editorAddressLine(completeConfig());
  assert.ok(line.includes('Ngaoundéré'));
  assert.ok(line.endsWith('Cameroun'));
  assert.ok(!line.includes('sans objet'), 'un champ sans objet ne doit pas polluer l’adresse');
  assert.ok(!line.includes('\n'));
});

test('Contact : le repli est un domaine réservé, donc non routable', () => {
  const withoutEmail = completeConfig({
    identity: { ...completeConfig().identity, email: toComplete('courriel') },
  });
  assert.equal(contactEmail(withoutEmail), 'contact@recovery-os.example');
  assert.equal(contactEmail(completeConfig()), 'bonjour@exemple.cm');
});

test('Mention locale : un éditeur OHADA non immatriculé doit porter la mention légale', () => {
  assert.equal(localRequiredMention(), 'Entreprenant dispensé d’immatriculation');
});

test('Directeur de publication : confondu avec l’éditeur pour une personne physique', () => {
  const summary = validationSummary(completeConfig());
  // Le document ne doit pas réclamer un directeur distinct à une personne physique.
  const mentions = summary.documents.find(doc => doc.id === 'mentions-legales');
  assert.ok(mentions);
  assert.ok(!mentions.missing.some(issue => /directeur/i.test(issue.label)));
});

/* ------------------------------------------------------------------ */
/* 5. Sérialisation                                                    */
/* ------------------------------------------------------------------ */

test('Sérialisation : le littéral généré est du TypeScript, pas du JSON', () => {
  const literal = toConfigLiteral(EDITOR_CONFIG);
  assert.match(literal, /type: 'individual'/);
  assert.match(literal, /toComplete\(/);
  assert.ok(!literal.includes('undefined'), 'aucun undefined ne doit apparaître');
});

/* ------------------------------------------------------------------ */
/* 6. Hébergement                                                      */
/* ------------------------------------------------------------------ */

test('Hébergement : les coordonnées obligatoires sont renseignées', () => {
  // LCEN art. 1-1 : nom, adresse et numéro de téléphone de l’hébergeur.
  assert.ok(HOST.name.length > 3);
  assert.ok(HOST.address.length > 10);
  assert.match(HOST.phone, /^\+?[\d\s().-]{8,}$/);
  assert.ok(!HOST.address.includes('['), 'l’adresse de l’hébergeur ne doit pas être un placeholder');
  assert.match(HOST.phoneNote, /DMCA|abus/i);
});
