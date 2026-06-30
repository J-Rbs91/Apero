export type VoteStatus = "yes" | "maybe" | "no";

export type BeaufLevel = "soft" | "medium" | "legendary";

export type AperitifEvent = {
  id: string;
  title: string;
  organizerName: string;
  description?: string;
  beaufLevel: BeaufLevel;
  options: AperitifOption[];
  participants: ParticipantResponse[];
  createdAt: string;
  updatedAt: string;
};

export type AperitifOption = {
  id: string;
  date: string;
  time: string;
  location: string;
  note?: string;
};

export type ParticipantResponse = {
  id: string;
  participantName: string;
  votes: Record<string, VoteStatus>;
  brings?: string;
  comment?: string;
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
