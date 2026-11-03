import test from 'node:test';
import assert from 'node:assert/strict';
import { missingLegalFields, isLegalIdentityIncomplete, editorAddressLine, EDITOR, HOST } from './editor';

test('Identité légale : la liste des champs manquants est stable entre deux appels', () => {
  // Test de régression : une expression régulière avec le drapeau `g` utilisée
  // via `RegExp.test` conserve `lastIndex` et produit des résultats alternés.
  const first = missingLegalFields();
  const second = missingLegalFields();
  const third = missingLegalFields();
  assert.deepEqual(first, second);
  assert.deepEqual(second, third);
});

test('Identité légale : tant que les placeholders sont présents, la complétude est signalée', () => {
  const missing = missingLegalFields();
  const hasPlaceholders = [EDITOR.legalName, EDITOR.siren, EDITOR.address].some(v => v.includes('['));
  if (hasPlaceholders) {
    assert.equal(isLegalIdentityIncomplete(), true, 'des placeholders doivent rendre l’identité incomplète');
    assert.ok(missing.length > 0);
    assert.ok(missing.includes('Raison sociale'));
  } else {
    assert.equal(isLegalIdentityIncomplete(), false, 'une identité complète ne doit pas être signalée');
    assert.deepEqual(missing, []);
  }
});

test('Identité légale : le médiateur non désigné est listé comme manquant', () => {
  const missing = missingLegalFields();
  if (EDITOR.mediator === null) {
    assert.ok(
      missing.some(m => m.includes('Médiateur de la consommation')),
      'l’absence de médiateur doit figurer dans la liste (obligation L616-1 en B2C)'
    );
  }
});

test('Identité légale : l’adresse postale est restituée sur une seule ligne lisible', () => {
  const line = editorAddressLine();
  assert.ok(line.includes(EDITOR.city));
  assert.ok(line.includes(EDITOR.postalCode));
  assert.ok(line.endsWith(EDITOR.country));
  assert.ok(!line.includes('\n'));
});

test('Hébergement : les coordonnées obligatoires de l’hébergeur sont renseignées', () => {
  // LCEN art. 1-1 : nom, adresse et numéro de téléphone de l’hébergeur.
  assert.ok(HOST.name.length > 3);
  assert.ok(HOST.address.length > 10);
  assert.match(HOST.phone, /^\+?[\d\s().-]{8,}$/);
  assert.ok(!HOST.address.includes('['), 'l’adresse de l’hébergeur ne doit pas être un placeholder');
});

test('Identité légale : un placeholder contenant un caractère spécial (°) est bien détecté', () => {
  // Régression : « [N° TVA INTRACOMMUNAUTAIRE] » échappait au motif initial
  // restreint aux lettres et chiffres, donc une TVA non renseignée passait.
  if (!EDITOR.vatExempt && EDITOR.vatNumber.includes('[')) {
    assert.ok(
      missingLegalFields().includes('Numéro de TVA'),
      'un placeholder avec ° doit être signalé comme manquant'
    );
  }
});
