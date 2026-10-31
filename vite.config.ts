import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** Jeton remplacé au build par l'URL publique réelle (voir VITE_SITE_URL). */
const SITE_URL_TOKEN = '__SITE_URL__';
const DEFAULT_SITE_URL = 'https://recovery-os.vercel.app';

/**
 * Remplace __SITE_URL__ dans index.html, robots.txt et sitemap.xml.
 * Évite tout domaine codé en dur : un seul VITE_SITE_URL suffit au déploiement.
 */
function siteUrlPlugin(siteUrl: string): Plugin {
  return {
    name: 'revenue-recovery-site-url',
    transformIndexHtml(html) {
      return html.replaceAll(SITE_URL_TOKEN, siteUrl);
    },
    closeBundle() {
      for (const file of ['robots.txt', 'sitemap.xml']) {
        const target = resolve(rootDir, 'dist', file);
        if (existsSync(target)) {
          writeFileSync(target, readFileSync(target, 'utf8').replaceAll(SITE_URL_TOKEN, siteUrl));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const siteUrl = (process.env.VITE_SITE_URL || env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl)],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      host: true,
      // HMR désactivé uniquement dans les environnements d'édition (DISABLE_HMR=true).
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: true,
      allowedHosts: true as unknown as string[],
    },
  };
});
