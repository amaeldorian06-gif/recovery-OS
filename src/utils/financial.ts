import { AgingBucket, FinancialMetrics, InvoiceRecord, RiskTier } from '../types';
import { daysPastDue, parseDateInput, todayISO } from './dates';
import { DEFAULT_CURRENCY, formatMoney, roundMoney } from './money';

export { formatMoney as formatCurrency };

/**
 * Jours de retard d'une échéance.
 * La date de référence est la date locale courante, sauf explicite (tests, import figé).
 * Une date illisible lève une erreur : plus aucun retour silencieux à 0.
 */
export function calculateDaysPastDue(dueDateStr: string, asOfDateStr?: string): number {
  return daysPastDue(dueDateStr, asOfDateStr ?? todayISO());
}

/** Catégorisation d'aging standard sur 5 tranches. */
export function getAgingBucket(days: number): AgingBucket {
  if (days <= 0) return 'Current';
  if (days <= 30) return '1-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

export interface RiskInput {
  daysPastDue: number;
  outstandingAmount: number;
  totalPortfolioAmount: number;
  isDisputed?: boolean;
  hasOpenPromise?: boolean;
  hasBrokenPromise?: boolean;
  promisedDate?: string;
  asOfDateStr?: string;
}

export interface RiskFactor {
  code: string;
  label: string;
  points: number;
}

export interface RiskResult {
  score: number;
  tier: RiskTier;
  /** Facteurs sous forme de chaînes lisibles (format historique, utilisé par l'UI et le stockage). */
  factors: string[];
  /** Facteurs structurés (code + points) pour l'audit et les exports. */
  factorDetails: RiskFactor[];
}

/**
 * Moteur de scoring de recouvrement — 100 % déterministe et explicable.
 *
 * Pondération (documentée, versionnée, testée) :
 *   1. Retard / ancienneté d'impayé ......... 0 à 50 pts
 *   2. Concentration d'exposition ........... 0 à 25 pts
 *   3. Promesse de règlement rompue ......... +15 pts
 *   4. Litige commercial en cours ........... +12 pts
 *   5. Promesse de règlement en cours ....... -8 pts (assouplissement maîtrisé)
 *
 * Le score est recalculé à chaque affichage depuis les données brutes :
 * il n'est jamais stocké figé.
 */
export function calculateRiskScore(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  let score = 0;

  const {
    daysPastDue: dpd,
    outstandingAmount,
    totalPortfolioAmount,
    isDisputed,
    hasOpenPromise,
    hasBrokenPromise,
    asOfDateStr,
    promisedDate,
  } = input;

  // 1. Ancienneté d'impayé (0-50)
  if (dpd <= 0) {
    factors.push({ code: 'aging_current', label: 'Facture à jour ou non échue (0 pt)', points: 0 });
  } else if (dpd <= 30) {
    score += 15;
    factors.push({ code: 'aging_1_30', label: `Impayé 1-30 jours (+15 pts : ${dpd} j de retard)`, points: 15 });
  } else if (dpd <= 60) {
    score += 28;
    factors.push({ code: 'aging_31_60', label: `Impayé 31-60 jours (+28 pts : ${dpd} j de retard)`, points: 28 });
  } else if (dpd <= 90) {
    score += 40;
    factors.push({ code: 'aging_61_90', label: `Impayé 61-90 jours (+40 pts : ${dpd} j de retard)`, points: 40 });
  } else {
    score += 50;
    factors.push({ code: 'aging_90p', label: `Impayé sévère 90+ jours (+50 pts : ${dpd} j de retard)`, points: 50 });
  }

  // 2. Concentration (0-25)
  if (totalPortfolioAmount > 0 && outstandingAmount > 0) {
    const concentration = outstandingAmount / totalPortfolioAmount;
    const pct = (concentration * 100).toFixed(1);
    if (concentration >= 0.15) {
      score += 25;
      factors.push({ code: 'conc_high', label: `Forte concentration (+25 pts : ${pct} % du portefeuille)`, points: 25 });
    } else if (concentration >= 0.05) {
      score += 15;
      factors.push({ code: 'conc_mid', label: `Concentration modérée (+15 pts : ${pct} % du portefeuille)`, points: 15 });
    } else if (concentration >= 0.02) {
      score += 8;
      factors.push({ code: 'conc_low', label: `Exposition notable (+8 pts : ${pct} % du portefeuille)`, points: 8 });
    } else {
      score += 3;
      factors.push({ code: 'conc_min', label: `Faible concentration relative (+3 pts : ${pct} % du portefeuille)`, points: 3 });
    }
  }

  // 3. Promesse rompue (+15)
  if (hasBrokenPromise || promisedDate) {
    const promiseDate = promisedDate;
    if (hasBrokenPromise || (promiseDate && asOfDateStr && daysPastDue(promiseDate, asOfDateStr) > 0)) {
      score += 15;
      factors.push({
        code: 'promise_broken',
        label: `Promesse de règlement rompue (+15 pts${promiseDate ? ` : échéance promise ${promiseDate} dépassée` : ''})`,
        points: 15,
      });
    }
  }

  // 4. Litige (+12)
  if (isDisputed) {
    score += 12;
    factors.push({ code: 'dispute', label: 'Litige commercial en cours (+12 pts : réconciliation requise)', points: 12 });
  }

  // 5. Promesse en cours valide (-8)
  if (hasOpenPromise && !hasBrokenPromise) {
    score -= 8;
    factors.push({ code: 'promise_open', label: 'Engagement de règlement en cours (-8 pts)', points: -8 });
  }

  score = Math.min(100, Math.max(0, score));

  let tier: RiskTier = 'Low';
  if (score >= 75) tier = 'Critical';
  else if (score >= 50) tier = 'High';
  else if (score >= 25) tier = 'Medium';

  return {
    score,
    tier,
    factors: factors.map(f => f.label),
    factorDetails: factors,
  };
}

/**
 * Taux de recouvrement empirique (Collection Recovery Factor).
 *
 * Courbe déclarative issue des ordres de grandeur publiés par la Credit Research
 * Foundation et les sociétés de recouvrement B2B (moyennes de portefeuille,
 * non contractualisées). Utilisée comme **heuristique d'aide à la décision**,
 * jamais comme provision comptable : aucune revendication IFRS 9 / CECL
 * n'est formulée sans validation méthodologique indépendante.
 */
export const DEFAULT_CRF_CURVE: ReadonlyArray<{ maxDays: number; factor: number }> = [
  { maxDays: 0, factor: 0.99 },
  { maxDays: 30, factor: 0.965 },
  { maxDays: 60, factor: 0.892 },
  { maxDays: 90, factor: 0.736 },
  { maxDays: 120, factor: 0.578 },
  { maxDays: 180, factor: 0.412 },
  { maxDays: Number.POSITIVE_INFINITY, factor: 0.245 },
];

export function getCollectionRecoveryFactor(days: number, curve = DEFAULT_CRF_CURVE): number {
  const d = Math.max(0, days);
  for (const step of curve) {
    if (d <= step.maxDays) return step.factor;
  }
  return curve[curve.length - 1].factor;
}

export interface InvoiceScoreContext {
  portfolioOutstanding: number;
  asOfDate: string;
  openPromiseIds?: Set<string>;
  brokenPromiseIds?: Set<string>;
}

/**
 * Recalcule les champs dérivés (retard, tranche, score) d'une facture
 * depuis ses données brutes. Fonction pure — utilisée à l'affichage.
 */
export function withDerivedFields(inv: InvoiceRecord, ctx: InvoiceScoreContext): InvoiceRecord {
  const dpd = calculateDaysPastDue(inv.dueDate, ctx.asOfDate);
  const bucket = getAgingBucket(dpd);
  const outstanding = roundMoney(Math.max(0, inv.totalAmount - (inv.paidAmount || 0)));
  const isDisputed = inv.status === 'disputed';
  const hasOpenPromise = !!inv.promisedPaymentDate && !ctx.brokenPromiseIds?.has(inv.id) && !!ctx.openPromiseIds?.has(inv.id);
  const hasBrokenPromise = !!ctx.brokenPromiseIds?.has(inv.id);

  const { score, tier, factors } = calculateRiskScore({
    daysPastDue: dpd,
    outstandingAmount: outstanding,
    totalPortfolioAmount: ctx.portfolioOutstanding,
    isDisputed,
    hasOpenPromise,
    hasBrokenPromise,
    promisedDate: inv.promisedPaymentDate,
    asOfDateStr: ctx.asOfDate,
  });

  const status: InvoiceRecord['status'] =
    outstanding <= 0 ? 'paid' : isDisputed ? 'disputed' : dpd > 0 ? 'overdue' : 'current';

  return {
    ...inv,
    outstandingAmount: outstanding,
    daysPastDue: dpd,
    agingBucket: bucket,
    riskScore: score,
    riskTier: tier,
    riskFactors: factors,
    status,
  };
}

/**
 * Agrégats financiers. Ségrégation comptable stricte :
 *  - une promesse de règlement n'est JAMAIS comptée comme du cash ;
 *  - un litige est isolé de l'encours en retard ;
 *  - les montants ne sont jamais additionnés entre devises.
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
    const cur = (inv.currency || DEFAULT_CURRENCY).toUpperCase();
    const outstanding = roundMoney(Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)));
    currencySummary[cur] = roundMoney((currencySummary[cur] || 0) + outstanding);
    confirmedPayments += inv.paidAmount || 0;

    if (inv.status === 'paid' || outstanding <= 0) {
      paidCount++;
      continue;
    }

    totalReceivables += outstanding;

    if (inv.status === 'disputed') {
      disputedAmount += outstanding;
      disputedCount++;
    } else if (inv.daysPastDue > 0) {
      totalOverdue += outstanding;
      overdueCount++;
    }

    if (inv.riskScore >= 70) {
      atRiskExposure += outstanding;
    }

    if (inv.promisedPaymentDate) {
      promisedPayments += outstanding;
    }
  }

  // DSO : formule simple (encours / ventes à crédit) × période.
  let dsoValue: number | null = null;
  const dsoMethod = 'Simple Receivables Ratio';
  let dsoNotes = '';
  const periodCreditSales = options?.periodCreditSales;
  const periodDays = options?.periodDays || 90;

  if (periodCreditSales && periodCreditSales > 0) {
    dsoValue = Math.round((totalReceivables / periodCreditSales) * periodDays);
    dsoNotes = `Calculé sur ${periodDays} jours à partir de ${Math.round(periodCreditSales).toLocaleString('fr-FR')} € de ventes à crédit.`;
  } else {
    const billed = invoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    if (billed > 0) {
      dsoValue = Math.round((totalReceivables / billed) * 90);
      dsoNotes = `Estimation indicative sur 90 jours à partir du volume facturé du portefeuille (${Math.round(billed).toLocaleString('fr-FR')} €). Renseignez vos ventes à crédit pour une mesure exacte.`;
    } else {
      dsoNotes = 'Données de vente insuffisantes pour calculer un DSO.';
    }
  }

  return {
    totalReceivables: roundMoney(totalReceivables),
    totalOverdue: roundMoney(totalOverdue),
    atRiskExposure: roundMoney(atRiskExposure),
    promisedPayments: roundMoney(promisedPayments),
    disputedAmount: roundMoney(disputedAmount),
    confirmedPayments: roundMoney(confirmedPayments),
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

/** Validation d'une facture avant persistance. */
export function validateInvoiceRecord(inv: Partial<InvoiceRecord>): string[] {
  const errors: string[] = [];
  if (!inv.invoiceNumber || !String(inv.invoiceNumber).trim()) {
    errors.push('Le numéro de facture est obligatoire.');
  }
  if (!inv.customerName || !String(inv.customerName).trim()) {
    errors.push('Le nom du client est obligatoire.');
  }
  if (typeof inv.totalAmount !== 'number' || !Number.isFinite(inv.totalAmount) || inv.totalAmount < 0) {
    errors.push('Le montant total doit être un nombre positif.');
  }
  if (typeof inv.paidAmount !== 'number' || !Number.isFinite(inv.paidAmount) || inv.paidAmount < 0) {
    errors.push('Le montant réglé doit être un nombre positif.');
  }
  if (typeof inv.totalAmount === 'number' && typeof inv.paidAmount === 'number' && inv.paidAmount > inv.totalAmount) {
    errors.push('Le montant réglé ne peut pas dépasser le montant total.');
  }
  if (!inv.dueDate || !parseDateInput(inv.dueDate).ok) {
    errors.push(`Date d'échéance illisible : ${inv.dueDate || 'absente'}`);
  }
  if (inv.issueDate && !parseDateInput(inv.issueDate).ok) {
    errors.push(`Date d'émission illisible : ${inv.issueDate}`);
  }
  return errors;
}
