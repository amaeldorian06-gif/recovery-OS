import test from 'node:test';
import assert from 'node:assert/strict';
import { Repository, ALL_STORES } from './repository';
import { MemoryBackend } from './backend';
import { exportBackup, inspectBackup, restoreBackup, backupToFileParts, BACKUP_FORMAT } from './backup';
import { generateLicenseKey, validateLicenseKey, buildLicense } from './license';
import { buildDemoInvoices, buildDemoCsvTemplate } from './seed';
import { InvoiceRecord } from '../types';
import { todayISO, addDaysISO } from '../utils/dates';

async function seededRepo() {
  const repo = new Repository(new MemoryBackend(ALL_STORES));
  await repo.init();
  const org = await repo.registerUser({
    fullName: 'Camille',
    email: 'camille@exemple.fr',
    companyName: 'Cabinet Exemple',
    password: 'MotDePasse2026!',
  });
  const today = todayISO();
  const invoices: InvoiceRecord[] = [
    {
      id: 'b1', invoiceNumber: 'FA-B-1', customerName: 'Alpha', customerEmail: 'a@a.fr',
      issueDate: addDaysISO(today, -90), dueDate: addDaysISO(today, -60),
      totalAmount: 5000, paidAmount: 0, outstandingAmount: 5000, currency: 'EUR',
      status: 'overdue', daysPastDue: 60, agingBucket: '31-60', riskScore: 50, riskTier: 'High', riskFactors: [],
    },
    {
      id: 'b2', invoiceNumber: 'FA-B-2', customerName: 'Bêta', customerEmail: 'b@b.fr',
      issueDate: addDaysISO(today, -40), dueDate: addDaysISO(today, -10),
      totalAmount: 2500, paidAmount: 500, outstandingAmount: 2000, currency: 'EUR',
      status: 'overdue', daysPastDue: 10, agingBucket: '1-30', riskScore: 20, riskTier: 'Low', riskFactors: [],
    },
  ];
  await repo.importInvoices(org.organization.id, invoices, 'replace');
  await repo.recordPayment(org.organization.id, 'b1', { amount: 1000, paidDate: today, reference: 'Virement' });
  return { repo, orgId: org.organization.id };
}

test('Sauvegarde : export, empreinte, inspection et restauration complets', async () => {
  const { repo, orgId } = await seededRepo();

  const backup = await exportBackup(repo, orgId);
  assert.equal(backup.format, BACKUP_FORMAT);
  assert.equal(backup.counts.invoices, 2);
  // 1 écriture initiale issue de l'import (b2 réglé partiellement) + 1 encaissement explicite
  assert.equal(backup.counts.payments, 2);
  assert.ok(backup.checksum.length >= 8);

  const { content, filename } = backupToFileParts(backup);
  assert.ok(filename.endsWith('.json'));
  assert.ok(content.includes('FA-B-1'));

  const inspection = await inspectBackup(content);
  assert.equal(inspection.valid, true, inspection.errors.join(' / '));
  assert.equal(inspection.checksumOk, true);
  assert.equal(inspection.organizationName, 'Cabinet Exemple');
  assert.equal(inspection.previewSample.length, 2);
});

test('Inspection : fichier corrompu rejeté avec erreur explicite', async () => {
  const { repo, orgId } = await seededRepo();
  const backup = await exportBackup(repo, orgId);
  const tampered = JSON.parse(JSON.stringify(backup));
  tampered.payload.invoices[0].totalAmount = 999999;
  const inspection = await inspectBackup(JSON.stringify(tampered));
  assert.equal(inspection.valid, false);
  assert.ok(inspection.errors.some(e => e.toLowerCase().includes('checksum')));

  const notJson = await inspectBackup('{oops');
  assert.equal(notJson.valid, false);
  assert.ok(notJson.errors.some(e => e.includes('JSON')));

  const wrongFormat = await inspectBackup(JSON.stringify({ format: 'autre', version: 1, payload: {} }));
  assert.equal(wrongFormat.valid, false);
});

test('Restauration : le mode remplacement exige une confirmation explicite', async () => {
  const { repo, orgId } = await seededRepo();
  const backup = await exportBackup(repo, orgId);
  const content = JSON.stringify(backup);

  // Vide le portefeuille puis restaure en remplacement SANS confirmation => refus
  await repo.importInvoices(orgId, [], 'replace');
  await assert.rejects(
    () => restoreBackup(repo, orgId, content, { mode: 'replace' }),
    /confirmation explicite requise/
  );

  // Avec la confirmation exacte => restauration
  const report = await restoreBackup(repo, orgId, content, { mode: 'replace', confirmation: 'RESTAURER' });
  assert.equal(report.invoices, 2);
  const restored = await repo.listInvoices(orgId);
  assert.equal(restored.length, 2);
  const alpha = restored.find(i => i.invoiceNumber === 'FA-B-1')!;
  assert.equal(alpha.paidAmount, 1000, 'le journal des encaissements doit être restauré');
  assert.equal(alpha.outstandingAmount, 4000);
});

test('Restauration en fusion : rien nest écrasé', async () => {
  const { repo, orgId } = await seededRepo();
  const backup = await exportBackup(repo, orgId);
  const content = JSON.stringify(backup);

  const report = await restoreBackup(repo, orgId, content, { mode: 'merge' });
  assert.equal(report.mode, 'merge');
  const all = await repo.listInvoices(orgId);
  assert.equal(all.length, 2);
});

test('Sauvegarde/restauration : aller-retour conserve les calculs dérivés', async () => {
  const { repo, orgId } = await seededRepo();
  const before = await repo.listInvoices(orgId);
  const backup = await exportBackup(repo, orgId);
  await restoreBackup(repo, orgId, JSON.stringify(backup), { mode: 'replace', confirmation: 'RESTAURER' });
  const after = await repo.listInvoices(orgId);
  assert.equal(after.length, before.length);
  for (const inv of after) {
    const match = before.find(b => b.invoiceNumber === inv.invoiceNumber)!;
    assert.equal(inv.paidAmount, match.paidAmount);
    assert.equal(inv.daysPastDue, match.daysPastDue);
    assert.equal(inv.riskScore, match.riskScore);
  }
});

test('Licences : génération, validation, falsification détectée', () => {
  const key = generateLicenseKey('pro', () => 0.42);
  const validation = validateLicenseKey(key);
  assert.equal(validation.ok, true);
  if (validation.ok) assert.equal(validation.plan, 'pro');

  const license = buildLicense('pro', key);
  assert.equal(license.seats, 3);
  assert.equal(license.verification, 'locale');
  assert.equal(license.label, 'Professionnel');

  const tampered = key.slice(0, -1) + (key.endsWith('A') ? 'B' : 'A');
  assert.equal(validateLicenseKey(tampered).ok, false);
  assert.equal(validateLicenseKey('RRV-PRO-AAAAAAAAAAAA').ok, false);
});

test('Démo : le jeu de démonstration est cohérent et daté du jour', () => {
  const demo = buildDemoInvoices();
  assert.ok(demo.length >= 8);
  const today = todayISO();
  for (const inv of demo) {
    assert.equal(inv.currency, 'EUR');
    const expectedDpd = Math.round(
      (new Date(`${inv.dueDate}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000
    ) * -1;
    assert.equal(inv.daysPastDue, expectedDpd, `retard incohérent sur ${inv.invoiceNumber}`);
  }
  const template = buildDemoCsvTemplate();
  assert.ok(template.includes('Numéro de facture'));
  assert.ok(template.split('\r\n').length === 4);
});
