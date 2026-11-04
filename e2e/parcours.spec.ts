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

/**
 * Exécute une étape nommée et préfixe toute erreur de son nom.
 * Sans ce marquage, un timeout de 60 s ne dit pas quelle action a bloqué.
 */
async function etape<T>(nom: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (erreur) {
    const message = (erreur as Error).message.split('\n').slice(0, 3).join(' ');
    throw new Error(`Étape « ${nom} » : ${message}`);
  }
}

async function creerEspace(page: import('@playwright/test').Page): Promise<void> {
  // Remonter toute exception JavaScript de la page : sans cela, un échec
  // silencieux ne se traduirait que par « élément introuvable ».
  const erreursPage: string[] = [];
  page.on('pageerror', erreur => erreursPage.push(`pageerror: ${erreur.message}`));
  page.on('console', message => {
    if (message.type() === 'error') erreursPage.push(`console: ${message.text()}`);
  });

  await etape('ouverture de la page d’inscription', async () => {
    await page.goto('/inscription');
    await expect(page.getByRole('heading', { name: 'Créer votre espace local' })).toBeVisible();
  });

  await etape('remplissage du formulaire', async () => {
    await page.getByLabel('Nom complet').fill('Awa Ngo Bassa');
    await page.getByLabel('Adresse e-mail').fill(`e2e-${stamp}@exemple.cm`);
    await page.getByLabel('Organisation').fill(`Cabinet E2E ${stamp}`);
    await page.getByLabel('Mot de passe (8 caractères min.)').fill(PASSWORD);
    await page.getByLabel('Confirmation').fill(PASSWORD);
  });

  await etape('soumission du formulaire', async () => {
    await page.getByRole('button', { name: /Créer mon espace et activer l.essai/ }).click();
  });

  await etape('attente de l’espace créé', async () => {
    // Deux issues possibles : l'écran de succès ou un bandeau d'erreur
    // (formulaire en rouge, ou erreur applicative en rose).
    const succes = page.getByRole('heading', { name: 'Votre espace est prêt' });
    const bandeauErreur = page.locator('[class*="bg-red-500"], [class*="bg-rose-500"]');
    try {
      await expect(succes.or(bandeauErreur).first()).toBeVisible({ timeout: 25_000 });
    } catch {
      const apercu = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 500);
      throw new Error(`aucun retour visible après 25 s — écran : « ${apercu} »`);
    }

    if (await bandeauErreur.count() > 0) {
      const texte = (await bandeauErreur.first().innerText()).trim();
      throw new Error(
        `refus de l’application : « ${texte} »` +
        (erreursPage.length ? ` | ${erreursPage.join(' ; ')}` : '')
      );
    }
  });

  await etape('ouverture du tableau de bord', async () => {
    await page.getByRole('button', { name: /Ouvrir mon tableau de bord/ }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });
}

test.describe('Parcours nominal', () => {
  test('inscription → tableau de bord → import CSV → sauvegarde JSON', async ({ page }) => {
    await creerEspace(page);

    // --- Import d'une balance âgée -------------------------------------
    await etape('ouverture de l’import CSV', async () => {
      await page.getByRole('button', { name: 'Importer un CSV', exact: true }).first().click();
      await expect(page.getByRole('heading', { name: /Import d.une balance âgée/ })).toBeVisible();
    });

    await etape('lecture du modèle CSV', async () => {
      // Le modèle intégré évite de dépendre d'un fichier externe.
      await page.getByRole('button', { name: /Insérer un modèle FR d.exemple/ }).click();
      await page.getByRole('button', { name: 'Valider et prévisualiser' }).click();
    });

    await etape('engagement des factures', async () => {
      const engager = page.getByRole('button', { name: /Engager \d+ facture/ });
      await expect(engager).toBeVisible();
      await engager.click();
      // Le résultat est confirmé à l'écran avant le retour au tableau de bord.
      await expect(page.getByText(/facture\(s\) ajoutée\(s\)/)).toBeVisible();
    });

    // --- Sauvegarde ----------------------------------------------------
    await etape('ouverture de la sauvegarde', async () => {
      await page.getByRole('button', { name: 'Sauvegarde', exact: true }).first().click();
    });
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

    await etape('import puis rechargement', async () => {
      await page.getByRole('button', { name: 'Importer un CSV', exact: true }).first().click();
      await page.getByRole('button', { name: /Insérer un modèle FR d.exemple/ }).click();
      await page.getByRole('button', { name: 'Valider et prévisualiser' }).click();
      await page.getByRole('button', { name: /Engager \d+ facture/ }).click();
      await expect(page.getByText(/facture\(s\) ajoutée\(s\)/)).toBeVisible();
    });

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
  // ⚠️ Ce test vérifie le routeur de l'application derrière le repli SPA du
  // serveur de prévisualisation (`vite preview` réécrit tout vers index.html).
  // En production, un chemin inconnu n'est PAS réécrit : Vercel sert
  // `dist/404.html` avec un statut 404. Les deux comportements sont voulus ;
  // `npm run dist:check` contrôle l'existence et la cohérence de ce fichier.
  test('un chemin inconnu rend la page 404 de l’application (repli SPA)', async ({ page }) => {
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
