import test from 'node:test';
import assert from 'node:assert/strict';
import {
  todayISO,
  parseDateInput,
  daysBetween,
  daysPastDue,
  addDaysISO,
  isValidISODate,
} from './dates';

test('todayISO produit la date locale au format ISO', () => {
  const d = new Date(2026, 9, 30); // 30 octobre 2026, heure locale
  assert.equal(todayISO(d), '2026-10-30');
  const d2 = new Date(2026, 0, 5);
  assert.equal(todayISO(d2), '2026-01-05');
});

test('parseDateInput accepte ISO et JJ/MM/AAAA', () => {
  assert.deepEqual(parseDateInput('2026-10-29'), { ok: true, iso: '2026-10-29' });
  assert.deepEqual(parseDateInput('29/10/2026'), { ok: true, iso: '2026-10-29' });
  assert.deepEqual(parseDateInput('29-10-2026'), { ok: true, iso: '2026-10-29' });
  assert.deepEqual(parseDateInput('2026/10/29'), { ok: true, iso: '2026-10-29' });
});

test('parseDateInput rejette explicitement les dates invalides', () => {
  const invalid = parseDateInput('31/02/2026');
  assert.equal(invalid.ok, false);
  assert.equal(parseDateInput('13/25/2026').ok, false);
  assert.equal(parseDateInput('').ok, false);
  assert.equal(parseDateInput('hello').ok, false);
  assert.equal(parseDateInput(null).ok, false);
  assert.equal(parseDateInput('2026-13-01').ok, false);
});

test('daysBetween et daysPastDue', () => {
  assert.equal(daysBetween('2026-10-14', '2026-10-29'), 15);
  assert.equal(daysPastDue('2026-10-14', '2026-10-29'), 15);
  assert.equal(daysPastDue('2026-10-29', '2026-10-29'), 0);
  assert.equal(daysPastDue('2026-11-05', '2026-10-29'), -7);
  // Retourne bien la date du jour par défaut (plus aucune date figée)
  const expected = daysBetween('2020-01-01', todayISO());
  assert.equal(daysPastDue('2020-01-01'), expected);
});

test('daysPastDue lève une erreur sur une date illisible (aucun 0 silencieux)', () => {
  assert.throws(() => daysPastDue('13/25/2026'), /Format de date non reconnu|invalide/);
});

test('addDaysISO gère les bornes de mois', () => {
  assert.equal(addDaysISO('2026-01-31', 1), '2026-02-01');
  assert.equal(addDaysISO('2026-03-01', -1), '2026-02-28');
  assert.equal(addDaysISO('2026-12-31', 1), '2027-01-01');
});

test('isValidISODate', () => {
  assert.equal(isValidISODate('2026-02-28'), true);
  assert.equal(isValidISODate('2026-02-30'), false);
});
