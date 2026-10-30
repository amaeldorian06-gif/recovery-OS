import React, { useState } from 'react';
import { InvoiceRecord, ActionLog, FinancialMetrics } from '../types';
import { User as UserType, SEED_USERS } from '../server/store';
import { MetricsHeader } from './MetricsHeader';
import { PrioritizationTable } from './PrioritizationTable';
import { CsvImportView } from './CsvImportView';
import { AgingReportView } from './AgingReportView';
import { OverdueCalculatorView } from './OverdueCalculatorView';
import { AgingTemplateResourceView } from './AgingTemplateResourceView';
import { 
  BarChart3, 
  UploadCloud, 
  FileText, 
  Calculator, 
  BookOpen, 
  Settings, 
  Download, 
  RotateCcw, 
  LogOut, 
  Building, 
  ShieldCheck, 
  ChevronRight,
  Menu,
  X,
  Layers,
  Sparkles,
  Users,
  LucideIcon
} from 'lucide-react';

export type WorkspaceSection = 'dashboard' | 'import' | 'aging' | 'calculator' | 'template' | 'settings';

interface AppWorkspaceProps {
  currentUser: UserType;
  invoices: InvoiceRecord[];
  financialMetrics: FinancialMetrics;
  isDemoData: boolean;
  actionLogs: ActionLog[];
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  onLoadDemoData: () => void;
  onResetData: () => void;
  onExportCsv: () => void;
  onSwitchUser: (newUser: UserType) => void;
  onLogout: () => void;
  onCommitImport: (newInvoices: InvoiceRecord[]) => void;
  onRecordPayment: (invoiceId: string, paymentAmount: number, reference: string, date: string) => void;
  onSavePromise: (invoiceId: string, promisedDate: string, notes: string) => void;
  onToggleDispute: (invoiceId: string) => void;
  onSaveActionLog: (log: ActionLog) => void;
  onOpenActionModal: (inv: InvoiceRecord) => void;
  onOpenPaymentModal: (inv: InvoiceRecord) => void;
  onOpenPromiseModal: (inv: InvoiceRecord) => void;
  onNavigateToPublicLanding: () => void;
}

