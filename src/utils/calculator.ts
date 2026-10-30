export interface CalculatorInputs {
  principalAmount: number;
  daysPastDue: number;
  costOfCapitalAnnualPct: number; // e.g. 8.5%
  inflationAnnualPct: number;     // e.g. 3.0%
}

export interface CalculatorResults {
  costOfCapitalDrag: number;
  inflationLoss: number;
  totalFinancialErosion: number;
  recoveryProbabilityPct: number;
  expectedRecoverableAmount: number;
  expectedWriteOffRisk: number;
  dailyCostOfDelay: number;
  recommendedUrgency: 'Standard' | 'Elevated' | 'Immediate Action';
}

/**
 * Empirical collection recovery probability curve based on standard accounts receivable industry benchmarks
 * (Credit Research Foundation & Commercial Collection Agency Association research)
 */
export function getCollectionProbability(daysPastDue: number): number {
  if (daysPastDue <= 0) return 99.0;
  if (daysPastDue <= 30) return 96.5;
  if (daysPastDue <= 60) return 89.2;
  if (daysPastDue <= 90) return 73.6;
  if (daysPastDue <= 120) return 57.8;
  if (daysPastDue <= 180) return 41.2;
  return 24.5;
}

export function calculateOverdueImpact(inputs: CalculatorInputs): CalculatorResults {
  const { principalAmount, daysPastDue, costOfCapitalAnnualPct, inflationAnnualPct } = inputs;

  const validDays = Math.max(0, daysPastDue);
  const yearsElapsed = validDays / 365;

  // Opportunity cost of carrying debt / line of credit interest
  const costOfCapitalDrag = principalAmount * (costOfCapitalAnnualPct / 100) * yearsElapsed;

  // Inflation erosion on uncollected cash
  const inflationLoss = principalAmount * (inflationAnnualPct / 100) * yearsElapsed;

  const totalFinancialErosion = costOfCapitalDrag + inflationLoss;

  const recoveryProbabilityPct = getCollectionProbability(validDays);
  const expectedRecoverableAmount = principalAmount * (recoveryProbabilityPct / 100);
  const expectedWriteOffRisk = principalAmount - expectedRecoverableAmount;

  // Daily cost of delay
  const dailyCostOfDelay = (principalAmount * (costOfCapitalAnnualPct / 100)) / 365;

  let recommendedUrgency: 'Standard' | 'Elevated' | 'Immediate Action' = 'Standard';
  if (validDays > 60 || recoveryProbabilityPct < 75) {
    recommendedUrgency = 'Immediate Action';
  } else if (validDays > 25) {
    recommendedUrgency = 'Elevated';
  }

  return {
    costOfCapitalDrag: Math.round(costOfCapitalDrag * 100) / 100,
    inflationLoss: Math.round(inflationLoss * 100) / 100,
    totalFinancialErosion: Math.round(totalFinancialErosion * 100) / 100,
    recoveryProbabilityPct,
    expectedRecoverableAmount: Math.round(expectedRecoverableAmount * 100) / 100,
    expectedWriteOffRisk: Math.round(expectedWriteOffRisk * 100) / 100,
    dailyCostOfDelay: Math.round(dailyCostOfDelay * 100) / 100,
    recommendedUrgency,
  };
}
