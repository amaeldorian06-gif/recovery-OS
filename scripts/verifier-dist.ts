/**
 * Contrôle du dossier de production (`dist/`) avant déploiement.
 *
 * Pourquoi ce script : plusieurs défauts ne se voient qu'après le build, et
 * aucun d'eux ne produit d'erreur au moment de la compilation.
 *
 *  1. **Route oubliée dans `vercel.json`** — une page existe dans le code et
 *     fonctionne en `vite preview` (qui réécrit tout vers `index.html`), mais
 *     renvoie 404 en production parce que la réécriture manque. Ce cas s'est
 *     déjà produit : `/cgu` a dû être ajoutée à la main.
 *  2. **Jeton `__SITE_URL__` non remplacé** — un domaine factice part en
 *     production dans le sitemap ou les métadonnées.
 *  3. **Référence à un asset absent** — page blanche au premier chargement.
 *  4. **`404.html` manquante** — Vercel sert alors sa propre page par défaut.
 *
 * Usage : npm run dist:check (après `npm run build`).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PATH_ROUTES } from '../src/app/routes';

const DIST = 'dist';
let echecs = 0;

function verifier(intitule: string, condition: boolean, detail = ''): void {
  const marque = condition ? 'OK  ' : 'FAIL';
  console.log(`${marque} ${intitule}${!condition && detail ? ` — ${detail}` : ''}`);
  if (!condition) echecs++;
}

const lire = (chemin: string): string => readFileSync(chemin, 'utf8');

/** Assets réellement présents, pour confronter les références des pages. */
const assetsPresents = new Set(
  existsSync(join(DIST, 'assets')) ? readdirSync(join(DIST, 'assets')) : []
);

function referencesAssets(html: string, fichier: string): void {
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(match => match[1])
    .filter(url => url.startsWith('/assets/'))
    .map(url => url.replace('/assets/', ''));

  const manquants = references.filter(nom => !assetsPresents.has(nom));
  verifier(
    `${fichier} : les assets référencés existent`,
    manquants.length === 0,
    manquants.join(', ')
  );
}

console.log('\nContrôle du dossier de production\n' + '─'.repeat(60));

/* ------------------------------------------------------------------ */
/* 1. Fichiers attendus                                                */
/* ------------------------------------------------------------------ */

verifier('dist/index.html présent', existsSync(join(DIST, 'index.html')));
verifier('dist/404.html présent', existsSync(join(DIST, '404.html')));
verifier('dist/sitemap.xml présent', existsSync(join(DIST, 'sitemap.xml')));
verifier('dist/robots.txt présent', existsSync(join(DIST, 'robots.txt')));

if (!existsSync(join(DIST, 'index.html'))) {
  console.log('\nBuild absent : lancer `npm run build` avant ce contrôle.\n');
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* 2. Jeton de domaine remplacé                                        */
/* ------------------------------------------------------------------ */

for (const fichier of ['index.html', '404.html', 'sitemap.xml', 'robots.txt']) {
  if (!existsSync(join(DIST, fichier))) continue;
  const contenu = lire(join(DIST, fichier));
  verifier(`${fichier} : aucun jeton __SITE_URL__ résiduel`, !contenu.includes('__SITE_URL__'));
}

/* ------------------------------------------------------------------ */
/* 3. Assets                                                           */
/* ------------------------------------------------------------------ */

referencesAssets(lire(join(DIST, 'index.html')), 'index.html');
if (existsSync(join(DIST, '404.html'))) {
  referencesAssets(lire(join(DIST, '404.html')), '404.html');
  const page404 = lire(join(DIST, '404.html'));
  verifier('404.html : titre explicite', /Page introuvable/i.test(page404));
  verifier('404.html : autonome (aucun script externe)', !/<script[^>]+src=/i.test(page404));
  verifier('404.html : non indexable', /noindex/i.test(page404));
}

/* ------------------------------------------------------------------ */
/* 4. Cohérence routes ↔ réécritures Vercel                            */
/* ------------------------------------------------------------------ */

const vercel = JSON.parse(lire('vercel.json')) as {
  rewrites?: Array<{ source: string; destination: string }>;
  cleanUrls?: boolean;
  trailingSlash?: boolean;
};

const rewrites = new Map((vercel.rewrites ?? []).map(r => [r.source, r.destination]));

for (const chemin of Object.keys(PATH_ROUTES)) {
  if (chemin === '/') continue; // servi par index.html à la racine
  verifier(
    `route ${chemin} réécrite vers index.html`,
    rewrites.get(chemin) === '/index.html',
    'absente de vercel.json — renverrait 404 en production'
  );
}

verifier(
  'réécriture de l’application /app/:path*',
  rewrites.get('/app/:path*') === '/index.html'
);

const ciblesInconnues = [...rewrites.values()].filter(
  destination => !existsSync(join(DIST, destination.replace(/^\//, '')))
);
verifier(
  'toutes les réécritures pointent vers un fichier existant',
  ciblesInconnues.length === 0,
  ciblesInconnues.join(', ')
);

verifier('cleanUrls activé', vercel.cleanUrls === true);
verifier('trailingSlash désactivé', vercel.trailingSlash === false);

/* ------------------------------------------------------------------ */
/* 5. Sitemap cohérent avec les routes                                 */
/* ------------------------------------------------------------------ */

const sitemap = lire(join(DIST, 'sitemap.xml'));
const urls = [...sitemap.matchAll(/<loc>[^<]*<\/loc>/g)].map(m => m[0]);
verifier('sitemap : au moins une URL', urls.length > 0);

// Le chemin doit être extrait du hostname, pas par une expression paresseuse :
// « //recovery-os.vercel.app/cgu » commencerait alors par « // ».
const cheminsSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(match => {
    try {
      return new URL(match[1].trim()).pathname.replace(/\/+$/, '');
    } catch {
      return match[1].trim();
    }
  })
  .map(chemin => (chemin === '' ? '/' : chemin));

const routesPubliques = new Set([...Object.keys(PATH_ROUTES), '/']);
const cheminsInconnus = cheminsSitemap.filter(chemin => !routesPubliques.has(chemin));
verifier(
  'sitemap : toutes les URL correspondent à une route connue',
  cheminsInconnus.length === 0,
  cheminsInconnus.join(', ')
);

/* ------------------------------------------------------------------ */
/* 6. Robots                                                           */
/* ------------------------------------------------------------------ */

const robots = lire(join(DIST, 'robots.txt'));
verifier('robots.txt : /app/ exclu', /Disallow:\s*\/app\//.test(robots));
verifier('robots.txt : /suivi exclu', /Disallow:\s*\/suivi/.test(robots));
verifier('robots.txt : sitemap déclaré', /Sitemap:\s*https?:\/\//.test(robots));

/* ------------------------------------------------------------------ */
/* Résultat                                                            */
/* ------------------------------------------------------------------ */

console.log('─'.repeat(60));
if (echecs > 0) {
  console.log(`${echecs} contrôle(s) en échec — déploiement à ne pas effectuer.\n`);
  process.exit(1);
}
console.log('Tous les contrôles passent.\n');
