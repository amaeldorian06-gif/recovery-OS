/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SEOMetadata {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  hash?: string;
  tab?: string;
  canonicalUrl?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  schemaSnippet?: Record<string, unknown>;
}

export const BASE_SITE_URL = 'https://ais-dev-xnl2yncmot7y7ur6qqt2yz-429114080415.europe-west2.run.app';
export const DEFAULT_OG_IMAGE = `${BASE_SITE_URL}/og-image.png`;

export const PUBLIC_SECTIONS_SEO: Record<string, SEOMetadata> = {
  // Section 01: Hero / Main Landing
  hero: {
    title: 'Revenue Recovery OS — Smarter Receivables Strategy',
    description: 'Turn scattered invoice data into clear priorities, structured collection actions and financial visibility with Revenue Recovery OS.',
    ogTitle: 'Revenue Recovery OS — Smarter Receivables Strategy',
    ogDescription: 'Turn scattered invoice data into clear priorities, structured collection actions and financial visibility.',
    hash: '#hero',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['accounts receivable', 'invoice recovery', 'B2B debt collection', 'cash flow management', 'risk scoring'],
    schemaSnippet: {
      '@type': 'SoftwareApplication',
      name: 'Revenue Recovery OS',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Turn scattered invoice data into clear priorities, structured collection actions and financial visibility.',
      offers: {
        '@type': 'Offer',
        price: '49.00',
        priceCurrency: 'USD',
      },
      featureList: [
        'RFC 4180 CSV Ingestion Engine',
        'Deterministic Explainable Risk Scoring',
        'ASC 310 Aging Matrix',
        'Structured Collection Action Center',
        'Multi-tenant Security Isolation',
      ],
    },
  },

  // Section 02: The Problem / The Challenge
  problem: {
    title: 'Overdue Receivables Challenge — Revenue Recovery OS',
    description: 'Stop bad debt drag and fragmented spreadsheet tracking. Identify exposure and recognize overdue invoice risk across your portfolio.',
    ogTitle: 'The Problem: Fragmented Receivables & Bad Debt Drag',
    ogDescription: 'Managing overdue invoices in disconnected spreadsheets causes customer friction and liquidity loss. See the exposure challenge.',
    hash: '#problem',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['overdue invoices', 'bad debt', 'receivables challenge', 'cash flow drag', 'spreadsheet fatigue'],
    schemaSnippet: {
      '@type': 'Article',
      headline: 'The Problem with Fragmented Receivables Spreadsheets',
      description: 'Why sorting invoices chronologically in spreadsheets leads to critical capital decay and customer friction.',
      author: {
        '@type': 'Organization',
        name: 'Revenue Recovery OS',
      },
    },
  },

  // Section 03: The Revelation / The Breakthrough
  revelation: {
    title: 'Deterministic Risk Scoring — Revenue Recovery OS',
    description: 'Replace guesswork with explainable mathematical scoring and structured workflows to prioritize overdue accounts and protect cash flow.',
    ogTitle: 'Deterministic Scoring & Mathematical Risk Prioritization',
    ogDescription: 'Replace guesswork with explainable scoring formulas that incorporate aging decay, concentration, and payment promises.',
    hash: '#revelation',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['deterministic scoring', 'invoice risk calculation', 'explainable AI', 'credit scoring', 'working capital'],
    schemaSnippet: {
      '@type': 'WebApplication',
      name: 'Revenue Recovery OS - Risk Scoring Algorithm',
      applicationCategory: 'FinanceApplication',
      description: 'Deterministic multi-factor risk engine ranking invoices from 0 to 100 with full audit transparency.',
    },
  },

  // Section 04: Features / Core Intelligence
  features: {
    title: 'Receivables OS Features — Ingestion, Aging & Actions',
    description: 'Explore RFC 4180 CSV ingestion, ASC 310 aging intelligence, deterministic risk scoring, and structured collection action playbooks.',
    ogTitle: 'Core Intelligence: Ingestion, Risk Scoring & Aging Matrices',
    ogDescription: 'Four core modules engineered for B2B finance leaders who demand certainty: CSV import, scoring, aging, and playbooks.',
    hash: '#features',
    tab: 'features',
    image: DEFAULT_OG_IMAGE,
    keywords: ['AR aging report', 'RFC 4180 CSV import', 'collection action center', 'working capital analytics', 'ASC 310'],
    schemaSnippet: {
      '@type': 'Product',
      name: 'Revenue Recovery OS Modules',
      description: 'Comprehensive suite of receivables prioritization, CSV parsing, and automated dunning workflow tools.',
    },
  },

  // Section 05: How It Works / Implementation Journey
  'how-it-works': {
    title: 'How It Works: 5 Steps to Cash Recovery — Revenue Recovery OS',
    description: 'From raw spreadsheet import to orchestrated cash recovery. Follow our five intuitive stages to prioritize invoices and reduce overdue debt.',
    ogTitle: 'How It Works: From Raw Data to Orchestrated Cash Recovery',
    ogDescription: 'Follow the 5-step journey: Import, Understand, Prioritize, Organize, and Track Cash Collected in Revenue Recovery OS.',
    hash: '#how-it-works',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['AR workflow', 'cash recovery roadmap', 'collection process', 'invoice tracking steps'],
    schemaSnippet: {
      '@type': 'HowTo',
      name: 'How to Prioritize Overdue Receivables in 5 Steps',
      description: 'A 5-step framework to import, score, and collect overdue invoices systematically.',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Import receivables', text: 'Drag and drop CSV or export file with auto column mapping.' },
        { '@type': 'HowToStep', position: 2, name: 'Understand portfolio', text: 'Inspect total exposure across standard aging brackets.' },
        { '@type': 'HowToStep', position: 3, name: 'Identify priorities', text: 'Review deterministic scores and target high-yield recoveries.' },
        { '@type': 'HowToStep', position: 4, name: 'Organize actions', text: 'Log follow-ups, payment promises, and customer dispute notes.' },
        { '@type': 'HowToStep', position: 5, name: 'Track cash collected', text: 'Reconcile payments and measure working capital improvements.' },
      ],
    },
  },

  // Section 06: Product Preview / Cockpit
  'product-preview': {
    title: 'Cockpit Preview — Revenue Recovery OS',
    description: 'Experience our purpose-built receivables cockpit. Inspect interactive aging matrices, explainable risk scoring, and collection workflows.',
    ogTitle: 'Interactive Cockpit Preview — Revenue Recovery OS',
    ogDescription: 'Explore the purpose-built financial cockpit with sample aging distributions, risk score breakdowns, and audit trails.',
    hash: '#product-preview',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['AR software demo', 'receivables cockpit preview', 'financial ledger UI', 'overdue invoice dashboard'],
    schemaSnippet: {
      '@type': 'SoftwareApplication',
      name: 'Revenue Recovery OS Cockpit',
      operatingSystem: 'Web Browser',
      description: 'Interactive demo of the Revenue Recovery OS accounts receivable cockpit.',
    },
  },

  // Section 07: Final Conversion / Call to Action
  cta: {
    title: 'Start Recovering Revenue Today — Revenue Recovery OS',
    description: 'Bring clarity to your receivables portfolio. Set up your company workspace and start prioritizing overdue accounts in two minutes.',
    ogTitle: 'Bring Clarity to Your Receivables — Revenue Recovery OS',
    ogDescription: 'Build a structured, transparent, and actionable collection process. Start your 14-day trial in minutes.',
    hash: '#cta',
    tab: 'landing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['receivables software', 'start AR recovery', 'free trial', 'invoice collection'],
  },

  // Pricing View
  pricing: {
    title: 'Pricing & Plans — Revenue Recovery OS',
    description: 'Predictable B2B pricing plans with deterministic explainable risk scoring, audit-standard aging calculations, and collection tools.',
    ogTitle: 'Transparent B2B Pricing Plans — Revenue Recovery OS',
    ogDescription: 'Choose from Starter, Professional, or Enterprise tiers designed for fast-growing B2B finance and accounting teams.',
    tab: 'pricing',
    image: DEFAULT_OG_IMAGE,
    keywords: ['receivables pricing', 'B2B SaaS pricing', 'AR software cost', 'credit management subscription'],
    schemaSnippet: {
      '@type': 'Product',
      name: 'Revenue Recovery OS Subscription',
      description: 'Cloud subscription for accounts receivable prioritization and recovery.',
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter Tier',
          price: '49.00',
          priceCurrency: 'USD',
          priceValidUntil: '2028-12-31',
        },
        {
          '@type': 'Offer',
          name: 'Professional Tier',
          price: '149.00',
          priceCurrency: 'USD',
          priceValidUntil: '2028-12-31',
        },
      ],
    },
  },

  // Sign In View
  signin: {
    title: 'Sign In to Workspace — Revenue Recovery OS',
    description: 'Access your receivables portfolio, collection action center, and prioritization queue in your secure company workspace.',
    ogTitle: 'Sign In to Your Receivables Workspace',
    ogDescription: 'Log in to your tenant-isolated Revenue Recovery OS environment to manage aging invoices and team dunning actions.',
    tab: 'signin',
    image: DEFAULT_OG_IMAGE,
    keywords: ['receivables login', 'AR workspace sign in', 'secure finance login'],
  },

  // Sign Up View
  signup: {
    title: 'Create Your Workspace — Revenue Recovery OS',
    description: 'Configure your company accounts receivable recovery workspace in two minutes. Start prioritizing overdue invoices today.',
    ogTitle: 'Create Your Company Receivables Workspace',
    ogDescription: 'Join finance leaders transforming accounts receivable management. Start your free trial with immediate CSV import.',
    tab: 'signup',
    image: DEFAULT_OG_IMAGE,
    keywords: ['create AR workspace', 'sign up receivables', 'free AR trial', 'invoice recovery registration'],
  },
};

