import React, { useState } from 'react';
import { ImportMapping, InvoiceRecord } from '../types';
import { parseCsvString, autoDetectColumnMapping } from '../utils/csv';
import { calculateDaysPastDue, getAgingBucket, calculateRiskScore, formatCurrency } from '../utils/financial';
import { SAMPLE_CSV_TEMPLATE } from '../data/sampleReceivables';
import { analytics } from '../utils/analytics';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

interface CsvImportViewProps {
  onCommitInvoices: (invoices: InvoiceRecord[]) => void;
  onCancel: () => void;
}

export const CsvImportView: React.FC<CsvImportViewProps> = ({ onCommitInvoices, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvRawText, setCsvRawText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({
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
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewRecords, setPreviewRecords] = useState<InvoiceRecord[]>([]);

  // Step 1: Parse CSV
  const handleParse = (text: string) => {
    analytics.track('csv_import_started');
    const { headers: parsedHeaders, rows: parsedRows } = parseCsvString(text);
    if (parsedHeaders.length === 0 || parsedRows.length === 0) {
      alert('Could not find any readable rows in the supplied CSV. Please verify delimiter and format.');
      return;
    }
    setHeaders(parsedHeaders);
    setRawRows(parsedRows);

    // Auto-detect columns
    const detected = autoDetectColumnMapping(parsedHeaders);
    setMapping(detected);
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setCsvRawText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTemplate = () => {
    setCsvRawText(SAMPLE_CSV_TEMPLATE);
    handleParse(SAMPLE_CSV_TEMPLATE);
  };

  // Step 2 -> 3: Validate and Build Preview
  const handleProceedToPreview = () => {
    const errors: string[] = [];
    const invMap = new Map<string, number>();
    const invNumIdx = headers.indexOf(mapping.invoiceNumber);
    const clientIdx = headers.indexOf(mapping.customerName);
    const emailIdx = headers.indexOf(mapping.customerEmail);
    const issueIdx = headers.indexOf(mapping.issueDate);
    const dueIdx = headers.indexOf(mapping.dueDate);
    const totalIdx = headers.indexOf(mapping.totalAmount);
    const paidIdx = headers.indexOf(mapping.paidAmount);
    const currIdx = headers.indexOf(mapping.currency);
    const notesIdx = headers.indexOf(mapping.notes);
    const disputeIdx = headers.indexOf(mapping.disputeStatus);

    if (invNumIdx === -1 || clientIdx === -1 || totalIdx === -1) {
      errors.push('Mapping error: Invoice Number, Customer Name, and Total Amount must be mapped.');
      setValidationErrors(errors);
      return;
    }

    const referenceDate = '2026-10-29';
    let totalPortfolio = 0;

    // First pass: sum total outstanding
    rawRows.forEach(row => {
      const rawTotal = parseFloat((row[totalIdx] || '').replace(/[^0-9.-]/g, '')) || 0;
      const rawPaid = paidIdx !== -1 ? parseFloat((row[paidIdx] || '').replace(/[^0-9.-]/g, '')) || 0 : 0;
      totalPortfolio += Math.max(0, rawTotal - rawPaid);
    });

    const parsedList: InvoiceRecord[] = [];

    rawRows.forEach((row, rIdx) => {
      const invNum = row[invNumIdx]?.trim() || `INV-${rIdx + 1}`;
      const client = row[clientIdx]?.trim() || 'Unknown Client';
      const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : `${client.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
      const issue = issueIdx !== -1 && row[issueIdx] ? row[issueIdx].trim() : '2026-09-01';
      const due = dueIdx !== -1 && row[dueIdx] ? row[dueIdx].trim() : '2026-10-01';
      const total = Math.max(0, parseFloat((row[totalIdx] || '0').replace(/[^0-9.-]/g, '')) || 0);
      const paid = paidIdx !== -1 ? Math.max(0, parseFloat((row[paidIdx] || '0').replace(/[^0-9.-]/g, '')) || 0) : 0;
      const outstanding = Math.max(0, total - paid);
      const currency = currIdx !== -1 && row[currIdx] ? row[currIdx].trim().toUpperCase() : 'USD';
      const notes = notesIdx !== -1 ? row[notesIdx]?.trim() : '';
      const disputeRaw = disputeIdx !== -1 ? row[disputeIdx]?.toLowerCase().trim() : '';
      const isDisputed = disputeRaw === 'true' || disputeRaw === 'disputed' || disputeRaw === 'yes';

      // Check duplicates
      const dupCount = (invMap.get(invNum) || 0) + 1;
      invMap.set(invNum, dupCount);
      if (dupCount > 1) {
        errors.push(`Row ${rIdx + 1}: Duplicate invoice number "${invNum}" detected.`);
      }

      const daysPastDue = calculateDaysPastDue(due, referenceDate);
      const agingBucket = getAgingBucket(daysPastDue);
      const status = paid >= total ? 'paid' : isDisputed ? 'disputed' : daysPastDue > 0 ? 'overdue' : 'current';

      const { score, tier, factors } = calculateRiskScore({
        daysPastDue,
        outstandingAmount: outstanding,
        totalPortfolioAmount: totalPortfolio,
        isDisputed,
        asOfDateStr: referenceDate,
      });

      parsedList.push({
        id: `import-${rIdx}-${invNum}`,
        invoiceNumber: invNum,
        customerName: client,
        customerEmail: email,
        issueDate: issue,
        dueDate: due,
        totalAmount: total,
        paidAmount: paid,
        outstandingAmount: outstanding,
        currency,
        status,
        daysPastDue,
        agingBucket,
        riskScore: score,
        riskTier: tier,
        riskFactors: factors,
        notes,
        disputeReason: isDisputed ? 'Commercial dispute flagged in import' : undefined,
      });
    });

    setValidationErrors(errors);
    setPreviewRecords(parsedList);
    setStep(3);
  };

  const handleCommit = () => {
    analytics.track('csv_import_completed', {
      totalRows: previewRecords.length,
      hasErrors: validationErrors.length > 0,
    });
    onCommitInvoices(previewRecords);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Step Indicator Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <span>Accounts Receivable CSV Importer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Step {step} of 3 — Cleanse, normalize, and validate receivables before committing to active ranking.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            1. Upload
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            2. Map Columns
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            3. Preview & Commit
          </span>
        </div>
      </div>

      {/* STEP 1: Upload or Paste */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 bg-slate-950/40 transition-colors">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Drag & drop your Receivables CSV file here</p>
                <p className="text-xs text-slate-400 mt-1">Supports QuickBooks, Xero, FreshBooks, NetSuite, or Excel exports</p>
              </div>
              <label className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors">
                Browse CSV File
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            {/* Paste Raw CSV or Quick Load Sample */}
            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Or Paste CSV Text Directly
                </label>
                <textarea
                  rows={6}
                  placeholder={`Invoice Number,Customer Name,Due Date,Total Amount,Paid Amount\nINV-001,Acme Corp,2026-09-15,14500,0`}
                  value={csvRawText}
                  onChange={e => setCsvRawText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleLoadSampleTemplate}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Insert Safe B2B Sample Template</span>
                </button>
                <button
                  type="button"
                  disabled={!csvRawText.trim()}
                  onClick={() => handleParse(csvRawText)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
                >
                  <span>Parse CSV</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300">Confidential Processing:</strong> All CSV normalization and risk scoring happen entirely in client memory. No invoice figures or debtor identities are stored on third-party tracking servers.
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Confirm Column Detection & Mapping</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              We automatically matched your CSV headers. Verify the assignments below or re-map fields.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Invoice # */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Invoice Number <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.invoiceNumber}
                onChange={e => setMapping({ ...mapping, invoiceNumber: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Select Header --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Customer / Debtor Name <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.customerName}
                onChange={e => setMapping({ ...mapping, customerName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Select Header --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Total Amount */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Total Invoiced Amount <span className="text-rose-400">*</span>
              </label>
              <select
                value={mapping.totalAmount}
                onChange={e => setMapping({ ...mapping, totalAmount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Select Header --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Paid Amount */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Paid / Settled Amount
              </label>
              <select
                value={mapping.paidAmount}
                onChange={e => setMapping({ ...mapping, paidAmount: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Not Mapped (Treat as $0 paid) --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Due Date
              </label>
              <select
                value={mapping.dueDate}
                onChange={e => setMapping({ ...mapping, dueDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Select Header --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Customer Email */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Customer Email / Billing Contact
              </label>
              <select
                value={mapping.customerEmail}
                onChange={e => setMapping({ ...mapping, customerEmail: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">-- Optional --</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Back to Upload
            </button>
            <button
              onClick={handleProceedToPreview}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <span>Validate & Preview Records ({rawRows.length} rows)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Commit */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Import Validation & Normalized Preview</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready to commit {previewRecords.length} records into the active prioritization matrix.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStep(2)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800"
              >
                Adjust Mapping
              </button>
              <button
                onClick={handleCommit}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center space-x-1 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Commit {previewRecords.length} Invoices to Active OS</span>
              </button>
            </div>
          </div>

          {/* Validation Warnings if any */}
          {validationErrors.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-lg text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-semibold text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Validation Warnings Detected ({validationErrors.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 max-h-24 overflow-y-auto">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mini Preview Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Aging</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Outstanding</th>
                  <th className="py-2.5 px-3">Computed Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {previewRecords.slice(0, 8).map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-semibold text-slate-200">{rec.invoiceNumber}</td>
                    <td className="py-2 px-3 font-sans text-slate-300">{rec.customerName}</td>
                    <td className="py-2 px-3 text-slate-400">{rec.dueDate}</td>
                    <td className="py-2 px-3 text-slate-300 font-sans">{rec.agingBucket} ({rec.daysPastDue}d)</td>
                    <td className="py-2 px-3 text-slate-300">{formatCurrency(rec.totalAmount, rec.currency)}</td>
                    <td className="py-2 px-3 font-bold text-slate-100">{formatCurrency(rec.outstandingAmount, rec.currency)}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        rec.riskScore >= 75 ? 'bg-rose-500/20 text-rose-300' :
                        rec.riskScore >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {rec.riskScore} ({rec.riskTier})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
