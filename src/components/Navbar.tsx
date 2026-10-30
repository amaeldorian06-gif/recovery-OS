import React, { useState } from 'react';
import { 
  Layers, 
  Menu, 
  X, 
  LogOut, 
  ArrowRight, 
  Building,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User as UserType } from '../server/store';

export type ActiveTab = 
  | 'landing'
  | 'features'
  | 'pricing'
  | 'signup'
  | 'signin'
  | 'welcome'
  | 'app'
  | 'dashboard' 
  | 'import' 
  | 'aging' 
  | 'calculator' 
  | 'template' 
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDemoData: boolean;
  onLoadDemoData: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  invoiceCount: number;
  currentUser: UserType | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const isPublicView = ['landing', 'features', 'pricing', 'signup', 'signin'].includes(activeTab);

  return (
    <header className="border-b border-white/10 bg-[#070B20]/80 backdrop-blur-xl sticky top-0 z-40 w-full max-w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Wordmark */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0" 
            onClick={() => handleTabSelect(currentUser ? 'dashboard' : 'landing')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#D946EF] p-0.5 shadow-md shadow-[#2563EB]/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#070B20] rounded-[10px] flex items-center justify-center">
                <Layers className="w-4 h-4 text-[#38BDF8]" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#F4F7FB] text-base tracking-tight">
                Revenue Recovery OS
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30">
                FinTech
              </span>
            </div>
          </div>

          {/* Conditional Navigation Links: Authenticated SaaS vs Public Website */}
          {isPublicView ? (
            /* =========================================================================
                UNIVERS 1: PUBLIC WEBSITE TOP BAR (STRICT TOP BAR CONTRACT)
                Links: Features, How it works, Pricing, Sign in, CTA: Get started
            ========================================================================= */
            <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-[#9AAAC0]">
              <button 
                onClick={() => handleTabSelect('features')} 
                className={`hover:text-[#F4F7FB] transition-colors cursor-pointer ${activeTab === 'features' ? 'text-[#38BDF8] font-semibold' : ''}`}
              >
                Features
              </button>

              <a 
                href="#how-it-works" 
                onClick={(e) => {
                  if (activeTab !== 'landing') {
                    e.preventDefault();
                    handleTabSelect('landing');
                    setTimeout(() => {
                      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }
                }}
                className="hover:text-[#F4F7FB] transition-colors cursor-pointer"
              >
                How it works
              </a>

              <button 
                onClick={() => handleTabSelect('pricing')} 
                className={`hover:text-[#F4F7FB] transition-colors cursor-pointer ${activeTab === 'pricing' ? 'text-[#38BDF8] font-semibold' : ''}`}
              >
                Pricing
              </button>

              <button 
                onClick={() => handleTabSelect('signin')} 
                className={`hover:text-[#F4F7FB] transition-colors cursor-pointer ${activeTab === 'signin' ? 'text-[#38BDF8] font-semibold' : ''}`}
              >
                Sign in
              </button>
            </nav>
          ) : (
            /* =========================================================================
                UNIVERS 2: AUTHENTICATED SAAS COCKPIT TOP BAR
                Shows active organization context & quick link back to public site
            ========================================================================= */
            <div className="hidden md:flex items-center space-x-4 text-xs">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live SaaS Workspace · Tenant Encrypted</span>
              </div>
              <button
                onClick={() => handleTabSelect('landing')}
                className="text-[#9AAAC0] hover:text-[#38BDF8] transition-colors cursor-pointer flex items-center gap-1 text-xs"
                title="View public product presentation"
              >
                <span>Public Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Right Action Utilities & Auth Status */}
          <div className="flex items-center space-x-3 shrink-0">
            {isPublicView ? (
              <div className="flex items-center space-x-2">
                {currentUser ? (
                  <button
                    onClick={() => handleTabSelect('dashboard')}
                    className="text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 rounded-xl shadow-lg shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Building className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Go to App ({currentUser.organizationName.split(' ')[0]})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleTabSelect('signin')}
                      className="hidden sm:inline-block text-xs font-medium text-[#9AAAC0] hover:text-[#F4F7FB] px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={() => handleTabSelect('signup')}
                      className="text-xs font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] px-4 py-2 rounded-xl shadow-lg shadow-[#2563EB]/25 transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <span>Get started</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ) : currentUser ? (
              /* Authenticated User Status in App Header */
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#10143A] border border-white/10 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                  <span className="font-semibold text-[#F4F7FB] max-w-[130px] truncate">
                    {currentUser.organizationName}
                  </span>
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase bg-white/5 px-1.5 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out of workspace"
                  className="p-2 rounded-xl text-[#9AAAC0] hover:text-rose-400 hover:bg-white/5 border border-white/5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle navigation"
              className="md:hidden p-2 rounded-xl text-[#9AAAC0] hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2 bg-[#070B20]">
            <button
              onClick={() => handleTabSelect('landing')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#F4F7FB] hover:bg-white/5"
            >
              Overview / Home
            </button>
            <button
              onClick={() => handleTabSelect('features')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#F4F7FB] hover:bg-white/5"
            >
              Features
            </button>
            <button
              onClick={() => handleTabSelect('pricing')}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#F4F7FB] hover:bg-white/5"
            >
              Pricing
            </button>

            {currentUser ? (
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={() => handleTabSelect('dashboard')}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[#38BDF8] bg-[#2563EB]/15 flex items-center justify-between"
                >
                  <span>Open SaaS Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-white/10 flex gap-2">
                <button
                  onClick={() => handleTabSelect('signin')}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-xs text-center font-medium text-[#F4F7FB]"
                >
                  Sign in
                </button>
                <button
                  onClick={() => handleTabSelect('signup')}
                  className="flex-1 py-2 rounded-xl bg-[#2563EB] text-xs text-center font-medium text-white"
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
