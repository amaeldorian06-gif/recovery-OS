import React, { useMemo, useState } from 'react';
import {
  EDITOR_CONFIG,
  EDITOR_TYPE_LABELS,
  FIELD_STATE_LABELS,
  FieldState,
  displayField,
  editorAddressLine,
  editorCountry,
  toConfigLiteral,
  validationSummary,
} from '../config/editor';
import { CHANNEL_ROLE_LABELS } from '../config/channels';
import { AlertTriangle, Check, CheckCircle2, ClipboardCopy, FileText, Scale, XCircle } from 'lucide-react';

/**
 * Console de configuration juridique (interne, non référencée).
 *
 * Elle ne prétend pas rendre le site conforme : elle montre, champ par champ,
 * ce qui est renseigné, ce qui est sans objet, ce qui manque et ce qui reste à
 * faire valider. Aucune valeur n'y est modifiable : la configuration est
 * compilée avec l'application, et le bloc à coller est fourni pour éviter les
 * allers-retours manuels.
 */

const STATE_STYLE: Record<FieldState, { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }> = {
  provided: { label: FIELD_STATE_LABELS.provided, cls: 'text-[#38C995] bg-[#38C995]/10 border-[#38C995]/30', icon: CheckCircle2 },
  not_applicable: { label: FIELD_STATE_LABELS.not_applicable, cls: 'text-[#9AAAC0] bg-white/5 border-white/15', icon: XCircle },
  to_complete: { label: FIELD_STATE_LABELS.to_complete, cls: 'text-[#E9AE57] bg-[#E9AE57]/10 border-[#E9AE57]/30', icon: AlertTriangle },
  legal_review_required: { label: FIELD_STATE_LABELS['legal_review_required'], cls: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30', icon: Scale },
};

const DOC_STATUS_STYLE = {
  complete: { label: 'Mentions renseignées', cls: 'text-[#38C995] bg-[#38C995]/10 border-[#38C995]/30' },
  incomplete: { label: 'Incomplet — publication bloquée', cls: 'text-[#E9AE57] bg-[#E9AE57]/10 border-[#E9AE57]/30' },
  legal_review_required: { label: 'Validation juridique requise', cls: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30' },
} as const;

interface LegalConfigPanelProps {
  onNavigate: (path: string) => void;
}

export const LegalConfigPanel: React.FC<LegalConfigPanelProps> = ({ onNavigate }) => {
  const summary = useMemo(() => validationSummary(), []);
  const [copied, setCopied] = useState(false);
  const literal = useMemo(() => toConfigLiteral(), []);
  const country = editorCountry();

  const fields: Array<{ label: string; value: string; state: FieldState; note?: string }> = [
    { label: 'Nom légal', value: displayField(EDITOR_CONFIG.identity.legalName), state: EDITOR_CONFIG.identity.legalName.state },
    { label: 'Nom commercial', value: displayField(EDITOR_CONFIG.identity.tradeName), state: EDITOR_CONFIG.identity.tradeName.state },
    { label: 'Adresse', value: editorAddressLine(), state: EDITOR_CONFIG.identity.address.state },
    { label: 'Code postal', value: displayField(EDITOR_CONFIG.identity.postalCode), state: EDITOR_CONFIG.identity.postalCode.state, note: EDITOR_CONFIG.identity.postalCode.note },
    { label: 'Téléphone', value: displayField(EDITOR_CONFIG.identity.phone), state: EDITOR_CONFIG.identity.phone.state },
    { label: 'Courriel', value: displayField(EDITOR_CONFIG.identity.email), state: EDITOR_CONFIG.identity.email.state },
    {
      label: EDITOR_CONFIG.registration.identifierLabel,
      value: displayField(EDITOR_CONFIG.registration.identifier),
      state: EDITOR_CONFIG.registration.identifier.state,
    },
    { label: 'Identifiant fiscal', value: displayField(EDITOR_CONFIG.registration.taxNumber), state: EDITOR_CONFIG.registration.taxNumber.state },
    { label: 'Capital social', value: displayField(EDITOR_CONFIG.registration.capital), state: EDITOR_CONFIG.registration.capital.state, note: EDITOR_CONFIG.registration.capital.note },
    { label: 'Registre national', value: displayField(EDITOR_CONFIG.registration.domesticRegistry), state: EDITOR_CONFIG.registration.domesticRegistry.state, note: EDITOR_CONFIG.registration.domesticRegistry.note },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(literal);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const overall = summary.structurallyComplete
    ? summary.legalReviewRequired
      ? { label: 'Mentions complètes — validation juridique en attente', tone: 'sky' as const }
      : { label: 'Mentions complètes', tone: 'green' as const }
    : { label: `Incomplet — ${summary.missingFields.length} champ(s) manquant(s)`, tone: 'amber' as const };

  const toneCls = {
    amber: 'border-[#E9AE57]/40 bg-[#E9AE57]/10 text-[#E9AE57]',
    sky: 'border-[#38BDF8]/40 bg-[#38BDF8]/10 text-[#38BDF8]',
    green: 'border-[#38C995]/40 bg-[#38C995]/10 text-[#38C995]',
  }[overall.tone];

  return (
    <section className="rounded-xl border border-white/10 bg-[#0B0F17] p-5 mb-6" id="conformite">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#38BDF8]" /> Configuration juridique de l’éditeur
        </h2>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${toneCls}`}>{overall.label}</span>
      </div>

      <p className="text-[12.5px] text-[#9AAAC0] mb-4 max-w-2xl">
        {EDITOR_TYPE_LABELS[EDITOR_CONFIG.type]} · {country.name}. Chaque valeur porte un état explicite : « sans objet »
        n’est jamais une case vide, et une donnée absente n’est jamais remplacée par une valeur plausible.
      </p>

      {/* Champs */}
      <div className="rounded-lg border border-white/10 overflow-hidden mb-5">
        <table className="w-full text-[12.5px]">
          <tbody>
            {fields.map(field => {
              const style = STATE_STYLE[field.state];
              return (
                <tr key={field.label} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2 text-[#9AAAC0] w-[42%]">{field.label}</td>
                  <td className="px-3 py-2 text-[#E6EAF2] break-words">{field.value}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${style.cls}`}>
                      <style.icon className="w-3 h-3" /> {style.label}
                    </span>
                    {field.note && field.state !== 'provided' && (
                      <span className="block text-[10.5px] text-[#6B7D98] mt-1 max-w-[220px] whitespace-normal text-left ml-auto">{field.note}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Documents */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-2">Documents publiés</p>
      <ul className="grid sm:grid-cols-2 gap-2 mb-5">
        {summary.documents.map(doc => {
          const style = DOC_STATUS_STYLE[doc.status];
          return (
            <li key={doc.id} className="rounded-lg border border-white/5 bg-[#111726] p-3">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => onNavigate(doc.path)}
                  className="text-left text-[12.5px] text-[#C7D2E5] hover:text-[#38BDF8] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" /> {doc.title}
                </button>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${style.cls}`}>{style.label}</span>
              </div>
              {doc.missing.length > 0 && (
                <p className="text-[11px] text-[#9AAAC0] mt-1.5">
                  Manque : {doc.missing.slice(0, 3).map(issue => issue.label).join(', ')}
                  {doc.missing.length > 3 ? `, +${doc.missing.length - 3}` : ''}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Points de validation */}
      {summary.reviewNotes.length > 0 && (
        <div className="rounded-lg border border-[#38BDF8]/25 bg-[#38BDF8]/5 p-3 mb-5">
          <p className="text-[12px] font-semibold text-[#38BDF8] mb-1.5 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5" /> {summary.reviewNotes.length} point(s) à validation juridique
          </p>
          <ul className="space-y-1.5">
            {summary.reviewNotes.map((note, index) => (
              <li key={index} className="text-[11.5px] text-[#C7D2E5] flex gap-2">
                <span className="text-[#38BDF8] shrink-0">{index + 1}.</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Canaux */}
      <div className="rounded-lg border border-white/10 p-3 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-1.5">Canaux de distribution</p>
        <ul className="space-y-1">
          {EDITOR_CONFIG.channels.map(channel => (
            <li key={channel.id} className="text-[11.5px] text-[#C7D2E5]">
              <span className="font-semibold">{channel.name}</span> — {CHANNEL_ROLE_LABELS[channel.role]}
              {!channel.roleVerified && <span className="text-[#E9AE57]"> · à établir contractuellement</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Fiscalité */}
      <div className="rounded-lg border border-white/10 p-3 mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-1.5">Fiscalité</p>
        <p className="text-[11.5px] text-[#C7D2E5]">
          Régime : <span className="font-mono">{EDITOR_CONFIG.tax.regime}</span>
        </p>
        <p className="text-[11px] text-[#9AAAC0] mt-1">{EDITOR_CONFIG.tax.note}</p>
      </div>

      {/* Bloc de configuration */}
      <details className="rounded-lg border border-white/10 p-3">
        <summary className="text-[11.5px] font-semibold text-[#9AAAC0] cursor-pointer">
          Bloc de configuration à coller dans <code className="font-mono text-[10.5px]">src/config/editor.ts</code>
        </summary>
        <div className="mt-3">
          <button
            onClick={() => void copy()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-[11.5px] text-[#C7D2E5] hover:bg-white/10 cursor-pointer mb-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#38C995]" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier le bloc'}
          </button>
          <pre className="text-[10.5px] leading-relaxed text-[#9AAAC0] bg-[#070B20] rounded-lg p-3 overflow-auto max-h-64">
            {literal}
          </pre>
          <p className="text-[10.5px] text-[#6B7D98] mt-2">
            La console ne modifie pas le site déployé : toute modification exige un nouveau build et une revue
            professionnelle des points ouverts.
          </p>
        </div>
      </details>
    </section>
  );
};
