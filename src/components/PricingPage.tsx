import React from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Building, Sparkles } from 'lucide-react';
import { SectionShareBadge } from './LandingPage';

interface PricingPageProps {
  onSelectPlan: (plan: string) => void;
  onGoToSignIn: () => void;
  onBackToLanding: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  onGoToSignIn,
  onBackToLanding
}) => {
  const plans = [
    {
      name: 'Starter',
      badge: 'Early Stage B2B',
      price: '490 €',
      period: '/ month',
      description: 'Essential receivable prioritization for growing companies managing under 500 invoices/month.',
      features: [
        'Up to 500 active invoices / month',
        'Intelligent CSV import & column mapping',
        'Standard 5-bucket aging matrix (ASC 310)',
        'Deterministic risk scoring engine',
        '2 Collector seats included',
        'Standard CSV export',
      ],
      cta: 'Start 14-day trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      badge: 'Most Popular',
      price: '1 290 €',
      period: '/ month',
      description: 'Advanced collection action workflows and decay curve analytics for mid-market finance teams.',
      features: [
        'Up to 5,000 active invoices / month',
        'Real-time CSV & ERP webhook synchronization',
        'Full Collection Action Center with dispute logs',
        'Working capital financing drag calculator',
        'Customizable risk factor thresholds',
        '10 Operator & collector seats',
        'Audit-grade immutable activity ledger',
        'Priority SLA support',
      ],
      cta: 'Start with Professional',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      badge: 'CFO & Corporate',
      price: 'Custom',
      period: 'tailored billing',
      description: 'Dedicated enterprise infrastructure with custom RBAC, SSO, and direct ERP connectors.',
      features: [
        'Unlimited monthly invoices & transaction volume',
        'Custom multi-factor credit scoring models',
        'Native SAP, NetSuite, QuickBooks & Sage APIs',
        'SSO / SAML 2.0 & Custom RBAC roles',
        'Dedicated Technical Account Manager',
        '99.99% uptime guarantee & SOC 2 Type II compliance',
      ],
      cta: 'Contact Enterprise Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-[#10143A]/60 text-xs font-mono text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5 text-[#D946EF]" />
            <span>Transparent B2B Pricing</span>
          </div>
          <SectionShareBadge sectionId="pricing" title="Pricing & Plans" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
          Predictable pricing for high-yield cash recovery.
        </h1>
        <p className="text-base text-[#9AAAC0]">
          No hidden fees. Every plan includes our deterministic explainable risk scoring and audit-standard aging calculations.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl p-8 flex flex-col justify-between transition-all duration-200 relative ${
              p.highlighted
                ? 'bg-gradient-to-b from-[#10143A] to-[#070B20] border-2 border-[#2563EB] shadow-2xl shadow-[#2563EB]/25 scale-105'
                : 'bg-[#0B102E]/60 border border-white/10 hover:border-white/20'
            }`}
          >
            {p.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#D946EF] to-[#2563EB] text-[11px] font-bold text-white tracking-wide uppercase shadow-md">
                {p.badge}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#F4F7FB]">{p.name}</h3>
                <p className="text-xs text-[#9AAAC0] mt-1.5 leading-relaxed">{p.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#F4F7FB]">{p.price}</span>
                <span className="text-xs text-[#9AAAC0] font-medium">{p.period}</span>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <span className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider block">
                  Included Capabilities
                </span>
                <ul className="space-y-2.5 text-xs text-[#DCE4EE]">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => onSelectPlan(p.name)}
                className={`w-full py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
                  p.highlighted
                    ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-[#2563EB]/30'
                    : 'bg-white/10 hover:bg-white/15 text-[#F4F7FB]'
                }`}
              >
                <span>{p.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="rounded-2xl border border-white/10 bg-[#070B20]/80 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#9AAAC0]">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-[#38BDF8] shrink-0" />
          <div>
            <div className="font-bold text-sm text-[#F4F7FB]">Enterprise Security & Data Isolation</div>
            <div>Multi-tenant encryption, zero formula execution, GDPR & SOC 2 Type II compliant storage.</div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onBackToLanding}
            className="text-xs text-[#38BDF8] hover:underline cursor-pointer"
          >
            ← Return to Overview
          </button>
          <button
            onClick={onGoToSignIn}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F7FB] border border-white/10 cursor-pointer"
          >
            Sign In to Existing Workspace
          </button>
        </div>
      </div>
    </div>
  );
};
