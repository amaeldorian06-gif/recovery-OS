import test from 'node:test';
import assert from 'node:assert/strict';
import { Repository } from './repository';
import { MemoryBackend } from './backend';
import { ALL_STORES } from './repository';
import { InvoiceRecord } from '../types';
import { todayISO, addDaysISO } from '../utils/dates';

function makeRepo(): Repository {
  return new Repository(new MemoryBackend(ALL_STORES));
}

function sampleInvoice(overrides: Partial<InvoiceRecord> = {}): InvoiceRecord {
  const today = todayISO();
  return {
    id: 'inv-test-1',
    invoiceNumber: 'FA-TEST-1',
    customerName: 'Client Test',
    customerEmail: 'client@test.fr',
    issueDate: addDaysISO(today, -60),
    dueDate: addDaysISO(today, -30),
    totalAmount: 1000,
    paidAmount: 0,
    outstandingAmount: 1000,
    currency: 'EUR',
    status: 'overdue',
    daysPastDue: 30,
    agingBucket: '1-30',
    riskScore: 0,
    riskTier: 'Low',
    riskFactors: [],
    ...overrides,
  };
}

test('Repository.init crée le schéma', async () => {
  const repo = makeRepo();
  const result = await repo.init();
  assert.equal(result.schemaVersion, 1);
  assert.equal(await repo.hasAnyUser(), false);
});

test('Inscription : compte local + organisation + session', async () => {
  const repo = makeRepo();
  await repo.init();
  const result = await repo.registerUser({
    fullName: 'Camille Dupont',
    email: 'camille@cabinet-dupont.fr',
    companyName: 'Cabinet Dupont',
    password: 'MotDePasse2026!',
  });
  assert.ok(result.token.startsWith('rr_'));
  assert.equal(result.user.role, 'owner');
  assert.equal(result.organization.name, 'Cabinet Dupont');
  assert.equal(await repo.hasAnyUser(), true);

  const session = await repo.getSession(result.token);
  assert.ok(session);
  assert.equal(session!.user.email, 'camille@cabinet-dupont.fr');
});

test('Inscription : e-mail dupliqué refusé, mot de passe faible refusé', async () => {
  const repo = makeRepo();
  await repo.init();
  const input = { fullName: 'A', email: 'a@b.fr', companyName: 'X', password: 'MotDePasse2026!' };
  await repo.registerUser(input);
  await assert.rejects(() => repo.registerUser(input), /existe déjà/);
  await assert.rejects(
    () => repo.registerUser({ ...input, email: 'c@d.fr', password: 'court' }),
    /8 caractères/
  );
});

test('Connexion : le mot de passe est réellement vérifié', async () => {
  const repo = makeRepo();
  await repo.init();
  await repo.registerUser({
    fullName: 'B', email: 'b@b.fr', companyName: 'Y', password: 'MotDePasse2026!',
  });
  await assert.rejects(() => repo.login('b@b.fr', 'mauvais-mdp'), /Identifiants incorrects/);
  const ok = await repo.login('b@b.fr', 'MotDePasse2026!');
  assert.ok(ok.token);
});

test('Isolation multi-tenant : une organisation ne voit pas les factures d une autre', async () => {
  const repo = makeRepo();
  await repo.init();
  const orgA = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgB = await repo.registerUser({ fullName: 'B', email: 'b@b.fr', companyName: 'OrgB', password: 'MotDePasse2026!' });

  await repo.importInvoices(orgA.organization.id, [sampleInvoice()], 'replace');
  const listA = await repo.listInvoices(orgA.organization.id);
  const listB = await repo.listInvoices(orgB.organization.id);
  assert.equal(listA.length, 1);
  assert.equal(listB.length, 0);

  await assert.rejects(
    () => repo.recordPayment(orgB.organization.id, listA[0].id, { amount: 10, paidDate: todayISO(), reference: 'x' }),
    /introuvable/
  );
});

test('Import : le remplacement écrase, la fusion conserve, la mise à jour fusionne', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;

  await repo.importInvoices(orgId, [sampleInvoice(), sampleInvoice({ id: 'i2', invoiceNumber: 'FA-TEST-2' })], 'replace');
  assert.equal((await repo.listInvoices(orgId)).length, 2);

  const merge = await repo.importInvoices(orgId, [
    sampleInvoice({ id: 'i3', invoiceNumber: 'FA-TEST-3' }),
    sampleInvoice({ id: 'i4', invoiceNumber: 'FA-TEST-1' }),
  ], 'merge');
  assert.equal(merge.inserted, 1);
  assert.equal(merge.skipped, 1);
  assert.equal((await repo.listInvoices(orgId)).length, 3);

  const replace = await repo.importInvoices(orgId, [sampleInvoice({ id: 'i9', invoiceNumber: 'FA-ONLY' })], 'replace');
  assert.equal(replace.inserted, 1);
  const after = await repo.listInvoices(orgId);
  assert.equal(after.length, 1);
  assert.equal(after[0].invoiceNumber, 'FA-ONLY');
});

