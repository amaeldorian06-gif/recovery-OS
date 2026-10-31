/** @license SPDX-License-Identifier: Apache-2.0 */

import React, { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './app/AppContext';
import { Navbar, PublicRoute } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { ProductPreview } from './components/ProductPreview';
import { PricingPage } from './components/PricingPage';
import { SignUpPage } from './components/SignUpPage';
import { SignInPage } from './components/SignInPage';
import { AppWorkspace, WorkspaceSection } from './components/AppWorkspace';
import { FintechCosmicBackground } from './components/FintechCosmicBackground';
import { Lock, HardDrive, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Routeur de chemins minimal (aucune dépendance externe)              */
/* ------------------------------------------------------------------ */

const PATH_ROUTES: Record<string, PublicRoute> = {
  '/': 'landing',
  '/fonctionnalites': 'features',
  '/apercu': 'preview',
  '/tarifs': 'pricing',
  '/connexion': 'signin',
  '/inscription': 'signup',
};

function routeFromPath(path: string): { route: PublicRoute | 'app'; section: WorkspaceSection } {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean.startsWith('/app')) {
    const sub = clean.replace(/^\/app\/?/, '');
    const allowed: WorkspaceSection[] = ['dashboard', 'import', 'aging', 'calculator', 'actions', 'backup', 'settings'];
    const section = (allowed.includes(sub as WorkspaceSection) ? sub : 'dashboard') as WorkspaceSection;
    return { route: 'app', section };
  }
  return { route: PATH_ROUTES[clean] ?? 'landing', section: 'dashboard' };
}

function pathForRoute(route: PublicRoute): string {
  return Object.entries(PATH_ROUTES).find(([, r]) => r === route)?.[0] ?? '/';
}

function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return pathname;
}

/* ------------------------------------------------------------------ */
/* Application                                                         */
/* ------------------------------------------------------------------ */

function Shell() {
  const { user, ready, storageAvailable, mode, error, clearError, exitDemo, signOut, startDemo } = useApp();
  const pathname = usePathname();
  const { route, section: initialSection } = routeFromPath(pathname);
  const [section, setSection] = useState<WorkspaceSection>(initialSection);

  useEffect(() => {
    const next = routeFromPath(pathname);
    if (next.route === 'app') setSection(next.section);
  }, [pathname]);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    const next = routeFromPath(path);
    if (next.route === 'app') setSection(next.section);
  }, []);

  const navigateToSection = useCallback((sec: WorkspaceSection) => {
    navigate(`/app/${sec}`);
  }, [navigate]);

  const isPublic = route !== 'app';

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-[#9AAAC0] text-sm">
        Ouverture de votre espace local…
      </div>
    );
  }

  const publicPage = () => {
    switch (route) {
      case 'features':
        return <FeaturesPage onNavigate={navigate} />;
      case 'preview':
        return <ProductPreview onNavigate={navigate} />;
      case 'pricing':
        return <PricingPage onNavigate={navigate} />;
      case 'signup':
        return <SignUpPage onSuccess={() => navigate('/app/dashboard')} onGoToSignIn={() => navigate('/connexion')} />;
      case 'signin':
        return <SignInPage onSuccess={() => navigate('/app/dashboard')} onGoToSignUp={() => navigate('/inscription')} onExploreDemo={() => { startDemo(); navigate('/app/dashboard'); }} />;
      default:
        return <LandingPage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070B20] text-[#F4F7FB] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {isPublic && <FintechCosmicBackground />}

      <Navbar
        route={route}
        user={user}
        isDemo={mode === 'demo'}
        onNavigate={navigate}
        onSignOut={() => { void signOut().then(() => navigate('/')); }}
      />

      {error && (
        <div className="relative z-50 bg-rose-500/15 border-b border-rose-500/30 text-rose-200 text-sm px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</span>
          <button onClick={clearError} className="text-rose-100 underline text-xs">Fermer</button>
        </div>
      )}

      {mode === 'demo' && (
        <div className="relative z-40 bg-amber-500/15 border-b border-amber-500/30 text-amber-100 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Mode démonstration.</strong> Ces données sont fictives, éphémères et n'écrivent jamais dans votre espace local.
          </span>
          <button
            onClick={() => { exitDemo(); navigate('/'); }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold"
          >
            Quitter la démonstration
          </button>
        </div>
      )}

      <main className={`flex-1 relative z-10 flex flex-col ${isPublic ? '' : 'min-h-0'}`}>
        {isPublic && publicPage()}

        {!isPublic && !user && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0B0F17] p-8 text-center space-y-6 shadow-2xl">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Espace de travail local</h3>
                <p className="text-sm text-[#9AAAC0] leading-relaxed">
                  Vos données financières restent sur cet appareil. Créez votre espace local ou lancez la démonstration éphémère.
                </p>
              </div>
              {!storageAvailable && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-start gap-2 text-left">
                  <HardDrive className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>IndexedDB est indisponible (mode privé ?). La persistance ne peut pas être garantie.</span>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/inscription')}
                  className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold cursor-pointer"
                >
                  Créer mon espace local
                </button>
                <button
                  onClick={() => navigate('/connexion')}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-[#9AAAC0] hover:text-white cursor-pointer"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        )}

        {!isPublic && user && (
          <AppWorkspace section={section} onNavigateSection={navigateToSection} onExitToPublic={() => navigate('/')} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
