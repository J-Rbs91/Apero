// Liens de tablée : même contrat que les liens d'invitation d'apéro.
// Les clés voyagent dans le fragment d'URL (#/tablee/:id?k=…&w=…) et ne sont
// jamais envoyées à un serveur. Ne jamais logger le résultat du parsing.

export type TableeKeys = {
  encryptionKey?: string;
  writeKey?: string;
};

/** Chemin routeur (à passer à navigate/Link) : /tablee/:tableeId?k=…&w=… */
export function buildTableePath(tableeId: string, keys: TableeKeys): string {
  const params = new URLSearchParams();

  if (keys.encryptionKey) {
    params.set("k", keys.encryptionKey);
  }
  if (keys.writeKey) {
    params.set("w", keys.writeKey);
  }

  const query = params.toString();
  return `/tablee/${tableeId}${query ? `?${query}` : ""}`;
}

/** URL complète partageable : {base}#/tablee/:tableeId?k=…&w=… */
export function buildTableeUrl(options: {
  tableeId: string;
  encryptionKey?: string;
  writeKey?: string;
  appBaseUrl?: string;
}): string {
  const base =
    options.appBaseUrl?.replace(/\/+$/, "") ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "")
      : "");

  const path = buildTableePath(options.tableeId, {
    encryptionKey: options.encryptionKey,
    writeKey: options.writeKey,
  });

  return `${base}/#${path}`;
}

/** Message d'invitation à rejoindre la tablée. */
export function buildTableeShareText(tableeName: string, founderName: string): string {
  return [
    `${founderName} t’invite à t’attabler : « ${tableeName} », la tablée officielle de la bande.`,
    "",
    "Une tablée, c’est la Confrérie en format rapproché : les apéros du groupe, le registre des présences, le palmarès maison. Rien d’obligatoire, tout d’essentiel.",
    "Attable-toi ici :",
  ].join("\n");
}
