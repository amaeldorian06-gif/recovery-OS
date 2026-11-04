/**
 * Coordonnées publiques du produit.
 *
 * ⚠️ Aucune valeur propre ici : tout est dérivé de `src/config/editor.ts`.
 * L'adresse de contact était auparavant codée deux fois (ici et dans la
 * configuration de l'éditeur), ce qui permettait de publier une adresse sur le
 * site et une autre dans les mentions légales. Il n'existe plus qu'un seul point
 * de modification.
 *
 * Tant que l'adresse réelle n'est pas renseignée, le repli est un domaine
 * réservé par la RFC 2606 (`.example`) qui ne peut jamais recevoir de courrier :
 * l'oubli reste visible plutôt que silencieux.
 */

import { PRODUCT, contactEmail, isContactFallback } from './editor';

export const PRODUCT_NAME = PRODUCT;

export const CONTACT_EMAIL = contactEmail();

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

/** Vrai si l'adresse de contact n'est pas encore renseignée dans la configuration. */
export const CONTACT_IS_PLACEHOLDER = isContactFallback();