/**
 * Ensures or creates a meta tag by attribute selector and updates its content
 */
function setMetaTag(selector: string, attributeName: string, attributeValue: string, content: string) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Ensures or creates a link tag (e.g. canonical)
 */
function setLinkTag(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Injects or updates Schema.org JSON-LD script in head
 */
function setStructuredData(data: Record<string, unknown>) {
  let script = document.getElementById('dynamic-seo-ldjson') as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'dynamic-seo-ldjson';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    ...data,
  });
}

/**
 * Dynamically updates all page metadata, Open Graph tags, Twitter card tags,
 * canonical link, and JSON-LD schema for a specific section or route.
 */
export function updateSEOTags(sectionKey: string, customData?: Partial<SEOMetadata>) {
  const baseData = PUBLIC_SECTIONS_SEO[sectionKey] || PUBLIC_SECTIONS_SEO.hero;
  const data: SEOMetadata = { ...baseData, ...customData };

  // 1. Page Title
  document.title = data.title;

  // 2. Meta description & keywords
  setMetaTag('meta[name="description"]', 'name', 'description', data.description);
  if (data.keywords && data.keywords.length > 0) {
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', data.keywords.join(', '));
  }

  // 3. Canonical URL
  const currentUrl = typeof window !== 'undefined' ? window.location.href : BASE_SITE_URL;
  const canonicalTarget = data.canonicalUrl || (data.hash ? `${BASE_SITE_URL}/${data.hash}` : currentUrl);
  setLinkTag('canonical', canonicalTarget);

  // 4. Open Graph Tags
  const ogTitle = data.ogTitle || data.title;
  const ogDescription = data.ogDescription || data.description;
  const ogImage = data.image || DEFAULT_OG_IMAGE;
  const ogType = data.type || 'website';

  setMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', ogDescription);
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalTarget);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
  setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Revenue Recovery OS');
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'en_US');

  // 5. Twitter Card Tags
  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', ogDescription);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

  // 6. Schema.org JSON-LD
  if (data.schemaSnippet) {
    setStructuredData(data.schemaSnippet);
  }
}
