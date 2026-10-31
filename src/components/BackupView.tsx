import React, { useRef, useState } from 'react';
import { useApp } from '../app/AppContext';
import { exportBackup, inspectBackup, restoreBackup, backupToFileParts, BackupFile, BackupInspection } from '../storage/backup';
import { HardDrive, Download, Upload, ShieldCheck, AlertTriangle, CheckCircle2, Trash2, Eye } from 'lucide-react';

/**
 * Sauvegarde & restauration.
 * Toute restauration en remplacement exige la saisie explicite « RESTAURER » :
 * aucune opération destructive n'est possible d'un seul clic.
 */
export const BackupView: React.FC = () => {
  const { repo, organization, refresh, busy } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastBackup, setLastBackup] = useState<BackupFile | null>(null);
  const [rawContent, setRawContent] = useState<string | null>(null);
  const [inspection, setInspection] = useState<BackupInspection | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    if (!repo || !organization) return;
    setMessage(null);
    try {
      const backup = await exportBackup(repo, organization.id);
      setLastBackup(backup);
      const { content, filename } = backupToFileParts(backup);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setMessage({ kind: 'ok', text: `Sauvegarde exportée : ${filename} (${backup.counts.invoices} facture(s), empreinte ${backup.checksumAlgorithm}).` });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Export impossible.' });
    }
  };

  const handleFile = async (file: File) => {
    setMessage(null);
    setInspection(null);
    setConfirmation('');
    try {
      const text = await file.text();
      setRawContent(text);
      const result = await inspectBackup(text);
      setInspection(result);
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Lecture du fichier impossible.' });
    }
  };

  const handleRestore = async () => {
    if (!repo || !organization || !rawContent) return;
    setMessage(null);
    try {
      const report = await restoreBackup(repo, organization.id, rawContent, {
        mode: restoreMode,
        confirmation: restoreMode === 'replace' ? confirmation : undefined,
      });
      await refresh();
      setInspection(null);
      setRawContent(null);
      setConfirmation('');
      setMessage({
        kind: 'ok',
        text: `Restauration ${report.mode === 'replace' ? 'complète' : 'en fusion'} effectuée : ${report.invoices} facture(s), ${report.payments} encaissement(s), ${report.promises} promesse(s), ${report.disputes} litige(s), ${report.actions} action(s).`,
      });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Restauration impossible.' });
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Sauvegarde & restauration</h1>
        <p className="text-[13px] text-[#9AAAC0] mt-0.5">
          Vos données ne vivent que sur cet appareil : exportez régulièrement une sauvegarde JSON autonome.
        </p>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl border text-sm flex items-start gap-2 ${
          message.kind === 'ok'
            ? 'bg-[#38C995]/10 border-[#38C995]/20 text-[#38C995]'
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          {message.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Download className="w-4 h-4 text-[#38BDF8]" /> 1. Exporter</h3>
        <p className="text-[13px] text-[#9AAAC0]">
          Génère un fichier JSON contenant factures, encaissements, promesses, litiges, actions et journal,
          scellé par une empreinte de contrôle.
        </p>
        <button
          onClick={() => void handleExport()}
          disabled={!repo || busy}
          className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
        >
          Télécharger ma sauvegarde JSON
        </button>
        {lastBackup && (
          <p className="text-xs text-[#6B7D98] font-mono">
            Dernier export : {lastBackup.exportedAt.slice(0, 19).replace('T', ' ')} · empreinte {lastBackup.checksumAlgorithm} · {lastBackup.checksum.slice(0, 16)}…
          </p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111726] p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Upload className="w-4 h-4 text-[#38C995]" /> 2. Restaurer</h3>
        <p className="text-[13px] text-[#9AAAC0]">
          Sélectionnez un fichier de sauvegarde : il sera analysé et prévisualisé avant toute écriture.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold cursor-pointer"
        >
          Choisir un fichier de sauvegarde…
        </button>

        {inspection && (
          <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#38BDF8]" /> Prévisualisation
              </h4>
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                inspection.valid ? 'bg-[#38C995]/15 text-[#38C995]' : 'bg-red-500/15 text-red-300'
              }`}>
                {inspection.valid ? 'Fichier valide' : 'Refusé'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <span className="p-2 rounded bg-white/5">Factures : <strong>{inspection.counts.invoices ?? 0}</strong></span>
              <span className="p-2 rounded bg-white/5">Encaissements : <strong>{inspection.counts.payments ?? 0}</strong></span>
              <span className="p-2 rounded bg-white/5">Promesses : <strong>{inspection.counts.promises ?? 0}</strong></span>
              <span className="p-2 rounded bg-white/5">Litiges : <strong>{inspection.counts.disputes ?? 0}</strong></span>
              <span className="p-2 rounded bg-white/5">Actions : <strong>{inspection.counts.actions ?? 0}</strong></span>
              <span className="p-2 rounded bg-white/5">Organisation : <strong>{inspection.organizationName ?? '—'}</strong></span>
            </div>

            {inspection.previewSample.length > 0 && (
              <div className="text-xs space-y-1">
                <span className="text-[#9AAAC0] font-semibold">Aperçu des factures :</span>
                {inspection.previewSample.map((inv, idx) => (
                  <div key={idx} className="p-2 rounded bg-white/5 flex justify-between">
                    <span>#{inv.invoiceNumber} — {inv.customerName}</span>
                    <span className="font-mono">{inv.totalAmount.toLocaleString('fr-FR')} {inv.currency}</span>
                  </div>
                ))}
              </div>
            )}

            {inspection.errors.length > 0 && (
              <ul className="text-xs text-red-300 space-y-1 list-disc list-inside">
                {inspection.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
            {inspection.warnings.length > 0 && (
              <ul className="text-xs text-[#E9AE57] space-y-1 list-disc list-inside">
                {inspection.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {inspection.checksumOk && (
              <p className="text-xs text-[#38C995] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Empreinte de contrôle vérifiée.
              </p>
            )}

            {inspection.valid && (
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={restoreMode === 'merge'} onChange={() => setRestoreMode('merge')} className="accent-[#38C995]" />
                    <span><strong>Fusion</strong> — ajoute ce qui manque, n'écrase rien (recommandé)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={restoreMode === 'replace'} onChange={() => setRestoreMode('replace')} className="accent-red-500" />
                    <span><strong>Remplacement complet</strong> — efface les données actuelles</span>
                  </label>
                </div>

                {restoreMode === 'replace' && (
                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex items-start gap-2">
                      <Trash2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Cette opération est <strong>irréversible</strong> : les factures, encaissements, promesses,
                        litiges et actions actuels seront supprimés. Saisissez <code className="font-bold">RESTAURER</code> pour confirmer.
                      </span>
                    </div>
                    <input
                      value={confirmation}
                      onChange={e => setConfirmation(e.target.value)}
                      placeholder="RESTAURER"
                      className="w-full bg-white/5 border border-red-500/30 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-400"
                    />
                  </div>
                )}

                <button
                  onClick={() => void handleRestore()}
                  disabled={busy || (restoreMode === 'replace' && confirmation !== 'RESTAURER')}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  {restoreMode === 'replace' ? 'Remplacer mes données par cette sauvegarde' : 'Fusionner cette sauvegarde'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
