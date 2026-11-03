/**
 * Contrôle de complétude de l'identité légale.
 *
 * Sort en erreur (code 1) tant que des champs obligatoires sont des
 * placeholders : c'est volontaire. Un site en production avec des mentions
 * légales incomplètes est en infraction (LCEN, article 1-2), donc ce contrôle
 * doit pouvoir bloquer une mise en ligne.
 *
 * Usage : npm run legal:check
 */
import { missingLegalFields, EDITOR, HOST } from '../src/config/editor';

const missing = missingLegalFields();

console.log('\nContrôle de conformité — identité de l’éditeur\n' + '─'.repeat(52));
console.log(`Éditeur  : ${EDITOR.legalName}`);
console.log(`Courriel : ${EDITOR.email}`);
console.log(`Hébergeur: ${HOST.name}`);
console.log(`Médiateur: ${EDITOR.mediator ? EDITOR.mediator.name : 'non désigné'}`);

if (missing.length === 0) {
  console.log('\n✓ Tous les champs obligatoires sont renseignés.\n');
  process.exit(0);
}

console.log('\n✗ Champs à compléter avant toute mise en vente :');
for (const field of missing) console.log(`   • ${field}`);
console.log('\nFichier concerné : src/config/editor.ts');
console.log('Voir docs/CONFORMITE-LEGALE.md pour la procédure.\n');
process.exit(1);
