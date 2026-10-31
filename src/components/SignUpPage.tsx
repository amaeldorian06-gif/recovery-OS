import React, { useState } from 'react';
import {
  ArrowRight, Layers, ShieldCheck, Lock, AlertCircle, CheckCircle2, HardDrive, Sparkles,
} from 'lucide-react';
import { useApp } from '../app/AppContext';
import { generateLicenseKey, PLAN_DETAILS } from '../storage/license';

interface SignUpPageProps {
  onSuccess: () => void;
  onGoToSignIn: () => void;
}

/**
 * Inscription + activation locale.
 * Le compte, l'organisation et la licence sont créés sur cet appareil.
 * Le mécanisme d'activation est transparent : c'est une préférence locale,
 * pas un contrôle serveur (voir page Tarifs).
 */
export const SignUpPage: React.FC<SignUpPageProps> = ({ onSuccess, onGoToSignIn }) => {
  const { register, busy, activateLicense } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planKey] = useState(() => generateLicenseKey('trial'));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName.trim() || !email.trim() || !companyName.trim() || !password) {
      setErrorMsg('Tous les champs sont obligatoires.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }
    try {
      await register({ fullName, email, companyName, password });
      await activateLicense(planKey);
      setStep(2);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Inscription impossible.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5 space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#55D6D2] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#55D6D2]" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">Revenue Recovery OS</span>
              <p className="text-xs text-[#9AAAC0]">Priorisation financière B2B</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Reprenez le contrôle de vos relances clients.
            </h1>
            <p className="text-base text-[#9AAAC0] leading-relaxed">
              Transformez des dizaines de créances dispersées en un plan d'action quotidien clair, explicable et traçable.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4 text-[#4F8CFF]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">100 % local, zéro cloud</h4>
                <p className="text-xs text-[#9AAAC0]">Vos factures, encaissements et promesses restent dans IndexedDB, sur votre appareil.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#38C995]/15 border border-[#38C995]/30 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-[#38C995]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Mots de passe dérivés, jamais stockés en clair</h4>
                <p className="text-xs text-[#9AAAC0]">PBKDF2-SHA256, 120 000 itérations, sel aléatoire par compte.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#D946EF]/15 border border-[#D946EF]/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#D946EF]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold">Essai 14 jours, sans carte bancaire</h4>
                <p className="text-xs text-[#9AAAC0]">{PLAN_DETAILS.trial.features.join(' · ')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/90 p-6 sm:p-10 shadow-2xl">
            {step === 1 ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">Créer votre espace local</h2>
                  <p className="text-sm text-[#9AAAC0] mt-1">
                    Aucune donnée n'est transmise : le compte est créé sur cet appareil.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleCreate} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5" htmlFor="su-name">Nom complet</label>
                    <input id="su-name" required value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5" htmlFor="su-email">Adresse e-mail</label>
                    <input id="su-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="vous@cabinet.fr"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5" htmlFor="su-company">Organisation</label>
                    <input id="su-company" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="Cabinet Dupont & Associés"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5" htmlFor="su-pass">Mot de passe (8 caractères min.)</label>
                      <input id="su-pass" type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5" htmlFor="su-pass2">Confirmation</label>
                      <input id="su-pass2" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]" />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-[#9AAAC0]">
                    <Lock className="w-4 h-4 shrink-0 text-[#55D6D2]" />
                    <span>
                      En cas d'oubli du mot de passe, vos données locales ne peuvent pas être récupérées par un tiers :
                      exportez votre sauvegarde JSON régulièrement.
                    </span>
                  </div>

                  <button
                    type="submit" disabled={busy}
                    className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{busy ? 'Création…' : 'Créer mon espace et activer l’essai'}</span>
                    {!busy && <ArrowRight className="w-4 h-4" />}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 text-center">
                  <span className="text-sm text-[#9AAAC0]">
                    Déjà un espace ?{' '}
                    <button onClick={onGoToSignIn} className="text-[#4F8CFF] hover:underline font-semibold cursor-pointer">Se connecter</button>
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-5 py-6">
                <div className="w-14 h-14 rounded-2xl bg-[#38C995]/15 border border-[#38C995]/30 flex items-center justify-center text-[#38C995] mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold">Votre espace est prêt</h2>
                <p className="text-sm text-[#9AAAC0] max-w-md mx-auto">
                  L'organisation <strong className="text-[#F4F7FB]">{companyName}</strong> a été créée sur cet appareil,
                  avec la licence d'essai de 14 jours. Importez votre première balance âgée pour démarrer.
                </p>
                <button
                  onClick={onSuccess}
                  className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-lg inline-flex items-center gap-2 cursor-pointer"
                >
                  Ouvrir mon tableau de bord
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
