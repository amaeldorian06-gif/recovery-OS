import React, { useMemo, useState } from 'react';
import {
  EDITOR_TYPE_LABELS,
  EditorType,
  TaxRegime,
  toConfigLiteral,
  validateDocument,
  DocumentId,
} from '../config/editor';
import {
  DRAFT_LABELS,
  DraftTextField,
  EMPTY_DRAFT,
  EditorDraft,
  TAX_REGIME_LABELS,
  applicabilityFor,
  buildConfigFromDraft,
  draftIsUsable,
  identifierLabelFor,
  validateDraft,
} from '../config/editorBuilder';
import { JURISDICTIONS, getJurisdiction } from '../config/jurisdictions';
import { AlertTriangle, Check, ClipboardCopy, Copy, RotateCcw, UserRound } from 'lucide-react';

/**
 * Constructeur d'identité légale (console interne, non référencée).
 *
 * Saisie en mémoire uniquement : rien n'est écrit dans le navigateur ni envoyé
 * à un serveur. Fermer la page efface le formulaire.
 *
 * Le formulaire n'a pas pour but de « remplir » le site : il produit le bloc
 * TypeScript à coller dans `src/config/editor.ts`, qui exige un nouveau build.
 * Aucune de ces valeurs n'apparaît en production sans passer par ce chemin.
 */

const DOCUMENT_IDS: DocumentId[] = ['mentions-legales', 'cgu', 'cgv', 'confidentialite', 'retractation'];

