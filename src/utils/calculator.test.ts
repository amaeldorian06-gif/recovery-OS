import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateOverdueImpact, getCollectionProbability } from './calculator';

test('getCollectionProbability reflects empirical decay with aging', () => {
  assert.equal(getCollectionProbability(0), 99.0);
  assert.equal(getCollectionProbability(20), 96.5);
  assert.equal(getCollectionProbability(45), 89.2);
  assert.equal(getCollectionProbability(75), 73.6);
  assert.equal(getCollectionProbability(100), 57.8);
  assert.equal(getCollectionProbability(150), 41.2);
  assert.equal(getCollectionProbability(200), 24.5);
});

test('calculateOverdueImpact computes financing drag and erosion accurately', () => {
  const result = calculateOverdueImpact({
    principalAmount: 50000,
    daysPastDue: 73, // exactly 0.2 years
    costOfCapitalAnnualPct: 10, // 10% annual
    inflationAnnualPct: 5,      // 5% annual
  });

  // 50000 * 0.10 * (73/365 = 0.2) = 1000
  assert.equal(result.costOfCapitalDrag, 1000);
  // 50000 * 0.05 * 0.2 = 500
  assert.equal(result.inflationLoss, 500);
  assert.equal(result.totalFinancialErosion, 1500);
  assert.equal(result.recoveryProbabilityPct, 73.6);
  assert.equal(result.recommendedUrgency, 'Immediate Action');
});
