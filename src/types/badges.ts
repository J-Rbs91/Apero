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
    name: "Éminence Fondatrice",
    description:
      "A organisé le tout premier apéro ayant réussi à attirer au moins un convive de la Confrérie, ce qui n’avait rien d’évident au départ.",
    rarity: "legendary",
    iconName: "institution",
  },
  {
    id: "FIRST_LOCATION_DISCOVERER",
    name: "Vigie du Zinc",
    description:
      "A proposé ce lieu sacré avant tout le monde, dans un rayon d’environ 1 km, ce qui tient à la fois de l’exploit et de la drôle de coïncidence.",
    rarity: "rare",
    iconName: "location",
  },
  {
    id: "POPULAR_TABLE",
    name: "Table de Dix",
    description: "A organisé un apéro avec plus de 10 convives. La nappe a souffert.",
    rarity: "rare",
    iconName: "table",
  },
  {
    id: "LONELY_CONVOKER",
    name: "Grand-Croix de la Loose",
    description:
      "A organisé un apéro auquel absolument personne, pas même le chien du quartier, n’est venu. Respect dans l’échec.",
    rarity: "shame",
    iconName: "emptyChair",
  },
  {
    id: "SUPER_ORGANIZER",
    name: "Excellence de Cérémonie",
    description: "A organisé plus de 10 apéros avec au moins un convive. Le zinc s’incline, et le zinc ne s’incline jamais.",
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
    name: "Fine Gâchette du Registre",
    description:
      "A déposé un nombre de réponses qui frise l’acharnement dans les apéros de la Confrérie.",
    rarity: "common",
    iconName: "ballot",
  },
  {
    id: "BANQUET_PROVIDER",
    name: "Providence du Banquet",
    description: "A régulièrement indiqué une contribution au banquet. Chips, saucisson ou gloire éternelle.",
    rarity: "common",
    iconName: "banquet",
  },
  {
    id: "LAST_MINUTE_MINISTER",
    name: "Ministre du Peut-être",
    description:
      "A beaucoup trop souvent répondu « J’me tâte », avec la constance d’un vrai ministre du doute.",
    rarity: "common",
    iconName: "minister",
  },
  {
    id: "FIRST_SHOT_CONSENSUS",
    name: "Consensus du premier coup",
    description:
      "A organisé un apéro si limpide que tout le monde a validé la proposition initiale sans réclamer de nouvelle date, de nouvel horaire ou de nouveau lieu.",
    rarity: "rare",
    iconName: "crown",
  },
  {
    id: "ZINC_DIPLOMAT",
    name: "Diplomate du Zinc",
    description: "A participé à plusieurs apéros sans jamais foutre le bazar dans les réponses.",
    rarity: "rare",
    iconName: "diplomat",
  },
];
