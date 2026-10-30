import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysPastDue,
  getAgingBucket,
  calculateRiskScore,
  calculateFinancialMetrics,
  getCollectionRecoveryFactor,
  withDerivedFields,
  validateInvoiceRecord,
} from './financial';
import { parseCsvString, autoDetectColumnMapping, sanitizeCsvCell, buildInvoicesFromCsv, exportInvoicesToCsv } from './csv';
import { InvoiceRecord } from '../types';
import { todayISO, addDaysISO } from './dates';

test('calculateDaysPastDue : explicite et dynamique', () => {
  assert.equal(calculateDaysPastDue('2026-10-14', '2026-10-29'), 15);
  assert.equal(calculateDaysPastDue('2026-10-29', '2026-10-29'), 0);
  assert.equal(calculateDaysPastDue('2026-11-05', '2026-10-29'), -7);
  // Sans référence : la date du jour est utilisée (plus aucune date figée)
  const today = todayISO();
  assert.equal(calculateDaysPastDue(addDaysISO(today, -3)), 3);
});

test('getAgingBucket : tranches standard', () => {
  assert.equal(getAgingBucket(0), 'Current');
  assert.equal(getAgingBucket(-5), 'Current');
  assert.equal(getAgingBucket(1), '1-30');
  assert.equal(getAgingBucket(30), '1-30');
  assert.equal(getAgingBucket(31), '31-60');
  assert.equal(getAgingBucket(60), '31-60');
  assert.equal(getAgingBucket(61), '61-90');
  assert.equal(getAgingBucket(90), '61-90');
  assert.equal(getAgingBucket(91), '90+');
});

test('calculateRiskScore : logique multi-facteurs documentée', () => {
  const resultHigh = calculateRiskScore({
    daysPastDue: 45,
    outstandingAmount: 20000,
    totalPortfolioAmount: 100000,
    hasBrokenPromise: true,
    asOfDateStr: '2026-10-29',
  });
  // 28 (aging) + 25 (concentration 20%) + 15 (promesse rompue) = 68
  assert.equal(resultHigh.score, 68);
  assert.equal(resultHigh.tier, 'High');
  assert.equal(resultHigh.factors.length >= 3, true);
  // Chaque facteur structuré porte un code et un nombre de points
  for (const f of resultHigh.factorDetails) {
    assert.ok(f.code.length > 0);
    assert.equal(typeof f.points, 'number');
    assert.ok(f.label.length > 0);
  }
  assert.ok(resultHigh.factors.length >= 3);

  const resultLow = calculateRiskScore({
    daysPastDue: -5,
    outstandingAmount: 1000,
    totalPortfolioAmount: 100000,
  });
  assert.equal(resultLow.score, 3);
  assert.equal(resultLow.tier, 'Low');
});

test('calculateRiskScore : la promesse en cours assouplit, la promesse rompue pénalise', () => {
  const base = { daysPastDue: 20, outstandingAmount: 1000, totalPortfolioAmount: 100000 };
  const neutral = calculateRiskScore(base); // 15 (retard) + 3 (concentration 1%) = 18
  const open = calculateRiskScore({ ...base, hasOpenPromise: true }); // 18 - 8 = 10
  const broken = calculateRiskScore({ ...base, hasBrokenPromise: true }); // 18 + 15 = 33
  assert.equal(neutral.score, 18);
  assert.equal(open.score, 10);
  assert.ok(open.score < neutral.score);
  assert.equal(broken.score, 33);
  assert.ok(broken.score > neutral.score);
});

test('getCollectionRecoveryFactor : décroissance monotone documentée (heuristique, non contractuelle)', () => {
  assert.equal(getCollectionRecoveryFactor(0), 0.99);
  assert.equal(getCollectionRecoveryFactor(20), 0.965);
  assert.equal(getCollectionRecoveryFactor(45), 0.892);
  assert.equal(getCollectionRecoveryFactor(75), 0.736);
  assert.equal(getCollectionRecoveryFactor(100), 0.578);
  assert.equal(getCollectionRecoveryFactor(150), 0.412);
  assert.equal(getCollectionRecoveryFactor(200), 0.245);
  let prev = 1;
  for (let d = 0; d <= 400; d += 10) {
    const f = getCollectionRecoveryFactor(d);
    assert.ok(f <= prev, `CRF non monotone au jour ${d}`);
    prev = f;
  }
});

