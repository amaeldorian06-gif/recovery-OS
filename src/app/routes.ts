import type { PublicRoute } from '../components/Navbar';
import type { WorkspaceSection } from '../components/AppWorkspace';

/**
 * Résolution des chemins — extraite de App.tsx pour être testable.
 *
 * Règle produit : un chemin inconnu ne doit JAMAIS retomber silencieusement sur
 * la page d'accueil (comportement précédent), car cela masque les liens cassés
 * et renvoie un contenu trompeur. Il est explicitement marqué `notfound`.
 */

export type { PublicRoute };

export const PATH_ROUTES: Record<string, PublicRoute> = {
  '/': 'landing',
  '/fonctionnalites': 'features',
  '/apercu': 'preview',
  '/suivi': 'progress',
  '/tarifs': 'pricing',
  '/connexion': 'signin',
  '/inscription': 'signup',
  '/mentions-legales': 'legal',
  '/cgu': 'cgu',
  '/cgv': 'terms',
  '/confidentialite': 'privacy',
  '/retractation': 'withdrawal',
};

export type ResolvedRoute = { route: PublicRoute | 'app'; section: WorkspaceSection };

export const WORKSPACE_SECTIONS: WorkspaceSection[] = [
  'dashboard', 'import', 'aging', 'calculator', 'actions', 'backup', 'settings',
];

export function routeFromPath(path: string): ResolvedRoute {
  const clean = path.replace(/\/+$/, '') || '/';

  if (clean === '/app' || clean.startsWith('/app/')) {
    const sub = clean.replace(/^\/app\/?/, '');
    const section = (WORKSPACE_SECTIONS.includes(sub as WorkspaceSection) ? sub : 'dashboard') as WorkspaceSection;
    return { route: 'app', section };
  }

  const known = PATH_ROUTES[clean];
  if (known) return { route: known, section: 'dashboard' };
  return { route: 'notfound', section: 'dashboard' };
}

/** Chemin canonique d'une route publique (par défaut : accueil). */
export function pathForRoute(route: PublicRoute): string {
  return Object.entries(PATH_ROUTES).find(([, r]) => r === route)?.[0] ?? '/';
}
