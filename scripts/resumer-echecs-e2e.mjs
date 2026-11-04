/**
 * Résumé des échecs Playwright sous forme d'annotations GitHub.
 *
 * Pourquoi : les journaux de workflow et les artefacts ne sont pas toujours
 * accessibles (réseau restreint). Les annotations, elles, le sont via l'API
 * `check-runs/{id}/annotations`. Sans ce résumé, un échec ne serait qu'un
 * « exit code 1 » opaque.
 */
import { readFileSync } from 'node:fs';

const chemin = 'test-results/report.json';

let rapport;
try {
  rapport = JSON.parse(readFileSync(chemin, 'utf8'));
} catch {
  console.log('::error::Rapport Playwright introuvable — impossible de détailler les échecs.');
  process.exit(0);
}

const echecs = [];

/** Parcourt récursivement l'arbre de suites du rapport JSON. */
function visiter(suite, parents = []) {
  const cheminSuites = suite.title ? [...parents, suite.title] : parents;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const result of test.results ?? []) {
        if (result.status === 'passed' || result.status === 'skipped') continue;
        const message = (result.error?.message ?? 'échec sans message').replace(/\u001b\[[0-9;]*m/g, '');
        echecs.push({
          titre: [...cheminSuites, spec.title].join(' › '),
          statut: result.status,
          message: message.split('\n').slice(0, 4).join('\n'),
        });
      }
    }
  }
  for (const enfant of suite.suites ?? []) visiter(enfant, cheminSuites);
}

for (const suite of rapport.suites ?? []) visiter(suite);

const echappe = texte => texte.replace(/%/g, '%25').replace(/\r?\n/g, '%0A');

if (echecs.length === 0) {
  console.log('::notice::Aucun échec Playwright enregistré dans le rapport.');
  process.exit(0);
}

for (const echec of echecs.slice(0, 12)) {
  console.log(`::error title=${echappe(echec.titre)}::${echappe(echec.message)}`);
}
console.log(`::error::${echecs.length} test(s) en échec.`);
