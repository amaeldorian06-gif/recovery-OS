import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  UploadCloud, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  Calendar,
  Zap,
  Building,
  UserCheck
} from 'lucide-react';
import { User, OnboardingState } from '../server/store';

interface WelcomePageProps {
  user: User;
  onboardingState: OnboardingState;
  invoiceCount: number;
  onNavigateTab: (tab: 'dashboard' | 'import' | 'aging' | 'calculator' | 'template') => void;
  onLoadDemoData: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  user,
  onboardingState,
  invoiceCount,
  onNavigateTab,
  onLoadDemoData,
}) => {
  // Determine dynamic checklist items
  const steps = [
    {
      id: 'config',
      label: "Configuration de l'organisation",
      description: `Espace dédié créé pour ${user.organizationName}. Isolation des données active.`,
      completed: onboardingState.hasConfiguredCompany,
      actionTab: null,
      buttonText: 'Configuré',
    },
    {
      id: 'import',
      label: 'Importer votre premier fichier de créances',
      description: invoiceCount > 0 
        ? `${invoiceCount} factures enregistrées dans votre portefeuille.`
        : 'Téléversez un fichier CSV de balance âgée ou facturation client.',
      completed: onboardingState.hasImportedFile || invoiceCount > 0,
      actionTab: 'import' as const,
      buttonText: 'Importer un fichier',
    },
    {
      id: 'review',
      label: 'Examiner les créances prioritaires',
      description: 'Découvrez la hiérarchie algorithmique de vos factures et les scores de risque.',
      completed: onboardingState.hasReviewedPriorities,
      actionTab: 'dashboard' as const,
      buttonText: 'Voir le portefeuille',
    },
    {
      id: 'action',
      label: 'Planifier votre première action de relance',
      description: 'Sélectionnez une facture critique et générez un modèle conforme.',
      completed: onboardingState.hasTakenAction,
      actionTab: 'dashboard' as const,
      buttonText: 'Organiser une action',
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Next recommended action
  const nextIncompleteStep = steps.find(s => !s.completed);

  return (
    <div className="min-h-screen bg-transparent text-[#F4F7FB] py-10 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Welcome Header */}
        <div className="glass-panel p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#4F8CFF]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#55D6D2]/30 bg-[#55D6D2]/10 text-xs font-medium text-[#55D6D2] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Espace sécurisé · {user.organizationName}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F4F7FB] mb-3">
              Bienvenue dans votre espace de travail, {user.name.split(' ')[0]}.
            </h1>
            <p className="text-base sm:text-lg text-[#9AAAC0] max-w-2xl leading-relaxed">
              Votre compte <span className="text-[#F4F7FB] font-semibold">{user.organizationName}</span> est actif. Organisons vos premières actions de recouvrement pour sécuriser votre trésorerie.
            </p>

            {/* Quick Summary Pill & Tenant Info */}
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9AAAC0]">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <Building className="w-4 h-4 text-[#4F8CFF]" />
                  <span>Rôle : <strong className="text-[#F4F7FB] capitalize">{user.role}</strong></span>
                </span>
                <span>·</span>
                <span className="flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-[#55D6D2]" />
                  <span>Portefeuille actuel : <strong className="text-[#F4F7FB]">{invoiceCount} factures</strong></span>
                </span>
              </div>

              {invoiceCount === 0 && (
                <button
                  onClick={onLoadDemoData}
                  className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-[#55D6D2] font-medium transition-colors cursor-pointer"
                >
                  Charger des données de démonstration
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Onboarding Progression Checklist Card */}
        <div className="glass-panel p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#F4F7FB]">Progression de l'onboarding</h2>
              <p className="text-xs text-[#9AAAC0] mt-1">
                Complétez ces étapes pour tirer le meilleur parti de votre moteur de recouvrement.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm font-semibold text-[#55D6D2]">{progressPercent}% complété</span>
              <div className="w-32 bg-[#0D1B2A] h-2.5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="bg-gradient-to-r from-[#4F8CFF] to-[#55D6D2] h-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div 
                key={step.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  step.completed 
                    ? 'bg-[#0D1B2A]/40 border-white/5 opacity-80' 
                    : 'bg-[#101F33]/80 border-[#4F8CFF]/30 shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="mt-0.5">
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-[#38C995] shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[#4F8CFF] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#4F8CFF]">{idx + 1}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${step.completed ? 'text-[#F4F7FB] line-through decoration-white/20' : 'text-[#F4F7FB]'}`}>
                      {step.label}
                    </h3>
                    <p className="text-xs text-[#9AAAC0] mt-0.5">{step.description}</p>
                  </div>
                </div>

                <div>
                  {step.actionTab && !step.completed && (
                    <button
                      onClick={() => onNavigateTab(step.actionTab!)}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#4F8CFF] hover:bg-[#3d7eff] text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>{step.buttonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {step.completed && (
                    <span className="text-xs text-[#38C995] font-medium px-2 py-1 bg-[#38C995]/10 rounded border border-[#38C995]/20">
                      Terminé
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Next Action Banner */}
          {nextIncompleteStep && (
            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[#9AAAC0]">
                Prochaine étape recommandée : <strong className="text-[#F4F7FB]">{nextIncompleteStep.label}</strong>
              </span>
              <button
                onClick={() => onNavigateTab(nextIncompleteStep.actionTab || 'dashboard')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#4F8CFF] hover:bg-[#3b7bf5] text-white text-sm font-semibold shadow-lg shadow-[#4F8CFF]/25 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 3 Direct Access Navigation Cards */}
        <div>
          <h2 className="text-lg font-bold text-[#F4F7FB] mb-4">Accès directs à votre espace</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {/* Card 1: Importer mes créances */}
            <div 
              onClick={() => onNavigateTab('import')}
              className="glass-panel-interactive p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 flex items-center justify-center text-[#4F8CFF] mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base text-[#F4F7FB] mb-1 group-hover:text-[#4F8CFF] transition-colors">
                  Importer mes créances
                </h3>
                <p className="text-xs text-[#9AAAC0] leading-relaxed">
                  Ajoutez vos fichiers CSV ou factures en attente. Détection automatique des colonnes et validation immédiate.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-xs font-medium text-[#4F8CFF] space-x-1">
                <span>Accéder à l'importateur</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Consulter mon portefeuille */}
            <div 
              onClick={() => onNavigateTab('dashboard')}
              className="glass-panel-interactive p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#55D6D2]/15 border border-[#55D6D2]/30 flex items-center justify-center text-[#55D6D2] mb-4 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base text-[#F4F7FB] mb-1 group-hover:text-[#55D6D2] transition-colors">
                  Consulter mon portefeuille
                </h3>
                <p className="text-xs text-[#9AAAC0] leading-relaxed">
                  Consultez la priorisation mathématique, les scores de risque unitaires et les métriques de recouvrement.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-xs font-medium text-[#55D6D2] space-x-1">
                <span>Ouvrir le tableau de bord</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 3: Organiser mes actions */}
            <div 
              onClick={() => onNavigateTab('aging')}
              className="glass-panel-interactive p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#E9AE57]/15 border border-[#E9AE57]/30 flex items-center justify-center text-[#E9AE57] mb-4 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-base text-[#F4F7FB] mb-1 group-hover:text-[#E9AE57] transition-colors">
                  Organiser mes actions
                </h3>
                <p className="text-xs text-[#9AAAC0] leading-relaxed">
                  Explorez la matrice d'antériorité comptable, le calculateur de dépréciation et les modèles de relance légaux.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center text-xs font-medium text-[#E9AE57] space-x-1">
                <span>Voir la matrice d'âge</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
