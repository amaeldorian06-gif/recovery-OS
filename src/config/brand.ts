/**
 * Coordonnées publiques du produit.
 *
 * ⚠️ `CONTACT_EMAIL` est un placeholder volontairement non routable :
 * le TLD `.example` est réservé par la RFC 2606 et ne peut jamais recevoir
 * de courrier. Il DOIT être remplacé par l'adresse réelle du vendeur avant
 * toute mise en production (voir docs/MISE-EN-PRODUCTION.md).
 * Un seul point de modification : aucun autre fichier ne code l'adresse.
 */
export const PRODUCT_NAME = 'Revenue Recovery OS';

export const CONTACT_EMAIL = 'contact@recovery-os.example';

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

/** Vrai si l'adresse de contact est encore le placeholder de développement. */
export const CONTACT_IS_PLACEHOLDER = CONTACT_EMAIL.endsWith('.example');
