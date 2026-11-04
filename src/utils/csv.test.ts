import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCsvDelimiter, parseCsvString } from './csv';
import { buildDemoCsvTemplate } from '../storage/seed';

/* ------------------------------------------------------------------ */
/* Détection du séparateur                                             */
/* ------------------------------------------------------------------ */

test('Séparateur : le point-virgule est détecté (exports français)', () => {
  // Régression : le parseur ne reconnaissait que la virgule. Or Sage, Cegid et
  // Pennylane exportent en « ; » puisque la virgule y est le séparateur décimal.
  // Toute la ligne d'en-tête devenait une seule colonne et l'import échouait.
  assert.equal(detectCsvDelimiter('a;b;c\n1;2;3'), ';');
});

test('Séparateur : la virgule reste prise en charge', () => {
  assert.equal(detectCsvDelimiter('a,b,c\n1,2,3'), ',');
});

test('Séparateur : la tabulation est prise en charge', () => {
  assert.equal(detectCsvDelimiter('a\tb\tc\n1\t2\t3'), '\t');
});

test('Séparateur : une virgule entre guillemets ne fausse pas la décision', () => {
  assert.equal(detectCsvDelimiter('"Nom, complet";Ville;Montant'), ';');
});

test('Séparateur : une ligne vide en tête est ignorée', () => {
  assert.equal(detectCsvDelimiter('\n\na;b\n1;2'), ';');
});

test('Séparateur : le BOM est ignoré', () => {
  assert.equal(detectCsvDelimiter('\uFEFFa;b;c'), ';');
});

test('Séparateur : une seule colonne ne produit pas d’erreur', () => {
  const parsed = parseCsvString('Seulement\nune valeur');
  assert.deepEqual(parsed.headers, ['Seulement']);
  assert.deepEqual(parsed.rows, [['une valeur']]);
});

/* ------------------------------------------------------------------ */
/* Analyse des champs                                                  */
/* ------------------------------------------------------------------ */

test('Parseur : un fichier point-virgule produit les bonnes colonnes', () => {
  const parsed = parseCsvString('Numéro;Client;Montant\nFA-1;Dupont;12450,00');
  assert.deepEqual(parsed.headers, ['Numéro', 'Client', 'Montant']);
  assert.deepEqual(parsed.rows, [['FA-1', 'Dupont', '12450,00']]);
  assert.equal(parsed.rows[0][2], '12450,00', 'le séparateur décimal doit être préservé');
});

test('Parseur : un champ entre guillemets conserve son séparateur interne', () => {
  const parsed = parseCsvString('Client;Ville\n"Dupont, fils";Lyon');
  assert.deepEqual(parsed.rows, [['Dupont, fils', 'Lyon']]);
});

test('Parseur : un guillemet doublé est restitué une seule fois', () => {
  const parsed = parseCsvString('Client\n"Menuiserie ""Les Cèdres"""');
  assert.deepEqual(parsed.rows, [['Menuiserie "Les Cèdres"']]);
});

test('Parseur : les retours chariot Windows et les lignes vides sont gérés', () => {
  const parsed = parseCsvString('a;b\r\n1;2\r\n\r\n3;4\r\n');
  assert.deepEqual(parsed.headers, ['a', 'b']);
  assert.deepEqual(parsed.rows, [['1', '2'], ['3', '4']]);
});

test('Parseur : un fichier vide ne produit ni en-tête ni ligne', () => {
  assert.deepEqual(parseCsvString(''), { headers: [], rows: [] });
  assert.deepEqual(parseCsvString('\n\n'), { headers: [], rows: [] });
});

/* ------------------------------------------------------------------ */
/* Modèle d'exemple proposé dans l'interface                           */
/* ------------------------------------------------------------------ */

test('Modèle d’exemple : il est réellement importable', () => {
  // Régression : le bouton « Insérer un modèle FR d'exemple » remplissait le
  // champ puis appelait le parseur, qui ne comprenait pas le « ; » du modèle.
  // Zéro facture n'était produite et l'import restait bloqué sans explication.
  const parsed = parseCsvString(buildDemoCsvTemplate());
  assert.ok(parsed.headers.length >= 5, `en-têtes attendus, obtenu : ${parsed.headers.join(' | ')}`);
  assert.equal(parsed.rows.length, 3);
  for (const ligne of parsed.rows) {
    assert.equal(ligne.length, parsed.headers.length, 'chaque ligne doit avoir autant de champs que l’en-tête');
  }
});

test('Modèle d’exemple : les colonnes attendues par le mappage sont présentes', () => {
  const { headers } = parseCsvString(buildDemoCsvTemplate());
  const normalise = (valeur: string) => valeur.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const attendus = ['numero', 'client', 'echeance', 'montant'];
  for (const attendu of attendus) {
    assert.ok(
      headers.some(entete => normalise(entete).includes(attendu)),
      `colonne contenant « ${attendu} » absente : ${headers.join(' | ')}`
    );
  }
});
