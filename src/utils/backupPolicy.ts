import { daysBetween } from './dates';

/** Seuil au-delà duquel l'absence de sauvegarde est signalée à l'utilisateur. */
export const BACKUP_REMINDER_THRESHOLD_DAYS = 7;

export interface BackupReminderState {
  /** Vrai si le rappel doit être affiché. */
  show: boolean;
  /** Jours écoulés depuis le dernier export, `null` si aucun export connu. */
  elapsedDays: number | null;
  /** Message principal, prêt à afficher (français). */
  message: string;
}

export interface BackupReminderInput {
  lastBackupAt?: string | null;
  invoiceCount: number;
  mode: 'real' | 'demo';
  today: string;
}

/**
 * Décide de l'affichage du rappel de sauvegarde — logique pure, testée.
 *
 * Aucun rappel en démonstration (données éphémères) ni sur un portefeuille vide
 * (rien à perdre). Une date de sauvegarde invalide est traitée comme absente
 * plutôt que de produire un « NaN jours » à l'écran.
 */
export function backupReminder(input: BackupReminderInput): BackupReminderState {
  const hidden: BackupReminderState = { show: false, elapsedDays: null, message: '' };

  if (input.mode === 'demo') return hidden;
  if (input.invoiceCount <= 0) return hidden;

  const raw = input.lastBackupAt;
  const elapsed = raw && /^\d{4}-\d{2}-\d{2}/.test(raw) ? daysBetween(raw.slice(0, 10), input.today) : null;

  if (elapsed !== null && Number.isFinite(elapsed) && elapsed < BACKUP_REMINDER_THRESHOLD_DAYS) {
    return { show: false, elapsedDays: elapsed, message: '' };
  }

  if (elapsed === null || !Number.isFinite(elapsed)) {
    return { show: true, elapsedDays: null, message: 'Aucune sauvegarde exportée pour le moment.' };
  }

  return {
    show: true,
    elapsedDays: elapsed,
    message: `Dernière sauvegarde il y a ${elapsed} jour${elapsed > 1 ? 's' : ''}.`,
  };
}
