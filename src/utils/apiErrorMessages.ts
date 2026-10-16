// Traduction des erreurs techniques (API VPS, validation) en messages de
// comptoir. Centralisé : le même incident doit se raconter pareil partout.

import { AperoApiError } from "../services/aperoApiClient";
import { EncryptedAperoError } from "../services/encryptedAperoRepository";
import { AperoValidationError } from "./aperoValidation";

export function describeApiError(error: unknown): string {
  // Écriture avortée AVANT l'envoi : toute mutation relit d'abord la version
  // en cours (anti-écrasement). Lecture en panne = rien n'est parti, et ça ne
  // se raconte pas comme un « souci technique » indéfini.
  if (error instanceof EncryptedAperoError) {
    return error.code === "NOT_FOUND"
      ? "Apéro supprimé."
      : "Réseau indisponible. Réessayer.";
  }

  if (error instanceof AperoApiError) {
    switch (error.code) {
      case "API_NOT_CONFIGURED":
        return "Service non configuré.";
      case "NETWORK_ERROR":
        return "Réseau indisponible. Réessayer.";
      case "CONFLICT":
        return "Conflit. Recharger.";
      case "WRITE_FORBIDDEN":
        if (error.serverCode === "LEGACY_DELETE_DISABLED") {
          return "Ancien apéro. Suppression désactivée.";
        }
        return "Lien incomplet.";
      case "NOT_FOUND":
        if (error.serverCode === "DELETE_ENDPOINT_MISSING") {
          return "Suppression indisponible. Serveur obsolète.";
        }
        return "Erreur serveur. Réessayer.";
      case "RATE_LIMITED":
        return "Trop de requêtes. Réessayer dans 1 min.";
      default:
        return "Erreur serveur. Réessayer.";
    }
  }

  // Saisie refusée par le registre (champ trop long, donnée invalide…) :
  // le dire, sinon le convive croit à une panne et réessaie en boucle.
  if (error instanceof AperoValidationError) {
    return `Saisie invalide (${error.message}).`;
  }

  return "Erreur inattendue. Réessayer.";
}
