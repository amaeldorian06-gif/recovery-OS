import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building, 
  User, 
  Mail, 
  Check, 
  X, 
  Layers, 
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { dbStore, User as UserType } from '../server/store';

interface SignUpPageProps {
  onSuccess: (user: UserType) => void;
  onGoToSignIn: () => void;
  onExploreDemo: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSuccess,
  onGoToSignIn,
  onExploreDemo,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 25, label: 'Faible', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 65, label: 'Moyen', color: 'bg-[#E9AE57]' };
    return { score: 100, label: 'Fort', color: 'bg-[#38C995]' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.trim() || !companyName.trim() || !password) {
      setErrorMsg('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Veuillez accepter les conditions d’utilisation pour continuer.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe saisis ne sont pas identiques.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = dbStore.registerUserAndTenant({
        fullName,
        email,
        companyName,
        password,
      });

      // Successful registration: invoke callback
      setTimeout(() => {
        setIsSubmitting(false);
        onSuccess(result.user);
      }, 400);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Une erreur est survenue lors de l’inscription.');
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#F4F7FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#4F8CFF] selection:text-white relative">
      <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Branding, Value Proposition & Trust */}
        <div className="lg:col-span-5 space-y-8">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onExploreDemo}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#4F8CFF] to-[#55D6D2] p-0.5 shadow-lg shadow-[#4F8CFF]/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#07111F] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#55D6D2]" />
              </div>
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-[#F4F7FB]">Revenue Recovery OS</span>
              <p className="text-xs text-[#9AAAC0]">Priorisation financière B2B</p>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F4F7FB] leading-tight">
              Automatisez la hiérarchie de vos relances clients.
            </h1>
            <p className="text-base text-[#9AAAC0] leading-relaxed">
              Transformez des centaines de créances disparates en un plan d’action quotidien clair, explicable et rentable pour votre équipe.
            </p>
          </div>

          {/* 3 Pillars of Trust */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4F7FB]">Sécurité bancaire & chiffrement</h4>
                <p className="text-xs text-[#9AAAC0]">Chiffrement des données en transit et au repos (norme TLS 1.3 / AES-256).</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#55D6D2]/15 border border-[#55D6D2]/30 flex items-center justify-center text-[#55D6D2] shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4F7FB]">Isolation multi-tenant stricte</h4>
                <p className="text-xs text-[#9AAAC0]">Chaque organisation bénéficie d'un périmètre de stockage totalement hermétique.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#38C995]/15 border border-[#38C995]/30 flex items-center justify-center text-[#38C995] shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F4F7FB]">Normes comptables IFRS 9 / CECL</h4>
                <p className="text-xs text-[#9AAAC0]">Algorithmes d’antériorité audités par des directions financières partenaires.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-[#9AAAC0] flex items-center justify-between">
            <span>Aucune carte bancaire requise. Accès immédiat.</span>
            <span className="text-[#55D6D2] font-semibold">100% Gratuit</span>
          </div>
        </div>

        {/* Right Column: Glassmorphic Registration Form */}
        <div className="lg:col-span-7">
          <div className="glass-panel p-6 sm:p-10 border-white/15 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#F4F7FB]">Créer votre espace de travail</h2>
              <p className="text-sm text-[#9AAAC0] mt-1">
                Démarrez en moins de deux minutes avec votre adresse professionnelle.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Nom complet */}
                <div>
                  <label className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                    Nom complet <span className="text-[#4F8CFF]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jean Dupont"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Nom de l'entreprise */}
                <div>
                  <label htmlFor="signup-company" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                    Entreprise / Société <span className="text-[#4F8CFF]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-company"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme France SAS"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Email professionnel */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                  Adresse email professionnelle <span className="text-[#4F8CFF]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@entreprise.com"
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Mot de passe & Confirmation */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="signup-password" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                    Mot de passe <span className="text-[#4F8CFF]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
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

                <div>
                  <label htmlFor="signup-password-confirm" className="block text-xs font-medium text-[#9AAAC0] mb-1.5">
                    Confirmer le mot de passe <span className="text-[#4F8CFF]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9AAAC0]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Strength Indicator */}
              {password && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9AAAC0]">Robustesse du mot de passe :</span>
                    <span className="font-semibold text-[#F4F7FB]">{strength.label}</span>
                  </div>
                  <div className="w-full bg-[#0D1B2A] h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`${strength.color} h-full transition-all duration-300`} 
                      style={{ width: `${strength.score}%` }} 
                    />
                  </div>
                </div>
              )}

              {/* Conditions Checkbox */}
              <div className="pt-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 rounded bg-[#0D1B2A] border-white/20 text-[#4F8CFF] focus:ring-[#4F8CFF]"
                  />
                  <span className="text-xs text-[#9AAAC0] leading-snug">
                    J’accepte les <a href="#cgu" className="text-[#4F8CFF] hover:underline">Conditions Générales d'Utilisation</a> et certifie être autorisé à représenter cette organisation.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-3 px-6 rounded-xl bg-[#4F8CFF] hover:bg-[#3b7bf5] text-white font-semibold text-sm shadow-xl shadow-[#4F8CFF]/25 hover:shadow-[#4F8CFF]/40 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Création de votre espace...</span>
                ) : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Option & Switch to Sign In */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-[#9AAAC0]">Besoin de tester immédiatement ?</span>
                <button
                  onClick={onExploreDemo}
                  className="text-xs font-semibold text-[#55D6D2] hover:underline cursor-pointer"
                >
                  Accès démo sans inscription
                </button>
              </div>

              <div className="text-xs text-[#9AAAC0]">
                Vous avez déjà un compte ?{' '}
                <button
                  onClick={onGoToSignIn}
                  className="text-[#4F8CFF] hover:underline font-semibold cursor-pointer"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
