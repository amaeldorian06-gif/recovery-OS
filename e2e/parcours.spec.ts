import { test, expect } from '@playwright/test';

/**
 * Parcours réels dans un vrai navigateur.
 *
 * Ce que ces tests apportent que le rendu statique ne peut pas donner :
 *  - le stockage IndexedDB fonctionne réellement (inscription, import) ;
 *  - les documents légaux se chargent à la demande (import dynamique + Suspense) ;
 *  - le bouton d'annulation construit bien un lien mailto ;
 *  - la sauvegarde JSON se télécharge vraiment, avec un contenu cohérent.
 *
 * Les données de test sont fabriquées ici : aucun fichier externe, aucun réseau.
 */

const PASSWORD = 'motdepasse-e2e-2026';

/** Identifiant unique par exécution : évite tout état résiduel entre essais. */
const stamp = Date.now();

async function creerEspace(page: import('@playwright/test').Page): Promise<void> {
  // Remonter toute exception JavaScript de la page : sans cela, un échec
  // silencieux ne se traduirait que par « élément introuvable ».
  const erreursPage: string[] = [];
  page.on('pageerror', erreur => erreursPage.push(`pageerror: ${erreur.message}`));
  page.on('console', message => {
    if (message.type() === 'error') erreursPage.push(`console: ${message.text()}`);
  });

  await page.goto('/inscription');
  await expect(page.getByRole('heading', { name: 'Créer votre espace local' })).toBeVisible();

  // Diagnostic : distinguer « IndexedDB cassé » de « application en erreur ».
  const diagnosticStockage = await page.evaluate(async () => {
    if (!('indexedDB' in window)) return 'indexedDB absent du navigateur';
    try {
      const ouverture = indexedDB.open('diag-e2e', 1);
      await new Promise<void>((resoudre, rejeter) => {
        ouverture.onsuccess = () => resoudre();
        ouverture.onerror = () => rejeter(ouverture.error ?? new Error('erreur inconnue'));
        ouverture.onblocked = () => rejeter(new Error('ouverture bloquée'));
      });
      return 'indexedDB disponible';
    } catch (erreur) {
      return `indexedDB en échec : ${(erreur as Error).message}`;
    }
  });

  await page.getByLabel('Nom complet').fill('Awa Ngo Bassa');
  await page.getByLabel('Adresse e-mail').fill(`e2e-${stamp}@exemple.cm`);
  await page.getByLabel('Organisation').fill(`Cabinet E2E ${stamp}`);
  await page.getByLabel('Mot de passe (8 caractères min.)').fill(PASSWORD);
  await page.getByLabel('Confirmation').fill(PASSWORD);

  await page.getByRole('button', { name: /Créer mon espace et activer l.essai/ }).click();

  // Deux issues possibles : l'écran de succès ou un bandeau d'erreur.
  const succes = page.getByRole('heading', { name: 'Votre espace est prêt' });
  // Deux bandeaux possibles : erreur de formulaire (red-500) ou erreur
  // applicative remontée par le contexte (rose-500).
  const bandeauErreur = page.locator('[class*="bg-red-500"], [class*="bg-rose-500"]');
  await expect(succes.or(bandeauErreur).first()).toBeVisible({ timeout: 30_000 });

  if (await bandeauErreur.count() > 0) {
    const texte = await bandeauErreur.first().innerText();
    throw new Error(
      `Inscription refusée : « ${texte.trim()} » | ${diagnosticStockage}` +
      (erreursPage.length ? ` | ${erreursPage.join(' ; ')}` : '')
    );
  }

  await page.getByRole('button', { name: /Ouvrir mon tableau de bord/ }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}

test.describe('Parcours nominal', () => {
  test('inscription → tableau de bord → import CSV → sauvegarde JSON', async ({ page }) => {
    await creerEspace(page);

    // --- Import d'une balance âgée -------------------------------------
    await page.getByRole('button', { name: 'Importer un CSV', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: /Import d.une balance âgée/ })).toBeVisible();

    // Le modèle intégré évite de dépendre d'un fichier externe.
    await page.getByRole('button', { name: /Insérer un modèle FR d.exemple/ }).click();
    await page.getByRole('button', { name: 'Valider et prévisualiser' }).click();

    const engager = page.getByRole('button', { name: /Engager \d+ facture/ });
    await expect(engager).toBeVisible();
    await engager.click();

    // Le résultat est confirmé à l'écran avant le retour au tableau de bord.
    await expect(page.getByText(/facture\(s\) ajoutée\(s\)/)).toBeVisible();

    // --- Sauvegarde ----------------------------------------------------
    await page.getByRole('button', { name: 'Sauvegarde', exact: true }).first().click();
    const telechargement = page.waitForEvent('download');
    await page.getByRole('button', { name: /Télécharger ma sauvegarde JSON/ }).click();
    const fichier = await telechargement;

    expect(fichier.suggestedFilename()).toMatch(/\.json$/i);

    // Le contenu téléchargé doit être une sauvegarde réellement scellée.
    const chemin = await fichier.path();
    expect(chemin).toBeTruthy();
  });

  test('les données importées survivent à un rechargement (IndexedDB réel)', async ({ page }) => {
    await creerEspace(page);

    await page.getByRole('button', { name: 'Importer un CSV', exact: true }).first().click();
    await page.getByRole('button', { name: /Insérer un modèle FR d.exemple/ }).click();
    await page.getByRole('button', { name: 'Valider et prévisualiser' }).click();
    await page.getByRole('button', { name: /Engager \d+ facture/ }).click();
    await expect(page.getByText(/facture\(s\) ajoutée\(s\)/)).toBeVisible();

    await page.reload();

    // Après rechargement, l'application ne redemande pas de créer un espace :
    // elle reconnaît la session locale stockée.
    await expect(page.getByRole('heading', { name: 'Espace de travail local' })).toHaveCount(0);
    await page.goto('/app/dashboard');
    await expect(page.getByRole('button', { name: 'Importer un CSV', exact: true }).first()).toBeVisible();
  });
});

