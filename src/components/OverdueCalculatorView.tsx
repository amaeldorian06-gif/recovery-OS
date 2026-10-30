import React, { useState, useMemo } from 'react';
import { calculateOverdueImpact } from '../utils/calculator';
import { formatCurrency } from '../utils/financial';
import { analytics } from '../utils/analytics';
import { 
  Calculator, 
  TrendingDown, 
  AlertTriangle, 
  HelpCircle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const OverdueCalculatorView: React.FC = () => {
  const [principal, setPrincipal] = useState<number>(35000);
  const [days, setDays] = useState<number>(65);
  const [costOfCapital, setCostOfCapital] = useState<number>(8.5);
  const [inflation, setInflation] = useState<number>(3.0);

  const results = useMemo(() => {
    analytics.track('calculator_used', { principal, days });
    return calculateOverdueImpact({
      principalAmount: principal,
      daysPastDue: days,
      costOfCapitalAnnualPct: costOfCapital,
      inflationAnnualPct: inflation,
    });
  }, [principal, days, costOfCapital, inflation]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-indigo-400" />
          <span>Overdue Receivables Financial Impact & Recovery Curve Calculator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Quantifies the exact financing drag, purchasing power erosion, and empirical probability of recovery based on Credit Research Foundation benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 text-xs">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            Receivables Parameters
          </h3>

          {/* Overdue Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-300">Overdue Invoice Principal</label>
              <span className="font-mono text-indigo-400 font-bold text-sm">
                {formatCurrency(principal)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={250000}
              step={1000}
              value={principal}
              onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>$1k</span>
              <span>$100k</span>
              <span>$250k</span>
            </div>
          </div>

          {/* Days Past Due */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-300">Days Past Due</label>
              <span className="font-mono text-amber-400 font-bold text-sm">
                {days} Days
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={180}
              step={1}
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>1 day</span>
              <span>60 days</span>
              <span>180 days</span>
            </div>
          </div>

          {/* Cost of Capital APR */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-300">Annual Cost of Capital / Working Capital APR</label>
              <span className="font-mono text-slate-200 font-bold">
                {costOfCapital}%
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="1"
              max="25"
              value={costOfCapital}
              onChange={e => setCostOfCapital(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
            />
            <p className="text-[10px] text-slate-500 mt-0.5">
              Typical revolving credit line / bank interest rate cost of carrying receivables.
            </p>
          </div>

          {/* Inflation Rate */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-300">Annual Inflation Rate</label>
              <span className="font-mono text-slate-200 font-bold">
                {inflation}%
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="15"
              value={inflation}
              onChange={e => setInflation(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Transparent Methodology:</span>
            <p>
              Capital drag = (Principal × APR × Days / 365). Recovery rates derived from Credit Research Foundation empirical collection decay statistics.
            </p>
          </div>
        </div>

        {/* Results & Analysis */}
        <div className="lg:col-span-7 space-y-4">
          {/* Recovery Curve Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Recovery Expectation</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                results.recommendedUrgency === 'Immediate Action'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : results.recommendedUrgency === 'Elevated'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {results.recommendedUrgency}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Statistical Collection Probability</div>
                <div className="text-2xl font-extrabold text-slate-100 mt-1 font-mono">
                  {results.recoveryProbabilityPct}%
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  At {days} days past due
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-rose-400">Expected Write-Off Risk Exposure</div>
                <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">
                  {formatCurrency(results.expectedWriteOffRisk)}
                </div>
                <div className="text-[11px] text-rose-500/80 mt-1">
                  Expected uncollectable capital
                </div>
              </div>
            </div>

            {/* Financial Erosion Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300">Direct Cost of Delay Breakdown</span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-400">
                  <span>Interest / Financing Carrying Drag:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.costOfCapitalDrag)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Inflationary Purchasing Power Erosion:</span>
                  <span className="font-mono text-slate-200">{formatCurrency(results.inflationLoss)}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/80 font-bold">
                  <span className="text-slate-200">Total Hidden Financial Loss:</span>
                  <span className="font-mono text-amber-400">{formatCurrency(results.totalFinancialErosion)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Ongoing Daily Erosion:</span>
                  <span className="font-mono text-rose-400 font-semibold">{formatCurrency(results.dailyCostOfDelay)} / day</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p>
                <strong>Why Prioritization Matters:</strong> At 90 days past due, historical data shows commercial debts have only a ~73% collection likelihood. At 180 days, this drops below 42%. Prioritizing high-exposure accounts before day 60 protects over 80% of uncollectable write-offs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
