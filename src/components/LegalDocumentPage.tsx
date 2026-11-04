import React from 'react';
import { LegalSection } from '../content/legal';
import { ALL_LEGAL_DOCUMENTS, documentText, documentStatus, LegalDocumentId } from '../content/legal';
import { LEGAL_UPDATED_AT, contactEmail } from '../config/editor';
import { FileText, AlertTriangle, ShieldCheck, ArrowUpRight, ChevronRight, Scale, CheckCircle2 } from 'lucide-react';

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
 * Bandeau d'état d'un document.
 *
 * Trois états distincts, jamais confondus :
 *  - `incomplete`            : un champ obligatoire manque — le document ne peut
 *                              pas être publié en l'état ;
 *  - `legal_review_required` : toutes les valeurs sont là, mais un point doit
 *                              être tranché par un professionnel du droit ;
 *  - `complete`              : aucun champ manquant ET aucun point en attente —
 *                              ce qui reste une vérification de configuration,
 *                              pas une certification de conformité.
 */
const DocumentStatusBanner: React.FC<{ validation: ReturnType<typeof documentStatus> }> = ({ validation }) => {
  if (validation.status === 'incomplete') {
    const shown = validation.missing.slice(0, 6);
    const rest = validation.missing.length - shown.length;
    return (
      <div className="mt-5 rounded-xl border border-[#E9AE57]/40 bg-[#E9AE57]/10 p-4">
        <p className="text-[13px] font-semibold text-[#E9AE57] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> Document non finalisé — publication bloquée
        </p>
        <p className="text-[12.5px] text-[#C7D2E5] mt-1.5">
          {validation.missing.length} mention{validation.missing.length > 1 ? 's' : ''} obligatoire
          {validation.missing.length > 1 ? 's' : ''} restent à renseigner. Aucune valeur n’est inventée pour combler
          le vide : les emplacements concernés apparaissent ci-dessous sous la forme « [à compléter] ».
        </p>
        <ul className="mt-2.5 space-y-1">
          {shown.map(issue => (
            <li key={issue.key} className="text-[12px] text-[#C7D2E5] flex gap-2">
              <span className="text-[#E9AE57] shrink-0">•</span>
              <span>{issue.label}</span>
            </li>
          ))}
          {rest > 0 && <li className="text-[12px] text-[#9AAAC0]">… et {rest} autre{rest > 1 ? 's' : ''}.</li>}
        </ul>
        <p className="text-[11px] text-[#9AAAC0] mt-2.5">
          Ces informations sont renseignées dans <code className="font-mono text-[10.5px]">src/config/editor.ts</code> ;
          l’avancement se suit avec <code className="font-mono text-[10.5px]">npm run legal:check</code>.
        </p>
      </div>
    );
  }

  if (validation.status === 'legal_review_required') {
    const shown = validation.reviewNotes.slice(0, 3);
    const rest = validation.reviewNotes.length - shown.length;
    return (
      <div className="mt-5 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 p-4">
        <p className="text-[13px] font-semibold text-[#38BDF8] flex items-center gap-2">
          <Scale className="w-4 h-4 shrink-0" /> Validation juridique requise
        </p>
        <p className="text-[12.5px] text-[#C7D2E5] mt-1.5">
          Les mentions configurées sont renseignées, mais {validation.reviewNotes.length} point
          {validation.reviewNotes.length > 1 ? 's' : ''} doi{validation.reviewNotes.length > 1 ? 'vent' : 't'} être
          tranché{validation.reviewNotes.length > 1 ? 's' : ''} par un professionnel du droit avant de considérer ce
          document comme définitif.
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {shown.map((note, index) => (
            <li key={index} className="text-[12px] text-[#C7D2E5] flex gap-2">
              <span className="text-[#38BDF8] shrink-0">•</span>
              <span>{note}</span>
            </li>
          ))}
          {rest > 0 && <li className="text-[12px] text-[#9AAAC0]">… et {rest} autre{rest > 1 ? 's' : ''} point{rest > 1 ? 's' : ''}.</li>}
        </ul>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-[#38C995]/40 bg-[#38C995]/10 p-4">
      <p className="text-[13px] font-semibold text-[#38C995] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" /> Mentions renseignées
      </p>
      <p className="text-[12.5px] text-[#C7D2E5] mt-1.5">
        Toutes les mentions attendues sont renseignées et aucun point de vérification ne reste ouvert.
        Cette vérification porte sur la configuration : elle ne constitue pas une certification de conformité
        juridique, qui suppose une validation professionnelle.
      </p>
    </div>
  );
};

/**
 * Gabarit commun aux documents légaux.
 * Affiche un avertissement visible tant que l'identité de l'éditeur n'est pas
 * renseignée : un document légal à trous ne doit jamais paraître définitif.
 */
export const LegalDocumentPage: React.FC<LegalDocumentPageProps> = ({ documentId, onNavigate, renderAfterSection }) => {
  const doc = ALL_LEGAL_DOCUMENTS.find(d => d.id === documentId);
  if (!doc) return null;

  const validation = documentStatus(documentId as LegalDocumentId);
  const otherDocs = ALL_LEGAL_DOCUMENTS.filter(d => d.id !== documentId);
  const email = contactEmail();

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

          <DocumentStatusBanner validation={validation} />

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
            <a href={`mailto:${email}`} className="underline hover:text-[#9AAAC0]">{email}</a>
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
