/**
 * Générateur de clés de licence — parcours de vente manuelle.
 *
 * Le produit n'a pas de serveur : la clé est générée ici, côté éditeur, puis
 * envoyée au client par courriel après encaissement. La clé est auto-portante
 * (plan + somme de contrôle) et s'active hors ligne dans le navigateur du client.
 *
 * Usage :
 *   npm run licence -- --plan pro
 *   npm run licence -- --plan cabinet --nombre 3
 *   npm run licence -- --plan essentiel --nombre 2 --client "ACME SARL"
 *
 * ⚠️ Ne jamais committer de clé générée dans ce dépôt.
 */
import { generateLicenseKey, validateLicenseKey, PLAN_DETAILS } from '../src/storage/license';
import { LicensePlan } from '../src/storage/types';

const PLANS: LicensePlan[] = ['trial', 'essentiel', 'pro', 'cabinet'];

interface Options {
  plan: LicensePlan;
  nombre: number;
  client: string | null;
}

function parseArgs(argv: string[]): Options {
  const read = (flag: string): string | undefined => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };

  const planRaw = (read('--plan') ?? 'pro').toLowerCase();
  if (!PLANS.includes(planRaw as LicensePlan)) {
    console.error(`Plan inconnu : « ${planRaw} ». Plans valides : ${PLANS.join(', ')}.`);
    process.exit(2);
  }

  const nombreRaw = Number(read('--nombre') ?? '1');
  const nombre = Number.isInteger(nombreRaw) && nombreRaw > 0 && nombreRaw <= 100 ? nombreRaw : 1;

  return { plan: planRaw as LicensePlan, nombre, client: read('--client') ?? null };
}

function main(): void {
  const { plan, nombre, client } = parseArgs(process.argv.slice(2));
  const details = PLAN_DETAILS[plan];

  const keys: string[] = [];
  for (let i = 0; i < nombre; i++) {
    const key = generateLicenseKey(plan);
    // Contrôle immédiat : une clé émise doit toujours se valider.
    const check = validateLicenseKey(key);
    if (!check.ok || check.plan !== plan) {
      console.error(`ERREUR : la clé générée ne se valide pas (${check.ok ? 'plan incohérent' : check.reason}). Aucune clé n'a été communiquée.`);
      process.exit(1);
    }
    keys.push(key);
  }

  const line = '─'.repeat(66);
  console.log(`\n${line}`);
  console.log(`  ${nombre} clé(s) de licence — ${details.label}`);
  console.log(`  ${details.seats} poste(s) · ${details.priceMonthly} €/mois`);
  if (client) console.log(`  Client : ${client}`);
  console.log(line);

  keys.forEach((key, index) => {
    console.log(`\n  ${String(index + 1).padStart(2, '0')}.  ${key}`);
  });

  console.log(`\n${line}`);
  console.log('  Message à envoyer au client après encaissement');
  console.log(line);
  console.log(`
Bonjour,

Votre licence ${details.label} (${details.seats} poste(s)) est activée.

Clé : ${keys[0]}

Pour l'activer :
  1. ouvrez l'application, puis Paramètres > Licence ;
  2. collez la clé dans le champ « Clé de licence » ;
  3. cliquez sur « Activer ».

L'activation se fait sur votre appareil, sans connexion : aucune donnée
financière n'est transmise à nos serveurs, nous n'y avons aucun accès.

Conservez cet e-mail : il constitue votre preuve d'achat.
`);

  console.log(`${line}`);
  console.log('  Vérifications');
  console.log(line);
  console.log(`  Format      : RRV-<PLAN>-<12 base32>-<4 contrôle> — validation testée`);
  console.log(`  Portée      : activation locale, non inviolable (documenté dans les CGV)`);
  console.log(`  À faire     : enregistrer la clé dans votre suivi de commande`);
  console.log(`  Ne pas      : committer la clé, ni la publier (elle vaut ${details.priceMonthly} €/mois)\n`);
}

main();
