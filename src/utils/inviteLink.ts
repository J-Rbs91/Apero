// Construction et parsing des liens d'invitation du flux chiffré.
//
// L'app est en HashRouter (GitHub Pages) : la route vit déjà dans le fragment
// d'URL. Le format cible « /invite/:aperoId#k=…&w=… » est donc adapté en
//
//   https://…/Apero/#/invite/apero_XXXX?k=ENCRYPTION_KEY&w=WRITE_KEY
//
// Tout ce qui suit le premier « # » est un fragment : les clés ne sont JAMAIS
// envoyées au serveur (ni GitHub Pages, ni l'API VPS) et n'apparaissent pas
// dans les logs serveur. Ne jamais logger le résultat du parsing.

export type InviteKeys = {
  encryptionKey?: string;
  writeKey?: string;
};

export type ParsedInviteLink = {
  aperoId?: string;
  keys: InviteKeys;
};

/** Chemin routeur (à passer à navigate/Link) : /invite/:aperoId?k=…&w=… */
export function buildInvitePath(aperoId: string, keys: InviteKeys): string {
  const params = new URLSearchParams();

  if (keys.encryptionKey) {
    params.set("k", keys.encryptionKey);
  }
  if (keys.writeKey) {
    params.set("w", keys.writeKey);
  }

  const query = params.toString();
  return `/invite/${aperoId}${query ? `?${query}` : ""}`;
}

/** URL complète partageable : {base}#/invite/:aperoId?k=…&w=… */
export function buildInviteUrl(options: {
  aperoId: string;
  encryptionKey?: string;
  writeKey?: string;
  /** Par défaut : origin + pathname courants (même logique que le partage existant). */
  appBaseUrl?: string;
}): string {
  const base =
    options.appBaseUrl?.replace(/\/+$/, "") ??
    (typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "")
      : "");

  const path = buildInvitePath(options.aperoId, {
    encryptionKey: options.encryptionKey,
    writeKey: options.writeKey,
  });

  return `${base}/#${path}`;
}

/** Version affichable sans les clés (pour l'UI) : coupe à partir de « ?k= ». */
export function maskInviteUrl(url: string): string {
  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? url : `${url.slice(0, queryIndex)}?…`;
}

function parseKeysFromSearchParams(params: URLSearchParams): InviteKeys {
  const encryptionKey = params.get("k") ?? undefined;
  const writeKey = params.get("w") ?? undefined;
  return {
    encryptionKey: encryptionKey || undefined,
    writeKey: writeKey || undefined,
  };
}

/**
 * Parse les clés depuis un `location.search` (fourni par react-router, qui
 * lit la partie « ?k=…&w=… » interne au hash avec HashRouter).
 */
export function parseInviteKeysFromSearch(search: string): InviteKeys {
  return parseKeysFromSearchParams(new URLSearchParams(search.replace(/^\?/, "")));
}

/**
 * Parse un fragment brut. Gère les deux formes :
 * - `#/invite/apero_X?k=…&w=…` (forme HashRouter de l'app) ;
 * - `#k=…&w=…` (forme « pure » de la spec, si un lien externe l'utilise).
 */
export function parseInviteLinkFromHash(hash: string): ParsedInviteLink {
  const fragment = hash.replace(/^#/, "");

  // Forme HashRouter : /invite/:aperoId?k=…&w=…
  const routeMatch = fragment.match(/^\/invite\/([^/?#]+)(?:\?(.*))?$/);
  if (routeMatch) {
    return {
      aperoId: routeMatch[1],
      keys: parseKeysFromSearchParams(new URLSearchParams(routeMatch[2] ?? "")),
    };
  }

  // Forme « pure » : k=…&w=… directement dans le fragment.
  if (/(^|&)(k|w)=/.test(fragment)) {
    return { keys: parseKeysFromSearchParams(new URLSearchParams(fragment)) };
  }

  return { keys: {} };
}

/**
 * Résolution complète côté page : clés du `location.search` react-router en
 * priorité, sinon fragment brut de la barre d'adresse (cas d'un lien collé
 * sous une forme inattendue).
 */
export function resolveInviteKeys(search: string): InviteKeys {
  const fromSearch = parseInviteKeysFromSearch(search);

  if (fromSearch.encryptionKey || fromSearch.writeKey) {
    return fromSearch;
  }

  if (typeof window !== "undefined") {
    return parseInviteLinkFromHash(window.location.hash).keys;
  }

  return {};
}