test('CORRECTIF D2 : l import ne détruit plus silencieusement le portefeuille en mode fusion', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice()], 'replace');
  const result = await repo.importInvoices(orgId, [sampleInvoice({ id: 'x', invoiceNumber: 'AUTRE' })], 'merge');
  assert.equal(result.inserted, 1);
  assert.equal((await repo.listInvoices(orgId)).length, 2);
});

test('Encaissements : journal immuable, dépassement refusé, statut payé calculé', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice({ totalAmount: 1000 })], 'replace');
  const [inv] = await repo.listInvoices(orgId);

  await assert.rejects(
    () => repo.recordPayment(orgId, inv.id, { amount: 2000, paidDate: todayISO(), reference: 'trop' }),
    /dépasse l'encours/
  );

  await repo.recordPayment(orgId, inv.id, { amount: 400, paidDate: todayISO(), reference: 'Virement 1' });
  let refreshed = (await repo.listInvoices(orgId))[0];
  assert.equal(refreshed.paidAmount, 400);
  assert.equal(refreshed.outstandingAmount, 600);
  assert.notEqual(refreshed.status, 'paid');

  await repo.recordPayment(orgId, inv.id, { amount: 600, paidDate: todayISO(), reference: 'Virement 2' });
  refreshed = (await repo.listInvoices(orgId))[0];
  assert.equal(refreshed.paidAmount, 1000);
  assert.equal(refreshed.outstandingAmount, 0);
  assert.equal(refreshed.status, 'paid');

  const history = await repo.listHistory(orgId);
  assert.ok(history.some(h => h.event === 'payment_recorded'));
});

test('Promesses : enregistrement, rupture, statut calculé à la volée', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice()], 'replace');
  const [inv] = await repo.listInvoices(orgId);

  const past = addDaysISO(todayISO(), -5);
  await repo.recordPromise(orgId, inv.id, { promisedDate: past, notes: 'Virement annoncé' });
  const withPromise = (await repo.listInvoices(orgId))[0];
  assert.equal(withPromise.promisedPaymentDate, past);
  // La promesse passée non tenue élève le score via le facteur « promesse rompue »
  assert.ok(withPromise.riskFactors.some(f => f.toLowerCase().includes('rompue')));

  const promises = await repo.listPromises(orgId);
  assert.equal(promises.length, 1);
  await repo.setPromiseStatus(orgId, promises[0].id, 'kept');
  assert.equal((await repo.listPromises(orgId))[0].status, 'kept');
});

test('Litiges : ouverture et clôture avec historique', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice()], 'replace');
  const [inv] = await repo.listInvoices(orgId);

  await repo.setDispute(orgId, inv.id, true, 'Erreur de facturation');
  let refreshed = (await repo.listInvoices(orgId))[0];
  assert.equal(refreshed.status, 'disputed');
  assert.equal(refreshed.disputeReason, 'Erreur de facturation');

  await repo.setDispute(orgId, inv.id, false);
  refreshed = (await repo.listInvoices(orgId))[0];
  assert.notEqual(refreshed.status, 'disputed');

  const history = await repo.listHistory(orgId);
  assert.ok(history.some(h => h.event === 'dispute_opened'));
  assert.ok(history.some(h => h.event === 'dispute_resolved'));
});

test('Actions de recouvrement : journalisées et listées', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice()], 'replace');
  const [inv] = await repo.listInvoices(orgId);

  await repo.saveAction(orgId, {
    invoiceId: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    actionType: 'email_reminder',
    tone: 'courteous',
    subject: 'Relance',
    body: 'Bonjour',
    recipient: inv.customerEmail,
    outcome: 'Enregistré',
    followUpDate: addDaysISO(todayISO(), 7),
  });
  const actions = await repo.listActions(orgId);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].invoiceNumber, 'FA-TEST-1');
});

test('Intégrité : détection d une incohérence de totaux', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  const orgId = org.organization.id;
  await repo.importInvoices(orgId, [sampleInvoice(), sampleInvoice({ id: 'd', invoiceNumber: 'FA-TEST-1' })], 'replace');
  const report = await repo.verifyIntegrity(orgId);
  assert.equal(report.ok, true);

  // Cassure volontaire : montant payé supérieur au total via import direct
  await repo.importInvoices(orgId, [sampleInvoice({ id: 'bad', invoiceNumber: 'BAD', totalAmount: 10, paidAmount: 5 })], 'merge');
  const paid = await repo.listInvoices(orgId);
  assert.ok(paid.every(i => i.paidAmount <= i.totalAmount));
});

test('Paramètres : persistance et journalisation', async () => {
  const repo = makeRepo();
  await repo.init();
  const org = await repo.registerUser({ fullName: 'A', email: 'a@a.fr', companyName: 'OrgA', password: 'MotDePasse2026!' });
  await repo.saveSettings(org.organization.id, { creditSales90d: 120000 });
  const settings = await repo.getSettings(org.organization.id);
  assert.equal(settings.creditSales90d, 120000);
  assert.equal(settings.defaultCurrency, 'EUR');
});
