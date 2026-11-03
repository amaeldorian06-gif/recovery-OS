import React from 'react';
import { Compass, ArrowRight, Mail, Home, Sparkles, CreditCard } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_MAILTO, CONTACT_IS_PLACEHOLDER } from '../config/brand';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  /** Chemin demandé, affiché pour aider au diagnostic. */
  path?: string;
}

/**
 * Page 404 interne (navigation côté client).
 * Le fichier statique public/404.html couvre les accès directs, pour lesquels
 * Vercel répond un vrai statut HTTP 404 avant que l'application ne se charge.
 */
export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate, path }) => {
  return (
    <div className="min-h-full text-[#E6EAF2] flex items-center justify-center px-5 py-16">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8] mx-auto">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-xs tracking-widest text-[#6B7D98]">ERREUR 404</p>
          <h1 className="text-3xl font-black tracking-tight">Cette page n'existe pas</h1>
          <p className="text-sm text-[#9AAAC0] leading-relaxed">
            L'adresse demandée{path ? <> <span className="font-mono text-[#C7D2E5] break-all">{path}</span></> : null} ne
            correspond à aucune page du produit. Si vous cherchiez votre espace de travail, il se trouve
            sous <span className="font-mono text-[#C7D2E5]">/app/dashboard</span>.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Accueil
          </button>
          <button
            onClick={() => onNavigate('/apercu')}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-[#C7D2E5] flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Aperçu du produit
          </button>
          <button
            onClick={() => onNavigate('/app/dashboard')}
            className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-[#C7D2E5] flex items-center gap-2 cursor-pointer"
          >
            Mon espace <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0B0F17] p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-[#C7D2E5]">Liens utiles</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#9AAAC0]">
            <button onClick={() => onNavigate('/fonctionnalites')} className="hover:text-[#38BDF8] underline cursor-pointer">
              Fonctionnalités
            </button>
            <button onClick={() => onNavigate('/tarifs')} className="hover:text-[#38BDF8] underline cursor-pointer">
              Tarifs
            </button>
            <button onClick={() => onNavigate('/connexion')} className="hover:text-[#38BDF8] underline cursor-pointer">
              Connexion
            </button>
            <button onClick={() => onNavigate('/inscription')} className="hover:text-[#38BDF8] underline cursor-pointer flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> Créer un espace
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#6B7D98] flex items-center justify-center gap-1.5">
          <Mail className="w-3.5 h-3.5" />
          Un lien cassé ? Signalez-le :{' '}
          <a href={CONTACT_MAILTO} className="underline hover:text-[#9AAAC0]">{CONTACT_EMAIL}</a>
          {CONTACT_IS_PLACEHOLDER && <span className="text-[#E9AE57]">(adresse à configurer)</span>}
        </p>
      </div>
    </div>
  );
};
