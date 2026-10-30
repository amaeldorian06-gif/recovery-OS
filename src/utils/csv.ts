import { ImportMapping, InvoiceRecord } from '../types';

/**
 * Robust CSV parser that handles commas inside quotes, escaped quotes (""),
 * and varied newline endings (\r\n or \n).
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
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of CRLF
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some(c => c.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = lines[0].map(h => h.replace(/^["']|["']$/g, '').trim());
  const rows = lines.slice(1);

  return { headers, rows };
}

/**
 * Intelligent Column Detection
 */
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

  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach(h => {
    const norm = clean(h);

    if (!mapping.invoiceNumber && (norm.includes('inv') || norm.includes('invoicenum') || norm.includes('billno') || norm === 'id' || norm === 'number')) {
      mapping.invoiceNumber = h;
    } else if (!mapping.customerName && (norm.includes('client') || norm.includes('customer') || norm.includes('company') || norm.includes('debtor') || norm.includes('accountname'))) {
      mapping.customerName = h;
    } else if (!mapping.customerEmail && (norm.includes('email') || norm.includes('contact') || norm.includes('billingemail'))) {
      mapping.customerEmail = h;
    } else if (!mapping.dueDate && (norm.includes('duedate') || norm.includes('due') || norm.includes('deadline') || norm.includes('paymentdue'))) {
      mapping.dueDate = h;
    } else if (!mapping.issueDate && (norm.includes('issue') || norm.includes('date') || norm.includes('billdate') || norm.includes('invoicedate'))) {
      mapping.issueDate = h;
    } else if (!mapping.totalAmount && (norm.includes('total') || norm.includes('amount') || norm.includes('gross') || norm.includes('balance') || norm.includes('invoicedamount'))) {
      mapping.totalAmount = h;
    } else if (!mapping.paidAmount && (norm.includes('paid') || norm.includes('collected') || norm.includes('received') || norm.includes('settled'))) {
      mapping.paidAmount = h;
    } else if (!mapping.currency && (norm.includes('curr') || norm.includes('currency') || norm === 'ccy')) {
      mapping.currency = h;
    } else if (!mapping.disputeStatus && (norm.includes('dispute') || norm.includes('disputed') || norm.includes('flag') || norm.includes('status'))) {
      mapping.disputeStatus = h;
    } else if (!mapping.notes && (norm.includes('notes') || norm.includes('memo') || norm.includes('remarks') || norm.includes('comment'))) {
      mapping.notes = h;
    }
  });

  return mapping;
}

/**
 * CSV Formula Injection Prevention (CWE-1236)
 * Prepend single quote if field starts with =, +, -, @, \t, \r
 */
export function sanitizeCsvCell(cellValue: string | number | undefined | null): string {
  if (cellValue === null || cellValue === undefined) return '';
  const str = String(cellValue);
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some(prefix => str.startsWith(prefix))) {
    return `'${str}`;
  }
  return str;
}

/**
 * Serializes invoice records to sanitized CSV for audit export
 */
export function exportInvoicesToCsv(invoices: InvoiceRecord[]): string {
  const headers = [
    'Invoice #',
    'Customer Name',
    'Customer Email',
    'Issue Date',
    'Due Date',
    'Days Past Due',
    'Aging Bucket',
    'Total Amount',
    'Paid Amount',
    'Outstanding Balance',
    'Currency',
    'Status',
    'Risk Score',
    'Risk Tier',
    'Dispute Reason',
    'Promised Payment Date',
    'Top Risk Factor',
  ];

  const rows = invoices.map(inv => [
    sanitizeCsvCell(inv.invoiceNumber),
    sanitizeCsvCell(inv.customerName),
    sanitizeCsvCell(inv.customerEmail),
    sanitizeCsvCell(inv.issueDate),
    sanitizeCsvCell(inv.dueDate),
    inv.daysPastDue.toString(),
    sanitizeCsvCell(inv.agingBucket),
    inv.totalAmount.toFixed(2),
    inv.paidAmount.toFixed(2),
    inv.outstandingAmount.toFixed(2),
    sanitizeCsvCell(inv.currency),
    sanitizeCsvCell(inv.status),
    inv.riskScore.toString(),
    sanitizeCsvCell(inv.riskTier),
    sanitizeCsvCell(inv.disputeReason || ''),
    sanitizeCsvCell(inv.promisedPaymentDate || ''),
    sanitizeCsvCell(inv.riskFactors[0] || ''),
  ]);

  const csvRows = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))];
  return csvRows.join('\r\n');
}
