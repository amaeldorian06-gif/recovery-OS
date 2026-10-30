import { InvoiceRecord } from '../types';
import { calculateDaysPastDue, getAgingBucket, calculateRiskScore } from '../utils/financial';

const referenceDate = '2026-10-29';

interface RawSampleInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: 'current' | 'overdue' | 'disputed' | 'paid';
  disputeReason?: string;
  promisedPaymentDate?: string;
  notes?: string;
}

const rawSampleData: RawSampleInvoice[] = [
  {
    id: 'sample-inv-1',
    invoiceNumber: 'INV-2026-881',
    customerName: 'Apex Logistics Global',
    customerEmail: 'finance@apexlogistics.io',
    issueDate: '2026-06-15',
    dueDate: '2026-07-15',
    totalAmount: 34500,
    paidAmount: 0,
    currency: 'USD',
    status: 'overdue',
    promisedPaymentDate: '2026-09-30',
    notes: 'Controller promised wire by end of September; wire not received. Follow-up phone call required.',
  },
  {
    id: 'sample-inv-2',
    invoiceNumber: 'INV-2026-904',
    customerName: 'Nexa Growth Partners',
    customerEmail: 'ap@nexagrowth.com',
    issueDate: '2026-07-30',
    dueDate: '2026-08-30',
    totalAmount: 18200,
    paidAmount: 3000,
    currency: 'USD',
    status: 'overdue',
    notes: 'Paid $3,000 initial retainer installment. Balance outstanding $15,200 pending VP approval.',
  },
  {
    id: 'sample-inv-3',
    invoiceNumber: 'INV-2026-921',
    customerName: 'BlueWave Digital Inc',
    customerEmail: 'billing@bluewavedigital.net',
    issueDate: '2026-08-12',
    dueDate: '2026-09-12',
    totalAmount: 22400,
    paidAmount: 0,
    currency: 'USD',
    status: 'disputed',
    disputeReason: 'PO line item mismatch: Client requested adjusted deliverables sign-off before release.',
    notes: 'Dispute opened 2026-09-18. Account manager scheduled clarification meeting with procurement.',
  },
  {
    id: 'sample-inv-4',
    invoiceNumber: 'INV-2026-840',
    customerName: 'Crestline Industrial',
    customerEmail: 'accounts@crestline-ind.com',
    issueDate: '2026-07-01',
    dueDate: '2026-08-01',
    totalAmount: 12500,
    paidAmount: 0,
    currency: 'USD',
    status: 'overdue',
    notes: 'No response to initial automated email reminders. Needs direct executive escalation.',
  },
  {
    id: 'sample-inv-5',
    invoiceNumber: 'INV-2026-945',
    customerName: 'Vanguard Advisory Group',
    customerEmail: 'treasury@vanguard-advisory.org',
    issueDate: '2026-09-02',
    dueDate: '2026-10-02',
    totalAmount: 14800,
    paidAmount: 0,
    currency: 'USD',
    status: 'overdue',
    notes: 'Net-30 consulting invoice. Client indicated scheduled bi-weekly AP run.',
  },
  {
    id: 'sample-inv-6',
    invoiceNumber: 'INV-2026-960',
    customerName: 'Summit Peak Labs',
    customerEmail: 'invoices@summitpeaklabs.com',
    issueDate: '2026-09-18',
    dueDate: '2026-10-18',
    totalAmount: 9500,
    paidAmount: 0,
    currency: 'USD',
    status: 'overdue',
    notes: 'Recently past due 11 days. Standard courteous reminder sent.',
  },
  {
    id: 'sample-inv-7',
    invoiceNumber: 'INV-2026-982',
    customerName: 'Horizon Media Works',
    customerEmail: 'payables@horizonmediaworks.com',
    issueDate: '2026-10-15',
    dueDate: '2026-11-15',
    totalAmount: 28000,
    paidAmount: 0,
    currency: 'USD',
    status: 'current',
    notes: 'Current contract billing; payment within agreed net-30 terms.',
  },
  {
    id: 'sample-inv-8',
    invoiceNumber: 'INV-2026-990',
    customerName: 'Sterling Creative Studio',
    customerEmail: 'ops@sterlingcreative.design',
    issueDate: '2026-10-25',
    dueDate: '2026-11-28',
    totalAmount: 8600,
    paidAmount: 0,
    currency: 'USD',
    status: 'current',
    notes: 'Freshly issued design sprint balance.',
  },
];

export function getCuratedSampleInvoices(): InvoiceRecord[] {
  const totalPortfolioAmount = rawSampleData.reduce(
    (acc, curr) => acc + Math.max(0, curr.totalAmount - curr.paidAmount),
    0
  );

  return rawSampleData.map(raw => {
    const daysPastDue = calculateDaysPastDue(raw.dueDate, referenceDate);
    const agingBucket = getAgingBucket(daysPastDue);
    const outstandingAmount = Math.max(0, raw.totalAmount - raw.paidAmount);

    const { score, tier, factors } = calculateRiskScore({
      daysPastDue,
      outstandingAmount,
      totalPortfolioAmount,
      isDisputed: raw.status === 'disputed',
      promisedDate: raw.promisedPaymentDate,
      asOfDateStr: referenceDate,
    });

    return {
      id: raw.id,
      invoiceNumber: raw.invoiceNumber,
      customerName: raw.customerName,
      customerEmail: raw.customerEmail,
      issueDate: raw.issueDate,
      dueDate: raw.dueDate,
      totalAmount: raw.totalAmount,
      paidAmount: raw.paidAmount,
      outstandingAmount,
      currency: raw.currency,
      status: raw.status,
      daysPastDue,
      agingBucket,
      riskScore: score,
      riskTier: tier,
      riskFactors: factors,
      disputeReason: raw.disputeReason,
      promisedPaymentDate: raw.promisedPaymentDate,
      notes: raw.notes,
    };
  });
}

export const SAMPLE_CSV_TEMPLATE = `Invoice Number,Customer Name,Customer Email,Issue Date,Due Date,Total Amount,Paid Amount,Currency,Status,Notes
INV-2026-881,Apex Logistics Global,finance@apexlogistics.io,2026-06-15,2026-07-15,34500,0,USD,overdue,Broken promise from Sept 30
INV-2026-904,Nexa Growth Partners,ap@nexagrowth.com,2026-07-30,2026-08-30,18200,3000,USD,overdue,Installment paid balance $15200
INV-2026-921,BlueWave Digital Inc,billing@bluewavedigital.net,2026-08-12,2026-09-12,22400,0,USD,disputed,PO line item mismatch
INV-2026-840,Crestline Industrial,accounts@crestline-ind.com,2026-07-01,2026-08-01,12500,0,USD,overdue,Executive escalation needed
INV-2026-945,Vanguard Advisory Group,treasury@vanguard-advisory.org,2026-09-02,2026-10-02,14800,0,USD,overdue,Net-30 bi-weekly AP run
INV-2026-960,Summit Peak Labs,invoices@summitpeaklabs.com,2026-09-18,2026-10-18,9500,0,USD,overdue,Standard reminder sent
INV-2026-982,Horizon Media Works,payables@horizonmediaworks.com,2026-10-15,2026-11-15,28000,0,USD,current,Contract billing
INV-2026-990,Sterling Creative Studio,ops@sterlingcreative.design,2026-10-25,2026-11-28,8600,0,USD,current,Design sprint balance`;
