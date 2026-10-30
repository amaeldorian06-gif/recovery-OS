import { AgingBucket, FinancialMetrics, InvoiceRecord, RiskTier } from '../types';

/**
 * Calculates days past due relative to reference date.
 * If dueDate is today or in future, returns 0 or negative number.
 */
export function calculateDaysPastDue(dueDateStr: string, asOfDateStr?: string): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr + 'T00:00:00Z');
  const asOf = asOfDateStr ? new Date(asOfDateStr + 'T00:00:00Z') : new Date('2026-10-29T00:00:00Z');
  
  if (isNaN(due.getTime()) || isNaN(asOf.getTime())) return 0;
  
  const diffTime = asOf.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Standard 5-bracket aging categorization
 */
export function getAgingBucket(daysPastDue: number): AgingBucket {
  if (daysPastDue <= 0) return 'Current';
  if (daysPastDue <= 30) return '1-30';
  if (daysPastDue <= 60) return '31-60';
  if (daysPastDue <= 90) return '61-90';
  return '90+';
}

export interface RiskInput {
  daysPastDue: number;
  outstandingAmount: number;
  totalPortfolioAmount: number;
  isDisputed?: boolean;
  promisedDate?: string;
  asOfDateStr?: string;
}

/**
 * Explainable Risk Scoring Engine
 * Computes deterministic score (0 - 100) and returns human-readable audit factors.
 */
export function calculateRiskScore(input: RiskInput): { score: number; tier: RiskTier; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  const { daysPastDue, outstandingAmount, totalPortfolioAmount, isDisputed, promisedDate, asOfDateStr } = input;

  // 1. Recency & Days Past Due Component (Max 50 points)
  if (daysPastDue <= 0) {
    factors.push('Invoice is current or not yet due (0 pts)');
  } else if (daysPastDue <= 30) {
    score += 15;
    factors.push(`Delinquent 1-30 days (+15 pts: ${daysPastDue}d overdue)`);
  } else if (daysPastDue <= 60) {
    score += 28;
    factors.push(`Aging 31-60 days (+28 pts: ${daysPastDue}d overdue)`);
  } else if (daysPastDue <= 90) {
    score += 40;
    factors.push(`High aging 61-90 days (+40 pts: ${daysPastDue}d overdue)`);
  } else {
    score += 50;
    factors.push(`Severely delinquent 90+ days (+50 pts: ${daysPastDue}d overdue)`);
  }

  // 2. Exposure Concentration Component (Max 25 points)
  if (totalPortfolioAmount > 0 && outstandingAmount > 0) {
    const concentration = outstandingAmount / totalPortfolioAmount;
    const pctStr = (concentration * 100).toFixed(1);
    if (concentration >= 0.15) {
      score += 25;
      factors.push(`High concentration risk (+25 pts: ${pctStr}% of total portfolio)`);
    } else if (concentration >= 0.05) {
      score += 15;
      factors.push(`Moderate concentration risk (+15 pts: ${pctStr}% of total portfolio)`);
    } else if (concentration >= 0.02) {
      score += 8;
      factors.push(`Noticeable balance exposure (+8 pts: ${pctStr}% of total portfolio)`);
    } else {
      score += 3;
      factors.push(`Low relative concentration (+3 pts: ${pctStr}% of total portfolio)`);
    }
  }

  // 3. Broken Promise to Pay Component (15 points)
  if (promisedDate) {
    const promiseDueDays = calculateDaysPastDue(promisedDate, asOfDateStr);
    if (promiseDueDays > 0) {
      score += 15;
      factors.push(`Broken promise penalty (+15 pts: Promised payment date was ${promisedDate}, passed ${promiseDueDays}d ago)`);
    }
  }

  // 4. Commercial Dispute Flag (12 points)
  if (isDisputed) {
    score += 12;
    factors.push('Dispute flagged: Requires account reconciliation or resolution (+12 pts)');
  }

  // Normalize score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Determine Tier
  let tier: RiskTier = 'Low';
  if (score >= 75) {
    tier = 'Critical';
  } else if (score >= 50) {
    tier = 'High';
  } else if (score >= 25) {
    tier = 'Medium';
  }

  return { score, tier, factors };
}

/**
 * Calculates aggregated financial metrics ensuring strict accounting segregation.
 * Never conflates promised payments or disputed amounts with collected cash.
 */
export function calculateFinancialMetrics(
  invoices: InvoiceRecord[],
  options?: { periodCreditSales?: number; periodDays?: number }
): FinancialMetrics {
  let totalReceivables = 0;
  let totalOverdue = 0;
  let atRiskExposure = 0;
  let promisedPayments = 0;
  let disputedAmount = 0;
  let confirmedPayments = 0;
  
  let overdueCount = 0;
  let disputedCount = 0;
  let paidCount = 0;
  const currencySummary: { [currency: string]: number } = {};

  for (const inv of invoices) {
    const cur = inv.currency || 'USD';
    currencySummary[cur] = (currencySummary[cur] || 0) + (inv.outstandingAmount || 0);

    confirmedPayments += inv.paidAmount || 0;

    if (inv.status === 'paid') {
      paidCount++;
      continue;
    }

    const outstanding = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
    totalReceivables += outstanding;

    if (inv.status === 'disputed') {
      disputedAmount += outstanding;
      disputedCount++;
    } else if (inv.daysPastDue > 0) {
      totalOverdue += outstanding;
      overdueCount++;
    }

    if (inv.riskScore >= 70 && outstanding > 0) {
      atRiskExposure += outstanding;
    }

    if (inv.promisedPaymentDate && outstanding > 0) {
      promisedPayments += outstanding;
    }
  }

  // DSO Calculation
  // Standard simple formula: (Total Receivables / Period Credit Sales) * Period Days
  let dsoValue: number | null = null;
  let dsoMethod = 'Simple Receivables Ratio';
  let dsoNotes = '';

  const periodCreditSales = options?.periodCreditSales;
  const periodDays = options?.periodDays || 90;

  if (periodCreditSales && periodCreditSales > 0) {
    dsoValue = Math.round((totalReceivables / periodCreditSales) * periodDays);
    dsoNotes = `Calculated over ${periodDays}-day period based on $${periodCreditSales.toLocaleString()} credit sales.`;
  } else {
    // Fallback: estimate from sum of issued invoices if available
    const estimatedCreditSales = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    if (estimatedCreditSales > 0) {
      dsoValue = Math.round((totalReceivables / estimatedCreditSales) * 90);
      dsoNotes = `Estimated over 90-day cycle based on total billed portfolio volume ($${Math.round(estimatedCreditSales).toLocaleString()}).`;
    } else {
      dsoNotes = 'Insufficient historical sales data to reliably compute DSO.';
    }
  }

  return {
    totalReceivables: Math.round(totalReceivables * 100) / 100,
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    atRiskExposure: Math.round(atRiskExposure * 100) / 100,
    promisedPayments: Math.round(promisedPayments * 100) / 100,
    disputedAmount: Math.round(disputedAmount * 100) / 100,
    confirmedPayments: Math.round(confirmedPayments * 100) / 100,
    invoiceCount: invoices.length,
    overdueCount,
    disputedCount,
    paidCount,
    dsoValue,
    dsoMethod,
    dsoNotes,
    currencySummary,
  };
}

/**
 * Format currency with locale-safe fallback
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString('en-US')}`;
  }
}