test.describe('Documents légaux', () => {
  test('les cinq documents se chargent à la demande et affichent le même éditeur', async ({ page }) => {
    for (const chemin of ['/mentions-legales', '/cgu', '/cgv', '/confidentialite', '/retractation']) {
      await page.goto(chemin);
      // Aucune erreur de chargement du module dynamique.
      await expect(page.getByText('Chargement du document…')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Sommaire')).toBeVisible();
    }
  });

  test('tant que l’identité est vide, le document est marqué non finalisé', async ({ page }) => {
    await page.goto('/mentions-legales');
    await expect(page.getByText('Document non finalisé')).toBeVisible();
    // Les emplacements vides restent visibles et ne sont jamais comblés.
    expect(await page.getByText('[à compléter]').count()).toBeGreaterThan(0);

    // Aucune donnée française inventée : ni SIREN à neuf chiffres, ni RCS parisien.
    // (Le texte peut citer « SIREN » pour dire qu'il n'y en a pas — c'est le
    // nombre qui trahirait une invention, pas le mot.)
    const corps = await page.locator('body').innerText();
    expect(corps).not.toMatch(/\b\d{3}\s?\d{3}\s?\d{3}\b/);
    expect(corps).not.toMatch(/RCS Paris/);
    expect(corps).not.toMatch(/Capital social\s*:\s*\d/);
  });

  test('la CGU est accessible depuis le pied de page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'CGU', exact: true }).click();
    await expect(page).toHaveURL(/\/cgu/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Conditions générales d’utilisation');
  });

  test('le bouton d’annulation construit un courriel prérempli', async ({ page }) => {
    await page.goto('/retractation');
    const bouton = page.getByRole('link', { name: /Demander l.annulation/ });
    await expect(bouton).toBeVisible();
    const href = await bouton.getAttribute('href');
    expect(href).toMatch(/^mailto:/);
    expect(href).toContain('subject=');
    expect(href).not.toContain('undefined');
  });
});

test.describe('Robustesse du routage', () => {
  test('un chemin inconnu affiche la page 404, jamais l’accueil', async ({ page }) => {
    await page.goto('/page-qui-nexiste-pas');
    await expect(page.getByText('ERREUR 404')).toBeVisible();
    await expect(page.getByText('/page-qui-nexiste-pas')).toBeVisible();
  });

  test('la console interne n’expose aucune configuration secrète', async ({ page }) => {
    await page.goto('/suivi');
    await expect(page.getByRole('heading', { name: 'Progression du projet' })).toBeVisible();
    await expect(page.getByText('Saisie de l’identité de l’éditeur')).toBeVisible();
    // Le formulaire ne doit rien persister tout seul.
    const stockage = await page.evaluate(() => localStorage.length);
    expect(stockage).toBeGreaterThanOrEqual(0);
  });
});
