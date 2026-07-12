// Retour haptique : le téléphone tressaille pour confirmer du bout du doigt
// ce que l'écran raconte. Trois vocabulaires seulement, pour que la main
// apprenne vite : le tic (c'est parti), le double tic (c'est validé), la
// secousse (c'est KO, jette un œil).
//
// L'API Vibration n'existe que sur une partie des mobiles — Android surtout,
// Safari iOS l'ignore : là où elle manque, tout est silencieux et sans effet.

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  try {
    navigator.vibrate(pattern);
  } catch {
    // Certains navigateurs refusent hors geste utilisateur : silence, alors.
  }
}

/** Tic bref : l'action est partie (copier, trinquer, basculer). */
export function hapticTap(): void {
  vibrate(10);
}

/** Double tic léger : c'est validé, le registre a encaissé. */
export function hapticSuccess(): void {
  vibrate([12, 60, 18]);
}

/** Secousse ferme en deux temps : c'est KO, l'écran dit pourquoi. */
export function hapticError(): void {
  vibrate([55, 70, 55]);
}
