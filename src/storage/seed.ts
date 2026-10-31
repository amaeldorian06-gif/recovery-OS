import { InvoiceRecord } from '../types';
import { addDaysISO, todayISO } from '../utils/dates';
import { calculateDaysPastDue, getAgingBucket, calculateRiskScore } from '../utils/financial';

/**
 * Jeu de démonstration — 100 % éphémère.
 *
 * Règle produit : la démonstration vit dans une instance mémoire distincte
 * et n'est JAMAIS persistée. Elle ne peut donc pas altérer les données
 * réelles de l'utilisateur, par construction.
 *
 * Les échéances sont calculées depuis la date du jour : le retard affiché
 * est toujours réaliste, jamais figé sur une date d'origine du projet.
 */

interface RawDemoInvoice {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  dueOffsetDays: number; // négatif = échue depuis N jours
  issueOffsetDays: number;
  totalAmount: number;
  paidAmount: number;
  status: 'current' | 'overdue' | 'disputed';
  promisedDateOffsetDays?: number;
  disputeReason?: string;
  notes?: string;
}

const DEMO_ROWS: RawDemoInvoice[] = [
  {
    invoiceNumber: 'FA-2026-0142',
    customerName: 'Atelier Provence Textile',
    customerEmail: 'compta@atelierprovence.fr',
    dueOffsetDays: -106,
    issueOffsetDays: -136,
    totalAmount: 34500,
    paidAmount: 0,
    status: 'overdue',
    promisedDateOffsetDays: -30,
    notes: 'Promesse de virement fin du mois non tenue. Appel du responsable comptable requis.',
  },
  {
    invoiceNumber: 'FA-2026-0158',
    customerName: 'Lyon Digital Agency',
    customerEmail: 'ap@lyondigital.fr',
    dueOffsetDays: -47,
    issueOffsetDays: -77,
    totalAmount: 18200,
    paidAmount: 3000,
    status: 'overdue',
    notes: 'Acompte de 3 000 € versé. Solde de 15 200 € en attente de validation RH.',
  },
  {
    invoiceNumber: 'FA-2026-0163',
    customerName: 'Cabinet Morel & Associés',
    customerEmail: 'facturation@morel-associes.fr',
    dueOffsetDays: -34,
    issueOffsetDays: -64,
    totalAmount: 22400,
    paidAmount: 0,
    status: 'disputed',
    disputeReason: 'Écart de bon de commande : livrable ajusté à valider avant déblocage.',
    notes: 'Réunion de réconciliation prévue avec les achats.',
  },
  {
    invoiceNumber: 'FA-2026-0171',
    customerName: 'Nantes Logistique SA',
    customerEmail: 'reglements@nanteslogistique.fr',
    dueOffsetDays: -71,
    issueOffsetDays: -101,
    totalAmount: 12500,
    paidAmount: 0,
    status: 'overdue',
    notes: 'Aucune réponse aux relances automatiques. Escalade direction générale.',
  },
  {
    invoiceNumber: 'FA-2026-0184',
    customerName: 'Bordeaux Vignobles',
    customerEmail: 'compta@bordeauxvignobles.fr',
    dueOffsetDays: -18,
    issueOffsetDays: -48,
    totalAmount: 14800,
    paidAmount: 0,
    status: 'overdue',
    notes: 'Client sur cycle de règlement bimensuel.',
  },
  {
    invoiceNumber: 'FA-2026-0190',
    customerName: 'Grenoble Mécanique',
    customerEmail: 'achats@grenoble-meca.fr',
    dueOffsetDays: -6,
    issueOffsetDays: -36,
    totalAmount: 9500,
    paidAmount: 0,
    status: 'overdue',
    notes: 'Relance courtoise déjà envoyée.',
  },
  {
    invoiceNumber: 'FA-2026-0201',
    customerName: 'Strasbourg Conseil',
    customerEmail: 'administration@strasbourg-conseil.eu',
    dueOffsetDays: 16,
    issueOffsetDays: -14,
    totalAmount: 28000,
    paidAmount: 0,
    status: 'current',
    notes: 'Facturation de mission, paiement à 30 jours.',
  },
  {
    invoiceNumber: 'FA-2026-0205',
    customerName: 'Lille Studio Créatif',
    customerEmail: 'hello@lillestudio.fr',
    dueOffsetDays: 29,
    issueOffsetDays: -1,
    totalAmount: 8600,
    paidAmount: 0,
    status: 'current',
    notes: 'Sprint design récemment facturé.',
  },
];

export function buildDemoInvoices(now: Date = new Date()): InvoiceRecord[] {
  const today = todayISO(now);
  const totalPortfolio = DEMO_ROWS.reduce((acc, r) => acc + Math.max(0, r.totalAmount - r.paidAmount), 0);

  return DEMO_ROWS.map((raw, index) => {
    const dueDate = addDaysISO(today, raw.dueOffsetDays);
    const issueDate = addDaysISO(today, raw.issueOffsetDays);
    const promisedDate = raw.promisedDateOffsetDays !== undefined ? addDaysISO(today, raw.promisedDateOffsetDays) : undefined;
    const outstanding = Math.max(0, raw.totalAmount - raw.paidAmount);
    const dpd = calculateDaysPastDue(dueDate, today);
    const isBrokenPromise = !!promisedDate && promisedDate < today;

    const { score, tier, factors } = calculateRiskScore({
      daysPastDue: dpd,
      outstandingAmount: outstanding,
      totalPortfolioAmount: totalPortfolio,
      isDisputed: raw.status === 'disputed',
      hasBrokenPromise: isBrokenPromise,
      promisedDate,
      asOfDateStr: today,
    });

    return {
      id: `demo-${index + 1}`,
      invoiceNumber: raw.invoiceNumber,
      customerName: raw.customerName,
      customerEmail: raw.customerEmail,
      issueDate,
      dueDate,
      totalAmount: raw.totalAmount,
      paidAmount: raw.paidAmount,
      outstandingAmount: outstanding,
      currency: 'EUR',
      status: raw.status,
      daysPastDue: dpd,
      agingBucket: getAgingBucket(dpd),
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
      disputeReason: raw.disputeReason,
      promisedPaymentDate: promisedDate,
      notes: raw.notes,
    } satisfies InvoiceRecord;
  });
}

/** Modèle CSV francophone prêt à l'emploi (en-têtes FR, dates JJ/MM/AAAA, montants EU). */
export function buildDemoCsvTemplate(): string {
  const today = todayISO();
  const due1 = addDaysISO(today, -45);
  const due2 = addDaysISO(today, -12);
  const due3 = addDaysISO(today, 15);
  const issue1 = addDaysISO(today, -75);
  const issue2 = addDaysISO(today, -42);
  const issue3 = addDaysISO(today, -15);
  const fr = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const rows = [
    'Numéro de facture;Client;Email;Date d\'émission;Date d\'échéance;Montant total;Montant réglé;Devise;Notes',
    `FA-2026-1001;Dupont Menuiserie;compta@dupont-menuiserie.fr;${fr(issue1)};${fr(due1)};12450,00;0,00;EUR;Impayé ancien`,
    `FA-2026-1002;Marseille Froid Industrie;achats@marseille-froid.fr;${fr(issue2)};${fr(due2)};"8.750,50";"2.500,00";EUR;Acompte versé`,
    `FA-2026-1003;Toulouse Consulting;factures@toulouse-consulting.fr;${fr(issue3)};${fr(due3)};4200,00;0,00;EUR;À échoir`,
  ];
  return rows.join('\r\n');
}
