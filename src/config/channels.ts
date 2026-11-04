/**
 * Canaux de distribution.
 *
 * ⚠️ Maketou et Chariow ne sont PAS présentés comme éditeurs, propriétaires ou
 * titulaires des droits sur le logiciel. Leur rôle contractuel exact — revendeur,
 * mandataire du vendeur, prestataire de paiement, hébergeur de la boutique ou
 * « merchant of record » — n'est pas déterminé ici.
 *
 * Tant qu'il ne l'est pas, `roleVerified` reste à `false` : les documents
 * signalent explicitement que la qualification est en attente et la validation
 * remonte un élément de vérification juridique.
 *
 * Source à consulter pour trancher : les conditions générales de chaque
 * plateforme (qui est le vendeur au sens contractuel, qui encaisse, qui émet la
 * facture, qui traite les remboursements et les litiges).
 */

export type ChannelRole =
  | 'reseller'
  | 'merchant_of_record'
  | 'payment_processor'
  | 'hosting'
  | 'agent'
  | 'unknown';

export const CHANNEL_ROLE_LABELS: Record<ChannelRole, string> = {
  reseller: 'Revendeur — contracte en son nom propre avec le client',
  merchant_of_record: 'Merchant of record — vendeur juridique, encaisse et facture',
  payment_processor: 'Prestataire de paiement — encaisse pour le compte du vendeur',
  hosting: 'Hébergeur de la boutique — ne contracte pas avec le client',
  agent: 'Mandataire — agit au nom et pour le compte du vendeur',
  unknown: 'Non qualifié',
};

export interface SalesChannel {
  id: string;
  name: string;
  website: string;
  /** Rôle contractuel retenu. `unknown` tant qu’aucune pièce contractuelle ne l’établit. */
  role: ChannelRole;
  /**
   * Vrai uniquement si le rôle a été établi par une source contractuelle
   * vérifiable (conditions générales de la plateforme, contrat signé).
   */
  roleVerified: boolean;
  /** Précision affichée dans la console de conformité. */
  note: string;
}

export const SALES_CHANNELS: SalesChannel[] = [
  {
    id: 'maketou',
    name: 'Maketou',
    website: 'https://maketou.com',
    role: 'unknown',
    roleVerified: false,
    note:
      'Plateforme de vente de produits numériques : boutique, encaissement et livraison des fichiers. ' +
      'Le rôle contractuel exact (revendeur, mandataire du vendeur ou prestataire de paiement) doit être ' +
      'déterminé à partir de ses conditions générales avant toute mention dans les documents.',
  },
  {
    id: 'chariow',
    name: 'Chariow',
    website: 'https://chariow.com',
    role: 'unknown',
    roleVerified: false,
    note:
      'Plateforme de vente de produits numériques avec encaissement multi-moyens (mobile money, cartes). ' +
      'La plateforme revendique l’hébergement, le paiement et la livraison : la qualification juridique ' +
      'de ce rôle (notamment l’éventuel statut de merchant of record) reste à établir contractuellement.',
  },
];

/** Canaux dont le rôle n’a pas été établi — déclenche une vérification juridique. */
export function unverifiedChannels(channels: SalesChannel[] = SALES_CHANNELS): SalesChannel[] {
  return channels.filter(channel => !channel.roleVerified);
}
