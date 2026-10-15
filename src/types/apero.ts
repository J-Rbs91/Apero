export type VoteStatus = "yes" | "maybe" | "no";

export type BeaufLevel = "soft" | "medium" | "legendary";

export type AperitifEventStatus = "active" | "closed" | "archived";

export type OptionCreatorRole = "organizer" | "participant";

// Cadence d'une assemblée qui se répète : le rituel est l'âme de la Confrérie.
export type AperoRecurrence = "weekly" | "biweekly" | "monthly";

export type AperitifEvent = {
  id: string;
  ceremonialName: string;
  title?: string;
  organizerName: string;
  description?: string;
  beaufLevel: BeaufLevel;
  status: AperitifEventStatus;
  options: AperitifOption[];
  participants: ParticipantResponse[];
  // Le mur du comptoir : mots laissés par la tablée, du plus ancien au plus
  // récent. Absent sur les apéros d'avant cette fonctionnalité.
  messages?: AperoMessage[];
  // Les mioches sont-ils conviés ? Réglé à la création de l'apéro. Absent sur
  // les apéros d'avant cette option (on ne présume alors rien).
  childrenAllowed?: boolean;
  // Cadence de répétition. Absente = assemblée d'un soir. Une fois l'apéro
  // passé, l'app propose de convoquer la tournée suivante sur cette cadence.
  recurrence?: AperoRecurrence;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  selectedOptionId?: string;
};

export type AperitifOption = {
  id: string;
  date: string;
  time: string;
  location: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  // Référence OpenStreetMap stable de l'établissement (« node/123 »,
  // « way/456 »…) quand le lieu vient d'une liste (Autour de moi, recherche)
  // plutôt que de la saisie libre. C'est la clé de normalisation des lieux :
  // sans elle, « Chez Dédé » en texte libre reste inexploitable pour
  // rapprocher deux apéros du même comptoir.
  locationPlaceId?: string;
  note?: string;
  createdByRole?: OptionCreatorRole;
  createdByName?: string;
  createdAt?: string;
  // Les blazes qui « trinquent » à ce créneau : micro-approbation d'ambiance,
  // sans valeur de vote. Dédupliqués par nom normalisé, absents si personne
  // n'a levé son verre.
  cheers?: string[];
};

// Un mot lâché au comptoir : le fil de discussion léger d'un apéro. Pas une
// messagerie — des mots courts, signés d'un blaze, dans le payload chiffré.
export type AperoMessage = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ParticipantResponse = {
  id: string;
  participantName: string;
  votes: Record<string, VoteStatus>;
  brings?: string;
  comment?: string;
  // Renforts amenés par le convive (les « pièces rapportées »). Renseigné lors
  // de la réponse à l'invitation. Absent/0 = le convive débarque en solo.
  companions?: number;
  // Traquenard-O-mètre : 0 (petite soirée sage) à 10 (traquenard total).
  traquenardLevel?: number;
  createdAt: string;
  updatedAt: string;
};

export type EventResults = {
  optionId: string;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  score: number;
};

export type ResultState =
  | {
      type: "empty";
      message: string;
      results: EventResults[];
    }
  | {
      type: "no-availability";
      message: string;
      results: EventResults[];
    }
  | {
      type: "tie";
      message: string;
      optionIds: string[];
      results: EventResults[];
    }
  | {
      type: "winner";
      message: string;
      optionId: string;
      results: EventResults[];
    };
