import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration des tests de bout en bout.
 *
 * Pourquoi ce fichier existe : jusqu'ici, aucune interaction réelle n'était
 * vérifiée. `npm run smoke` contrôle le rendu statique (`renderToStaticMarkup`),
 * ce qui ne prouve rien du clic, du presse-papiers, du téléchargement de
 * sauvegarde ni du stockage IndexedDB.
 *
 * Exécution : `npm run e2e` (Chromium uniquement — un seul navigateur suffit à
 * prouver les parcours ; le multi-navigateurs reste manuel, voir
 * docs/MISE-EN-PRODUCTION.md).
 *
 * `reuseExistingServer` : en local, un `vite preview` déjà lancé est réutilisé ;
 * en CI, un serveur existant ne serait pas fiable, il est donc ignoré.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        // Rapport machine : les journaux GitHub ne sont pas toujours
        // téléchargeables, ce fichier alimente des annotations lisibles via l'API.
        ['json', { outputFile: 'test-results/report.json' }],
      ]
    : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Sans borne, un clic impossible consomme tout le budget du test et le message
  // se réduit à « Test timeout » : impossible de savoir quel élément manquait.
  actionTimeout: 15_000,
  navigationTimeout: 20_000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Africa/Douala',
    acceptDownloads: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
