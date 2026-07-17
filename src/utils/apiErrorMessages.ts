// Traduction des erreurs techniques (API VPS, validation) en messages de
// comptoir. Centralisé : le même incident doit se raconter pareil partout.

import { AperoApiError } from "../services/aperoApiClient";
import { AperoValidationError } from "./aperoValidation";

export function describeApiError(error: unknown): string {
  if (error instanceof AperoApiError) {
    switch (error.code) {
      case "API_NOT_CONFIGURED":
        return "Le comptoir numérique n’est pas encore raccordé (API non configurée). Ta réponse est notée sur cet appareil, elle partira dès que le service sera rétabli.";
      case "NETWORK_ERROR":
        return "Impossible de joindre le comptoir numérique. Vérifie la connexion et réessaie — ta réponse reste notée sur cet appareil.";
      case "CONFLICT":
        return "Quelqu’un a répondu en même temps que toi. Recharge la page et réessaie, ça passe presque toujours du deuxième coup.";
      case "WRITE_FORBIDDEN":
        if (error.serverCode === "LEGACY_DELETE_DISABLED") {
          return "Cette ancienne convocation n’a pas encore de clé d’annulation sécurisée. Active temporairement ALLOW_LEGACY_WRITE_KEY_DELETE côté API pour la supprimer, puis remets la variable à false.";
        }
        return "Ce lien ne permet pas de répondre ici. Vérifie qu’il est complet.";
      case "NOT_FOUND":
        if (error.serverCode === "DELETE_ENDPOINT_MISSING") {
          return "La suppression n’est pas encore disponible côté serveur : l’API du VPS doit être mise à jour. Rien n’a été supprimé.";
        }
        return "Un souci technique est survenu, réessaie dans un instant.";
      case "RATE_LIMITED":
        return "Le comptoir sature, doucement sur la cadence. Réessaie dans une minute.";
      default:
        return "Un souci technique est survenu, réessaie dans un instant.";
    }
  }

  // Saisie refusée par le registre (champ trop long, donnée invalide…) :
  // le dire, sinon le convive croit à une panne et réessaie en boucle.
  if (error instanceof AperoValidationError) {
    return `Le registre refuse cette saisie (${error.message}). Corrige le champ concerné et réessaie.`;
  }

  return "Un souci technique est survenu, réessaie dans un instant.";
}
