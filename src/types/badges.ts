export type BadgeId =
  | "FIRST_REAL_ORGANIZER"
  | "FIRST_LOCATION_DISCOVERER"
  | "POPULAR_TABLE"
  | "LONELY_CONVOKER"
  | "SUPER_ORGANIZER"
  | "FAITHFUL_MEMBER"
  | "SERIAL_VOTER"
  | "BANQUET_PROVIDER"
  | "LAST_MINUTE_MINISTER"
  | "ZINC_DIPLOMAT"
  | "FIRST_SHOT_CONSENSUS";

export type BadgeRarity = "common" | "rare" | "legendary" | "shame";

export type BadgeIconName =
  | "institution"
  | "location"
  | "table"
  | "emptyChair"
  | "crown"
  | "member"
  | "ballot"
  | "banquet"
  | "minister"
  | "diplomat";

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
    name: "Premier Grand Convoqueur",
    description: "A organisé le premier apéro ayant attiré au moins un membre de la Confrérie.",
    rarity: "legendary",
    iconName: "institution",
  },
  {
    id: "FIRST_LOCATION_DISCOVERER",
    name: "Éclaireur du Zinc",
    description: "Premier à proposer ce lieu sacré dans un rayon d’environ 1 km.",
    rarity: "rare",
    iconName: "location",
  },
  {
    id: "POPULAR_TABLE",
    name: "Table de Dix",
    description: "A organisé une assemblée avec plus de 10 participants. La nappe a souffert.",
    rarity: "rare",
    iconName: "table",
  },
  {
    id: "LONELY_CONVOKER",
    name: "Chevalier de la Loose",
    description: "A convoqué une assemblée à laquelle absolument personne n’est venu. Respect dans l’échec.",
    rarity: "shame",
    iconName: "emptyChair",
  },
  {
    id: "SUPER_ORGANIZER",
    name: "Grand Maître de Cérémonie",
    description: "A organisé plus de 10 apéros avec au moins un participant. Le zinc reconnaît les siens.",
    rarity: "legendary",
    iconName: "crown",
  },
  {
    id: "FAITHFUL_MEMBER",
    name: "Pilier Certifié",
    description: "A participé à au moins 5 apéros différents. Présence suspectement régulière.",
    rarity: "rare",
    iconName: "member",
  },
  {
    id: "SERIAL_VOTER",
    name: "Scrutateur du Comptoir",
    description: "A déposé de nombreux suffrages dans les assemblées de la Confrérie.",
    rarity: "common",
    iconName: "ballot",
  },
  {
    id: "BANQUET_PROVIDER",
    name: "Bienfaiteur du Banquet",
    description: "A régulièrement indiqué une contribution au banquet. Chips, saucisson ou gloire éternelle.",
    rarity: "common",
    iconName: "banquet",
  },
  {
    id: "LAST_MINUTE_MINISTER",
    name: "Ministre du Peut-être",
    description: "A beaucoup trop souvent répondu sous réserve du ministre.",
    rarity: "common",
    iconName: "minister",
  },
  {
    id: "FIRST_SHOT_CONSENSUS",
    name: "Consensus du premier coup",
    description:
      "A convoqu\u00e9 une assembl\u00e9e si limpide que tout le monde a valid\u00e9 une proposition initiale sans r\u00e9clamer de nouvelle date, de nouvel horaire ou de nouveau lieu.",
    rarity: "rare",
    iconName: "crown",
  },
  {
    id: "ZINC_DIPLOMAT",
    name: "Diplomate du Zinc",
    description: "A participé à plusieurs apéros sans jamais foutre le bazar dans les votes.",
    rarity: "rare",
    iconName: "diplomat",
  },
];
