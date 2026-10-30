import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, roundMoney, formatMoney, normalizeAmountInput } from './money';

test('parseAmount gère le format européen (virgule décimale)', () => {
  const a = parseAmount('1234,56');
  assert.equal(a.ok, true);
  if (a.ok) {
    assert.equal(a.value, 1234.56);
    assert.equal(a.format, 'eu');
  }
  const b = parseAmount('1.234,56');
  assert.equal(b.ok, true);
  if (b.ok) assert.equal(b.value, 1234.56);
});

test('parseAmount gère le format américain (point décimal)', () => {
  const a = parseAmount('1,234.56');
  assert.equal(a.ok, true);
  if (a.ok) {
    assert.equal(a.value, 1234.56);
    assert.equal(a.format, 'us');
  }
  const b = parseAmount('1234.56');
  assert.equal(b.ok, true);
  if (b.ok) assert.equal(b.value, 1234.56);
});

test('CORRECTIF D1 : les montants EU ne sont plus multipliés/divisés par 1000', {
  // Régression du bug historique : "1.234,56" -> 1.23456 (erreur ×1000)
}, () => {
  const v = parseAmount('1.234,56');
  assert.equal(v.ok, true);
  if (v.ok) assert.notEqual(v.value, 1.23456);
  if (v.ok) assert.equal(v.value, 1234.56);

  const w = parseAmount('1234,56');
  assert.equal(w.ok, true);
  if (w.ok) assert.notEqual(w.value, 123456);
  if (w.ok) assert.equal(w.value, 1234.56);
});

test('parseAmount supprime symboles et espaces (y compris insécables)', () => {
  const a = parseAmount('1 234,56 €');
  assert.equal(a.ok, true);
  if (a.ok) assert.equal(a.value, 1234.56);
  const b = parseAmount('1\u00a0234,56€');
  assert.equal(b.ok, true);
  if (b.ok) assert.equal(b.value, 1234.56);
  const c = parseAmount('$1,234.56');
  assert.equal(c.ok, true);
  if (c.ok) assert.equal(c.value, 1234.56);
});

test('parseAmount signale explicitement les formats invalides', () => {
  assert.equal(parseAmount('').ok, false);
  assert.equal(parseAmount('abc').ok, false);
  assert.equal(parseAmount('12,3,4').ok, false);
  assert.equal(parseAmount(null).ok, false);
  assert.equal(parseAmount(undefined).ok, false);
});

test('parseAmount traite les parenthèses comptables comme négatives', () => {
  const a = parseAmount('(1 234,56)');
  assert.equal(a.ok, true);
  if (a.ok) assert.equal(a.value, -1234.56);
});

test('parseAmount accepte un nombre numérique direct', () => {
  const a = parseAmount(1500.75);
  assert.equal(a.ok, true);
  if (a.ok) assert.equal(a.value, 1500.75);
});

test('roundMoney évite les artefacts binaires', () => {
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
  assert.equal(roundMoney(10.005), 10.01);
});

test('formatMoney produit un format FR lisible', () => {
  const out = formatMoney(1234.5, 'EUR');
  assert.ok(out.includes('1'), out);
  assert.ok(out.length > 0);
});

test('normalizeAmountInput retire les symboles courants', () => {
  assert.equal(normalizeAmountInput('12,50 €'), '12,50');
  assert.equal(normalizeAmountInput('12.50 USD'), '12.50');
});