test('withDerivedFields recalcule depuis les données brutes (aucune valeur figée)', () => {
  const today = todayISO();
  const inv: InvoiceRecord = {
    id: 'x1',
    invoiceNumber: 'F-1',
    customerName: 'Client Test',
    customerEmail: 'c@test.fr',
    issueDate: addDaysISO(today, -100),
    dueDate: addDaysISO(today, -40),
    totalAmount: 1000,
    paidAmount: 0,
    outstandingAmount: 1000,
    currency: 'EUR',
    status: 'current', // statut volontairement faux dans le stockage
    daysPastDue: 0, // valeur périmée volontairement fausse
    agingBucket: 'Current',
    riskScore: 0,
    riskTier: 'Low',
    riskFactors: [],
  };
  const derived = withDerivedFields(inv, { portfolioOutstanding: 1000, asOfDate: today });
  assert.equal(derived.daysPastDue, 40);
  assert.equal(derived.agingBucket, '31-60');
  assert.equal(derived.status, 'overdue');
  assert.equal(derived.riskScore, 53); // 28 (aging) + 25 (concentration 100%)
  assert.equal(derived.riskTier, 'High');
});

test('calculateFinancialMetrics : ségrégation stricte promesses / litiges / cash', () => {
  const today = todayISO();
  const dummyInvoices: InvoiceRecord[] = [
    {
      id: 'inv-1', invoiceNumber: 'INV-001', customerName: 'Acme Corp', customerEmail: 'billing@acme.com',
      issueDate: addDaysISO(today, -58), dueDate: addDaysISO(today, -28),
      totalAmount: 10000, paidAmount: 2000, outstandingAmount: 8000, currency: 'EUR',
      status: 'overdue', daysPastDue: 28, agingBucket: '1-30', riskScore: 40, riskTier: 'Medium',
      riskFactors: [], promisedPaymentDate: addDaysISO(today, 6),
    },
    {
      id: 'inv-2', invoiceNumber: 'INV-002', customerName: 'Beta LLC', customerEmail: 'ap@beta.com',
      issueDate: addDaysISO(today, -88), dueDate: addDaysISO(today, -58),
      totalAmount: 5000, paidAmount: 0, outstandingAmount: 5000, currency: 'EUR',
      status: 'disputed', daysPastDue: 58, agingBucket: '31-60', riskScore: 65, riskTier: 'High',
      riskFactors: [], disputeReason: 'Erreur de quantité',
    },
    {
      id: 'inv-3', invoiceNumber: 'INV-003', customerName: 'Gamma Inc', customerEmail: 'finance@gamma.com',
      issueDate: addDaysISO(today, -43), dueDate: addDaysISO(today, -13),
      totalAmount: 3000, paidAmount: 3000, outstandingAmount: 0, currency: 'EUR',
      status: 'paid', daysPastDue: 13, agingBucket: '1-30', riskScore: 0, riskTier: 'Low',
      riskFactors: [],
    },
  ];

  const metrics = calculateFinancialMetrics(dummyInvoices, { periodCreditSales: 50000, periodDays: 90 });
  assert.equal(metrics.totalReceivables, 13000);
  assert.equal(metrics.totalOverdue, 8000);
  assert.equal(metrics.disputedAmount, 5000);
  assert.equal(metrics.confirmedPayments, 5000);
  assert.equal(metrics.promisedPayments, 8000);
  assert.equal(metrics.dsoValue, 23);
});

test('validateInvoiceRecord refuse les données incohérentes', () => {
  const today = todayISO();
  const base: Partial<InvoiceRecord> = {
    invoiceNumber: 'F-1',
    customerName: 'Client',
    totalAmount: 100,
    paidAmount: 0,
    dueDate: today,
  };
  assert.equal(validateInvoiceRecord(base).length, 0);
  assert.ok(validateInvoiceRecord({ ...base, paidAmount: 200 }).length > 0);
  assert.ok(validateInvoiceRecord({ ...base, dueDate: '31/02/2026' }).length > 0);
  assert.ok(validateInvoiceRecord({ ...base, invoiceNumber: '' }).length > 0);
});

test('parseCsvString : guillemets, échappements, CRLF', () => {
  const csv = `Facture,Client,Montant\nINV-1,"Smith, Jones & Co",1500\nINV-2,"Say ""Hello""",2500`;
  const parsed = parseCsvString(csv);
  assert.equal(parsed.headers.length, 3);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0][1], 'Smith, Jones & Co');
  assert.equal(parsed.rows[1][1], 'Say "Hello"');
});

