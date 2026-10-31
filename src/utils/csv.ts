import { ImportMapping, InvoiceRecord } from '../types';
import { parseDateInput, todayISO } from './dates';
import { parseAmount, roundMoney, DEFAULT_CURRENCY } from './money';
import { calculateDaysPastDue, getAgingBucket, calculateRiskScore } from './financial';

/**
 * Moteur d'import CSV — RFC 4180 (guillemets, `""`, CRLF),
 * mapping de colonnes FR/EN, validation explicite, aucun défaut silencieux.
 */

export function parseCsvString(csvText: string): { headers: string[]; rows: string[][] } {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  return { headers, rows: lines.slice(1) };
}

/**
 * Détection automatique de colonnes — vocabulaire francophone prioritaire,
 * puis anglais. Chaque en-tête est normalisé sans accents ni ponctuation.
 */
const FIELD_PATTERNS: Record<keyof ImportMapping, string[]> = {
  invoiceNumber: ['numerodefacture', 'nofacture', 'numfacture', 'facture', 'factureno', 'referencefacture', 'invoice', 'invoicenumber', 'invoiceno', 'billno', 'billingnumber', 'documentnumber', 'number', 'id'],
  customerName: ['client', 'nomclient', 'customer', 'customername', 'company', 'societe', 'debtor', 'compte', 'accountname', 'compteclient'],
  customerEmail: ['email', 'emailclient', 'mail', 'courriel', 'contactemail', 'contact', 'billingemail', 'emailfacturation'],
  issueDate: ['dated emission', 'datedemission', 'emission', 'issuedate', 'invoicedate', 'billdate', 'datecreation', 'creation'],
  dueDate: ['date d echeance', 'dateecheance', 'echeance', 'duedate', 'paymentdue', 'deadline', 'echeancefacture'],
  totalAmount: ['montanttotal', 'totalttc', 'totalht', 'total', 'montant', 'amount', 'gross', 'balance', 'soldeinitial', 'valeurfacture', 'invoicedamount'],
  paidAmount: ['soldepaye', 'montantpaye', 'paye', 'regle', 'regleamount', 'paid', 'paidamount', 'collected', 'received', 'settled', 'acompte'],
  currency: ['devise', 'currency', 'monnaie', 'ccy'],
  notes: ['notes', 'note', 'remarques', 'commentaires', 'comment', 'remarks', 'memo', 'observations'],
  disputeStatus: ['litige', 'dispute', 'disputed', 'statuslitige', 'flag', 'statut', 'status', 'contentieux'],
};

function normalizeHeader(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function autoDetectColumnMapping(headers: string[]): ImportMapping {
  const mapping: ImportMapping = {
    invoiceNumber: '',
    customerName: '',
    customerEmail: '',
    issueDate: '',
    dueDate: '',
    totalAmount: '',
    paidAmount: '',
    currency: '',
    notes: '',
    disputeStatus: '',
  };

  const normalized = headers.map(h => ({ raw: h, norm: normalizeHeader(h) }));
  const taken = new Set<string>();

  const fields = Object.keys(FIELD_PATTERNS) as Array<keyof ImportMapping>;
  // Priorité aux champs critiques puis optionnels.
  const ordered: Array<keyof ImportMapping> = [
    'invoiceNumber', 'customerName', 'totalAmount', 'dueDate', 'paidAmount',
    'issueDate', 'customerEmail', 'currency', 'disputeStatus', 'notes',
  ];

  for (const field of ordered) {
    for (const { raw, norm } of normalized) {
      if (!norm || taken.has(raw)) continue;
      if (FIELD_PATTERNS[field].some(pattern => norm === pattern || norm.includes(pattern))) {
        mapping[field] = raw;
        taken.add(raw);
        break;
      }
    }
  }
  void fields;
  return mapping;
}

/**
 * Prévention de l'injection de formules CSV (CWE-1236).
 */
export function sanitizeCsvCell(cellValue: string | number | undefined | null): string {
  if (cellValue === null || cellValue === undefined) return '';
  const str = String(cellValue);
  const dangerous = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerous.some(p => str.startsWith(p))) {
    return `'${str}`;
  }
  return str;
}

export interface RowIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface BuildPreviewOptions {
  headers: string[];
  rows: string[][];
  mapping: ImportMapping;
  asOfDate?: string;
  defaultCurrency?: string;
}

