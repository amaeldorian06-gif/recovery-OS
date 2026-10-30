export type AgingBucket = 'Current' | '1-30' | '31-60' | '61-90' | '90+';
export type InvoiceStatus = 'current' | 'overdue' | 'disputed' | 'paid';
export type RiskTier = 'Low' | 'Medium' | 'High' | 'Critical';
export type ActionType = 'email_reminder' | 'firm_notice' | 'phone_call' | 'formal_demand' | 'payment_plan' | 'dispute_review';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  currency: string;
  status: InvoiceStatus;
  daysPastDue: number;
  agingBucket: AgingBucket;
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  riskFactors: string[];
  disputeReason?: string;
  promisedPaymentDate?: string; // YYYY-MM-DD
  notes?: string;
  lastActionDate?: string;
  lastActionType?: string;
}

export interface CustomerAccount {
  name: string;
  email: string;
  invoiceCount: number;
  totalOutstanding: number;
  totalOverdue: number;
  oldestDueDate: string;
  maxDaysPastDue: number;
  aggregateRiskScore: number;
  primaryRiskFactor: string;
  recommendedAction: string;
  invoices: InvoiceRecord[];
}

export interface FinancialMetrics {
  totalReceivables: number;
  totalOverdue: number;
  atRiskExposure: number; // riskScore >= 70
  promisedPayments: number; // Tracked separately, NOT added to collected cash
  disputedAmount: number;
  confirmedPayments: number;
  invoiceCount: number;
  overdueCount: number;
  disputedCount: number;
  paidCount: number;
  dsoValue: number | null;
  dsoMethod: string;
  dsoNotes: string;
  currencySummary: { [currency: string]: number };
}

export interface ImportMapping {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  paidAmount: string;
  currency: string;
  notes: string;
  disputeStatus: string;
}

export interface ActionLog {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  timestamp: string;
  actionType: ActionType;
  tone: 'courteous' | 'firm' | 'formal' | 'legal';
  subject: string;
  messageBody: string;
  recipient: string;
  outcome: string;
  scheduledFollowUpDate?: string;
}

export interface AnalyticsEvent {
  eventName: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}
