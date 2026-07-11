// Système de notifications de la Confrérie.
//
// Contrainte d'architecture majeure : les apéros sont chiffrés de bout en bout
// (le serveur VPS ne stocke que du ciphertext + le hash de la write key, voir
// server/src/routes/aperos.ts). Le serveur ne peut donc PAS savoir qui a voté
// « peut-être », ni quand tombe l'apéro. Toute la logique de notification est
// calculée côté client, là où les données sont déchiffrées : on diffe l'état
// fraîchement déchiffré contre un instantané « déjà vu » gardé en localStorage.

import type { LocalAperoRole } from "./encryptedApero";

// Réponse du convive, dérivée de ses votes créneau par créneau.
// - "yes"   : au moins un « j'y serai »        → notifications importantes
// - "maybe" : au moins un « j'me tâte »        → rappels 48h / 24h / 2h
// - "no"    : que des « sans moi »             → aucune notification
// - "none"  : émargé mais pas encore de vote   → tenu au courant, sans rappel
export type ViewerVote = "yes" | "maybe" | "no" | "none";

// Qui regarde, pour un apéro donné : son rôle (créateur ou invité) tel que
// mémorisé dans le registre local, et sa propre réponse.
export type NotificationViewer = {
  role: LocalAperoRole;
  vote: ViewerVote;
  // Nom de comptoir normalisé : sert à ne jamais s'auto-notifier de ses
  // propres actions (le créateur qui ajoute un créneau, l'invité qui vote…).
  normalizedName: string;
};

// Type d'événement à l'origine de la notification.
export type NotificationEventType =
  // Destinées au créateur de l'apéro (section 1 du cahier des charges).
  | "guest-responded" // un invité répond à l'invitation
  | "guest-changed-response" // un invité modifie sa réponse
  | "guest-proposed-option" // un invité propose un nouveau créneau
  // Destinées aux invités « oui » / engagés (section 2).
  | "new-option" // nouvelle proposition de date, d'horaire ou de lieu
  | "option-modified" // modification d'un créneau existant
  | "final-confirmation" // confirmation finale de la date / de l'horaire / du lieu
  | "important-change" // changement important concernant l'apéro
  // Destinés aux invités « peut-être » (section 3).
  | "reminder-48h"
  | "reminder-24h"
  | "reminder-2h"
  // L'apéro est passé : on souffle à la tablée de convoquer le suivant
  // (boucle invité → organisateur, ou tournée récurrente).
  | "next-round-nudge"
  // L'apéro a disparu du stockage public : annulé par la personne qui
  // l'organisait. Émise localement au moment où l'appareil purge ses traces
  // (registre, notifications, instantané), pour expliquer la disparition.
  | "apero-deleted";

// Canal de diffusion (section 7). Le badge interne est toujours honoré ; le
// canal système n'est utilisé que si l'utilisateur a donné son autorisation.
export type NotificationChannel = "internal" | "system";

// Une notification interne, telle que stockée et affichée dans le centre de
// notifications et comptée par le badge rouge.
export type AppNotification = {
  id: string;
  aperoId: string;
  aperoName: string;
  type: NotificationEventType;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
  // Clé stable de déduplication : deux syncs successifs ne doivent jamais
  // recréer la même notification pour le même fait.
  dedupeKey: string;
};
