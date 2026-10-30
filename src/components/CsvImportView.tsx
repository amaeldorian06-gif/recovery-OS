import React, { useState } from 'react';
import { useApp } from '../app/AppContext';
import { ImportMapping, InvoiceRecord } from '../types';
import { parseCsvString, autoDetectColumnMapping, buildInvoicesFromCsv, RowIssue } from '../utils/csv';
import { buildDemoCsvTemplate } from '../storage/seed';
import { formatMoney } from '../utils/money';
import {
  UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, ShieldCheck, FileText,
} from 'lucide-react';

interface CsvImportViewProps {
  onDone: () => void;
}

type ImportMode = 'replace' | 'merge' | 'update';

/**
 * Import CSV en 3 étapes : chargement, mappage, aperçu & engagement.
 * Modes d'engagement explicites — plus jamais de remplacement silencieux.
 */
export const CsvImportView: React.FC<CsvImportViewProps> = ({ onDone }) => {
  const { importInvoices } = useApp();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvRawText, setCsvRawText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ImportMapping>({
    invoiceNumber: '', customerName: '', customerEmail: '', issueDate: '', dueDate: '',
    totalAmount: '', paidAmount: '', currency: '', notes: '', disputeStatus: '',
  });
  const [issues, setIssues] = useState<RowIssue[]>([]);
  const [preview, setPreview] = useState<InvoiceRecord[]>([]);
  const [rejectedRows, setRejectedRows] = useState(0);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [result, setResult] = useState<string | null>(null);

  const handleParse = (text: string) => {
    const parsed = parseCsvString(text);
    if (parsed.headers.length === 0 || parsed.rows.length === 0) {
      setIssues([{ row: 0, field: 'file', message: 'Aucune ligne lisible. Vérifiez le séparateur (virgule ou point-virgule) et le format.', severity: 'error' }]);
      return;
    }
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setMapping(autoDetectColumnMapping(parsed.headers));
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
    e.target.value = '';
  };

  const handlePreview = () => {
    const built = buildInvoicesFromCsv({ headers, rows: rawRows, mapping });
    setIssues(built.issues);
    setPreview(built.invoices);
    setRejectedRows(built.rejectedRows);
    setStep(3);
  };

  const handleCommit = async () => {
    const res = await importInvoices(preview, importMode);
    setResult(
      `${res.inserted} facture(s) ajoutée(s), ${res.updated} mise(s) à jour, ${res.skipped} déjà présente(s), ${res.rejected} rejetée(s).`
    );
    setTimeout(onDone, 1400);
  };

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  return (
    <div className="max-w-5xl space-y-5">
      <div className="rounded-xl border border-white/10 bg-[#111726] p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><UploadCloud className="w-5 h-5 text-[#38BDF8]" /> Import d'une balance âgée (CSV)</h2>
          <p className="text-[13px] text-[#9AAAC0] mt-0.5">Étape {step} sur 3 — lecture, mappage puis aperçu avant écriture.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <span className={`px-2.5 py-1 rounded-full font-semibold ${step >= s ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-[#9AAAC0]'}`}>
                {s === 1 ? '1. Fichier' : s === 2 ? '2. Colonnes' : '3. Aperçu'}
              </span>
              {s < 3 && <ArrowRight className="w-3.5 h-3.5 text-[#6B7D98]" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="rounded-xl border border-white/10 bg-[#111726] p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="border-2 border-dashed border-white/15 hover:border-[#2563EB] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-[#2563EB]/10 text-[#38BDF8] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Déposer un fichier CSV</p>
                <p className="text-xs text-[#9AAAC0] mt-1">Export Sage, Cegid, Pennylane, QuickBooks, Excel…</p>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold">Parcourir</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileUpload} />
            </label>

            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-[#9AAAC0] mb-1">Ou coller le contenu CSV</label>
                <textarea
                  rows={7}
                  placeholder={"Numéro de facture;Client;Date d'échéance;Montant total\nFA-2026-001;Dupont SARL;15/09/2026;12450,00"}
                  value={csvRawText}
                  onChange={e => setCsvRawText(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-white/10 rounded-lg p-3 text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { const t = buildDemoCsvTemplate(); setCsvRawText(t); handleParse(t); }}
                  className="text-xs text-[#E9AE57] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Insérer un modèle FR d'exemple
                </button>
                <button
                  disabled={!csvRawText.trim()}
                  onClick={() => handleParse(csvRawText)}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                >
                  Lire le fichier
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0B0F17] border border-white/5 text-xs text-[#9AAAC0] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38C995] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#E6EAF2]">Traitement 100 % local.</strong> Le fichier n'est ni téléversé ni envoyé :
              le parsing, la conversion des montants (« 1 234,56 » comme 1 234,56 €) et le calcul du retard se font dans votre navigateur.
            </span>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-white/10 bg-[#111726] p-6 space-y-5">
          <div>
            <h3 className="text-sm font-bold">Mappage des colonnes</h3>
            <p className="text-[13px] text-[#9AAAC0] mt-0.5">
              Détection automatique (vocabulaire français et anglais) — vérifiez ou corrigez.
              {rawRows.length > 0 && ` ${rawRows.length} ligne(s) détectée(s).`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {([
              ['invoiceNumber', 'Numéro de facture', true],
              ['customerName', 'Client', true],
              ['totalAmount', 'Montant total', true],
              ['dueDate', "Date d'échéance", true],
              ['paidAmount', 'Montant réglé', false],
              ['issueDate', "Date d'émission", false],
              ['customerEmail', 'Email du client', false],
              ['currency', 'Devise', false],
              ['notes', 'Notes', false],
              ['disputeStatus', 'Litige', false],
            ] as Array<[keyof ImportMapping, string, boolean]>).map(([key, label, required]) => (
              <div key={key} className="p-3 rounded-lg bg-[#0B0F17] border border-white/5 space-y-1">
                <label className="block text-xs font-semibold">
                  {label} {required && <span className="text-[#E9AE57]">*</span>}
                </label>
                <select
                  value={mapping[key]}
                  onChange={e => setMapping({ ...mapping, [key]: e.target.value })}
                  className="w-full bg-[#111726] border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">{required ? '— Obligatoire —' : '— Non utilisé —'}</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>

          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200 space-y-1">
              {errors.map((e, i) => <p key={i}>{e.message}</p>)}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button onClick={() => setStep(1)} className="text-xs text-[#9AAAC0] hover:text-white cursor-pointer">Retour</button>
            <button onClick={handlePreview} className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer">
              Valider et prévisualiser
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl border border-white/10 bg-[#111726] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Aperçu avant écriture</h3>
              <p className="text-[13px] text-[#9AAAC0] mt-0.5">
                {preview.length} facture(s) valides · {rejectedRows} ligne(s) rejetée(s) · {warnings.length} avertissement(s)
              </p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="p-3 rounded-lg bg-[#E9AE57]/10 border border-[#E9AE57]/20 text-xs text-[#E9AE57] space-y-1 max-h-32 overflow-y-auto">
              <div className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Anomalies bloquantes</div>
              {errors.slice(0, 20).map((e, i) => <p key={i}>{e.message}</p>)}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/20 text-xs text-[#38BDF8] space-y-1 max-h-28 overflow-y-auto">
              <div className="font-semibold">Avertissements</div>
              {warnings.slice(0, 10).map((w, i) => <p key={i}>{w.message}</p>)}
            </div>
          )}

          {preview.length > 0 && (
            <div className="overflow-x-auto border border-white/10 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F17] text-[#9AAAC0] uppercase">
                  <tr>
                    <th className="p-2.5">Facture</th>
                    <th className="p-2.5">Client</th>
                    <th className="p-2.5">Échéance</th>
                    <th className="p-2.5">Retard</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Encours</th>
                    <th className="p-2.5">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.slice(0, 10).map(rec => (
                    <tr key={rec.id} className="hover:bg-white/5">
                      <td className="p-2.5 font-semibold">#{rec.invoiceNumber}</td>
                      <td className="p-2.5">{rec.customerName}</td>
                      <td className="p-2.5 font-mono">{rec.dueDate}</td>
                      <td className="p-2.5 font-mono">{rec.daysPastDue > 0 ? `${rec.daysPastDue} j` : 'à jour'}</td>
                      <td className="p-2.5 font-mono">{formatMoney(rec.totalAmount, rec.currency)}</td>
                      <td className="p-2.5 font-mono font-bold">{formatMoney(rec.outstandingAmount, rec.currency)}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.riskScore >= 75 ? 'bg-red-500/20 text-red-300' : rec.riskScore >= 50 ? 'bg-[#E9AE57]/20 text-[#E9AE57]' : 'bg-[#38C995]/20 text-[#38C995]'
                        }`}>
                          {rec.riskScore} · {rec.riskTier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 rounded-lg bg-[#0B0F17] border border-white/10 space-y-3">
            <span className="text-xs font-semibold">Mode d'engagement</span>
            <div className="space-y-2 text-[13px]">
              {([
                ['merge', 'Fusion (recommandé) : ajoute les nouvelles factures, ignore celles déjà présentes.'],
                ['update', 'Mise à jour : ajoute les nouvelles et remplace celles dont le numéro existe.'],
                ['replace', 'Remplacement complet : efface le portefeuille actuel avant import.'],
              ] as Array<[ImportMode, string]>).map(([mode, label]) => (
                <label key={mode} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={importMode === mode}
                    onChange={() => setImportMode(mode)}
                    className={`mt-1 ${mode === 'replace' ? 'accent-red-500' : 'accent-[#38C995]'}`}
                  />
                  <span className={mode === 'replace' ? 'text-[#E9AE57]' : ''}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {result && (
            <div className="p-3 rounded-lg bg-[#38C995]/10 border border-[#38C995]/20 text-sm text-[#38C995] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {result}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button onClick={() => setStep(2)} className="text-xs text-[#9AAAC0] hover:text-white cursor-pointer">Modifier le mappage</button>
            <button
              onClick={() => void handleCommit()}
              disabled={preview.length === 0}
              className="px-4 py-2 rounded-lg bg-[#38C995] hover:bg-[#2FB37F] text-[#04120B] text-xs font-bold cursor-pointer disabled:opacity-40"
            >
              Engager {preview.length} facture(s)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
