import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  FileText, 
  ShieldCheck, 
  UploadCloud, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { SectionShareBadge } from './LandingPage';

interface FeaturesPageProps {
  onStartSignUp: () => void;
  onGoToSignIn: () => void;
  onBackToLanding: () => void;
  onNavigateTab: (tab: 'calculator' | 'template') => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onStartSignUp,
  onGoToSignIn,
  onBackToLanding,
  onNavigateTab,
}) => {
  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-20 text-[#F4F7FB]">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-[#10143A]/60 text-xs font-mono text-[#38BDF8]">
            <Sparkles className="w-3.5 h-3.5 text-[#D946EF]" />
            <span>Product Architecture & Specifications</span>
          </div>
          <SectionShareBadge sectionId="features" title="Features & Architecture" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
          Every module designed for zero ambiguity.
        </h1>
        <p className="text-base text-[#9AAAC0]">
          Discover how Revenue Recovery OS replaces manual spreadsheet sorting with deterministic algorithms, RFC 4180 parsing, and ASC 310 compliance.
        </p>
      </div>

      {/* Feature Deep Dive 1: Ingestion Engine */}
      <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/30 flex items-center justify-center text-[#38BDF8]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider">Module 01</span>
              <h2 className="text-xl font-bold text-[#F4F7FB]">Intelligent Ingestion & Sanitization Engine</h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            RFC 4180 Compliant
          </span>
        </div>

        <p className="text-sm text-[#9AAAC0] leading-relaxed">
          Accounting exports from ERPs frequently present inconsistent date schemes, comma-separated decimals, and unescaped quote delimiters. Revenue Recovery OS normalizes this data client-side before committing it to your tenant partition.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-[#070B20] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4F7FB]">Auto-Column Mapping</div>
            <p className="text-[#9AAAC0]">
              Detects standard English and French accounting headers (Facture, Client, Échéance, Montant, Solde, Reste dû).
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#070B20] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4F7FB]">CSV Formula Injection Defense</div>
            <p className="text-[#9AAAC0]">
              Prefixes dangerous leading characters (<code className="text-[#D946EF]">=, +, -, @</code>) with single quotes to shield spreadsheet viewers from remote command execution.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#070B20] border border-white/5 space-y-2">
            <div className="font-bold text-[#F4F7FB]">Pre-Commit Validation</div>
            <p className="text-[#9AAAC0]">
              Visual preview screen surfaces format anomalies, missing fields, and duplicates before any ledger modification.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Deep Dive 2: Explainable Scoring */}
      <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D946EF]/20 border border-[#D946EF]/30 flex items-center justify-center text-[#D946EF]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#D946EF] uppercase tracking-wider">Module 02</span>
              <h2 className="text-xl font-bold text-[#F4F7FB]">Multi-Factor Explainable Risk Scoring</h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#D946EF]/10 text-[#D946EF] border border-[#D946EF]/20">
            Deterministic Logic
          </span>
        </div>

        <p className="text-sm text-[#9AAAC0] leading-relaxed">
          Standard credit management often fails because collectors call whoever is at the top of an alphabetical or chronological list. Our scoring engine computes a composite risk score between 0 and 100 with clear human-readable factors.
        </p>

        <div className="p-4 rounded-xl bg-[#070B20] border border-white/5 font-mono text-xs text-[#38BDF8] space-y-1">
          <div>RiskScore = (DaysPastDue_Weight × 40) + (PortfolioShare_Weight × 30) + DisputePenalty(+25) - PromiseRelief(-15)</div>
          <div className="text-[11px] text-[#6B7D98]">Tiers: Critical (Score &ge; 75), High (&ge; 50), Medium (&ge; 25), Low (&lt; 25)</div>
        </div>
      </div>

      {/* Feature Deep Dive 3: Financial Calculations & Tools */}
      <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider">Module 03 & 04</span>
              <h2 className="text-xl font-bold text-[#F4F7FB]">Accounting Standards & Financial Drag Analytics</h2>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded font-mono bg-[#2563EB]/10 text-[#38BDF8] border border-[#2563EB]/20">
            ASC 310 / CECL Aligned
          </span>
        </div>

        <p className="text-sm text-[#9AAAC0] leading-relaxed">
          Equip your finance team with auditor-ready aging matrices and real-time calculators to quantify liquidity cost and bad debt reserve requirements.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => onNavigateTab('calculator')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#F4F7FB] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>Launch Financial Calculator</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#38BDF8]" />
          </button>
          <button
            onClick={() => onNavigateTab('template')}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#F4F7FB] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>Explore Spreadsheet Template</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#38BDF8]" />
          </button>
        </div>
      </div>

      {/* Conversion Banner */}
      <div className="text-center space-y-4 pt-6">
        <h3 className="text-2xl font-bold text-[#F4F7FB]">Ready to deploy Revenue Recovery OS?</h3>
        <div className="flex justify-center gap-4">
          <button
            onClick={onStartSignUp}
            className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-lg shadow-[#2563EB]/30 transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Create your workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onBackToLanding}
            className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9AAAC0] hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
};
