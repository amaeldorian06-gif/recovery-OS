/**
 * Contrôle de conformité de la configuration juridique.
 *
 * Deux niveaux, volontairement distincts :
 *
 *  1. **Complétude** — tous les champs obligatoires sont-ils renseignés ?
 *     Un champ absent bloque la publication : une mention légale incomplète
 *     engage la responsabilité de l'éditeur. Code de sortie 1.
 *
 *  2. **Validation juridique** — reste-t-il des points à trancher par un
 *     professionnel du droit (rôle des plateformes de distribution, TVA
 *     intracommunautaire, représentant RGPD, statut d'entreprenant…) ?
 *     Signalés systématiquement ; bloquants uniquement avec `--strict`.
 *
 * ⚠️ Un code de sortie 0 ne signifie PAS « site juridiquement conforme ».
 * Il signifie « aucune mention configurée ne manque ». La conformité juridique
 * suppose une revue professionnelle, qui n'est pas automatisable.
 *
 * Usage : npm run legal:check [-- --strict]
 */
import {
  EDITOR_CONFIG,
  EDITOR_TYPE_LABELS,
  FIELD_STATE_LABELS,
  HOST,
  displayField,
  editorAddressLine,
  editorCountry,
  validationSummary,
} from '../src/config/editor';
import { CHANNEL_ROLE_LABELS, unverifiedChannels } from '../src/config/channels';

const strict = process.argv.includes('--strict');
const summary = validationSummary();
const country = editorCountry();

const rule = (char = '─'): string => char.repeat(64);
const stateBadge: Record<string, string> = {
  complete: '✓ mentions renseignées',
  incomplete: '✗ incomplet',
  legal_review_required: '! validation juridique requise',
};

console.log(`\n${rule('═')}`);
console.log('  CONFORMITÉ — configuration juridique de Revenue Recovery OS');
console.log(`${rule('═')}`);

console.log('\nÉDITEUR');
console.log(`  Type        : ${EDITOR_TYPE_LABELS[EDITOR_CONFIG.type]}`);
console.log(`  Pays        : ${country.name} (${country.legalSystem})`);
console.log(`  Nom légal   : ${displayField(EDITOR_CONFIG.identity.legalName)}`);
console.log(`  Adresse     : ${editorAddressLine()}`);
console.log(`  Téléphone   : ${displayField(EDITOR_CONFIG.identity.phone)}`);
console.log(`  Courriel    : ${displayField(EDITOR_CONFIG.identity.email)}`);
console.log(`  ${EDITOR_CONFIG.registration.identifierLabel.padEnd(12)}: ${displayField(EDITOR_CONFIG.registration.identifier)}`);
console.log(`  Fiscal      : ${displayField(EDITOR_CONFIG.registration.taxNumber)}`);
console.log(`  Hébergeur   : ${HOST.name}`);

console.log('\nCHAMPS DE LA CONFIGURATION');
const fields: Array<[string, (typeof EDITOR_CONFIG)['identity']['legalName']]> = [
  ['Nom légal', EDITOR_CONFIG.identity.legalName],
  ['Adresse', EDITOR_CONFIG.identity.address],
  ['Code postal', EDITOR_CONFIG.identity.postalCode],
  ['Ville', EDITOR_CONFIG.identity.city],
  ['Téléphone', EDITOR_CONFIG.identity.phone],
  ['Courriel', EDITOR_CONFIG.identity.email],
  [EDITOR_CONFIG.registration.identifierLabel, EDITOR_CONFIG.registration.identifier],
  ['Identifiant fiscal', EDITOR_CONFIG.registration.taxNumber],
  ['Capital social', EDITOR_CONFIG.registration.capital],
  ['Registre national', EDITOR_CONFIG.registration.domesticRegistry],
];
for (const [label, field] of fields) {
  const value = field.state === 'provided' ? field.value : '';
  console.log(`  ${FIELD_STATE_LABELS[field.state].padEnd(24)} ${label}${value ? ` : ${value}` : ''}`);
  if (field.state !== 'provided' && field.note) console.log(`      ↳ ${field.note}`);
}

console.log('\nCANAUX DE DISTRIBUTION');
for (const channel of EDITOR_CONFIG.channels) {
  console.log(`  ${channel.name.padEnd(10)} rôle : ${CHANNEL_ROLE_LABELS[channel.role]}`);
  if (!channel.roleVerified) console.log('      ↳ qualification contractuelle à établir');
}

console.log(`\nDOCUMENTS (${summary.documents.length})`);
for (const doc of summary.documents) {
  console.log(`  ${doc.title.padEnd(38)} ${stateBadge[doc.status]}`);
}

if (summary.missingFields.length > 0) {
  console.log(`\n✗ ${summary.missingFields.length} champ(s) obligatoire(s) manquant(s) :`);
  for (const issue of summary.missingFields) {
    console.log(`   • ${issue.label}  [${issue.key}]`);
  }
}

if (summary.reviewNotes.length > 0) {
  console.log(`\n! ${summary.reviewNotes.length} point(s) à validation juridique :`);
  summary.reviewNotes.forEach((note, index) => {
    console.log(`   ${index + 1}. ${note}`);
  });
}

const unverified = unverifiedChannels();
if (unverified.length > 0) {
  console.log(`\n! Rôle non établi : ${unverified.map(channel => channel.name).join(', ')}`);
  console.log('   → À trancher à partir de leurs conditions générales avant toute mention contractuelle.');
}

console.log(`\n${rule()}`);
if (summary.missingFields.length > 0) {
  console.log('RÉSULTAT : INCOMPLET — publication bloquée.');
  console.log('Fichier concerné : src/config/editor.ts');
  console.log('Procédure : docs/CONFORMITE-LEGALE.md\n');
  process.exit(1);
}

if (summary.legalReviewRequired) {
  console.log('RÉSULTAT : mentions complètes, validation juridique EN ATTENTE.');
  if (strict) {
    console.log('Mode --strict : les points de validation juridique sont bloquants.\n');
    process.exit(1);
  }
  console.log('Aucun champ obligatoire ne manque. Les points ci-dessus restent à faire trancher');
  console.log('par un professionnel du droit : une configuration complète n’est pas une conformité.\n');
  process.exit(0);
}

console.log('RÉSULTAT : mentions complètes, aucun point en attente.');
console.log('Rappel : cette vérification est technique. Elle ne remplace pas une revue juridique.\n');
process.exit(0);
