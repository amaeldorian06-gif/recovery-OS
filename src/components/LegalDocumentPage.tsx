import React from 'react';
import { LegalSection } from '../content/legal';
import { ALL_LEGAL_DOCUMENTS, documentText } from '../content/legal';
import { LEGAL_UPDATED_AT, isLegalIdentityIncomplete, missingLegalFields, EDITOR } from '../config/editor';
import { FileText, AlertTriangle, ShieldCheck, ArrowUpRight, ChevronRight } from 'lucide-react';

interface LegalDocumentPageProps {
  /** Identifiant du document dans ALL_LEGAL_DOCUMENTS. */
  documentId: string;
  onNavigate: (path: string) => void;
  /** Contenu supplémentaire inséré après une section donnée (ex. bouton de rétractation). */
  renderAfterSection?: (sectionId: string) => React.ReactNode;
}

function formatFrenchDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}

const Section: React.FC<{ section: LegalSection; anchorPrefix: string }> = ({ section, anchorPrefix }) => (
  <section id={`${anchorPrefix}-${section.id}`} className="scroll-mt-24">
    <h2 className="text-base font-bold text-[#F4F7FB] mt-8 mb-3">{section.title}</h2>
    {section.paragraphs?.map((paragraph, index) => (
      <p key={index} className="text-[13.5px] leading-relaxed text-[#C7D2E5] mb-2.5">{paragraph}</p>
    ))}
    {section.list && (
      <ul className="my-3 space-y-1.5 pl-1">
        {section.list.map((item, index) => (
          <li key={index} className="text-[13.5px] leading-relaxed text-[#C7D2E5] flex gap-2.5">
            <span className="text-[#38BDF8] shrink-0 pt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
);

/**
 * Gabarit commun aux quatre documents légaux.
 * Affiche un avertissement visible tant que l'identité de l'éditeur n'est pas
 * renseignée : un document légal à trous ne doit jamais paraître définitif.
 */
export const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({ documentId, onNavigate, renderAfterSection }) => {
  const doc = ALL_LEGAL_DOCUMENTS.find(d => d.id === documentId);
  if (!doc) return null;

  const incomplete = isLegalIdentityIncomplete();
  const missing = missingLegalFields();
  const otherDocs = ALL_LEGAL_DOCUMENTS.filter(d => d.id !== documentId);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-full text-[#E6EAF2]">
      <div className="max-w-6xl mx-auto px-5 py-10 grid lg:grid-cols-[1fr_260px] gap-10">
        <article className="min-w-0">
          <p className="font-mono text-[11px] tracking-widest text-[#38BDF8] uppercase mb-2">Document contractuel</p>
          <h1 className="text-3xl font-black tracking-tight">{doc.title}</h1>
          <p className="text-xs text-[#6B7D98] mt-2">
            Dernière révision : {formatFrenchDate(LEGAL_UPDATED_AT)} · {documentText(doc.sections).split(/\s+/).length} mots
          </p>

          {incomplete && (
            <div className="mt-5 rounded-xl border border-[#E9AE57]/40 bg-[#E9AE57]/10 p-4">
              <p className="text-[13px] font-semibold text-[#E9AE57] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Document non finalisé
              </p>
              <p className="text-[12.5px] text-[#C7D2E5] mt-1.5">
                Les informations d’identification de l’éditeur ne sont pas encore renseignées
                ({missing.slice(0, 3).join(', ')}{missing.length > 3 ? `, et ${missing.length - 3} autres` : ''}).
                Ce document ne peut pas être publié en l’état : une mention légale inexacte ou incomplète
                engage la responsabilité pénale de l’éditeur (LCEN, article 1-2).
              </p>
            </div>
          )}

          <div className="mt-2">
            {doc.sections.map(section => (
              <React.Fragment key={section.id}>
                <Section section={section} anchorPrefix={doc.id} />
                {section.link && (
                  <button
                    onClick={() => onNavigate(section.link!.path)}
                    className="inline-flex items-center gap-1.5 text-[13px] text-[#38BDF8] hover:underline mt-1 mb-2 cursor-pointer"
                  >
                    {section.link.label} <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {renderAfterSection?.(section.id)}
              </React.Fragment>
            ))}
          </div>

          <div className="mt-10 pt-5 border-t border-white/10 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#6B7D98]">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Version en vigueur au {formatFrenchDate(LEGAL_UPDATED_AT)}</span>
            <button onClick={handlePrint} className="underline hover:text-[#9AAAC0] cursor-pointer">Imprimer / enregistrer en PDF</button>
            <a href={`mailto:${EDITOR.email}`} className="underline hover:text-[#9AAAC0]">{EDITOR.email}</a>
          </div>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <nav className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-2.5">Sommaire</p>
              <ul className="space-y-1">
                {doc.sections.map(section => (
                  <li key={section.id}>
                    <a
                      href={`#${doc.id}-${section.id}`}
                      className="block text-[12.5px] text-[#9AAAC0] hover:text-[#38BDF8] py-0.5 leading-snug"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-2.5">Autres documents</p>
              <ul className="space-y-1.5">
                {otherDocs.map(other => (
                  <li key={other.id}>
                    <button
                      onClick={() => onNavigate(other.path)}
                      className="flex items-center gap-1 text-[12.5px] text-[#9AAAC0] hover:text-[#38BDF8] text-left cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" /> {other.title}
                      <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* Liens inter-documents en bas de page sur mobile */}
      <div className="lg:hidden max-w-6xl mx-auto px-5 pb-10">
        <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7D98] mb-2">Autres documents</p>
          <div className="flex flex-wrap gap-2">
            {otherDocs.map(other => (
              <button
                key={other.id}
                onClick={() => onNavigate(other.path)}
                className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[12px] text-[#C7D2E5] cursor-pointer"
              >
                {other.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