const DOC_STATUS = {
  complete: { label: 'mentions complètes', cls: 'text-[#38C995] bg-[#38C995]/10 border-[#38C995]/30' },
  incomplete: { label: 'incomplet', cls: 'text-[#E9AE57] bg-[#E9AE57]/10 border-[#E9AE57]/30' },
  legal_review_required: { label: 'relecture requise', cls: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30' },
} as const;

/** Ordre d'affichage des champs texte. */
const FIELD_ORDER: DraftTextField[] = [
  'legalName',
  'tradeName',
  'address',
  'postalCode',
  'city',
  'phone',
  'email',
  'identifier',
  'taxNumber',
  'capital',
  'domesticRegistry',
  'publicationDirector',
];

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-white/10 bg-[#070B20] text-[12.5px] text-[#E6EAF2] ' +
  'placeholder:text-[#4B5A72] focus:outline-none focus:border-[#38BDF8]/60';

export const LegalIdentityBuilder: React.FC = () => {
  const [draft, setDraft] = useState<EditorDraft>(EMPTY_DRAFT);
  const [copied, setCopied] = useState(false);

  const issues = useMemo(() => validateDraft(draft), [draft]);
  const errors = issues.filter(issue => issue.severity === 'error');
  const warnings = issues.filter(issue => issue.severity === 'warning');
  const usable = draftIsUsable(draft);

  const config = useMemo(() => buildConfigFromDraft(draft), [draft]);
  const documents = useMemo(() => DOCUMENT_IDS.map(id => validateDocument(config, id)), [config]);
  const literal = useMemo(() => toConfigLiteral(config), [config]);

  const jurisdiction = getJurisdiction(draft.countryCode);
  const identifierLabel = identifierLabelFor(draft.type, jurisdiction);

  const update = (key: DraftTextField, value: string) => {
    setDraft(current => ({ ...current, [key]: value }));
    setCopied(false);
  };

  const copy = async () => {
    if (!usable) return;
    try {
      await navigator.clipboard.writeText(literal);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const issueFor = (key: DraftTextField) => issues.filter(issue => issue.field === key);

  return (
    <section className="rounded-xl border border-white/10 bg-[#0B0F17] p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <UserRound className="w-4 h-4 text-[#38BDF8]" /> Saisie de l’identité de l’éditeur
        </h2>
        <button
          onClick={() => { setDraft(EMPTY_DRAFT); setCopied(false); }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-[11px] text-[#9AAAC0] hover:bg-white/10 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Réinitialiser
        </button>
      </div>

      <p className="text-[12px] text-[#9AAAC0] mb-4 max-w-2xl">
        Saisie <strong className="text-[#C7D2E5]">en mémoire uniquement</strong> : rien n’est enregistré dans le
        navigateur ni transmis. Les champs sans objet pour le type d’éditeur ou le pays disparaissent au lieu d’être
        réclamés à tort.
      </p>

      {/* Type d'éditeur */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-1.5">Type d’éditeur</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(EDITOR_TYPE_LABELS) as EditorType[]).map(type => (
          <button
            key={type}
            onClick={() => { setDraft(current => ({ ...current, type })); setCopied(false); }}
            className={`px-3 py-1.5 rounded-lg border text-[11.5px] cursor-pointer ${
              draft.type === type
                ? 'border-[#38BDF8]/60 bg-[#38BDF8]/15 text-[#38BDF8] font-semibold'
                : 'border-white/10 bg-white/5 text-[#9AAAC0] hover:bg-white/10'
            }`}
          >
            {EDITOR_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Pays + régime fiscal */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98]">Pays d’établissement</span>
          <select
            value={draft.countryCode}
            onChange={event => { setDraft(current => ({ ...current, countryCode: event.target.value })); setCopied(false); }}
            className={`${inputCls} mt-1`}
          >
            {Object.values(JURISDICTIONS).map(item => (
              <option key={item.code} value={item.code}>{item.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98]">Régime de taxe</span>
          <select
            value={draft.taxRegime}
            onChange={event => {
              setDraft(current => ({ ...current, taxRegime: event.target.value as TaxRegime }));
              setCopied(false);
            }}
            className={`${inputCls} mt-1`}
          >
            {(Object.keys(TAX_REGIME_LABELS) as TaxRegime[]).map(regime => (
              <option key={regime} value={regime}>{TAX_REGIME_LABELS[regime]}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Champs */}
      <div className="grid sm:grid-cols-2 gap-3">
        {FIELD_ORDER.map(key => {
          const applicability = applicabilityFor(key, draft);
          const fieldIssues = issueFor(key);
          const hasError = fieldIssues.some(issue => issue.severity === 'error');
          const label = key === 'identifier' ? identifierLabel : DRAFT_LABELS[key];

          if (!applicability.applicable) {
            return (
              <div
                key={key}
                className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5"
                title={applicability.reason}
              >
                <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7D98]">
                  {label}
                </span>
                <span className="block text-[11.5px] text-[#6B7D98] mt-0.5">Sans objet</span>
                <span className="block text-[10.5px] text-[#4B5A72] mt-0.5 leading-snug">{applicability.reason}</span>
              </div>
            );
          }

          return (
            <label key={key} className="block">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-[#6B7D98]">
                {label}
              </span>
              <input
                type={key === 'email' ? 'email' : 'text'}
                value={draft[key]}
                onChange={event => update(key, event.target.value)}
                placeholder={key === 'legalName' ? 'Prénom NOM' : ''}
                className={`${inputCls} mt-1 ${hasError ? 'border-[#E9AE57]/60' : ''}`}
              />
              {fieldIssues.map((issue, index) => (
                <span
                  key={index}
                  className={`block text-[10.5px] mt-1 ${
                    issue.severity === 'error' ? 'text-[#E9AE57]' : 'text-[#38BDF8]'
                  }`}
                >
                  {issue.message}
                </span>
              ))}
            </label>
          );
        })}
      </div>

      {/* État des documents */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mt-5 mb-2">
        Effet sur les documents
      </p>
      <ul className="flex flex-wrap gap-1.5 mb-4">
        {documents.map(doc => {
          const style = DOC_STATUS[doc.status];
          return (
            <li
              key={doc.id}
              className={`text-[10.5px] px-2 py-1 rounded-full border ${style.cls}`}
              title={doc.missing.map(issue => issue.label).join(', ') || undefined}
            >
              {doc.title} · {style.label}
            </li>
          );
        })}
      </ul>

      {errors.length > 0 && (
        <p className="text-[11.5px] text-[#E9AE57] flex items-start gap-2 mb-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {errors.length} champ(s) à corriger avant de pouvoir copier la configuration.
        </p>
      )}
      {warnings.length > 0 && (
        <ul className="text-[11px] text-[#38BDF8] space-y-1 mb-3">
          {warnings.map((issue, index) => (
            <li key={index}>• {issue.message}</li>
          ))}
        </ul>
      )}

      {/* Bloc de configuration */}
      <details className="rounded-lg border border-white/10 p-3">
        <summary className="text-[11.5px] font-semibold text-[#9AAAC0] cursor-pointer">
          Bloc à coller dans <code className="font-mono text-[10.5px]">src/config/editor.ts</code>
        </summary>
        <div className="mt-3">
          <button
            onClick={() => void copy()}
            disabled={!usable}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11.5px] mb-2 ${
              usable
                ? 'border-white/15 bg-white/5 text-[#C7D2E5] hover:bg-white/10 cursor-pointer'
                : 'border-white/5 bg-white/[0.02] text-[#4B5A72] cursor-not-allowed'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#38C995]" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : usable ? 'Copier le bloc' : 'Corriger les champs en rouge'}
          </button>
          <pre className="text-[10.5px] leading-relaxed text-[#9AAAC0] bg-[#070B20] rounded-lg p-3 overflow-auto max-h-72">
            {literal}
          </pre>
          <p className="text-[10.5px] text-[#6B7D98] mt-2 flex items-start gap-1.5">
            <Copy className="w-3 h-3 shrink-0 mt-0.5" />
            collez ce bloc à la place de <code className="font-mono">EDITOR_CONFIG</code>, puis lancez
            <code className="font-mono"> npm run legal:check</code> et un nouveau build.
          </p>
        </div>
      </details>
    </section>
  );
};
