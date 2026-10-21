import type { VerrerieComposition } from "./Verrerie";

// La verrerie de chaque écran fixe : un objet, un angle, un ancrage
// (UXER_REDESIGN_CONTRACT.md §17.4). Les apéros et les groupes tirent la leur
// de leur identifiant (composerVerrerie). La taille ne se choisit jamais :
// toute la verrerie est à la même échelle.
export const VERRERIE_ECRANS = {
  creer: { objet: "flute", angle: 190, ancre: "centre" },
  agenda: { objet: "nonic", angle: -10, ancre: "droite" },
  notifications: { objet: "flute", angle: 10, ancre: "droite" },
  palmares: { objet: "flute", angle: -12, ancre: "droite" },
  bilan: { objet: "bouteille", angle: -20, ancre: "droite" },
  sauvegarde: { objet: "verre", angle: 170, ancre: "droite" },
  groupes: { objet: "verre", angle: -14, ancre: "droite" },
  nom: { objet: "verre", angle: 12, ancre: "droite" },
  notificationsAccueil: { objet: "flute", angle: -10, ancre: "droite" },
  erreur: { objet: "bouteille", angle: -25, ancre: "droite" },
} satisfies Record<string, VerrerieComposition>;
