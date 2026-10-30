import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysPastDue,
  getAgingBucket,
  calculateRiskScore,
  calculateFinancialMetrics,
} from './financial';
import { parseCsvString, autoDetectColumnMapping, sanitizeCsvCell } from './csv';
import { InvoiceRecord } from '../types';

test('calculateDaysPastDue accurately computes elapsed days', () => {
  // As of 2026-10-29
  assert.equal(calculateDaysPastDue('2026-10-14', '2026-10-29'), 15);
  assert.equal(calculateDaysPastDue('2026-10-29', '2026-10-29'), 0);
  assert.equal(calculateDaysPastDue('2026-11-05', '2026-10-29'), -7);
});

test('getAgingBucket assigns proper standard accounting brackets', () => {
  assert.equal(getAgingBucket(0), 'Current');
  assert.equal(getAgingBucket(-5), 'Current');
  assert.equal(getAgingBucket(1), '1-30');
  assert.equal(getAgingBucket(30), '1-30');
  assert.equal(getAgingBucket(31), '31-60');
  assert.equal(getAgingBucket(60), '31-60');
  assert.equal(getAgingBucket(61), '61-90');
  assert.equal(getAgingBucket(90), '61-90');
  assert.equal(getAgingBucket(91), '90+');
  assert.equal(getAgingBucket(120), '90+');
});

test('calculateRiskScore adheres to documented multi-factor explainable logic', () => {
  // Invoice 1: 45 days overdue, large portfolio concentration (20%), broken promise
  const resultHigh = calculateRiskScore({
    daysPastDue: 45,
    outstandingAmount: 20000,
    totalPortfolioAmount: 100000,
    promisedDate: '2026-10-15',
    asOfDateStr: '2026-10-29',
  });

  // 28 (aging 31-60d) + 25 (concentration >= 15%) + 15 (broken promise) = 68
  assert.equal(resultHigh.score, 68);
  assert.equal(resultHigh.tier, 'High');
  assert.equal(resultHigh.factors.length >= 3, true);

  // Invoice 2: Current invoice, low concentration
  const resultLow = calculateRiskScore({
    daysPastDue: -5,
    outstandingAmount: 1000,
    totalPortfolioAmount: 100000,
  });
  // 0 + 3 = 3
  assert.equal(resultLow.score, 3);
  assert.equal(resultLow.tier, 'Low');
});

test('calculateFinancialMetrics strictly segregates promises and disputed invoices from collected cash', () => {
  const dummyInvoices: InvoiceRecord[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-001',
      customerName: 'Acme Corp',
      customerEmail: 'billing@acme.com',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      totalAmount: 10000,
      paidAmount: 2000,
      outstandingAmount: 8000,
      currency: 'USD',
      status: 'overdue',
      daysPastDue: 28,
      agingBucket: '1-30',
      riskScore: 40,
      riskTier: 'Medium',
      riskFactors: [],
      promisedPaymentDate: '2026-11-05',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-002',
      customerName: 'Beta LLC',
      customerEmail: 'ap@beta.com',
      issueDate: '2026-08-01',
      dueDate: '2026-09-01',
      totalAmount: 5000,
      paidAmount: 0,
      outstandingAmount: 5000,
      currency: 'USD',
      status: 'disputed',
      disputeReason: 'Wrong quantity delivered',
      daysPastDue: 58,
      agingBucket: '31-60',
      riskScore: 65,
      riskTier: 'High',
      riskFactors: [],
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-003',
      customerName: 'Gamma Inc',
      customerEmail: 'finance@gamma.com',
      issueDate: '2026-09-15',
      dueDate: '2026-10-15',
      totalAmount: 3000,
      paidAmount: 3000,
      outstandingAmount: 0,
      currency: 'USD',
      status: 'paid',
      daysPastDue: 14,
      agingBucket: '1-30',
      riskScore: 0,
      riskTier: 'Low',
      riskFactors: [],
    },
  ];

  const metrics = calculateFinancialMetrics(dummyInvoices, {
    periodCreditSales: 50000,
    periodDays: 90,
  });

  // Total receivables outstanding = 8000 + 5000 = 13000
  assert.equal(metrics.totalReceivables, 13000);
  // Total overdue (excluding disputed) = 8000
  assert.equal(metrics.totalOverdue, 8000);
  // Disputed amount = 5000
  assert.equal(metrics.disputedAmount, 5000);
  // Confirmed payments (cash) = 2000 + 3000 = 5000
  assert.equal(metrics.confirmedPayments, 5000);
  // Promised payment is 8000, strictly isolated
  assert.equal(metrics.promisedPayments, 8000);
  // DSO = (13000 / 50000) * 90 = 23.4 -> 23
  assert.equal(metrics.dsoValue, 23);
});

test('CSV formula injection prevention prefixes dangerous characters', () => {
  assert.equal(sanitizeCsvCell('=1+1'), "'=1+1");
  assert.equal(sanitizeCsvCell('+cmd|'), "'+cmd|");
  assert.equal(sanitizeCsvCell('-50.00'), "'-50.00");
  assert.equal(sanitizeCsvCell('@SUM(A1:A5)'), "'@SUM(A1:A5)");
  assert.equal(sanitizeCsvCell('Acme Corp'), 'Acme Corp');
});

test('parseCsvString correctly handles quoted commas and escaped quotes', () => {
  const csv = `Invoice,Client,Amount\nINV-1,"Smith, Jones & Co",1500\nINV-2,"Say ""Hello""",2500`;
  const parsed = parseCsvString(csv);
  assert.equal(parsed.headers.length, 3);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0][1], 'Smith, Jones & Co');
  assert.equal(parsed.rows[1][1], 'Say "Hello"');
});

test('autoDetectColumnMapping identifies standard accounting headers', () => {
  const headers = ['Invoice Number', 'Client Name', 'Due Date', 'Total Amount', 'Paid'];
  const mapping = autoDetectColumnMapping(headers);
  assert.equal(mapping.invoiceNumber, 'Invoice Number');
  assert.equal(mapping.customerName, 'Client Name');
  assert.equal(mapping.dueDate, 'Due Date');
  assert.equal(mapping.totalAmount, 'Total Amount');
  assert.equal(mapping.paidAmount, 'Paid');
});