interface NavItem {
  id: WorkspaceSection;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export const AppWorkspace: React.FC<AppWorkspaceProps> = ({
  currentUser,
  invoices,
  financialMetrics,
  isDemoData,
  activeSection,
  onSelectSection,
  onResetData,
  onExportCsv,
  onSwitchUser,
  onLogout,
  onCommitImport,
  onToggleDispute,
  onOpenActionModal,
  onOpenPaymentModal,
  onOpenPromiseModal,
  onNavigateToPublicLanding,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Prioritization Queue', icon: BarChart3, badge: invoices.length > 0 ? invoices.length : undefined },
    { id: 'import', label: 'Import CSV', icon: UploadCloud },
    { id: 'aging', label: 'Aging Matrix (ASC 310)', icon: FileText },
    { id: 'calculator', label: 'Financial Calculator', icon: Calculator },
    { id: 'template', label: 'Spreadsheet Template', icon: BookOpen },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden text-[#F4F7FB]">
      {/* =========================================================================
          WORKSPACE SIDEBAR (DESKTOP)
      ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-[#070B20]/95 backdrop-blur-xl shrink-0 select-none">
        {/* Active Organization & Role Header */}
        <div className="p-4 border-b border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider text-[#38BDF8] uppercase font-semibold">
              Authenticated Workspace
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/30">
              {currentUser.role}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#10143A] border border-white/15 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
              {currentUser.organizationName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[#F4F7FB] truncate">
                {currentUser.organizationName}
              </div>
              <div className="text-[11px] text-[#9AAAC0] truncate">
                {currentUser.name}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/25 font-semibold'
                    : 'text-[#9AAAC0] hover:text-[#F4F7FB] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#6B7D98]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-[#9AAAC0]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-3 border-t border-white/10 space-y-2 bg-[#040716]/60">
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={onExportCsv}
              disabled={invoices.length === 0}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[11px] font-medium text-[#9AAAC0] hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Export compliant audit CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/10 text-[#9AAAC0] hover:text-rose-400 transition-colors cursor-pointer"
              title="Reset tenant data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-[#6B7D98]">
            <button
              onClick={onNavigateToPublicLanding}
              className="hover:text-[#38BDF8] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>← Public Site</span>
            </button>

            <button
              onClick={onLogout}
              className="hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE SIDEBAR MODAL / DRAWER
      ========================================================================= */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/70 backdrop-blur-sm flex">
          <div className="w-72 bg-[#070B20] border-r border-white/15 h-full flex flex-col p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold text-sm text-[#F4F7FB]">Workspace Menu</span>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 text-[#9AAAC0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectSection(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#9AAAC0] hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <button onClick={onNavigateToPublicLanding} className="text-[#38BDF8]">
                Public Site
              </button>
              <button onClick={onLogout} className="text-rose-400 flex items-center gap-1">
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          WORKSPACE MAIN CONTENT PANE
      ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#070B20]/40">
        {/* Mobile top bar to toggle sidebar */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-white/10 bg-[#070B20]">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 text-xs text-[#F4F7FB]"
          >
            <Menu className="w-4 h-4 text-[#38BDF8]" />
            <span>Workspace Navigation</span>
          </button>
          <span className="text-xs font-mono text-[#38BDF8]">{currentUser.organizationName}</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* SECTION 1: DASHBOARD / PRIORITIZATION */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FB] tracking-tight">
                    Accounts Receivable Prioritization
                  </h1>
                  <p className="text-xs text-[#9AAAC0] mt-0.5">
                    Multi-factor explainable risk scoring · ASC 310 brackets · Audit-compliant execution
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isDemoData && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20">
                      Sample Dataset Loaded
                    </span>
                  )}
                  <button
                    onClick={() => onSelectSection('import')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#2563EB]/20 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Import New File</span>
                  </button>
                </div>
              </div>

              {/* Restructured 4-KPI Metric Cards */}
              <MetricsHeader metrics={financialMetrics} />

              {/* Prioritization Interactive Table */}
              <PrioritizationTable
                invoices={invoices}
                onOpenActionModal={onOpenActionModal}
                onOpenPaymentModal={onOpenPaymentModal}
                onOpenPromiseModal={onOpenPromiseModal}
                onToggleDispute={(inv) => onToggleDispute(inv.id)}
              />
            </div>
          )}

          {/* SECTION 2: IMPORT CSV */}
          {activeSection === 'import' && (
            <CsvImportView
              onCommitInvoices={onCommitImport}
              onCancel={() => onSelectSection('dashboard')}
            />
          )}

          {/* SECTION 3: AGING REPORT MATRIX */}
          {activeSection === 'aging' && (
            <AgingReportView
              invoices={invoices}
            />
          )}

          {/* SECTION 4: FINANCIAL CALCULATOR */}
          {activeSection === 'calculator' && (
            <OverdueCalculatorView />
          )}

          {/* SECTION 5: SPREADSHEET TEMPLATES & GUIDE */}
          {activeSection === 'template' && (
            <AgingTemplateResourceView />
          )}

          {/* SECTION 6: WORKSPACE SETTINGS & TENANT PROFILE */}
          {activeSection === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-white/10 pb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FB] tracking-tight">
                  Workspace & Organization Settings
                </h1>
                <p className="text-xs text-[#9AAAC0] mt-0.5">
                  Tenant configuration, RBAC permissions, and sample environment switcher.
                </p>
              </div>

              {/* Organization Profile Details */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0B102E]/60 space-y-4">
                <h3 className="font-bold text-sm text-[#F4F7FB] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#38BDF8]" />
                  <span>Tenant Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#070B20] border border-white/5">
                    <span className="text-[#6B7D98] block">Organization ID</span>
                    <span className="text-[#F4F7FB]">{currentUser.organizationId}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070B20] border border-white/5">
                    <span className="text-[#6B7D98] block">Organization Name</span>
                    <span className="text-[#F4F7FB]">{currentUser.organizationName}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070B20] border border-white/5">
                    <span className="text-[#6B7D98] block">Authenticated Operator</span>
                    <span className="text-[#F4F7FB]">{currentUser.name} ({currentUser.email})</span>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070B20] border border-white/5">
                    <span className="text-[#6B7D98] block">Assigned Role</span>
                    <span className="text-[#38BDF8]">{currentUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Fast Tenant Switcher for Testing & Demonstration */}
              <div className="p-6 rounded-2xl border border-white/10 bg-[#0B102E]/60 space-y-4">
                <h3 className="font-bold text-sm text-[#F4F7FB] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D946EF]" />
                  <span>Switch Pre-configured Organization</span>
                </h3>
                <p className="text-xs text-[#9AAAC0]">
                  Select an authenticated profile to test multi-tenant isolation and role-based permissions in real-time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SEED_USERS.map((seedUser) => {
                    const isSelected = seedUser.id === currentUser.id;
                    return (
                      <button
                        key={seedUser.id}
                        onClick={() => onSwitchUser(seedUser)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563EB]/15 border-[#2563EB] text-white shadow-md'
                            : 'bg-[#070B20] border-white/10 hover:border-white/20 text-[#9AAAC0]'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-[#F4F7FB]">{seedUser.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#38BDF8]">
                            {seedUser.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B7D98]">{seedUser.organizationName}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
