import React, { useMemo, useState } from 'react';
import { LegalDocumentPage } from './LegalDocumentPage';
import { EDITOR, PRODUCT } from '../config/editor';
import { Undo2, Copy, Check, Mail, AlertCircle } from 'lucide-react';

interface PageProps {
  onNavigate: (path: string) => void;
}

export const LegalNoticePage: React.FC<PageProps> = ({ onNavigate }) => (
  <LegalDocumentPage documentId="mentions-legales" onNavigate={onNavigate} />
);

export const TermsPage: React.FC<PageProps> = ({ onNavigate }) => (
  <LegalDocumentPage documentId="cgv" onNavigate={onNavigate} />
);

export const PrivacyPage: React.FC<PageProps> = ({ onNavigate }) => (
  <LegalDocumentPage documentId="confidentialite" onNavigate={onNavigate} />
);

/* ------------------------------------------------------------------ */
/* Rétractation — avec la fonctionnalité « renoncer au contrat ici »   */
/* ------------------------------------------------------------------ */

const buildWithdrawalBody = (): string =>
  [
    `Objet : Rétractation — ${PRODUCT}`,
    '',
    'Je vous notifie par la présente ma rétractation du contrat portant sur la fourniture du service suivant :',
    `Service : ${PRODUCT}`,
    'Offre souscrite : [à compléter]',
    'Date de commande : [à compléter]',
    'Date de réception de la clé : [à compléter]',
    '',
    'Nom du consommateur : [à compléter]',
    'Adresse : [à compléter]',
    'Adresse électronique du compte : [à compléter]',
    '',
    `Date : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    'Je conserve une copie de ce message ainsi que l’accusé de réception comme preuve de ma demande.',
  ].join('\n');

const WithdrawalAction: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const body = useMemo(buildWithdrawalBody, []);
  const mailto = `mailto:${EDITOR.email}?subject=${encodeURIComponent(`Rétractation — ${PRODUCT}`)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`À : ${EDITOR.email}\n\n${body}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-5 rounded-xl border border-[#38BDF8]/30 bg-[#38BDF8]/5 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Undo2 className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
        <div>
          <p className="text-[13px] font-semibold text-[#F4F7FB]">Fonctionnalité de rétractation en ligne</p>
          <p className="text-[12.5px] text-[#9AAAC0] mt-1">
            Le bouton ci-dessous ouvre un message déjà rédigé, adressé à l’éditeur. Envoyez-le :
            votre demande est horodatée par votre messagerie, ce qui constitue une preuve d’envoi.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={mailto}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold flex items-center gap-2"
        >
          <Mail className="w-4 h-4" /> Renoncer au contrat ici
        </a>
        <button
          onClick={() => void copy()}
          className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-[#C7D2E5] flex items-center gap-2 cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-[#38C995]" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Texte copié' : 'Copier le texte de la demande'}
        </button>
      </div>

      <p className="text-[11px] text-[#6B7D98] leading-relaxed">
        Limite assumée : sans serveur, le site ne peut pas émettre automatiquement un accusé de
        réception sur support durable. L’e-mail que vous envoyez, conservé dans votre boîte
        d’envoi, remplit cette fonction. Si vous préférez un autre canal, toute notification
        écrite (courrier, formulaire type) produit les mêmes effets.
      </p>
    </div>
  );
};

export const WithdrawalPage: React.FC<PageProps> = ({ onNavigate }) => (
  <LegalDocumentPage
    documentId="retractation"
    onNavigate={onNavigate}
    renderAfterSection={sectionId => (sectionId === 'exercice' ? <WithdrawalAction /> : null)}
  />
);

/** Bandeau affiché en tête des pages légales si l'identité est incomplète. */
export const LegalContactHint: React.FC = () => (
  <p className="text-[11px] text-[#6B7D98] flex items-center gap-1.5">
    <AlertCircle className="w-3.5 h-3.5" />
    Contact : <a href={`mailto:${EDITOR.email}`} className="underline">{EDITOR.email}</a>
  </p>
);
