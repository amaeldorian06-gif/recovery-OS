import test from 'node:test';
import assert from 'node:assert/strict';
import { backupReminder, BACKUP_REMINDER_THRESHOLD_DAYS } from './backupPolicy';
import { addDaysISO } from './dates';

const TODAY = '2026-11-03';

const base = { invoiceCount: 12, mode: 'real' as const, today: TODAY };

test('Rappel : affiché quand aucune sauvegarde n’a jamais été faite', () => {
  const state = backupReminder({ ...base, lastBackupAt: null });
  assert.equal(state.show, true);
  assert.equal(state.elapsedDays, null);
  assert.match(state.message, /Aucune sauvegarde/);
});

test('Rappel : masqué juste après une sauvegarde', () => {
  const state = backupReminder({ ...base, lastBackupAt: `${TODAY}T09:12:00.000Z` });
  assert.equal(state.show, false);
  assert.equal(state.elapsedDays, 0);
});

test('Rappel : masqué sous le seuil, affiché au seuil et au-delà', () => {
  const under = addDaysISO(TODAY, -(BACKUP_REMINDER_THRESHOLD_DAYS - 1));
  const atThreshold = addDaysISO(TODAY, -BACKUP_REMINDER_THRESHOLD_DAYS);
  const over = addDaysISO(TODAY, -(BACKUP_REMINDER_THRESHOLD_DAYS + 21));

  assert.equal(backupReminder({ ...base, lastBackupAt: under }).show, false);
  assert.equal(backupReminder({ ...base, lastBackupAt: atThreshold }).show, true);
  assert.equal(backupReminder({ ...base, lastBackupAt: over }).show, true);

  const state = backupReminder({ ...base, lastBackupAt: over });
  assert.equal(state.elapsedDays, BACKUP_REMINDER_THRESHOLD_DAYS + 21);
  assert.match(state.message, /28 jours/);
});

test('Rappel : une date de sauvegarde invalide est traitée comme absente', () => {
  // Aucun « NaN jours » à l'écran si le champ est corrompu.
  const invalid = backupReminder({ ...base, lastBackupAt: 'pas-une-date' });
  assert.equal(invalid.show, true);
  assert.equal(invalid.elapsedDays, null);
});

test('Rappel : jamais en mode démonstration', () => {
  assert.equal(backupReminder({ ...base, mode: 'demo', lastBackupAt: null }).show, false);
});

test('Rappel : jamais sur un portefeuille vide (rien à perdre)', () => {
  assert.equal(backupReminder({ ...base, invoiceCount: 0, lastBackupAt: null }).show, false);
});

test('Rappel : une date de sauvegarde future ne produit pas de faux positif', () => {
  const future = addDaysISO(TODAY, 5);
  const state = backupReminder({ ...base, lastBackupAt: future });
  assert.equal(state.show, false, 'une horloge en avance ne doit pas déclencher le rappel');
});
