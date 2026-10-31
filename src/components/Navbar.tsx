import React, { useState } from 'react';
import { Layers, Menu, X, LogOut, ArrowRight, Building, ExternalLink } from 'lucide-react';
import { SessionUser } from '../app/AppContext';

export type PublicRoute = 'landing' | 'features' | 'pricing' | 'preview' | 'signin' | 'signup';

interface NavbarProps {
  route: PublicRoute | 'app';
  user: SessionUser | null;
  isDemo: boolean;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

/**
 * Barre de navigation.
 *  - Univers public : liens marketing + CTA.
 *  - Application : contexte d'organisation sobre (l'habillage cosmique
 *    est réservé au site public).
 */
export const Navbar: React.FC<NavbarProps> = ({ route, user, isDemo, onNavigate, onSignOut }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isPublic = route !== 'app';

  const go = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const publicLinks: Array<{ label: string; path: string; route: PublicRoute }> = [
    { label: 'Accueil', path: '/', route: 'landing' },
    { label: 'Fonctionnalités', path: '/fonctionnalites', route: 'features' },
    { label: 'Aperçu', path: '/apercu', route: 'preview' },
    { label: 'Tarifs', path: '/tarifs', route: 'pricing' },
  ];

  return (
    <header className={`border-b border-white/10 sticky top-0 z-40 w-full ${isPublic ? 'bg-[#070B20]/80 backdrop-blur-xl' : 'bg-[#0B0F17]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Marque */}
          <button
            onClick={() => go(user && !isPublic ? '/app/dashboard' : '/')}
            className="flex items-center space-x-2.5 shrink-0 cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-xl p-0.5 shadow-md flex items-center justify-center ${isPublic ? 'bg-gradient-to-tr from-[#2563EB] to-[#D946EF]' : 'bg-[#2563EB]'}`}>
              <div className="w-full h-full bg-[#070B20] rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-[#38BDF8]" />
              </div>
            </div>
            <span className="font-bold text-base tracking-tight">Revenue Recovery OS</span>
          </button>

          {isPublic ? (
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-[#9AAAC0]">
              {publicLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => go(link.path)}
                  className={`hover:text-[#F4F7FB] transition-colors cursor-pointer ${route === link.route ? 'text-[#38BDF8] font-semibold' : ''}`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Données locales · cet appareil
              </span>
              <button
                onClick={() => go('/')}
                className="text-[#9AAAC0] hover:text-[#38BDF8] flex items-center gap-1 text-xs cursor-pointer"
              >
                <span>Site public</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center space-x-3 shrink-0">
            {isPublic ? (
              user ? (
                <button
                  onClick={() => go('/app/dashboard')}
                  className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-xl shadow-lg shadow-[#2563EB]/25 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Mon espace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => go('/connexion')}
                    className="hidden sm:inline-block text-sm font-medium text-[#9AAAC0] hover:text-[#F4F7FB] px-3 py-2 rounded-lg cursor-pointer"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => go('/inscription')}
                    className="text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] px-4 py-2 rounded-xl shadow-lg shadow-[#2563EB]/25 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Essai gratuit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </>
              )
            ) : user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="font-semibold text-[#F4F7FB] max-w-[160px] truncate">{user.fullName}</span>
                  {isDemo && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">démo</span>}
                </div>
                {!isDemo && (
                  <button
                    onClick={onSignOut}
                    title="Se déconnecter"
                    className="p-2 rounded-xl text-[#9AAAC0] hover:text-rose-400 hover:bg-white/5 border border-white/5 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : null}

            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Ouvrir le menu"
              className="md:hidden p-2 rounded-xl text-[#9AAAC0] hover:text-white bg-white/5 border border-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2 bg-[#070B20]">
            {isPublic ? (
              <>
                {publicLinks.map(link => (
                  <button key={link.path} onClick={() => go(link.path)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5">
                    {link.label}
                  </button>
                ))}
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <button onClick={() => go('/connexion')} className="flex-1 py-2 rounded-xl bg-white/5 text-sm">Connexion</button>
                  <button onClick={() => go('/inscription')} className="flex-1 py-2 rounded-xl bg-[#2563EB] text-sm text-white">Essai gratuit</button>
                </div>
              </>
            ) : (
              <button onClick={() => go('/')} className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#9AAAC0] hover:bg-white/5">
                Retour au site public
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
