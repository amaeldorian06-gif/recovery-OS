import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Eye, EyeOff, ArrowRight, Mail, Layers, Sparkles,
  AlertCircle, CheckCircle2, HardDrive,
} from 'lucide-react';
import { useApp } from '../app/AppContext';

interface SignInPageProps {
  onSuccess: () => void;
  onGoToSignUp: () => void;
  onExploreDemo: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSuccess, onGoToSignUp, onExploreDemo }) => {
  const { signIn, busy } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre e-mail et votre mot de passe.');
      return;
    }
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Identifiants incorrects.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="relative z-10 max-w-5xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#55D6D2] p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#55D6D2]" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">Revenue Recovery OS</span>
              <p className="text-xs text-[#9AAAC0]">Espace de pilotage des créances</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              Retrouvez votre portefeuille de créances.
            </h1>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Vos données restent chiffrées et stockées sur cet appareil. Aucune facture n'est envoyée sur nos serveurs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Priorisation recalculée à chaque affichage</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Formats français : dates JJ/MM/AAAA, montants « 1 234,56 € »</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Sauvegarde JSON exportable à tout moment</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0D1B2A]/90 border border-white/10 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#55D6D2] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pas encore de compte ?</span>
            </div>
            <button
              onClick={onExploreDemo}
              className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="font-semibold">Lancer la démonstration éphémère</div>
                <div className="text-xs text-[#9AAAC0]">Données fictives, jamais enregistrées</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#4F8CFF]" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-[#0B0F17]/90 p-6 sm:p-10 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Connexion</h2>
              <p className="text-sm text-[#9AAAC0] mt-1">
                Accédez à votre espace de travail local.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AAAC0]" />
                  <input
                    id="signin-email" type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="vous@cabinet.fr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AAAC0]" />
                  <input
                    id="signin-password" type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#4F8CFF]"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AAAC0] hover:text-white"
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-[#9AAAC0]">
                <HardDrive className="w-4 h-4 shrink-0 text-[#55D6D2]" />
                <span>
                  Mot de passe vérifié sur cet appareil uniquement. Pensez à exporter régulièrement votre sauvegarde JSON :
                  en local-first, personne d'autre ne peut restaurer vos données pour vous.
                </span>
              </div>

              <button
                type="submit" disabled={busy}
                className="w-full mt-2 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>{busy ? 'Vérification…' : 'Se connecter'}</span>
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <span className="text-sm text-[#9AAAC0]">
                Pas encore d'espace ?{' '}
                <button onClick={onGoToSignUp} className="text-[#4F8CFF] hover:underline font-semibold cursor-pointer">
                  Créer un compte local gratuit
                </button>
              </span>
            </div>

            <p className="mt-4 text-[11px] text-[#6B7D98] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Le mot de passe est dérivé par PBKDF2-SHA256 (120 000 itérations) et ne quitte jamais cet appareil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