test('autoDetectColumnMapping : vocabulaire francophone', () => {
  const mapping = autoDetectColumnMapping([
    'Numéro de facture', 'Client', 'Email', "Date d'émission", "Date d'échéance",
    'Montant total', 'Montant réglé', 'Devise', 'Notes', 'Litige',
  ]);
  assert.equal(mapping.invoiceNumber, 'Numéro de facture');
  assert.equal(mapping.customerName, 'Client');
  assert.equal(mapping.customerEmail, 'Email');
  assert.equal(mapping.dueDate, "Date d'échéance");
  assert.equal(mapping.issueDate, "Date d'émission");
  assert.equal(mapping.totalAmount, 'Montant total');
  assert.equal(mapping.paidAmount, 'Montant réglé');
  assert.equal(mapping.currency, 'Devise');
  assert.equal(mapping.notes, 'Notes');
  assert.equal(mapping.disputeStatus, 'Litige');
});

test('autoDetectColumnMapping : en-tête « Facture # » (correction du rejet FR historique)', () => {
  const mapping = autoDetectColumnMapping(['Facture #', 'Client', 'Échéance', 'Montant']);
  assert.equal(mapping.invoiceNumber, 'Facture #');
  assert.equal(mapping.dueDate, 'Échéance');
  assert.equal(mapping.totalAmount, 'Montant');
});

test('buildInvoicesFromCsv : dates FR, montants EU, aucune valeur silencieuse', () => {
  const today = todayISO();
  const headers = ['Numéro de facture', 'Client', "Date d'échéance", 'Montant total', 'Montant réglé'];
  const rows = [
    ['FA-1', 'Client A', '15/09/2026', '1.234,56', '0,00'],
    ['FA-2', 'Client B', '01/12/2099', '2.000,00', '500,00'],
  ];
  const mapping = autoDetectColumnMapping(headers);
  const result = buildInvoicesFromCsv({ headers, rows, mapping, asOfDate: '2026-10-29', defaultCurrency: 'EUR' });
  assert.equal(result.rejectedRows, 0);
  assert.equal(result.invoices.length, 2);
  assert.equal(result.invoices[0].totalAmount, 1234.56);
  assert.equal(result.invoices[0].currency, 'EUR');
  assert.ok(result.invoices[0].daysPastDue > 40);
  assert.equal(result.invoices[1].daysPastDue < 0, true);
  assert.equal(result.invoices[1].status, 'current');
  assert.equal(result.invoices[1].outstandingAmount, 1500);
  void today;
});

test('buildInvoicesFromCsv : une date illisible est une erreur visible, pas un retard à zéro', () => {
  const headers = ['Facture', 'Client', 'Échéance', 'Montant'];
  const rows = [['FA-1', 'Client A', '31/02/2026', '100']];
  const mapping = autoDetectColumnMapping(headers);
  const result = buildInvoicesFromCsv({ headers, rows, mapping, asOfDate: '2026-10-29' });
  assert.equal(result.rejectedRows, 1);
  assert.equal(result.invoices.length, 0);
  assert.ok(result.issues.some(i => i.severity === 'error' && i.message.includes('inexistante')));
});

test('buildInvoicesFromCsv : les doublons sont rejetés', () => {
  const headers = ['Facture', 'Client', 'Échéance', 'Montant'];
  const rows = [
    ['FA-1', 'A', '2026-09-01', '100'],
    ['FA-1', 'B', '2026-09-01', '200'],
  ];
  const mapping = autoDetectColumnMapping(headers);
  const result = buildInvoicesFromCsv({ headers, rows, mapping, asOfDate: '2026-10-29' });
  assert.equal(result.rejectedRows, 1);
  assert.equal(result.invoices.length, 1);
});

test('sanitizeCsvCell : neutralisation des formules (CWE-1236)', () => {
  assert.equal(sanitizeCsvCell('=1+1'), "'=1+1");
  assert.equal(sanitizeCsvCell('+cmd|'), "'+cmd|");
  assert.equal(sanitizeCsvCell('-50.00'), "'-50.00");
  assert.equal(sanitizeCsvCell('@SUM(A1:A5)'), "'@SUM(A1:A5)");
  assert.equal(sanitizeCsvCell('Acme Corp'), 'Acme Corp');
});

test('exportInvoicesToCsv produit un CSV lisible et sanitizé', () => {
  const today = todayISO();
  const invoices: InvoiceRecord[] = [{
    id: '1', invoiceNumber: '=VIRUS()', customerName: 'Client; avec point-virgule', customerEmail: 'a@b.fr',
    issueDate: today, dueDate: today, totalAmount: 100, paidAmount: 0, outstandingAmount: 100,
    currency: 'EUR', status: 'current', daysPastDue: 0, agingBucket: 'Current', riskScore: 3,
    riskTier: 'Low', riskFactors: ['x'],
  }];
  const csv = exportInvoicesToCsv(invoices);
  assert.ok(csv.includes("'=VIRUS()"));
  const reparsed = parseCsvString(csv);
  assert.equal(reparsed.rows.length, 1);
  assert.equal(reparsed.rows[0].length, reparsed.headers.length);
});
