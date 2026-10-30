import React, { useState, useEffect } from 'react';
import { InvoiceRecord, ActionLog } from '../types';
import { ACTION_TEMPLATES, generateActionMessage, ActionTemplateOption } from '../utils/actionTemplates';
import { formatCurrency } from '../utils/financial';
import { analytics } from '../utils/analytics';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Mail, 
  Calendar, 
  ShieldAlert, 
  FileCheck 
} from 'lucide-react';

interface ActionCenterModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onSaveActionLog: (log: ActionLog) => void;
}

export const ActionCenterModal: React.FC<ActionCenterModalProps> = ({
  invoice,
  onClose,
  onSaveActionLog,
}) => {
  // Pick default template based on risk/dispute/days
  const defaultTemplateId = invoice.status === 'disputed'
    ? 'dispute-resolution'
    : invoice.daysPastDue > 45
    ? 'formal-demand'
    : invoice.daysPastDue > 15
    ? 'firm-notice'
    : 'courteous-reminder';

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(defaultTemplateId);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('2026-11-05');
  const [outcomeNotes, setOutcomeNotes] = useState('Notice generated and prepared for transmission.');

  const currentTemplate = ACTION_TEMPLATES.find(t => t.id === selectedTemplateId) || ACTION_TEMPLATES[0];

  useEffect(() => {
    if (invoice && currentTemplate) {
      const generated = generateActionMessage(currentTemplate, invoice);
      setSubject(generated.subject);
      setBody(generated.body);
    }
  }, [invoice, currentTemplate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    analytics.track('action_copied_to_clipboard');
  };

  const handleLogAction = () => {
    analytics.track('first_action_created');
    const log: ActionLog = {
      id: `log-${Date.now()}`,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      timestamp: new Date().toISOString(),
      actionType: 'email_reminder',
      tone: currentTemplate.tone,
      subject,
      messageBody: body,
      recipient: invoice.customerEmail,
      outcome: outcomeNotes,
      scheduledFollowUpDate: followUpDate,
    };
    onSaveActionLog(log);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Action Notice Generator — {invoice.customerName}
              </h3>
              <p className="text-xs text-slate-400">
                Invoice #{invoice.invoiceNumber} • {formatCurrency(invoice.outstandingAmount, invoice.currency)} • {invoice.daysPastDue}d Overdue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Tone Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Select Communication Strategy & Tone
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACTION_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-2 rounded-lg text-left border transition-all ${
                    selectedTemplateId === tpl.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{tpl.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 capitalize">Stage: {tpl.stage}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Body Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                Outreach Message Copy
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Copy'}</span>
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Follow-up schedule & Action Log */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Schedule Next Follow-Up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Internal Audit Note
              </label>
              <input
                type="text"
                value={outcomeNotes}
                onChange={e => setOutcomeNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-5 sm:py-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-950/60 gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors order-2 sm:order-1 text-center"
          >
            Cancel
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Text</span>
            </button>
            <button
              onClick={handleLogAction}
              className="px-4 py-2 sm:py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center space-x-1 shadow"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Log Action & Update Timeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
