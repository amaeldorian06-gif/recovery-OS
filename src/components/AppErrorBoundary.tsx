import React from 'react';
import { AlertTriangle, RefreshCw, HardDrive, ShieldCheck, Copy, Check } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_MAILTO, CONTACT_IS_PLACEHOLDER } from '../config/brand';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  copied: boolean;
}

/**
 * Filet de sécurité de l'interface.
 *
 * Sans ce garde-fou, toute exception de rendu (navigateur ancien, IndexedDB
 * refusé, données corrompues) produisait un écran blanc sans explication sur
 * un produit où les données de l'utilisateur sont locales et uniques.
 *
 * Principes :
 *  - aucune action destructrice n'est proposée ici ;
 *  - l'utilisateur est rassuré sur l'intégrité de ses données locales ;
 *  - le détail technique est affichable et copiable pour le support.
 *
 * Les promesses rejetées non gérées ne sont volontairement PAS capturées :
 * certaines opérations facultatives (licence, préférences) peuvent échouer
 * sans compromettre la session, et un écran plein format serait trompeur.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[Revenue Recovery OS] Erreur de rendu non rattrapée :', error, info.componentStack);
  }

  componentDidMount(): void {
    window.addEventListener('error', this.handleWindowError);
  }

  componentWillUnmount(): void {
    window.removeEventListener('error', this.handleWindowError);
  }

  private handleWindowError = (event: ErrorEvent): void => {
    if (event.error instanceof Error) {
      this.setState({ error: event.error });
    }
  };

  private reload = (): void => {
    window.location.reload();
  };

  private copyDetails = async (): Promise<void> => {
    const { error } = this.state;
    const text = [
      `Produit : Revenue Recovery OS`,
      `URL : ${window.location.href}`,
      `Navigateur : ${navigator.userAgent}`,
      `Date : ${new Date().toISOString()}`,
      `Erreur : ${error?.name ?? 'Error'}: ${error?.message ?? 'inconnue'}`,
      error?.stack ? `\n${error.stack}` : '',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  };

  render(): React.ReactNode {
    const { error, copied } = this.state;
    if (!error) return this.props.children;
    return (
      <AppErrorScreen
        error={error}
        copied={copied}
        onReload={this.reload}
        onCopy={() => void this.copyDetails()}
      />
    );
  }
}

export interface AppErrorScreenProps {
  error: Error;
  copied: boolean;
  onReload: () => void;
  onCopy: () => void;
}

/**
 * Écran d'erreur fatal — composant pur, séparé du garde-fou React afin d'être
 * vérifiable hors navigateur (voir scripts/smoke-render.tsx).
 */
export const AppErrorScreen: React.FC<AppErrorScreenProps> = ({ error, copied, onReload, onCopy }) => {
  return (
      <div className="min-h-screen bg-[#070B20] text-[#F4F7FB] flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-[#0B0F17] p-8 space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">L'application s'est arrêtée sur une erreur</h1>
            <p className="text-sm text-[#9AAAC0] leading-relaxed">
              Une erreur inattendue a interrompu l'affichage. Vos données locales sont stockées dans
              ce navigateur et <strong className="text-[#F4F7FB]">ne sont pas supprimées</strong> par cette erreur.
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-[#111726] p-4 text-[13px]">
            <div className="flex items-start gap-2">
              <HardDrive className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
              <p className="text-[#C7D2E5]">
                Rechargez la page pour reprendre. Si l'erreur revient, exportez votre sauvegarde JSON
                dès que l'application répond à nouveau — c'est votre seul filet de sécurité.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#38C995]" />
              <p className="text-[#C7D2E5]">
                Aucune donnée n'a été transmise : ce produit ne possède pas de serveur de stockage.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onReload}
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Recharger la page
            </button>
            <button
              onClick={() => onCopy}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-[#C7D2E5] flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#38C995]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Détail copié' : 'Copier le détail technique'}
            </button>
          </div>

          <details className="text-[12px] text-[#9AAAC0]">
            <summary className="cursor-pointer select-none">Détail de l'erreur</summary>
            <pre className="mt-2 p-3 rounded-lg bg-[#0B0F17] border border-white/10 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-[#E9AE57]">
              {error.name}: {error.message}
            </pre>
          </details>

          <p className="text-[11px] text-[#6B7D98] border-t border-white/10 pt-4">
            Si le problème persiste, signalez-le{CONTACT_IS_PLACEHOLDER ? ' (adresse de contact à configurer)' : ''} :{' '}
            <a href={CONTACT_MAILTO} className="underline hover:text-[#9AAAC0]">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    );
};
