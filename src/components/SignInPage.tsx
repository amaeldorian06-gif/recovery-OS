import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Mail, 
  Layers, 
  Sparkles,
  AlertCircle,
  Building,
  UserCheck,
  CheckCircle2,
  HelpCircle,
  X
} from 'lucide-react';
import { dbStore, SEED_USERS, User as UserType } from '../server/store';

interface SignInPageProps {
  onSuccess: (user: UserType) => void;
  onGoToSignUp: () => void;
  onExploreDemo: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({
  onSuccess,
  onGoToSignUp,
  onExploreDemo,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = dbStore.authenticateUser(email, password);
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(result.user);
      }, 350);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Identifiants invalides.');
    }
  };

  const handleQuickSeedLogin = (user: UserType) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const session = dbStore.createSession(user);
      setIsSubmitting(false);
      onSuccess(user);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F4F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#4F8CFF] selection:text-white relative">
      <div className="relative z-10 max-w-5xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Reassurance & Context */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onExploreDemo}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#55D6D2] p-0.5 shadow-lg shadow-[#4F8CFF]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#55D6D2]" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-[#F4F7FB]">Revenue Recovery OS</span>
              <p className="text-xs text-[#9AAAC0]">Espace de gestion financière</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#F4F7FB] leading-tight">
              Retrouvez votre espace de pilotage des créances.
            </h1>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Accédez directement à vos priorités du jour, à l’état d’avancement de vos relances et à l'historique sécurisé de votre organisation.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3 text-xs text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Priorisation dynamique actualisée en temps réel</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Calcul automatisé des intérêts de retard (BCE + 10%)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-[#9AAAC0]">
              <CheckCircle2 className="w-4 h-4 text-[#38C995] shrink-0" />
              <span>Isolation complète des données inter-entreprises</span>
            </div>
          </div>

          {/* Quick Demo Shortcuts Card */}
          <div className="p-4 rounded-xl bg-[#0D1B2A]/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#55D6D2] uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Accès rapides de démonstration</span>
              </span>
              <span className="text-[10px] text-[#9AAAC0]">1 clic</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickSeedLogin(SEED_USERS[0])}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Sarah Chen (Owner)</div>
                  <div className="text-[11px] text-[#9AAAC0]">Acme Advisory Group · 14 factures</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#4F8CFF]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickSeedLogin(SEED_USERS[1])}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Mike Ross (Collector)</div>
                  <div className="text-[11px] text-[#9AAAC0]">Acme Advisory Group · Vue opérationnelle</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#4F8CFF]" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickSeedLogin(SEED_USERS[2])}
                className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Elena Rostova (Owner)</div>
                  <div className="text-[11px] text-[#9AAAC0]">Strata Media Partners · Tenant isolé</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#4F8CFF]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphic Form Card */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 sm:p-10 border-white/15 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F4F7FB]">Connexion</h2>
              <p className="text-sm text-[#9AAAC0] mt-1">
                Accédez à votre portefeuille de créances avec vos identifiants d'entreprise.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                  Email professionnel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@acme-consulting.com"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="signin-password" className="block text-xs font-medium text-[#9AAAC0]">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-[#4F8CFF] hover:underline cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9AAAC0] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-[#0D1B2A] border-white/20 text-[#4F8CFF] focus:ring-[#4F8CFF]"
                  />
                  <span className="text-xs text-[#9AAAC0]">Rester connecté sur cet appareil</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 px-6 rounded-xl bg-[#4F8CFF] hover:bg-[#3b7bf5] text-white font-semibold text-sm shadow-xl shadow-[#4F8CFF]/25 hover:shadow-[#4F8CFF]/40 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authentification en cours...</span>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <span className="text-xs text-[#9AAAC0]">
                Vous n'avez pas encore d'espace ?{' '}
                <button
                  onClick={onGoToSignUp}
                  className="text-[#4F8CFF] hover:underline font-semibold cursor-pointer"
                >
                  Créer un compte gratuitement
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 sm:p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-[#9AAAC0] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-[#F4F7FB] mb-2">Réinitialisation du mot de passe</h3>
            <p className="text-xs text-[#9AAAC0] leading-relaxed mb-4">
              Pour des raisons de conformité et de sécurité multi-tenant, un lien de réinitialisation sécurisé sera adressé à votre administrateur d'organisation ou à votre adresse vérifiée.
            </p>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-[#55D6D2] mb-6">
              Pour les comptes de démonstration (Sarah Chen, Mike Ross, Elena Rostova), utilisez le mot de passe <code>demo123</code> ou cliquez directement sur les accès rapides.
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#4F8CFF] hover:bg-[#3b7bf5] text-white text-xs font-semibold cursor-pointer"
            >
              Compris, fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
