/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InvoiceRecord, ActionLog, InvoiceStatus } from './types';
import { dbStore, SEED_USERS, User as UserType } from './server/store';
import { calculateFinancialMetrics, calculateRiskScore } from './utils/financial';
import { exportInvoicesToCsv } from './utils/csv';
import { analytics } from './utils/analytics';
import { updateSEOTags } from './utils/seo';

import { Navbar, ActiveTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { PricingPage } from './components/PricingPage';
import { SignUpPage } from './components/SignUpPage';
import { SignInPage } from './components/SignInPage';
import { AppWorkspace, WorkspaceSection } from './components/AppWorkspace';
import { ActionCenterModal } from './components/ActionCenterModal';
import { PaymentModal } from './components/PaymentModal';
import { PromiseModal } from './components/PromiseModal';
import { AuthModal } from './components/AuthModal';
import { FintechCosmicBackground } from './components/FintechCosmicBackground';

import { Lock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('landing');
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => SEED_USERS[0]); // Default pre-loaded tenant session
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    return dbStore.getInvoices(SEED_USERS[0].organizationId);
  });
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);

  // Modals state
  const [selectedActionInvoice, setSelectedActionInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedPaymentInvoice, setSelectedPaymentInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedPromiseInvoice, setSelectedPromiseInvoice] = useState<InvoiceRecord | null>(null);

  // Private workspace active section
  const [privateSection, setPrivateSection] = useState<WorkspaceSection>('dashboard');

  // Initialize with query params or default
  useEffect(() => {
    analytics.track('app_initialized');
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as ActiveTab | null;

    if (tabParam && ['landing', 'features', 'pricing', 'signup', 'signin', 'welcome', 'app', 'dashboard', 'import', 'aging', 'calculator', 'template', 'settings'].includes(tabParam)) {
      if (['dashboard', 'import', 'aging', 'calculator', 'template', 'settings'].includes(tabParam)) {
        setPrivateSection(tabParam as WorkspaceSection);
        setActiveTab('app');
      } else {
        setActiveTab(tabParam);
      }
    }

    const autostart = params.get('autostart');
    if (autostart === '1') {
      loadTenantInvoices(SEED_USERS[0]);
      setActiveTab('app');
      setPrivateSection('dashboard');
    }
  }, []);

  // Sync active tab with browser URL history without reload
  const navigateToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (['dashboard', 'import', 'aging', 'calculator', 'template', 'settings'].includes(tab)) {
      setPrivateSection(tab as WorkspaceSection);
      setActiveTab('app');
    }
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  // Update Dynamic SEO Title, Open Graph & Structured Metadata on tab switch
  useEffect(() => {
    switch (activeTab) {
      case 'landing': {
        const hash = window.location.hash.replace('#', '');
        if (hash && ['hero', 'problem', 'revelation', 'features', 'how-it-works', 'product-preview', 'cta'].includes(hash)) {
          updateSEOTags(hash);
        } else {
          updateSEOTags('hero');
        }
        break;
      }
      case 'features':
        updateSEOTags('features');
        break;
      case 'pricing':
        updateSEOTags('pricing');
        break;
      case 'signup':
        updateSEOTags('signup');
        break;
      case 'signin':
        updateSEOTags('signin');
        break;
      case 'app':
      case 'dashboard':
      case 'import':
      case 'aging':
      case 'calculator':
      case 'template':
      case 'settings': {
        const orgTitle = currentUser?.organizationName 
          ? `${currentUser.organizationName} — Revenue Recovery OS`
          : 'Receivables Cockpit — Revenue Recovery OS';
        updateSEOTags('hero', {
          title: orgTitle,
          description: 'Authenticated receivables workspace, deterministic multi-factor risk scoring and collection workflows.',
          ogTitle: orgTitle,
          ogDescription: 'Real-time B2B accounts receivable management and collection execution cockpit.',
        });
        break;
      }
      default:
        updateSEOTags('hero');
        break;
    }
  }, [activeTab, currentUser]);

  // Load Invoices for Tenant
  const loadTenantInvoices = (user: UserType) => {
    const orgInvoices = dbStore.getInvoices(user.organizationId);
    setInvoices(orgInvoices);
    setIsDemoData(user.organizationId === 'org-acme');
  };

  const handleSwitchUser = (newUser: UserType) => {
    setCurrentUser(newUser);
    loadTenantInvoices(newUser);
    analytics.track('tenant_switched', { orgId: newUser.organizationId });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setInvoices([]);
    setIsDemoData(false);
    navigateToTab('landing');
  };

  const loadDemoData = () => {
    if (!currentUser) {
      setCurrentUser(SEED_USERS[0]);
      loadTenantInvoices(SEED_USERS[0]);
    } else {
      loadTenantInvoices(currentUser);
    }
    setPrivateSection('dashboard');
    navigateToTab('app');
    analytics.track('sample_data_loaded');
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset the receivables portfolio for this organization?')) {
      if (currentUser) {
        dbStore.saveInvoices(currentUser.organizationId, []);
      }
      setInvoices([]);
      setIsDemoData(false);
      setActionLogs([]);
    }
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    const csv = exportInvoicesToCsv(invoices);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Revenue_Recovery_OS_${currentUser?.organizationId || 'Audit'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    analytics.track('audit_csv_exported');
  };

  // Recalculate metrics whenever invoices change
  const financialMetrics = useMemo(() => {
    return calculateFinancialMetrics(invoices);
  }, [invoices]);

  // Commit Import
  const handleCommitImport = (newInvoices: InvoiceRecord[]) => {
    if (currentUser) {
      dbStore.saveInvoices(currentUser.organizationId, newInvoices);
      dbStore.recordOnboardingStep(currentUser.organizationId, 'hasImportedFile');
    }
    setInvoices(newInvoices);
    setIsDemoData(false);
    setPrivateSection('dashboard');
  };

  // Record Payment
  const handleRecordPayment = (invoiceId: string, paymentAmount: number, reference: string, date: string) => {
    analytics.track('payment_recorded');
    if (currentUser) {
      dbStore.updateInvoice(currentUser.organizationId, invoiceId, inv => {
        const newPaid = inv.paidAmount + paymentAmount;
        const newOutstanding = Math.max(0, inv.totalAmount - newPaid);
        const newStatus: InvoiceStatus = newOutstanding <= 0 ? 'paid' : inv.status;

        return {
          ...inv,
          paidAmount: newPaid,
          outstandingAmount: newOutstanding,
          status: newStatus,
          notes: `${inv.notes ? inv.notes + ' | ' : ''}Payment of ${paymentAmount.toLocaleString()} € recorded on ${date} (${reference})`,
        };
      });
      dbStore.recordOnboardingStep(currentUser.organizationId, 'hasTakenAction');
      setInvoices(dbStore.getInvoices(currentUser.organizationId));
    }
  };

  // Save Promise
  const handleSavePromise = (invoiceId: string, promisedDate: string, notes: string) => {
    analytics.track('promise_recorded');
    if (currentUser) {
      const allInvoices = dbStore.getInvoices(currentUser.organizationId);
      const totalPortfolio = allInvoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

      dbStore.updateInvoice(currentUser.organizationId, invoiceId, inv => {
        const { score, tier, factors } = calculateRiskScore({
          daysPastDue: inv.daysPastDue,
          outstandingAmount: inv.outstandingAmount,
          totalPortfolioAmount: totalPortfolio,
          isDisputed: inv.status === 'disputed',
          promisedDate,
          asOfDateStr: '2026-10-29',
        });

        return {
          ...inv,
          promisedPaymentDate: promisedDate,
          notes,
          riskScore: score,
          riskTier: tier,
          riskFactors: factors,
        };
      });
      dbStore.recordOnboardingStep(currentUser.organizationId, 'hasTakenAction');
      setInvoices(dbStore.getInvoices(currentUser.organizationId));
    }
  };

  // Toggle Dispute
  const handleToggleDispute = (invoiceId: string) => {
    analytics.track('dispute_toggled');
    if (currentUser) {
      const allInvoices = dbStore.getInvoices(currentUser.organizationId);
      const totalPortfolio = allInvoices.reduce((acc, curr) => acc + curr.outstandingAmount, 0);

      dbStore.updateInvoice(currentUser.organizationId, invoiceId, inv => {
        const isNowDisputed = inv.status !== 'disputed';
        const newStatus: InvoiceStatus = isNowDisputed ? 'disputed' : (inv.daysPastDue > 0 ? 'overdue' : 'current');

        const { score, tier, factors } = calculateRiskScore({
          daysPastDue: inv.daysPastDue,
          outstandingAmount: inv.outstandingAmount,
          totalPortfolioAmount: totalPortfolio,
          isDisputed: isNowDisputed,
          promisedDate: inv.promisedPaymentDate,
          asOfDateStr: '2026-10-29',
        });

        return {
          ...inv,
          status: newStatus,
          riskScore: score,
          riskTier: tier,
          riskFactors: factors,
        };
      });
      setInvoices(dbStore.getInvoices(currentUser.organizationId));
    }
  };

  // Save Action Log
  const handleSaveActionLog = (log: ActionLog) => {
    setActionLogs(prev => [log, ...prev]);
    if (currentUser) {
      dbStore.recordOnboardingStep(currentUser.organizationId, 'hasTakenAction');
    }
  };

  // Authentication Handlers
  const handleRegistrationSuccess = (newUser: UserType) => {
    setCurrentUser(newUser);
    loadTenantInvoices(newUser);
    setPrivateSection('dashboard');
    navigateToTab('app');
  };

  const handleSignInSuccess = (user: UserType) => {
    setCurrentUser(user);
    loadTenantInvoices(user);
    setPrivateSection('dashboard');
    navigateToTab('app');
  };

  const isPublicRoute = ['landing', 'features', 'pricing', 'signup', 'signin'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#070B20] text-[#F4F7FB] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden">
      {/* Scroll-synchronized Dual Celestial Spherical FinTech Background */}
      <FintechCosmicBackground />

      {/* Top Navbar */}
      <div className="relative z-40">
        <Navbar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          isDemoData={isDemoData}
          onLoadDemoData={loadDemoData}
          onResetData={resetData}
          onExportCsv={handleExportCsv}
          invoiceCount={invoices.length}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-full relative z-10 flex flex-col">
        {/* =====================================================================
            UNIVERS 1 — PUBLIC WEBSITE
        ===================================================================== */}
        {activeTab === 'landing' && (
          <LandingPage
            onStartSignUp={() => navigateToTab('signup')}
            onGoToSignIn={() => navigateToTab('signin')}
            onExploreDemo={() => {
              if (!currentUser) setCurrentUser(SEED_USERS[0]);
              loadTenantInvoices(currentUser || SEED_USERS[0]);
              setPrivateSection('dashboard');
              navigateToTab('app');
            }}
            onNavigateTab={(tab) => {
              setPrivateSection(tab as WorkspaceSection);
              navigateToTab('app');
            }}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesPage
            onStartSignUp={() => navigateToTab('signup')}
            onGoToSignIn={() => navigateToTab('signin')}
            onBackToLanding={() => navigateToTab('landing')}
            onNavigateTab={(tab) => {
              setPrivateSection(tab as WorkspaceSection);
              navigateToTab('app');
            }}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage
            onSelectPlan={() => navigateToTab('signup')}
            onGoToSignIn={() => navigateToTab('signin')}
            onBackToLanding={() => navigateToTab('landing')}
          />
        )}

        {activeTab === 'signup' && (
          <SignUpPage
            onSuccess={handleRegistrationSuccess}
            onGoToSignIn={() => navigateToTab('signin')}
            onExploreDemo={() => {
              if (!currentUser) setCurrentUser(SEED_USERS[0]);
              loadTenantInvoices(currentUser || SEED_USERS[0]);
              setPrivateSection('dashboard');
              navigateToTab('app');
            }}
          />
        )}

        {activeTab === 'signin' && (
          <SignInPage
            onSuccess={handleSignInSuccess}
            onGoToSignUp={() => navigateToTab('signup')}
            onExploreDemo={() => {
              if (!currentUser) setCurrentUser(SEED_USERS[0]);
              loadTenantInvoices(currentUser || SEED_USERS[0]);
              setPrivateSection('dashboard');
              navigateToTab('app');
            }}
          />
        )}

        {/* =====================================================================
            UNIVERS 2 — PRIVATE SAAS APPLICATION (STRICT AUTHENTICATION GATE)
        ===================================================================== */}
        {!isPublicRoute && (
          currentUser ? (
            <AppWorkspace
              currentUser={currentUser}
              invoices={invoices}
              financialMetrics={financialMetrics}
              isDemoData={isDemoData}
              actionLogs={actionLogs}
              activeSection={privateSection}
              onSelectSection={(sec) => setPrivateSection(sec)}
              onLoadDemoData={loadDemoData}
              onResetData={resetData}
              onExportCsv={handleExportCsv}
              onSwitchUser={handleSwitchUser}
              onLogout={handleLogout}
              onCommitImport={handleCommitImport}
              onRecordPayment={handleRecordPayment}
              onSavePromise={handleSavePromise}
              onToggleDispute={handleToggleDispute}
              onSaveActionLog={handleSaveActionLog}
              onOpenActionModal={(inv) => setSelectedActionInvoice(inv)}
              onOpenPaymentModal={(inv) => setSelectedPaymentInvoice(inv)}
              onOpenPromiseModal={(inv) => setSelectedPromiseInvoice(inv)}
              onNavigateToPublicLanding={() => navigateToTab('landing')}
            />
          ) : (
            /* Secure Access Gate if unauthenticated user attempts direct /app access */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#070B20]/95 backdrop-blur-xl p-8 text-center space-y-6 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#F4F7FB]">Workspace Authentication Required</h3>
                  <p className="text-xs text-[#9AAAC0] leading-relaxed">
                    This receivables ledger is protected by client-isolated tenant partitions. Please sign in or create an organization workspace to proceed.
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={() => navigateToTab('signin')}
                    className="w-full py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-lg shadow-[#2563EB]/20 transition-colors cursor-pointer"
                  >
                    Sign In to Workspace
                  </button>
                  <button
                    onClick={() => navigateToTab('landing')}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-[#9AAAC0] hover:text-white transition-colors cursor-pointer"
                  >
                    Return to Public Overview
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Global Modals */}
      {selectedActionInvoice && (
        <ActionCenterModal
          invoice={selectedActionInvoice}
          onClose={() => setSelectedActionInvoice(null)}
          onSaveActionLog={handleSaveActionLog}
        />
      )}

      {selectedPaymentInvoice && (
        <PaymentModal
          invoice={selectedPaymentInvoice}
          onClose={() => setSelectedPaymentInvoice(null)}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {selectedPromiseInvoice && (
        <PromiseModal
          invoice={selectedPromiseInvoice}
          onClose={() => setSelectedPromiseInvoice(null)}
          onSavePromise={handleSavePromise}
        />
      )}

      {isAuthModalOpen && currentUser && (
        <AuthModal
          isOpen={isAuthModalOpen}
          currentUser={currentUser}
          onClose={() => setIsAuthModalOpen(false)}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
