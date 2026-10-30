import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  FileText, 
  Lock, 
  Building2, 
  Users, 
  Clock, 
  Sparkles,
  HelpCircle,
  TrendingUp,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { analytics } from '../utils/analytics';

interface PublicMarketingViewProps {
  onLaunchApp: () => void;
  onLoadDemo: () => void;
}

export const PublicMarketingView: React.FC<PublicMarketingViewProps> = ({
  onLaunchApp,
  onLoadDemo,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'prioritization-guide' | 'pricing' | 'security'>('overview');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCtaClick = () => {
    analytics.track('primary_cta_clicked', { source: 'hero' });
    onLaunchApp();
  };

  const handleDemoClick = () => {
    analytics.track('sample_data_loaded', { source: 'public_hero' });
    onLoadDemo();
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Subnav for Public SEO Sections */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto space-x-2 border-b border-slate-800 pb-3 text-xs scrollbar-none">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeSection === 'overview'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Product Overview (/)
        </button>
        <button
          onClick={() => setActiveSection('prioritization-guide')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeSection === 'prioritization-guide'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Prioritization Guide (/invoice-prioritization)
        </button>
        <button
          onClick={() => setActiveSection('pricing')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeSection === 'pricing'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pricing (/pricing)
        </button>
        <button
          onClick={() => setActiveSection('security')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeSection === 'security'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security Architecture (/security)
        </button>
      </div>

      {/* SECTION: OVERVIEW */}
      {activeSection === 'overview' && (
        <>
          {/* Hero Section */}
          <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>B2B Receivables Prioritization & Action Engine</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
              Prioritize overdue receivables. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                Know what needs attention next.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Import your receivables data, identify accounts that require urgent attention, understand why they matter through explainable risk scoring, and organize the next collection action in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleCtaClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Launch Interactive Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleDemoClick}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Evaluate with Safe Sample Data</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 flex items-center justify-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>No credit card required • Client-side private data processing • Instant demo</span>
            </p>
          </section>

          {/* 3-Step Core Workflow */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                The 3-Step Prioritization Workflow
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Move from messy accounting exports to clear, prioritized collection outreach in under two minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg font-mono">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-200">Import & Normalize CSV</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export your open invoices from QuickBooks, Xero, FreshBooks, or Excel. Our engine detects headers, validates dates, detects duplicate records, and normalizes outstanding balances.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg font-mono">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-200">Explainable Algorithmic Ranking</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instead of sorting solely by age or amount, our transparent formula scores each account by overdue duration, balance concentration, broken commitments, and dispute holds.
                </p>
              </div>

              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-lg font-mono">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-200">Action Generator & Audit Log</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate tone-appropriate follow-ups (Courteous Reminder, Firm Past-Due Notice, Dispute Reconciliation, or Formal Demand), record partial receipts, and track promised payment dates.
                </p>
              </div>
            </div>
          </section>

          {/* Competitive Matrix */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                How Revenue Recovery OS Compares
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                A focused prioritization operating system designed specifically for agile B2B teams.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                    <th className="py-3 px-4">Capability</th>
                    <th className="py-3 px-4 text-indigo-400 font-bold">Revenue Recovery OS</th>
                    <th className="py-3 px-4">Excel / Google Sheets</th>
                    <th className="py-3 px-4">Heavyweight ERP Add-ons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">Time to First Useful Result</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">&lt; 2 Minutes (CSV Upload)</td>
                    <td className="py-3 px-4 text-slate-400">Hours of manual formulas</td>
                    <td className="py-3 px-4 text-slate-400">4 - 8 weeks integration</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">Prioritization Model</td>
                    <td className="py-3 px-4 font-bold text-indigo-400">Explainable Multi-Factor Score</td>
                    <td className="py-3 px-4 text-slate-400">Single-column sorting only</td>
                    <td className="py-3 px-4 text-slate-400">Black-box opacity or rigid rules</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">Financial Segregation</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">Strict separation of cash vs promises</td>
                    <td className="py-3 px-4 text-slate-400">Prone to formula errors</td>
                    <td className="py-3 px-4 text-slate-400">Varies</td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-semibold text-slate-200">Data Privacy & Security</td>
                    <td className="py-3 px-4 font-bold text-emerald-400">Confidential client-side processing</td>
                    <td className="py-3 px-4 text-slate-400">Unencrypted local spreadsheets</td>
                    <td className="py-3 px-4 text-slate-400">Full cloud vendor access</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Target Customer Segments */}
          <section className="max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                Designed for Growing B2B Businesses
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Tailored for organizations managing 20 to 500 active monthly commercial accounts on payment terms.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <Building2 className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-slate-200 text-sm">Agencies & Consultancies</h3>
                <p className="text-xs text-slate-400">
                  Stop chasing client retainers with awkward manual emails. Rank delinquent project milestones by balance severity.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <Users className="w-6 h-6 text-sky-400" />
                <h3 className="font-bold text-slate-200 text-sm">Professional Services</h3>
                <p className="text-xs text-slate-400">
                  Legal, accounting, and engineering firms managing net-30/60 billing cycles across high-value client engagements.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <Clock className="w-6 h-6 text-amber-400" />
                <h3 className="font-bold text-slate-200 text-sm">B2B SaaS (Invoiced Accounts)</h3>
                <p className="text-xs text-slate-400">
                  For annual contracts and enterprise billing where customers pay via PO, wire, or check rather than credit cards.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-slate-200 text-sm">Wholesale & Distribution</h3>
                <p className="text-xs text-slate-400">
                  Protect working capital against delayed commercial credit releases and track broken payment promises.
                </p>
              </div>
            </div>
          </section>

          {/* Real Objections FAQ */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Direct answers to common operational, technical, and commercial questions.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {[
                {
                  q: 'Do I have to connect our primary accounting ERP or share banking credentials?',
                  a: 'No. Revenue Recovery OS operates on standard CSV exports from any accounting software. You do not need to grant full API write-access to your general ledger or expose sensitive credentials.',
                },
                {
                  q: 'How does the explainable risk score work?',
                  a: 'Our scoring engine evaluates four transparent factors: (1) Days past due aging duration, (2) Portfolio balance concentration percentage, (3) Elapsed broken promise dates, and (4) Commercial dispute flags. You can click any invoice to inspect the exact point breakdown.',
                },
                {
                  q: 'How are payment promises handled in financial calculations?',
                  a: 'Strictly segregated. A promised payment or settlement agreement is tracked for follow-up timing, but is NEVER added into collected cash totals until an actual payment receipt is recorded.',
                },
                {
                  q: 'Is our financial data stored or sold to third parties?',
                  a: 'Never. Data processing, calculation, and reporting occur directly in your browser session with client-side isolation. We do not transmit invoice details or debtor identities to advertising networks or external analytics trackers.',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left font-semibold text-slate-200 flex justify-between items-center"
                  >
                    <span>{faq.q}</span>
                    {openFaq === idx ? <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-slate-400 border-t border-slate-800/80 pt-3 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* SECTION: PRIORITIZATION GUIDE (/invoice-prioritization) */}
      {activeSection === 'prioritization-guide' && (
        <section className="max-w-4xl mx-auto space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="text-xs uppercase font-bold text-indigo-400">Accounts Receivable Best Practices</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              The B2B Invoice Prioritization Framework
            </h1>
            <p className="text-xs text-slate-400">
              Why traditional FIFO or aging-only sorting destroys cash flow, and how multi-factor ranking recovers more capital.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-100">The Flaw of Standard Aging Reports</h3>
            <p>
              Most finance teams open their accounting software on Monday morning and sort their AR aging report from oldest to newest. This creates severe operational distortion: a collection specialist may spend 45 minutes trying to recover a $350 invoice that is 92 days overdue, while a $48,000 receivable sitting at 35 days past due receives zero attention.
            </p>

            <h3 className="text-sm font-bold text-slate-100">The Four Pillars of Explainable Prioritization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300">1. Aging Velocity & Recency Penalty</span>
                <p className="text-slate-400">
                  Evaluates how many days have elapsed since the agreed due date. Statistically, collection probability drops from 96.5% at 30 days to 73.6% at 90 days.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300">2. Portfolio Concentration Risk</span>
                <p className="text-slate-400">
                  Measures the invoice balance relative to total outstanding portfolio receivables. Accounts representing &gt;15% of total capital receive priority intervention.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300">3. Broken Payment Commitments</span>
                <p className="text-slate-400">
                  When a debtor commits to wire funds on a specific date and fails to remit, this is the strongest leading indicator of cash distress.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300">4. Commercial Dispute Isolation</span>
                <p className="text-slate-400">
                  Invoices held due to PO mismatch, billing disputes, or deliverable clarifications require operational reconciliation, not automated dunning reminders.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: PRICING (/pricing) */}
      {activeSection === 'pricing' && (
        <section className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-100">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Straightforward monthly licensing designed for small to mid-market B2B finance operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Starter</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-100">$49</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ideal for solo founders and boutique agencies managing up to 50 active receivables.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Up to 150 Invoices / Month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>CSV Upload & Auto Mapping</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Explainable Risk Scoring Engine</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Standard Outreach Templates</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleCtaClick}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Evaluate Starter
              </button>
            </div>

            {/* Growth */}
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl shadow-indigo-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full">
                Most Popular
              </div>
              <div className="space-y-4">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Growth</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-100">$149</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  For growing B2B services, consulting firms, and SaaS with active collections teams.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Unlimited Monthly Invoices</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Customer Account Aggregation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Audit-Standard Aging Matrix</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Promise-to-Pay Segregation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sanitized CSV Audit Export</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleCtaClick}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
              >
                Start Growth Plan
              </button>
            </div>

            {/* Multi-seat */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Multi-Seat Firm</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-100">$399</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-400">
                  For mid-market enterprises requiring multi-collector workflows and custom audit trails.
                </p>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Includes 5 Collector Seats</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-Currency Portfolio Auditing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom Collection Cadences</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Dedicated Onboarding Support</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={handleCtaClick}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Contact Commercial Sales
              </button>
            </div>
          </div>

          {/* Payment Method & Compliance Note */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-start space-x-3">
            <CreditCard className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">B2B Billing Workflow:</strong> We support direct corporate wire transfer, ACH remittance, and verified manual invoicing. In accordance with enterprise financial controls, subscription licenses are activated upon verified bank receipt without third-party aggregator lock-in.
            </div>
          </div>
        </section>
      )}

      {/* SECTION: SECURITY (/security) */}
      {activeSection === 'security' && (
        <section className="max-w-4xl mx-auto space-y-6 bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="text-xs uppercase font-bold text-emerald-400 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Security & Trust Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Verified Data Protection Standards
            </h1>
            <p className="text-xs text-slate-400">
              How Revenue Recovery OS protects confidential receivables data and enforces multi-tenant isolation.
            </p>
          </div>

          <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Zero Financial Data Telemetry</span>
              </h3>
              <p>
                Our analytics bus enforces strict client-side redaction. No customer company names, invoice dollar amounts, individual balances, or contact email addresses are transmitted to analytics or logging services.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>CSV Formula Injection Defense (CWE-1236)</span>
              </h3>
              <p>
                All imported and exported text cells undergo automated sanitization. Any cell beginning with formula execution triggers (<code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">=</code>, <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">+</code>, <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">-</code>, <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">@</code>) is safely escaped with a single quote prefix to prevent spreadsheet command execution when opened in Excel or Calc.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Client-Side Processing & Storage Isolation</span>
              </h3>
              <p>
                Receivables normalization and scoring execute directly within the authenticated user's local memory session. Tenancy boundaries are strictly enforced with cryptographic separation, ensuring cross-tenant data leakage is structurally impossible.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
