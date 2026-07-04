// Badge sur l'icône de l'application (écran d'accueil / dock), façon Facebook.
//
// S'appuie sur l'API Badging (navigator.setAppBadge / clearAppBadge). Elle ne
// fonctionne QUE pour une app installée (PWA « ajoutée à l'écran d'accueil ») :
// - iOS/iPadOS 16.4+ : uniquement la PWA installée, pas l'onglet Safari ;
// - Android/desktop (Chrome, Edge) : PWA installée.
// Dans un simple onglet de navigateur, l'appel est un no-op silencieux.
//
// Limite de plateforme : le compteur n'est mis à jour que pendant que l'app
// tourne (ou via un push en tâche de fond, non encore branché). Après
// fermeture, la dernière valeur posée reste affichée sur l'icône.

export function isAppBadgeSupported(): boolean {
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

/**
 * Reflète le nombre de notifications non lues sur l'icône de l'app.
 * count <= 0 efface le badge. Ne lève jamais : sur un support partiel ou un
 * onglet non installé, on échoue en silence.
 */
export async function updateAppBadge(count: number): Promise<void> {
  if (!isAppBadgeSupported()) {
    return;
  }

  try {
    if (count > 0) {
      await (navigator as Navigator & { setAppBadge: (n?: number) => Promise<void> }).setAppBadge(
        count,
      );
    } else {
      await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
    }
  } catch {
    // Support partiel (onglet non installé, permission refusée…) : le badge
    // interne dans l'app reste la source de vérité, on n'insiste pas.
  }
}
