export type BadgeId =
  | "FIRST_REAL_ORGANIZER"
  | "FIRST_LOCATION_DISCOVERER"
  | "POPULAR_TABLE"
  | "LONELY_CONVOKER"
  | "SUPER_ORGANIZER"
  | "FAITHFUL_MEMBER"
  | "SERIAL_VOTER"
  | "LAST_MINUTE_MINISTER"
  | "ZINC_DIPLOMAT"
  | "FIRST_SHOT_CONSENSUS"
  | "AFFRANCHI";

export type BadgeRarity = "common" | "rare" | "legendary" | "shame";

export type BadgeIconName =
  | "institution"
  | "location"
  | "table"
  | "emptyChair"
  | "crown"
  | "member"
  | "ballot"
  | "minister"
  | "diplomat"
  | "torch";

export type BadgeDefinition = {
  id: BadgeId;
  name: string;
  description: string;
  rarity: BadgeRarity;
  iconName: BadgeIconName;
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "FIRST_REAL_ORGANIZER",
    name: "Premier hôte",
    description: "Apéro créé, 1 convive minimum.",
    rarity: "legendary",
    iconName: "institution",
  },
  {
    id: "FIRST_LOCATION_DISCOVERER",
    name: "Éclaireur",
    description: "Premier à proposer ce lieu.",
    rarity: "rare",
    iconName: "location",
  },
  {
    id: "POPULAR_TABLE",
    name: "Grande table",
    description: "Apéro à plus de 10 convives.",
    rarity: "rare",
    iconName: "table",
  },
  {
    id: "LONELY_CONVOKER",
    name: "Table vide",
    description: "Apéro passé sans aucun convive.",
    rarity: "shame",
    iconName: "emptyChair",
  },
  {
    id: "SUPER_ORGANIZER",
    name: "Grand hôte",
    description: "Plus de 10 apéros avec convives.",
    rarity: "legendary",
    iconName: "crown",
  },
  {
    id: "FAITHFUL_MEMBER",
    name: "Fidèle",
    description: "Réponse à 5 apéros minimum.",
    rarity: "rare",
    iconName: "member",
  },
  {
    id: "SERIAL_VOTER",
    name: "Répondant",
    description: "10 réponses minimum.",
    rarity: "common",
    iconName: "ballot",
  },
  {
    id: "LAST_MINUTE_MINISTER",
    name: "Hésitant",
    description: "Peut-être, 3 fois minimum.",
    rarity: "common",
    iconName: "minister",
  },
  {
    id: "FIRST_SHOT_CONSENSUS",
    name: "Consensus",
    description: "Créneau initial accepté par tous.",
    rarity: "rare",
    iconName: "crown",
  },
  {
    id: "ZINC_DIPLOMAT",
    name: "Diplomate",
    description: "3 apéros minimum, aucun Non.",
    rarity: "rare",
    iconName: "diplomat",
  },
  {
    id: "AFFRANCHI",
    name: "Promu",
    description: "Convive d’abord, hôte ensuite.",
    rarity: "rare",
    iconName: "torch",
  },
];
