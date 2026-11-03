import React, { useState } from 'react';
import { useApp } from '../app/AppContext';
import { PLAN_DETAILS, trialDaysLeft as computeTrialDaysLeft } from '../storage/license';
import { KeyRound, ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Bloc « Licence » des paramètres.
 *
 * Avant ce module, `activateLicense` n'était appelé qu'à l'inscription avec une
 * clé d'essai générée automatiquement : un client ayant payé une offre n'avait
 * aucun endroit où saisir sa clé, et restait donc en essai pour toujours.
 */
export const LicenseCard: React.FC = () => {
  const { license, mode, activateLicense, busy } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trialDaysLeft = computeTrialDaysLeft(license);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!keyInput.trim()) {
      setErrorMsg('Saisissez la clé reçue lors de votre commande.');
      return;
    }
    setSubmitting(true);
    try {
      const info = await activateLicense(keyInput);
      setSuccessMsg(`Licence « ${info.label} » activée sur cet appareil.`);
      setKeyInput('');
      setFormOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Activation impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#38C995]" /> Licence
      </h3>

      {license ? (
        <div className="text-[13px] space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#38C995]/15 text-[#38C995] border border-[#38C995]/30 text-xs font-semibold">
              {license.label}
            </span>
            <span className="font-mono text-xs text-[#9AAAC0] break-all">{license.key}</span>
          </div>
          <p className="text-xs text-[#9AAAC0]">
            Activée le {license.activatedAt} · {license.seats} poste(s) ·{' '}
            {PLAN_DETAILS[license.plan].priceMonthly === 0
              ? 'essai gratuit'
              : `${PLAN_DETAILS[license.plan].priceMonthly} €/mois`}
          </p>

          {trialDaysLeft !== null && (
            trialDaysLeft > 0 ? (
              <p className="text-xs flex items-center gap-1.5 text-[#E9AE57]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Essai : {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''}.
                Saisissez votre clé payante ci-dessous pour conserver votre plan.
              </p>
            ) : (
              <p className="text-xs flex items-center gap-1.5 text-[#E9AE57]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Essai arrivé à échéance. Vos données restent accessibles ; saisissez votre clé pour
                régulariser votre plan.
              </p>
            )
          )}

          <p className="text-xs text-[#6B7D98] flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Activation locale de confort : cette clé vérifie sa propre cohérence et mémorise votre plan.
            Ce n'est pas un contrôle serveur inviolable — nos offres fonctionnent sans vérification en ligne.
          </p>

          {mode === 'demo' && (
            <p className="text-xs text-[#E9AE57]">
              Mode démonstration : toute activation est éphémère et ne touche pas votre espace réel.
            </p>
          )}

          {!formOpen && (
            <button
              onClick={() => { setFormOpen(true); setSuccessMsg(null); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 font-semibold text-[#C7D2E5] cursor-pointer"
            >
              Changer de clé
            </button>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-[#9AAAC0]">Aucune licence active sur cet appareil.</p>
      )}

      {successMsg && (
        <p className="text-xs flex items-center gap-1.5 text-[#38C995]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {successMsg}
        </p>
      )}

      {(formOpen || !license) && (
        <form onSubmit={submit} className="space-y-2 border-t border-white/10 pt-3">
          <label htmlFor="licence-key" className="block text-xs font-medium text-[#9AAAC0]">
            Clé de licence
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="licence-key"
              type="text"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="RRV-PRO-XXXXXXXXXXXX-XXXX"
              spellCheck={false}
              autoComplete="off"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono uppercase placeholder:text-[#4B5A72] focus:outline-none focus:border-[#4F8CFF]"
            />
            <button
              type="submit"
              disabled={submitting || busy}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Activer
            </button>
            {formOpen && license && (
              <button
                type="button"
                onClick={() => { setFormOpen(false); setErrorMsg(null); setKeyInput(''); }}
                className="px-3 py-2.5 rounded-xl border border-white/15 bg-white/5 text-sm text-[#9AAAC0] cursor-pointer"
              >
                Annuler
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#6B7D98]">
            Format attendu : <span className="font-mono">RRV-PRO-XXXXXXXXXXXX-XXXX</span>. Les espaces et
            minuscules sont acceptés.
          </p>
          {errorMsg && (
            <p className="text-xs flex items-start gap-1.5 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {errorMsg}
            </p>
          )}
        </form>
      )}
    </section>
  );
};
