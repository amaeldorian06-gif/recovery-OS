/**
 * Traitement fiscal affiché au public — dérivé de la configuration de l'éditeur.
 *
 * Isolé de `src/content/legal.ts` pour deux raisons :
 *  - les pages marketing (accueil, tarifs) n'ont besoin que d'une phrase, pas des
 *    cinq documents ;
 *  - l'ancienne version affirmait « TVA non applicable, article 293 B du CGI »,
 *    disposition FRANÇAISE présentée comme applicable à un éditeur camerounais.
 *    La seule formulation autorisée est désormais calculée depuis `tax.regime`.
 */

import { EDITOR_CONFIG, EditorConfig, editorCountry } from './editor';

/** Paragraphe complet, destiné aux conditions générales de vente. */
export function taxStatement(config: EditorConfig = EDITOR_CONFIG): string {
  switch (config.tax.regime) {
    case 'french_franchise':
      return 'TVA non applicable, article 293 B du Code général des impôts (franchise en base française). Les prix affichés sont les prix effectivement dus.';
    case 'vat_registered':
      return 'Les prix sont indiqués hors taxes ; la taxe applicable est ajoutée sur la facture.';
    case 'to_verify':
      return 'Le régime de taxe applicable n’a pas encore été déterminé. Les prix sont indiqués hors taxes ; la facture précisera le traitement retenu.';
    case 'no_french_vat':
    default:
      return (
        `Les prix sont indiqués hors taxes. L’éditeur est établi au ${editorCountry(config).name} et ne facture donc ` +
        'aucune TVA française ; il ne dispose d’aucun numéro de TVA intracommunautaire. ' +
        'Pour une prestation fournie à un client professionnel établi dans l’Union européenne, la taxe est en principe ' +
        'autoliquidée par le client (régime du « reverse charge ») ; le traitement retenu est précisé sur la facture.'
      );
  }
}

/** Mention courte, destinée aux pages de tarifs et à l'accueil. */
export function shortTaxMention(config: EditorConfig = EDITOR_CONFIG): string {
  switch (config.tax.regime) {
    case 'french_franchise':
      return 'TVA non applicable, art. 293 B du CGI';
    case 'vat_registered':
      return 'Prix hors taxes';
    case 'to_verify':
      return 'Prix hors taxes · régime de taxe à confirmer';
    default:
      return 'Prix hors taxes · aucune TVA française facturée (éditeur établi hors de France)';
  }
}
