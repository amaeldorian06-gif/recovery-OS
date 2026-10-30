import React, { useMemo } from 'react';
import { calculateOverdueImpact } from '../utils/calculator';
import { formatMoney } from '../utils/money';
import { Calculator, TrendingDown, AlertTriangle, HelpCircle, Clock } from 'lucide-react';

/**
 * Calculateur de coût du retard : hérite de la mécanique validée
 * (calculator.ts, tests unitaires) — reformulé en français, sobre,
 * avec avertissement méthodologique explicite. Aucune télémétrie.
 */
export const OverdueCalculatorView: React.FC = () => {
  const [principal, setPrincipal] = React.useState<number>(35000);
  const [days, setDays] = React.useState<number>(65);
  const [costOfCapital, setCostOfCapital] = React.useState<number>(8.5);
  const [inflation, setInflation] = React.useState<number>(3.0);

  const results = useMemo(
    () => calculateOverdueImpact({
      principalAmount: principal,
      daysPastDue: days,
      costOfCapitalAnnualPct: costOfCapital,
      inflationAnnualPct: inflation,
    }),
    [principal, days, costOfCapital, inflation]
  );

  const urgencyStyle =
    results.recommendedUrgency === 'Immediate Action'
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : results.recommendedUrgency === 'Elevated'
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

  const urgencyLabel =
    results.recommendedUrgency === 'Immediate Action'
      ? 'Action immédiate'
      : results.recommendedUrgency === 'Elevated'
      ? 'Vigilance renforcée'
      : 'Rythme standard';

  return (
    <div className="max-w-5xl space-y-5">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#38BDF8]" /> Coût financier du retard
        </h1>
        <p className="text-[13px] text-[#9AAAC0] mt-0.5">
          Quantifiez le coût d'immobilisation, l'érosion inflationniste et la probabilité de recouvrement
          par tranche d'impayé.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Paramètres */}
        <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#111726] p-5 space-y-5 text-xs">
          <h3 className="text-sm font-bold border-b border-white/10 pb-2">Paramètres de la créance</h3>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="calc-principal" className="font-semibold text-[#C7D2E5]">Montant impayé</label>
              <span className="font-mono text-[#38BDF8] font-bold text-sm">{formatMoney(principal, 'EUR')}</span>
            </div>
            <input
              id="calc-principal" type="range" min={1000} max={250000} step={1000}
              value={principal} onChange={e => setPrincipal(Number(e.target.value))}
              className="w-full accent-[#2563EB] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6B7D98] mt-0.5">
              <span>1 k€</span><span>125 k€</span><span>250 k€</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="calc-days" className="font-semibold text-[#C7D2E5]">Jours de retard</label>
              <span className="font-mono text-[#E9AE57] font-bold text-sm">{days} jours</span>
            </div>
            <input
              id="calc-days" type="range" min={1} max={180} step={1}
              value={days} onChange={e => setDays(Number(e.target.value))}
              className="w-full accent-[#E9AE57] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#6B7D98] mt-0.5">
              <span>1 j</span><span>90 j</span><span>180 j</span>
            </div>
          </div>

          <div>
            <label htmlFor="calc-coc" className="font-semibold text-[#C7D2E5] block mb-1">Coût annuel du capital (%)</label>
            <input
              id="calc-coc" type="number" step="0.1" min="1" max="25"
              value={costOfCapital} onChange={e => setCostOfCapital(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg p-2.5 text-[#E6EAF2] focus:outline-none focus:border-[#2563EB]"
            />
            <p className="text-[10px] text-[#6B7D98] mt-1">
              Taux de la ligne de crédit ou du financement de trésorerie immobilisé dans la créance.
            </p>
          </div>

          <div>
            <label htmlFor="calc-inf" className="font-semibold text-[#C7D2E5] block mb-1">Inflation annuelle (%)</label>
            <input
              id="calc-inf" type="number" step="0.1" min="0" max="15"
              value={inflation} onChange={e => setInflation(Number(e.target.value))}
              className="w-full bg-[#0B0F17] border border-white/10 rounded-lg p-2.5 text-[#E6EAF2] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/10 text-[11px] text-[#9AAAC0] space-y-1">
            <span className="font-semibold text-[#C7D2E5]">Méthodologie transparente :</span>
            <p>
              Coût de portage = (Montant × Taux annuel × Jours / 365).
              Probabilités de recouvrement issues de courbes d'empressement de recouvrement (CRF) —
              heuristique interne, non contractuelle, ni provision IFRS 9 / CECL.
            </p>
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#9AAAC0]">Horizon de recouvrement</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${urgencyStyle}`}>{urgencyLabel}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B0F17] p-4 rounded-xl border border-white/10">
                <div className="text-xs text-[#9AAAC0]">Probabilité de recouvrement</div>
                <div className="text-2xl font-extrabold mt-1 font-mono text-white">{results.recoveryProbabilityPct} %</div>
                <div className="text-[11px] text-[#6B7D98] mt-1">à {days} jours de retard</div>
              </div>
              <div className="bg-[#0B0F17] p-4 rounded-xl border border-white/10">
                <div className="text-xs text-red-400">Exposition à la perte</div>
                <div className="text-2xl font-extrabold text-red-400 mt-1 font-mono">{formatMoney(results.expectedWriteOffRisk, 'EUR')}</div>
                <div className="text-[11px] text-red-400/70 mt-1">capital potentiellement irrécouvrable</div>
              </div>
            </div>

            <div className="bg-[#0B0F17] p-4 rounded-xl border border-white/10 space-y-2 text-xs">
              <span className="font-semibold text-[#C7D2E5] flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-[#E9AE57]" /> Décomposition du coût du retard
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[#9AAAC0]">
                  <span>Coût de portage du capital :</span>
                  <span className="font-mono text-[#E6EAF2]">{formatMoney(results.costOfCapitalDrag, 'EUR')}</span>
                </div>
                <div className="flex justify-between text-[#9AAAC0]">
                  <span>Érosion inflationniste du pouvoir d'achat :</span>
                  <span className="font-mono text-[#E6EAF2]">{formatMoney(results.inflationLoss, 'EUR')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10 font-bold">
                  <span className="text-[#C7D2E5]">Coût financier total :</span>
                  <span className="font-mono text-[#E9AE57]">{formatMoney(results.totalFinancialErosion, 'EUR')}</span>
                </div>
                <div className="flex justify-between text-[#6B7D98] text-[11px]">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Érosion quotidienne en cours :</span>
                  <span className="font-mono text-red-400 font-semibold">{formatMoney(results.dailyCostOfDelay, 'EUR')} / jour</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-[#9AAAC0] bg-white/5 p-3 rounded-lg border border-white/10 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#C7D2E5]">Pourquoi agir avant 60 jours :</strong> passé ce seuil,
                les courbes de recouvrement chutent rapidement — sous 74 % à 90 jours, sous 42 % à 180 jours.
                Traiter les expositions élevées avant le jour 60 protège l'essentiel des encaissements.
              </p>
            </div>

            <div className="text-[11px] text-[#6B7D98] bg-[#E9AE57]/5 border border-[#E9AE57]/20 p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#E9AE57] shrink-0 mt-0.5" />
              <p>
                Outil d'aide à la décision interne. Les taux et courbes ne constituent ni un conseil
                d'investissement, ni une provision comptable réglementaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
