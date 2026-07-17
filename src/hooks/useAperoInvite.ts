import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import {
  getCachedAperoEvent,
  getEncryptedAperoById,
  purgeDeletedApero,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { hasAperoDeletedNotification } from "../services/notificationStore";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import type { AperitifEvent } from "../types/apero";
import { resolveInviteKeys } from "../utils/inviteLink";

// Chargement d'une invitation chiffrée : résolution des clés (fragment d'URL
// puis registre local), lecture + déchiffrement, et tous les états d'échec
// possibles. Extrait d'InvitePage pour que la page ne raconte que l'UI.

export type InviteLoadState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "missing-key" }
  | { status: "not-found" }
  // L'apéro était connu sur cet appareil et a disparu du stockage public :
  // annulé par la personne qui l'organisait (traces locales purgées).
  | { status: "deleted" }
  | { status: "bad-key" }
  | { status: "error"; message: string }
  | { status: "ready"; event: AperitifEvent };

export type InviteKeys = {
  encryptionKey?: string;
  writeKey?: string;
  adminKey?: string;
};

export function useAperoInvite(aperoId: string | undefined) {
  const location = useLocation();

  // Clés : d'abord le lien (fragment), sinon l'appareil (apéro déjà créé ou
  // déjà accepté sur cet appareil).
  const keys = useMemo<InviteKeys>(() => {
    const fromLink = resolveInviteKeys(location.search);
    const localEntry = aperoId ? findLocalApero(aperoId) : null;

    return {
      encryptionKey: fromLink.encryptionKey ?? localEntry?.encryptionKey,
      writeKey: fromLink.writeKey ?? localEntry?.writeKey,
      adminKey: localEntry?.adminKey,
    };
  }, [aperoId, location.search]);

  // Apéro tout juste créé (state de navigation) : sert de repli tant que la
  // lecture n'a pas rattrapé l'écriture — évite un faux « introuvable »
  // juste après avoir envoyé l'invitation.
  const seededEvent = (location.state as { createdEvent?: AperitifEvent } | null)?.createdEvent;
  const initialEvent = seededEvent && seededEvent.id === aperoId ? seededEvent : null;

  const [state, setState] = useState<InviteLoadState>(
    initialEvent ? { status: "ready", event: initialEvent } : { status: "loading" },
  );
  const [loadWarning, setLoadWarning] = useState("");
  const [hasLocalEntry, setHasLocalEntry] = useState(
    () => Boolean(aperoId && findLocalApero(aperoId)),
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!aperoId || !isValidAperoId(aperoId)) {
        setState({ status: "invalid-id" });
        return;
      }

      // Apéro annulé dont les traces locales ont déjà été purgées (clés
      // comprises) : le dire clairement AVANT de conclure à un lien incomplet,
      // sinon on pousse l'invité à réclamer un lien vers un apéro disparu.
      if (hasAperoDeletedNotification(aperoId)) {
        setState({ status: "deleted" });
        return;
      }

      if (!keys.encryptionKey) {
        setState({ status: "missing-key" });
        return;
      }

      try {
        if (!initialEvent) {
          setState({ status: "loading" });
        }
        const loaded = await getEncryptedAperoById(aperoId, keys.encryptionKey);

        if (!isMounted) {
          return;
        }

        if (!loaded) {
          if (!initialEvent) {
            // Apéro supprimé par son organisateur : il disparaît aussi de cet
            // appareil (registre local, notifications, instantané) — sans
            // toucher aux apéros jamais encore vus publiquement, dont la
            // lecture peut simplement être en retard sur l'écriture. Quand la
            // purge a lieu (ou a déjà eu lieu : la notification d'annulation
            // en garde la trace), on l'explique clairement au lieu d'un
            // simple « introuvable ».
            if (purgeDeletedApero(aperoId) || hasAperoDeletedNotification(aperoId)) {
              setHasLocalEntry(false);
              setState({ status: "deleted" });
            } else {
              setState({ status: "not-found" });
            }
          }
          // Sinon : on vient de créer cet apéro, la lecture peut être en
          // retard sur l'écriture — on garde la version fraîche en mémoire
          // plutôt que d'afficher « introuvable ».
          return;
        }

        setState({ status: "ready", event: loaded.event });
        // Génère les notifications de cet apéro (si connu localement) à partir
        // de l'écart avec le dernier état vu sur cet appareil.
        syncAperoNotificationsFromRegistry(loaded.event);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        if (loadError instanceof AperoCryptoError) {
          setState({ status: "bad-key" });
          return;
        }

        // Lecture en panne (API injoignable, réseau) : comme l'agenda, on
        // retombe sur la dernière version connue de cet apéro sur cet
        // appareil plutôt que de bloquer l'accès — l'organisateur garde
        // notamment la main pour le supprimer.
        const cachedEvent = getCachedAperoEvent(aperoId);
        if (cachedEvent) {
          setState({ status: "ready", event: cachedEvent });
          setLoadWarning(
            "Impossible de rafraîchir cet apéro pour le moment : voici sa dernière version connue sur cet appareil.",
          );
          return;
        }

        if (!initialEvent) {
          setState({
            status: "error",
            message: "Impossible de récupérer cet apéro pour le moment. Réessaie dans un instant.",
          });
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
    // initialEvent est dérivé du state de navigation, stable pour une visite.
    // eslint hors-jeu ici : les deux vraies entrées sont l'id et la clé.
  }, [aperoId, keys.encryptionKey]);

  return { state, setState, keys, loadWarning, hasLocalEntry, setHasLocalEntry };
}
