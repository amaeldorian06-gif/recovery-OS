import { InvoiceRecord } from '../types';
import { formatCurrency } from './financial';

export interface ActionTemplateOption {
  id: string;
  name: string;
  tone: 'courteous' | 'firm' | 'formal' | 'legal';
  stage: string;
  subjectTemplate: string;
  bodyTemplate: string;
}

export const ACTION_TEMPLATES: ActionTemplateOption[] = [
  {
    id: 'courteous-reminder',
    name: 'Friendly Due-Date Follow-up (1-15 Days)',
    tone: 'courteous',
    stage: 'Early Stage',
    subjectTemplate: 'Statement Reminder: Invoice {{invoiceNumber}} for {{customerName}}',
    bodyTemplate: `Hi {{customerName}} Accounts Payable Team,

I hope you are having a productive week.

We are writing with a brief reminder regarding invoice {{invoiceNumber}} in the amount of {{outstandingAmount}}, which was due on {{dueDate}} ({{daysPastDue}} days ago).

Could you please confirm if this invoice is currently scheduled for payment in your upcoming accounts payable run?

If you need another copy of the invoice or our banking/wire instructions, please reply directly to this message.

Thank you for your partnership,
Finance & Accounts Receivable`,
  },
  {
    id: 'firm-notice',
    name: 'Firm Past-Due Notice (16-45 Days)',
    tone: 'firm',
    stage: 'Mid Stage',
    subjectTemplate: 'URGENT: Outstanding Balance on Invoice {{invoiceNumber}} ({{daysPastDue}} Days Overdue)',
    bodyTemplate: `Attention: Accounts Payable & Financial Operations — {{customerName}},

Our records indicate that invoice {{invoiceNumber}} for {{outstandingAmount}} remains past due ({{daysPastDue}} days overdue from the original due date of {{dueDate}}).

Despite our previous reminders, we have not yet received payment confirmation or remittance advice.

Please process payment within 3 business days, or provide the exact date on which settlement will be executed. If there is a billing question or PO reconciliation issue holding up payment, please let us know immediately so we can assist.

Wire & Remittance Details:
Invoice #: {{invoiceNumber}}
Amount Due: {{outstandingAmount}}

Sincerely,
Accounts Receivable Management`,
  },
  {
    id: 'dispute-resolution',
    name: 'Commercial Dispute Reconciliation',
    tone: 'courteous',
    stage: 'Dispute Handling',
    subjectTemplate: 'Resolution Review: Clarification on Invoice {{invoiceNumber}}',
    bodyTemplate: `Dear {{customerName}} Finance & Project Team,

We noticed a hold or dispute recorded regarding invoice {{invoiceNumber}} ({{outstandingAmount}}).

Our objective is to resolve any discrepancies promptly to ensure accurate billing alignment.

Reason on file: {{disputeReason}}

Could we arrange a 10-minute touchpoint this week with your project sponsor or procurement lead to reconcile the deliverable records and approve the release of funds?

Best regards,
Commercial Operations & Receivables`,
  },
  {
    id: 'payment-plan',
    name: 'Installment & Payment Plan Offer',
    tone: 'courteous',
    stage: 'Workout Agreement',
    subjectTemplate: 'Structured Payment Agreement Proposal — Invoice {{invoiceNumber}}',
    bodyTemplate: `Dear {{customerName}} Leadership,

We recognize that cash flow timing can occasionally require operational flexibility. Invoice {{invoiceNumber}} for {{outstandingAmount}} is now {{daysPastDue}} days past due.

To support your team and bring the account into good standing without disruption to ongoing services, we would like to propose a structured 2-to-3 installment plan over the next 45 days.

Please confirm whether an initial payment of 50% this week followed by bi-weekly installments works with your cash planning.

We appreciate your ongoing communication and look forward to your confirmation.

Regards,
Treasury & Credit Control`,
  },
  {
    id: 'formal-demand',
    name: 'Final Demand for Payment (45+ Days)',
    tone: 'formal',
    stage: 'Escalation',
    subjectTemplate: 'FINAL NOTICE BEFORE ESCALATION: Invoice {{invoiceNumber}}',
    bodyTemplate: `FORMAL NOTICE OF OUTSTANDING DEBT

TO: {{customerName}} — Corporate Finance & Executive Officers
DATE: {{todayDate}}
RE: INVOICE {{invoiceNumber}} — DELINQUENT BALANCE OF {{outstandingAmount}}

This constitutes formal notice that payment for Invoice {{invoiceNumber}}, issued on {{issueDate}} and due on {{dueDate}}, is now {{daysPastDue}} days past due.

Prior reminders and scheduled payment agreements have not been fulfilled.

Demand is hereby made for full payment of {{outstandingAmount}} within seven (7) calendar days of this notice. Failure to remit payment or establish an authorized settlement agreement will compel us to suspend all active service delivery and transition this account to external legal recovery counsel.

To immediately satisfy this obligation, wire funds to our registered bank account and transmit confirmation to this address.

Sincerely,
Credit Control & Commercial Recovery Directorate`,
  },
];

export function generateActionMessage(
  template: ActionTemplateOption,
  invoice: InvoiceRecord,
  todayDate: string = '2026-10-29'
): { subject: string; body: string } {
  const replaceTokens = (text: string) => {
    return text
      .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
      .replace(/{{customerName}}/g, invoice.customerName)
      .replace(/{{customerEmail}}/g, invoice.customerEmail)
      .replace(/{{outstandingAmount}}/g, formatCurrency(invoice.outstandingAmount, invoice.currency))
      .replace(/{{totalAmount}}/g, formatCurrency(invoice.totalAmount, invoice.currency))
      .replace(/{{dueDate}}/g, invoice.dueDate)
      .replace(/{{issueDate}}/g, invoice.issueDate)
      .replace(/{{daysPastDue}}/g, String(Math.max(0, invoice.daysPastDue)))
      .replace(/{{todayDate}}/g, todayDate)
      .replace(/{{disputeReason}}/g, invoice.disputeReason || 'Unspecified reconciliation hold');
  };

  return {
    subject: replaceTokens(template.subjectTemplate),
    body: replaceTokens(template.bodyTemplate),
  };
}