export interface BuildPreviewResult {
  invoices: InvoiceRecord[];
  issues: RowIssue[];
  /** Nombre de lignes refusées (erreurs bloquantes). */
  rejectedRows: number;
}

function cellAt(row: string[], headers: string[], headerName: string): string {
  if (!headerName) return '';
  const idx = headers.indexOf(headerName);
  if (idx === -1) return '';
  return (row[idx] ?? '').trim();
}

const DISPUTE_TRUE = ['true', 'oui', 'o', 'yes', 'y', '1', 'litige', 'disputed', 'dispute'];

/**
 * Construit les enregistrements normalisés à partir d'un CSV.
 * Toute illisibilité produit une erreur explicite — jamais un défaut silencieux.
 */
export function buildInvoicesFromCsv(options: BuildPreviewOptions): BuildPreviewResult {
  const { headers, rows, mapping } = options;
  const asOfDate = options.asOfDate ?? todayISO();
  const defaultCurrency = (options.defaultCurrency ?? DEFAULT_CURRENCY).toUpperCase();

  const issues: RowIssue[] = [];
  const invoices: InvoiceRecord[] = [];
  const seen = new Map<string, number>();
  let rejectedRows = 0;
  let portfolioOutstanding = 0;

  // Passe 1 : encours total pour la concentration.
  const parsedAmounts = rows.map(row => {
    const total = parseAmount(cellAt(row, headers, mapping.totalAmount));
    const paid = mapping.paidAmount ? parseAmount(cellAt(row, headers, mapping.paidAmount)) : ({ ok: true as const, value: 0, format: 'plain' as const, ambiguous: false });
    if (!total.ok || !paid.ok) return null;
    return { total: total.value, paid: paid.value };
  });
  for (const p of parsedAmounts) {
    if (p) portfolioOutstanding += Math.max(0, roundMoney(p.total - p.paid));
  }

  rows.forEach((row, rIdx) => {
    const rowNumber = rIdx + 1;
    const rowIssues: RowIssue[] = [];
    let rejected = false;

    const rawInvoiceNumber = cellAt(row, headers, mapping.invoiceNumber);
    const rawCustomer = cellAt(row, headers, mapping.customerName);
    const rawTotal = cellAt(row, headers, mapping.totalAmount);
    const rawPaid = mapping.paidAmount ? cellAt(row, headers, mapping.paidAmount) : '';
    const rawDue = cellAt(row, headers, mapping.dueDate);
    const rawIssue = cellAt(row, headers, mapping.issueDate);
    const rawCurrency = cellAt(row, headers, mapping.currency);
    const rawDispute = mapping.disputeStatus ? cellAt(row, headers, mapping.disputeStatus) : '';

    if (!rawInvoiceNumber) {
      rowIssues.push({ row: rowNumber, field: 'invoiceNumber', message: `Ligne ${rowNumber} : numéro de facture manquant.`, severity: 'error' });
      rejected = true;
    } else {
      const count = (seen.get(rawInvoiceNumber) || 0) + 1;
      seen.set(rawInvoiceNumber, count);
      if (count > 1) {
        rowIssues.push({ row: rowNumber, field: 'invoiceNumber', message: `Ligne ${rowNumber} : numéro de facture dupliqué « ${rawInvoiceNumber} ».`, severity: 'error' });
        rejected = true;
      }
    }

    if (!rawCustomer) {
      rowIssues.push({ row: rowNumber, field: 'customerName', message: `Ligne ${rowNumber} : nom du client manquant.`, severity: 'error' });
      rejected = true;
    }

    const totalParsed = parseAmount(rawTotal);
    let totalValue = 0;
    if (!totalParsed.ok) {
      rowIssues.push({ row: rowNumber, field: 'totalAmount', message: `Ligne ${rowNumber} : ${totalParsed.reason}`, severity: 'error' });
      rejected = true;
    } else {
      totalValue = totalParsed.value;
      if (totalParsed.ambiguous) {
        rowIssues.push({ row: rowNumber, field: 'totalAmount', message: `Ligne ${rowNumber} : montant « ${rawTotal} » interprété en séparateur de milliers (${totalValue}).`, severity: 'warning' });
      }
    }

    let paidValue = 0;
    if (rawPaid) {
      const paidResult = parseAmount(rawPaid);
      if (!paidResult.ok) {
        rowIssues.push({ row: rowNumber, field: 'paidAmount', message: `Ligne ${rowNumber} : ${paidResult.reason}`, severity: 'error' });
        rejected = true;
      } else {
        paidValue = paidResult.value;
      }
    }

    const dueParsed = parseDateInput(rawDue);
    let dueIso = asOfDate;
    if (!dueParsed.ok) {
      rowIssues.push({ row: rowNumber, field: 'dueDate', message: `Ligne ${rowNumber} : ${dueParsed.reason}`, severity: 'error' });
      rejected = true;
    } else {
      dueIso = dueParsed.iso;
    }

    let issueParsed: { ok: true; iso: string } | null = null;
    if (rawIssue) {
      const p = parseDateInput(rawIssue);
      if (p.ok) issueParsed = p;
      else {
        rowIssues.push({ row: rowNumber, field: 'issueDate', message: `Ligne ${rowNumber} : ${p.reason}`, severity: 'warning' });
      }
    }

    if (totalValue > 0 && paidValue > totalValue) {
      rowIssues.push({ row: rowNumber, field: 'paidAmount', message: `Ligne ${rowNumber} : le montant réglé (${paidValue}) dépasse le total (${totalValue}).`, severity: 'error' });
      rejected = true;
    }

    issues.push(...rowIssues);
    if (rejected) {
      rejectedRows++;
      return;
    }

    const totalAmount = roundMoney(totalValue);
    const paidAmount = roundMoney(paidValue);
    const outstanding = roundMoney(Math.max(0, totalAmount - paidAmount));
    const currency = (rawCurrency || defaultCurrency).toUpperCase().trim();
    const isDisputed = DISPUTE_TRUE.includes(rawDispute.toLowerCase());
    const daysPastDueValue = calculateDaysPastDue(dueIso, asOfDate);
    const agingBucket = getAgingBucket(daysPastDueValue);
    const status: InvoiceRecord['status'] =
      paidAmount >= totalAmount ? 'paid' : isDisputed ? 'disputed' : daysPastDueValue > 0 ? 'overdue' : 'current';

    const { score, tier, factors } = calculateRiskScore({
      daysPastDue: daysPastDueValue,
      outstandingAmount: outstanding,
      totalPortfolioAmount: portfolioOutstanding,
      isDisputed,
      asOfDateStr: asOfDate,
    });

    invoices.push({
      id: `imp-${asOfDate}-${rIdx}-${rawInvoiceNumber}`,
      invoiceNumber: rawInvoiceNumber,
      customerName: rawCustomer,
      customerEmail: cellAt(row, headers, mapping.customerEmail),
      issueDate: issueParsed ? issueParsed.iso : dueIso,
      dueDate: dueIso,
      totalAmount,
      paidAmount,
      outstandingAmount: outstanding,
      currency,
      status,
      daysPastDue: daysPastDueValue,
      agingBucket,
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
      disputeReason: isDisputed ? 'Litige signalé à l\'import' : undefined,
      notes: mapping.notes ? cellAt(row, headers, mapping.notes) : '',
    });
  });

  return { invoices, issues, rejectedRows };
}

