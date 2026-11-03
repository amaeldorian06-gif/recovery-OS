/**
 * Contrôle de rendu (smoke test) — exécution réelle sans navigateur.
 *
 * Vérifie que les composants critiques produisent bien du HTML cohérent via
 * `renderToStaticMarkup`. Ce n'est PAS un test d'interaction : les parcours
 * cliquables restent à couvrir par Playwright (voir docs/MISE-EN-PRODUCTION.md).
 *
 * Usage : npm run smoke
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotFoundPage } from '../src/components/NotFoundPage';
import { AppErrorBoundary, AppErrorScreen } from '../src/components/AppErrorBoundary';
import { LegalNoticePage, TermsPage, PrivacyPage, WithdrawalPage } from '../src/components/LegalPages';

let failures = 0;

function check(label: string, ok: boolean): void {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failures++;
}

// 1. Page 404 : contenu attendu, aucune valeur technique parasite.
const notFound = renderToStaticMarkup(<NotFoundPage onNavigate={() => {}} path="/une-page-inconnue" />);
// React échappe les apostrophes en &#x27; : on vérifie les fragments stables.
check('404 : titre présent', notFound.includes('Cette page') && notFound.includes('existe pas'));
check('404 : code d’erreur affiché', notFound.includes('ERREUR 404'));
check('404 : chemin fautif affiché', notFound.includes('/une-page-inconnue'));
check('404 : aucun « undefined » ni « NaN »', !notFound.includes('undefined') && !notFound.includes('NaN'));
check('404 : lien de contact rendu', notFound.includes('mailto:'));

// 2. ErrorBoundary : comportement nominal (enfants rendus, pas d'écran d'erreur).
const nominal = renderToStaticMarkup(
  <AppErrorBoundary>
    <div>contenu-normal</div>
  </AppErrorBoundary>
);
check('Boundary : enfants rendus sans erreur', nominal.includes('contenu-normal'));
check('Boundary : aucun écran d’erreur parasite', !nominal.includes("s'est arrêtée"));

// 3. Écran d'erreur fatal : contenu réellement affiché à l'utilisateur.
const boom = new Error('IndexedDB introuvable');
const screen = renderToStaticMarkup(
  <AppErrorScreen error={boom} copied={false} onReload={() => {}} onCopy={() => {}} />
);
check('Erreur : titre affiché', screen.includes('arrêtée sur une erreur'));
check('Erreur : message technique restitué', screen.includes('IndexedDB introuvable'));
check('Erreur : réassurance sur les données locales', screen.includes('ne sont pas supprimées'));
check('Erreur : bouton de rechargement présent', screen.includes('Recharger la page'));
check('Erreur : aucun « undefined » ni « NaN »', !screen.includes('undefined') && !screen.includes('NaN'));

// 4. Contrat React du garde-fou : l'erreur capturée devient l'état de secours.
const derived = AppErrorBoundary.getDerivedStateFromError(boom) as { error: Error };
check('Boundary : getDerivedStateFromError conserve l’erreur', derived.error === boom);

// 5. Documents légaux : rendu réel des quatre pages.
const legalPages = [
  { label: 'Mentions légales', render: <LegalNoticePage onNavigate={() => {}} />, marker: 'Éditeur du site' },
  { label: 'CGV', render: <TermsPage onNavigate={() => {}} />, marker: 'Conditions générales de vente' },
  { label: 'Confidentialité', render: <PrivacyPage onNavigate={() => {}} />, marker: 'Politique de confidentialité' },
  { label: 'Rétractation', render: <WithdrawalPage onNavigate={() => {}} />, marker: 'Droit de rétractation' },
];

for (const page of legalPages) {
  const html = renderToStaticMarkup(page.render);
  check(`${page.label} : page rendue`, html.includes(page.marker));
  check(`${page.label} : aucun « undefined » ni « NaN »`, !html.includes('undefined') && !html.includes('NaN'));
  check(`${page.label} : avertissement de non-finalisation visible`, html.includes('Document non finalisé'));
  check(`${page.label} : sommaire présent`, html.includes('Sommaire'));
}

// 6. Rétractation : la fonctionnalité exigée par le décret n° 2026-3 est présente.
const withdrawalHtml = renderToStaticMarkup(<WithdrawalPage onNavigate={() => {}} />);
check('Rétractation : bouton « Renoncer au contrat ici »', withdrawalHtml.includes('Renoncer au contrat ici'));
check('Rétractation : lien mailto construit', withdrawalHtml.includes('mailto:'));

console.log(failures === 0 ? '\nSMOKE : tous les contrôles passent' : `\nSMOKE : ${failures} échec(s)`);
process.exit(failures === 0 ? 0 : 1);
