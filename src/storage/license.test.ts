import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLicenseKey, validateLicenseKey, buildLicense, PLAN_DETAILS, trialDaysLeft, TRIAL_DURATION_DAYS } from './license';
import { addDaysISO } from '../utils/dates';
import { LicensePlan } from './types';

const PLANS: LicensePlan[] = ['trial', 'essentiel', 'pro', 'cabinet'];

test('Licence : une clé générée est reconnue et restitue le bon plan', () => {
  for (const plan of PLANS) {
    for (let i = 0; i < 25; i++) {
      const key = generateLicenseKey(plan);
      const result = validateLicenseKey(key);
      assert.equal(result.ok, true, `clé rejetée pour ${plan} : ${key}`);
      if (result.ok) assert.equal(result.plan, plan);
    }
  }
});

test('Licence : les minuscules et les espaces sont tolérés', () => {
  const key = generateLicenseKey('pro');
  const noisy = `  ${key.toLowerCase().replace(/-/g, ' - ')}  `;
  const result = validateLicenseKey(noisy);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.plan, 'pro');
});

test('Licence : format invalide rejeté avec un motif explicite', () => {
  const cases = [
    '',
    'ABC',
    'RRV-PRO-123',
    'RRV-XXX-ABCDEFGHJKLM-ABCD',
    'RRV-PRO-ABCDEFGHJKLM',
    'PRO-ABCDEFGHJKLM-ABCD',
  ];
  for (const raw of cases) {
    const result = validateLicenseKey(raw);
    assert.equal(result.ok, false, `clé acceptée à tort : « ${raw} »`);
    if (!result.ok) assert.ok(result.reason.length > 10, 'le motif doit être explicite');
  }
});

test('Licence : une clé dont le corps est modifié est rejetée (somme de contrôle)', () => {
  const key = generateLicenseKey('cabinet');
  const parts = key.split('-');
  // Altère un caractère du corps sans recalculer la somme de contrôle.
  const tampered = `${parts[0]}-${parts[1]}-${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}-${parts[3]}`;
  const result = validateLicenseKey(tampered);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /contrôle/i);
});

test('Licence : une clé dont le suffixe de contrôle est modifié est rejetée', () => {
  const key = generateLicenseKey('essentiel');
  const tampered = key.slice(0, -4) + (key.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.equal(validateLicenseKey(tampered).ok, false);
});

test('Licence : buildLicense reprend les caractéristiques du plan', () => {
  for (const plan of PLANS) {
    const key = generateLicenseKey(plan);
    const info = buildLicense(plan, key);
    assert.equal(info.plan, plan);
    assert.equal(info.key, key);
    assert.equal(info.label, PLAN_DETAILS[plan].label);
    assert.equal(info.seats, PLAN_DETAILS[plan].seats);
    assert.equal(info.verification, 'locale');
    assert.match(info.activatedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('Licence : les clés générées sont distinctes (pas de collision immédiate)', () => {
  const keys = new Set<string>();
  for (let i = 0; i < 200; i++) keys.add(generateLicenseKey('pro'));
  assert.equal(keys.size, 200);
});

test('Licence : les jours d’essai restants sont calculés sans invention', () => {
  const TODAY = '2026-11-03';
  const trial = buildLicense('trial', generateLicenseKey('trial'));

  assert.equal(trialDaysLeft(null, TODAY), null, 'aucune licence → pas d’essai');

  const startedToday = { ...trial, activatedAt: TODAY };
  assert.equal(trialDaysLeft(startedToday, TODAY), TRIAL_DURATION_DAYS);

  const startedWeekAgo = { ...trial, activatedAt: addDaysISO(TODAY, -7) };
  assert.equal(trialDaysLeft(startedWeekAgo, TODAY), TRIAL_DURATION_DAYS - 7);

  const expired = { ...trial, activatedAt: addDaysISO(TODAY, -(TRIAL_DURATION_DAYS + 3)) };
  assert.equal(trialDaysLeft(expired, TODAY), -3, 'un essai échu doit être négatif, pas nul');

  const paid = buildLicense('pro', generateLicenseKey('pro'));
  assert.equal(trialDaysLeft({ ...paid, activatedAt: TODAY }, TODAY), null, 'une licence payante n’a pas d’essai');
});
