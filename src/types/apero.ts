export type VoteStatus = "yes" | "maybe" | "no";

export type BeaufLevel = "soft" | "medium" | "legendary";

export type AperitifEventStatus = "active" | "closed" | "archived";

export type OptionCreatorRole = "organizer" | "participant";

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
  // Les mioches sont-ils conviés ? Réglé à la création de l'apéro. Absent sur
  // les apéros d'avant cette option (on ne présume alors rien).
  childrenAllowed?: boolean;
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
  note?: string;
  createdByRole?: OptionCreatorRole;
  createdByName?: string;
  createdAt?: string;
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