/** Export CSV auditable (cellules sanitizées). */
export function exportInvoicesToCsv(invoices: InvoiceRecord[]): string {
  const headers = [
    'Numéro de facture', 'Client', 'Email', "Date d'émission", "Date d'échéance",
    'Jours de retard', 'Tranche d\'aging', 'Montant total', 'Montant réglé',
    'Encours', 'Devise', 'Statut', 'Score de risque', 'Niveau de risque',
    'Motif de litige', 'Promesse de règlement', 'Premier facteur de risque',
  ];

  const rows = invoices.map(inv => [
    sanitizeCsvCell(inv.invoiceNumber),
    sanitizeCsvCell(inv.customerName),
    sanitizeCsvCell(inv.customerEmail),
    inv.issueDate,
    inv.dueDate,
    String(inv.daysPastDue),
    sanitizeCsvCell(inv.agingBucket),
    inv.totalAmount.toFixed(2),
    (inv.paidAmount || 0).toFixed(2),
    inv.outstandingAmount.toFixed(2),
    sanitizeCsvCell(inv.currency),
    sanitizeCsvCell(inv.status),
    String(inv.riskScore),
    sanitizeCsvCell(inv.riskTier),
    sanitizeCsvCell(inv.disputeReason || ''),
    sanitizeCsvCell(inv.promisedPaymentDate || ''),
    sanitizeCsvCell(inv.riskFactors?.[0] || ''),
  ]);

  const csvRows = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))];
  return csvRows.join('\r\n');
}
