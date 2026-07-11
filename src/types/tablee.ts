// Les Tablées : les bandes persistantes de la Confrérie.
//
// Un apéro est un événement d'un soir ; une tablée est la bande qui se
// reforme à chaque tournée. Techniquement, une tablée est stockée exactement
// comme un apéro : un fichier chiffré AES-GCM dans data/aperos/ (le serveur ne
// lit jamais le contenu, il n'a donc rien à connaître des tablées), avec ses
// propres clés de lecture et d'écriture dans le fragment du lien.
//
// Le payload d'une tablée référence ses apéros AVEC leurs clés : quiconque
// détient le lien de la tablée accède donc à l'historique complet de la bande.
// C'est le contrat assumé — une tablée se partage comme une confidence.

export type TableeMember = {
  name: string;
  joinedAt: string;
};

// Référence d'un apéro rattaché à la tablée. Les clés permettent aux membres
// d'ouvrir l'apéro directement depuis la page de la tablée.
export type TableeAperoRef = {
  aperoId: string;
  encryptionKey: string;
  writeKey?: string;
  ceremonialName: string;
  addedAt: string;
  addedBy?: string;
};

export type Tablee = {
  kind: "tablee";
  id: string;
  name: string;
  motto?: string;
  founderName: string;
  members: TableeMember[];
  aperoRefs: TableeAperoRef[];
  createdAt: string;
  updatedAt: string;
};

// Entrée du registre local (localStorage) des tablées connues de l'appareil.
// Contient des clés : ne quitte jamais le navigateur (sauf via le Coffre).
export type LocalTableeEntry = {
  tableeId: string;
  encryptionKey: string;
  writeKey: string;
  // Clé de dissolution : reste sur l'appareil de la personne qui a fondé la
  // tablée, jamais dans le lien de partage.
  adminKey?: string;
  name?: string;
  role?: "founder" | "member";
  joinedAt: string;
  updatedAt: string;
};
