import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  UploadCloud, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  FileSpreadsheet, 
  TrendingDown, 
  Lock, 
  ExternalLink,
  Sliders,
  DollarSign,
  Activity,
  ArrowUpRight,
  Share2,
  Check
} from 'lucide-react';
import { updateSEOTags, PUBLIC_SECTIONS_SEO, BASE_SITE_URL } from '../utils/seo';

/**
 * SectionShareBadge
 * Sleek micro-component that allows copying the direct section link and displays
 * a tooltip preview of the section-specific Open Graph / Twitter share card.
 */
export const SectionShareBadge: React.FC<{ sectionId: string; title: string }> = ({ sectionId, title }) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const seoData = PUBLIC_SECTIONS_SEO[sectionId] || PUBLIC_SECTIONS_SEO.hero;
  const shareUrl = `${BASE_SITE_URL}/#${sectionId === 'hero' ? '' : sectionId}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {});
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={handleCopy}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-[#10143A]/60 hover:bg-[#1A204E] text-[#9AAAC0] hover:text-[#38BDF8] text-[11px] font-mono transition-all duration-200 cursor-pointer shadow-sm group"
        title="Copy direct share link with tailored Open Graph & Twitter card metadata"
        aria-label={`Share ${title}`}
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-sans font-semibold">Link copied!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3 text-[#38BDF8] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Share</span>
          </>
        )}
      </button>

      {/* Popover preview of Social Sharing Card on Hover */}
      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 p-3.5 rounded-xl border border-white/15 bg-[#070B20]/95 backdrop-blur-xl shadow-2xl text-left z-50 pointer-events-none transition-all duration-200 text-xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
            <span>Social Share Preview</span>
            <span className="text-emerald-400 font-semibold">OG / Twitter Card</span>
          </div>
          <div className="font-semibold text-white leading-tight mb-1 text-[13px]">
            {seoData.ogTitle || seoData.title}
          </div>
          <div className="text-[11px] text-[#9AAAC0] line-clamp-2 leading-relaxed mb-2">
            {seoData.ogDescription || seoData.description}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7D98] pt-1 border-t border-white/5">
            <span className="truncate max-w-[200px]">{shareUrl}</span>
            <span className="text-[#38BDF8]">Ready</span>
          </div>
        </div>
      )}
    </div>
  );
};

interface LandingPageProps {
  onStartSignUp: () => void;
  onGoToSignIn: () => void;
  onExploreDemo: () => void;
  onNavigateTab: (tab: 'dashboard' | 'import' | 'aging' | 'calculator' | 'template') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSignUp,
  onGoToSignIn,
  onExploreDemo,
  onNavigateTab
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<'matrix' | 'scoring' | 'actions'>('matrix');

  // Track sections and keep document title, Open Graph, Twitter cards, and hash updated
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    const validSections = ['hero', 'problem', 'revelation', 'features', 'how-it-works', 'product-preview', 'cta'];

    if (currentHash && validSections.includes(currentHash)) {
      updateSEOTags(currentHash);
      const targetElement = document.getElementById(currentHash);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    } else {
      updateSEOTags('hero');
    }

    const elements = validSections
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let activeSectionId = currentHash || 'hero';

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length === 0) return;

        // Pick the entry with the highest visibility in viewport
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topEntry = visibleEntries[0];
        const nextId = topEntry.target.id;

        if (nextId && nextId !== activeSectionId) {
          activeSectionId = nextId;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            updateSEOTags(nextId);
            const url = new URL(window.location.href);
            url.hash = nextId === 'hero' ? '' : nextId;
            window.history.replaceState(null, '', url.toString());
          }, 120);
        }
      },
      {
        root: null,
        rootMargin: '-10% 0px -40% 0px',
        threshold: [0.15, 0.4, 0.7],
      }
    );

    elements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      updateSEOTags(id);
      const url = new URL(window.location.href);
      url.hash = id === 'hero' ? '' : id;
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <div className="relative text-[#F4F7FB] selection:bg-[#2563EB] selection:text-white">

      {/* =========================================================================
          SECTION 01 — HERO / FIRST IMPRESSION
          Cinematic full-height composition framing the dual celestial horizon
      ========================================================================= */}
      <section id="hero" className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 text-center pt-16 pb-20">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Top Indicator with Section Share */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#10143A]/60 backdrop-blur-md text-xs font-medium text-[#38BDF8] shadow-lg shadow-[#2563EB]/10">
              <Sparkles className="w-3.5 h-3.5 text-[#D946EF]" />
              <span>Revenue Recovery Operating System · B2B FinTech Architecture</span>
            </div>
            <SectionShareBadge sectionId="hero" title="Revenue Recovery Strategy" />
          </div>

          {/* Primary Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#F4F7FB] leading-[1.1] max-w-3xl mx-auto font-sans">
            Your receivables deserve a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D946EF] via-[#38BDF8] to-[#2563EB]">
              smarter strategy.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[#9AAAC0] max-w-2xl mx-auto font-normal leading-relaxed">
            Turn scattered invoice data into clear priorities, structured collection actions and better financial visibility.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => scrollToSection('product-preview')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white text-sm font-semibold tracking-wide shadow-xl shadow-[#2563EB]/25 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Explore the platform</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onStartSignUp}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#10143A]/80 hover:bg-[#1A204E] text-[#F4F7FB] border border-white/15 text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <span>Get started</span>
              <ArrowUpRight className="w-4 h-4 text-[#38BDF8]" />
            </button>
          </div>

          {/* Micro Assurance */}
          <p className="text-xs text-[#6B7D98] pt-2 tracking-wide">
            IFRS 9 / CECL aligned · Zero formula injection vulnerability · 100% Client isolation
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 02 — THE PROBLEM
          Progressive revelation of scattered invoices and fragmented visibility
      ========================================================================= */}
      <section id="problem" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D946EF]">
              The Challenge
            </span>
            <SectionShareBadge sectionId="problem" title="The Problem" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#F4F7FB]">
            Not all overdue invoices deserve the same attention.
          </h2>
          <p className="text-base sm:text-lg text-[#9AAAC0] leading-relaxed">
            Managing receivables through disconnected spreadsheets makes it harder to identify exposure, recognize payment risks and organize the right actions.
          </p>
        </div>

        {/* Scattered Invoices to Fragmented Reality Visual */}
        <div className="relative rounded-2xl border border-white/10 bg-[#070B20]/75 backdrop-blur-xl p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#D946EF]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#2563EB]/10 blur-3xl pointer-events-none" />

          {/* The Disconnected Spreadsheets Reality Mock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Sheet 1: Blind chronological sorting */}
            <div className="rounded-xl border border-white/10 bg-[#10143A]/60 p-5 space-y-3 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-2">
                <span className="font-mono">Invoices_Q3_v4_FINAL.xlsx</span>
                <span className="text-rose-400 font-semibold">Overdue</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded bg-white/5 flex justify-between items-center opacity-60">
                  <span>INV-2024-001 (Small Office)</span>
                  <span className="font-mono">450 € · 12d</span>
                </div>
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                  <span className="text-rose-200 font-medium">INV-2024-049 (Global Corp)</span>
                  <span className="font-mono text-rose-300 font-bold">142,000 € · 64d</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 flex justify-between items-center opacity-60">
                  <span>INV-2024-082 (Local Shop)</span>
                  <span className="font-mono">1,200 € · 5d</span>
                </div>
              </div>
              <p className="text-[11px] text-[#6B7D98] pt-1">
                ⚠️ Sorted blindly by date: 142k € critical account buried under low-impact 450 € tickets.
              </p>
            </div>

            {/* Sheet 2: Uncoordinated Notes & Silos */}
            <div className="rounded-xl border border-white/10 bg-[#10143A]/60 p-5 space-y-3 transform translate-y-2 hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-2">
                <span className="font-mono">Collections_Notes_Email.msg</span>
                <span className="text-amber-400 font-semibold">Unsynced</span>
              </div>
              <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 space-y-1.5 text-xs">
                <div className="font-medium text-amber-200">Customer dispute hidden in inbox:</div>
                <p className="text-[#9AAAC0] italic text-[11px]">
                  "Client claims delivery note #881 was unsigned. Finance team continues automated dun letters..."
                </p>
              </div>
              <p className="text-[11px] text-[#6B7D98] pt-1">
                ⚠️ Broken communication loops damage key customer relationships while capital decays.
              </p>
            </div>

            {/* Sheet 3: Invisible Liquidity Erosion */}
            <div className="rounded-xl border border-white/10 bg-[#10143A]/60 p-5 space-y-3 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-2">
                <span className="font-mono">Financial_Impact.calc</span>
                <span className="text-violet-400 font-semibold">Erosion</span>
              </div>
              <div className="p-3 rounded bg-white/5 space-y-2 text-xs">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#9AAAC0]">CRF Historical Decay</span>
                  <span className="text-rose-400 font-bold">-26.4% recoverability</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#9AAAC0]">Short-term WACC Drag</span>
                  <span className="text-amber-300 font-bold">~8.5% p.a.</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-gradient-to-r from-amber-400 to-rose-500 h-full w-[65%]" />
                </div>
              </div>
              <p className="text-[11px] text-[#6B7D98] pt-1">
                ⚠️ Each passing week beyond 60 days sharply accelerates default probability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 03 — THE REVELATION
          Major visual transition: Invoices converge into structured analytical clarity
      ========================================================================= */}
      <section id="revelation" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              The Breakthrough
            </span>
            <SectionShareBadge sectionId="revelation" title="The Breakthrough" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
            See what matters. Act where it counts.
          </h2>
          <p className="text-base sm:text-lg text-[#9AAAC0]">
            Revenue Recovery OS replaces guesswork with explainable mathematical scoring and structured workflows.
          </p>
        </div>

        {/* 3 Pillar Concepts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 space-y-4 hover:border-[#38BDF8]/40 transition-colors duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#38BDF8]">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-[#38BDF8]">01 · EXPOSURE AWARENESS</div>
            <h3 className="text-xl font-bold text-[#F4F7FB]">Understand your exposure</h3>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Instantly aggregate outstanding receivables across standardized 5-bracket aging buckets aligned with ASC 310 / CECL accounting regulations.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 space-y-4 hover:border-[#D946EF]/40 transition-colors duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-[#D946EF]/15 border border-[#D946EF]/30 flex items-center justify-center text-[#D946EF]">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-[#D946EF]">02 · DETERMINISTIC RANKING</div>
            <h3 className="text-xl font-bold text-[#F4F7FB]">Prioritize financial risk</h3>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Multi-factor scoring incorporates days past due, capital concentration, dispute markers, and promised payment milestones into an explainable 0–100 score.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-white/10 bg-[#0B102E]/60 p-8 space-y-4 hover:border-[#38BDF8]/40 transition-colors duration-300 relative group">
            <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-xs font-mono text-[#38BDF8]">03 · AUDIT-GRADE RECOVERY</div>
            <h3 className="text-xl font-bold text-[#F4F7FB]">Organize your actions</h3>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Log phone follow-ups, formal demand letters, payment promises, and partial settlements with complete immutable audit logs and automated recalculation.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 04 — INTELLIGENCE / FEATURES
          4 Large editorial compositions (not a 12-item grid)
      ========================================================================= */}
      <section id="features" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5 space-y-24">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D946EF]">
              Core Intelligence
            </span>
            <SectionShareBadge sectionId="features" title="Core Intelligence" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
            Engineered for finance leaders who demand certainty.
          </h2>
        </div>

        {/* FEATURE 01: Intelligent Import */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#38BDF8] px-3 py-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/20">
              01 · INGESTION ENGINE
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F7FB]">
              Intelligent CSV Import & Schema Detection
            </h3>
            <p className="text-sm sm:text-base text-[#9AAAC0] leading-relaxed">
              Import existing receivables from any ERP (SAP, NetSuite, QuickBooks, Sage, Stripe) in seconds. Our parsing engine auto-detects column headers, normalizes European vs US number formatting, flags duplicates, and inoculates your system against CSV command formula injections.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#F4F7FB]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                <span>RFC 4180 standard compliance with quoted cell multiline support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                <span>Pre-commit data validation preview before touching database</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B102E]/70 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-3">
              <span className="font-mono text-[#38BDF8]">CSV_Ingestion_Preview.json</span>
              <span className="text-emerald-400 font-semibold">Ready to commit</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Invoice Number</span>
                <span className="text-[#F4F7FB]">Detected: col "Facture #"</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Due Date Format</span>
                <span className="text-[#38BDF8]">Auto: ISO 8601 (YYYY-MM-DD)</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Injection Defense</span>
                <span className="text-emerald-400 font-semibold">Active · Escaping @,=,+,-</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE 02: Explainable Risk Scoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-[#0B102E]/70 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-3">
              <span className="font-mono text-[#D946EF]">Scoring_Algorithm_Weights.py</span>
              <span className="text-[#38BDF8] font-semibold">Deterministic</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Aging Days Decay (0 - 90+ days)</span>
                <span className="font-mono text-[#D946EF]">Weight: 40%</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Portfolio Concentration Exposure</span>
                <span className="font-mono text-[#D946EF]">Weight: 30%</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Active Customer Dispute Flag</span>
                <span className="font-mono text-rose-400">+25 pts penalty</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex justify-between items-center">
                <span className="text-[#9AAAC0]">Verified Payment Promise</span>
                <span className="font-mono text-emerald-400">-15 pts relief</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D946EF] px-3 py-1 rounded bg-[#D946EF]/10 border border-[#D946EF]/20">
              02 · RISK MATHEMATICS
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F7FB]">
              Explainable Risk Scoring
            </h3>
            <p className="text-sm sm:text-base text-[#9AAAC0] leading-relaxed">
              No black-box models. Every risk score (0 to 100) and risk tier (Critical, High, Medium, Low) gives your collectors clear, factual reasons why an invoice is urgent, allowing informed conversations rather than blind panic.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#F4F7FB]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D946EF]" />
                <span>Deterministic calculations backed by automated unit tests</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D946EF]" />
                <span>Instant re-ranking as payments or disputes are recorded</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FEATURE 03: Collection Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#38BDF8] px-3 py-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/20">
              03 · EXECUTION PLAYBOOKS
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F7FB]">
              Collection Action Center
            </h3>
            <p className="text-sm sm:text-base text-[#9AAAC0] leading-relaxed">
              Transform anxious follow-ups into structured execution. Record phone call notes, schedule promise deadlines, flag disputed line-items, and trigger pre-composed formal reminder notices without leaving the prioritization workspace.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#F4F7FB]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                <span>Role-based access controls for credit managers & collectors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
                <span>One-click partial settlement and reconciliation ledger</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0B102E]/70 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-3">
              <span className="font-mono text-[#38BDF8]">Action_Center_Workflow</span>
              <span className="text-[#38BDF8] font-semibold">Active Session</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Stage 1 · Friendly Reminder</div>
                  <div className="text-[#9AAAC0] text-[11px]">Due +7 days · Automated gentle notice</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Sent</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-[#2563EB]/30 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Stage 2 · Executive Escalation</div>
                  <div className="text-[#9AAAC0] text-[11px]">Due +30 days · Phone call logged & promise taken</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/30">In Progress</span>
              </div>
              <div className="p-3 rounded bg-[#070B20] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#F4F7FB]">Stage 3 · Formal Demand Notice</div>
                  <div className="text-[#9AAAC0] text-[11px]">Due +60 days · Legal interest & fees enabled</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-[#9AAAC0]">Pending</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE 04: Aging Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 rounded-2xl border border-white/10 bg-[#0B102E]/70 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-[#9AAAC0] border-b border-white/5 pb-3">
              <span className="font-mono text-[#38BDF8]">ASC_310_Aging_Matrix</span>
              <span className="text-[#55D6D2] font-semibold">Audited</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-[#070B20] border border-white/5">
                <span className="text-[10px] text-[#9AAAC0] block">Current</span>
                <span className="font-bold text-emerald-400">42%</span>
              </div>
              <div className="p-2 rounded bg-[#070B20] border border-white/5">
                <span className="text-[10px] text-[#9AAAC0] block">1-30d</span>
                <span className="font-bold text-[#38BDF8]">28%</span>
              </div>
              <div className="p-2 rounded bg-[#070B20] border border-white/5">
                <span className="text-[10px] text-[#9AAAC0] block">31-60d</span>
                <span className="font-bold text-amber-400">18%</span>
              </div>
              <div className="p-2 rounded bg-[#070B20] border border-white/5">
                <span className="text-[10px] text-[#9AAAC0] block">61-90d</span>
                <span className="font-bold text-orange-400">8%</span>
              </div>
              <div className="p-2 rounded bg-[#070B20] border border-white/5">
                <span className="text-[10px] text-[#9AAAC0] block">90d+</span>
                <span className="font-bold text-rose-500">4%</span>
              </div>
            </div>
            <p className="text-[11px] text-[#9AAAC0] pt-1">
              Provides real-time bad debt provision benchmarks directly usable by your auditors and CFO.
            </p>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-[#D946EF] px-3 py-1 rounded bg-[#D946EF]/10 border border-[#D946EF]/20">
              04 · FINANCIAL INTELLIGENCE
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#F4F7FB]">
              Aging Intelligence & Financial Exposure
            </h3>
            <p className="text-sm sm:text-base text-[#9AAAC0] leading-relaxed">
              Drill down into customer-level concentrations, historical default curves, and financing drag. Calculate exactly how much working capital interest is being consumed by slow-paying enterprise clients.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#F4F7FB]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D946EF]" />
                <span>Instant export to auditor-compliant CSV spreadsheets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D946EF]" />
                <span>Built-in working capital financing drag and decay curve calculator</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 05 — HOW IT WORKS
          Horizontal progressive timeline on desktop, vertical on mobile
      ========================================================================= */}
      <section id="how-it-works" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8]">
              Implementation Journey
            </span>
            <SectionShareBadge sectionId="how-it-works" title="How It Works" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
            How it works
          </h2>
          <p className="text-base sm:text-lg text-[#9AAAC0]">
            From raw spreadsheet dump to orchestrated cash recovery in five intuitive stages.
          </p>
        </div>

        {/* 5-Step Connected Flow */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            {
              step: '01',
              title: 'Import receivables',
              desc: 'Drag & drop your CSV or export file with automatic column mapping.',
            },
            {
              step: '02',
              title: 'Understand portfolio',
              desc: 'Inspect total exposure, aging brackets, and critical high-value accounts.',
            },
            {
              step: '03',
              title: 'Identify priorities',
              desc: 'Review explainable risk scores and focus your team on high-yield recoveries.',
            },
            {
              step: '04',
              title: 'Organize actions',
              desc: 'Log follow-ups, payment promises, and escalate disputes systematically.',
            },
            {
              step: '05',
              title: 'Track cash collected',
              desc: 'Record incoming funds and watch working capital drag decrease.',
            },
          ].map((item, index) => (
            <div 
              key={item.step}
              className="rounded-xl border border-white/10 bg-[#0B102E]/60 p-5 space-y-3 relative flex flex-col justify-between hover:border-[#38BDF8]/40 transition-all duration-300"
            >
              <div>
                <span className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-br from-[#D946EF] to-[#38BDF8]">
                  {item.step}
                </span>
                <h4 className="font-bold text-[#F4F7FB] text-sm mt-2">{item.title}</h4>
                <p className="text-xs text-[#9AAAC0] mt-2 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-[#38BDF8]">
                Step {index + 1} of 5
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 06 — PRODUCT PREVIEW
          Controlled visual demonstration (Mock only, non-editable, sample data disclaimer)
      ========================================================================= */}
      <section id="product-preview" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#D946EF]">
              Interface Preview
            </span>
            <SectionShareBadge sectionId="product-preview" title="Product Preview" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB]">
            A clean, purpose-built cockpit.
          </h2>
          <p className="text-base sm:text-lg text-[#9AAAC0]">
            Experience the clarity of Revenue Recovery OS before creating your dedicated workspace.
          </p>
        </div>

        {/* Preview Shell Container */}
        <div className="rounded-2xl border border-white/15 bg-[#070B20]/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Top disclaimer bar */}
          <div className="px-6 py-3 bg-[#10143A]/90 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#38BDF8]">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <span className="font-medium">Illustrative preview — sample data, not live financial records.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePreviewTab('matrix')}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activePreviewTab === 'matrix' ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#9AAAC0] hover:text-white'
                }`}
              >
                Aging Overview
              </button>
              <button
                onClick={() => setActivePreviewTab('scoring')}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activePreviewTab === 'scoring' ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#9AAAC0] hover:text-white'
                }`}
              >
                Scoring Engine
              </button>
              <button
                onClick={() => setActivePreviewTab('actions')}
                className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                  activePreviewTab === 'actions' ? 'bg-[#2563EB] text-white font-semibold' : 'text-[#9AAAC0] hover:text-white'
                }`}
              >
                Action Workflow
              </button>
            </div>
          </div>

          {/* Interactive Preview Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {activePreviewTab === 'matrix' && (
              <div className="space-y-6">
                {/* 4 Metric cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-[#0B102E] border border-white/10">
                    <span className="text-xs text-[#9AAAC0]">Total Overdue</span>
                    <div className="text-2xl font-bold text-[#F4F7FB] mt-1">284,500 €</div>
                    <span className="text-[11px] text-amber-400">14 overdue accounts</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B102E] border border-white/10">
                    <span className="text-xs text-[#9AAAC0]">Critical Risk (&gt;60d)</span>
                    <div className="text-2xl font-bold text-rose-400 mt-1">112,000 €</div>
                    <span className="text-[11px] text-rose-300">Requires immediate call</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B102E] border border-white/10">
                    <span className="text-xs text-[#9AAAC0]">Promises Secured</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">54,200 €</div>
                    <span className="text-[11px] text-emerald-300">Expected by end of week</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B102E] border border-white/10">
                    <span className="text-xs text-[#9AAAC0]">Disputed Line-items</span>
                    <div className="text-2xl font-bold text-violet-400 mt-1">18,300 €</div>
                    <span className="text-[11px] text-violet-300">Awaiting credit note</span>
                  </div>
                </div>

                {/* Sample Read-only Prioritization Table */}
                <div className="rounded-xl border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#10143A] text-[#9AAAC0] border-b border-white/10 uppercase tracking-wider font-mono text-[10px]">
                      <tr>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Invoice</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Overdue</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Risk Score</th>
                        <th className="p-3">Recommended Next Step</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold text-[#F4F7FB]">Acme Industrial Ltd</td>
                        <td className="p-3 font-mono text-[#38BDF8]">INV-2024-884</td>
                        <td className="p-3 text-[#9AAAC0]">2026-08-15</td>
                        <td className="p-3 text-rose-400 font-bold">75 days</td>
                        <td className="p-3 font-mono font-bold text-[#F4F7FB]">68,400 €</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold font-mono">92/100 · Critical</span>
                        </td>
                        <td className="p-3 text-[#9AAAC0]">Phone call to VP Finance + demand notice</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold text-[#F4F7FB]">Apex Logistics S.A.</td>
                        <td className="p-3 font-mono text-[#38BDF8]">INV-2024-912</td>
                        <td className="p-3 text-[#9AAAC0]">2026-09-20</td>
                        <td className="p-3 text-amber-400 font-bold">39 days</td>
                        <td className="p-3 font-mono font-bold text-[#F4F7FB]">34,200 €</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold font-mono">68/100 · High</span>
                        </td>
                        <td className="p-3 text-[#9AAAC0]">Follow up on promise date (due Friday)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-semibold text-[#F4F7FB]">Beacon Retail Network</td>
                        <td className="p-3 font-mono text-[#38BDF8]">INV-2024-940</td>
                        <td className="p-3 text-[#9AAAC0]">2026-10-12</td>
                        <td className="p-3 text-[#38BDF8] font-bold">17 days</td>
                        <td className="p-3 font-mono font-bold text-[#F4F7FB]">9,500 €</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-[#2563EB]/15 text-[#38BDF8] font-bold font-mono">34/100 · Medium</span>
                        </td>
                        <td className="p-3 text-[#9AAAC0]">Standard friendly statement reminder</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activePreviewTab === 'scoring' && (
              <div className="p-6 rounded-xl bg-[#0B102E] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-[#F4F7FB]">Deterministic Risk Breakdown</h4>
                    <p className="text-xs text-[#9AAAC0]">Sample breakdown for Acme Industrial Ltd (INV-2024-884)</p>
                  </div>
                  <span className="text-xl font-bold font-mono text-rose-400">Score 92/100</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#9AAAC0]">Age past due (75 days &gt; 60d threshold)</span>
                      <span className="font-mono text-rose-400">+35 pts</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[85%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#9AAAC0]">Portfolio concentration (24.0% of total receivables)</span>
                      <span className="font-mono text-amber-400">+28 pts</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[70%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#9AAAC0]">Customer dispute marker active</span>
                      <span className="font-mono text-rose-400">+25 pts</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-rose-400 h-full w-[65%]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePreviewTab === 'actions' && (
              <div className="p-6 rounded-xl bg-[#0B102E] border border-white/10 space-y-4">
                <h4 className="font-bold text-[#F4F7FB]">Action History & Recovery Audit Trail</h4>
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded bg-[#070B20] border border-white/5 flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[#F4F7FB]">Call logged with Sarah Jenkins (Accounts Payable)</div>
                      <div className="text-[#9AAAC0] text-[11px]">2026-10-24 · Promise recorded for 34,200 € on 2026-11-05</div>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-[#070B20] border border-white/5 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[#F4F7FB]">Partial Wire Payment Reconciled</div>
                      <div className="text-[#9AAAC0] text-[11px]">2026-10-22 · 12,000 € applied against INV-2024-810</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA directly below sample preview */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
              <span className="text-xs text-[#9AAAC0]">
                Ready to configure your organization's real receivables ledger?
              </span>
              <button
                onClick={onStartSignUp}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-lg shadow-[#2563EB]/20 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Create your workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 07 — FINAL CONVERSION & FOOTER
          Large high-impact closing statement and clean editorial footer
      ========================================================================= */}
      <section id="cta" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center border-t border-white/5 space-y-8">
        <div className="flex justify-center">
          <SectionShareBadge sectionId="cta" title="Get Started" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F4F7FB] max-w-2xl mx-auto">
          Bring clarity to your receivables.
        </h2>
        <p className="text-base sm:text-lg text-[#9AAAC0] max-w-xl mx-auto leading-relaxed">
          Build a more structured, transparent and actionable collection process.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartSignUp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] text-white text-sm font-semibold tracking-wide shadow-xl shadow-[#2563EB]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Get started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onGoToSignIn}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#10143A]/80 hover:bg-[#1A204E] text-[#F4F7FB] border border-white/15 text-sm font-medium tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <span>Sign in</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#070B20]/90 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#6B7D98]">
          <div className="flex items-center gap-2.5 text-[#F4F7FB]">
            <div className="w-6 h-6 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-sm">Revenue Recovery OS</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <button onClick={() => scrollToSection('problem')} className="hover:text-white transition-colors cursor-pointer">Product</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">How it works</button>
            <button onClick={() => onNavigateTab('calculator')} className="hover:text-white transition-colors cursor-pointer">Impact Calculator</button>
            <button onClick={() => onNavigateTab('template')} className="hover:text-white transition-colors cursor-pointer">Aging Template</button>
            <span className="text-[#38BDF8]">IFRS 9 / CECL Certified Standards</span>
          </div>

          <div className="text-center md:text-right">
            © {new Date().getFullYear()} Revenue Recovery OS. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
