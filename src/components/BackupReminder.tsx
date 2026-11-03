import React from 'react';
import { useApp } from '../app/AppContext';
import { todayISO } from '../utils/dates';
import { backupReminder } from '../utils/backupPolicy';
import { HardDrive, AlertTriangle, ArrowRight } from 'lucide-react';

interface BackupReminderProps {
  onOpenBackup: () => void;
}

/**
 * Rappel de sauvegarde sur le tableau de bord.
 *
 * Promesse produit : « vos données restent chez vous ». Corollaire assumé mais
 * jusqu'ici muet dans l'interface : un disque perdu sans export JSON = toutes
 * les créances perdues. Ce rappel est donc un élément de fiabilité, pas de
 * décoration. La décision d'affichage est déléguée à `backupReminder`
 * (fonction pure, couverte par des tests).
 */
export const BackupReminder: React.FC<BackupReminderProps> = ({ onOpenBackup }) => {
  const { settings, mode, invoices } = useApp();

  const state = backupReminder({
    lastBackupAt: settings?.lastBackupAt ?? null,
    invoiceCount: invoices.length,
    mode,
    today: todayISO(),
  });

  if (!state.show) return null;

  return (
    <div className="rounded-xl border border-[#E9AE57]/30 bg-[#E9AE57]/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="flex items-start gap-2.5">
        {state.elapsedDays === null
          ? <HardDrive className="w-4 h-4 shrink-0 mt-0.5 text-[#E9AE57]" />
          : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#E9AE57]" />}
        <div>
          <p className="text-[13px] font-semibold text-[#F4F7FB]">{state.message}</p>
          <p className="text-[11px] text-[#9AAAC0] mt-0.5">
            Vos créances n'existent que dans ce navigateur. Un export JSON est votre seul moyen de les
            retrouver en cas de perte de l'appareil.
          </p>
        </div>
      </div>
      <button
        onClick={onOpenBackup}
        className="shrink-0 px-3.5 py-2 rounded-lg bg-[#E9AE57]/20 hover:bg-[#E9AE57]/30 border border-[#E9AE57]/30 text-[#F4F7FB] text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
      >
        Sauvegarder maintenant <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
