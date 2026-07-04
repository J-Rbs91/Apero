// Préchargé (node --import) devant la vraie API server/ pendant les tests
// fonctionnels : redirige tous les appels fetch vers https://api.github.com
// sur le faux GitHub local (FAKE_GITHUB_BASE_URL), sans toucher au code prod.

const fakeBaseUrl = process.env.FAKE_GITHUB_BASE_URL;

if (!fakeBaseUrl) {
  throw new Error("FAKE_GITHUB_BASE_URL est requis pour le patch fetch des tests.");
}

const GITHUB_ORIGIN = "https://api.github.com";
const realFetch = globalThis.fetch;

globalThis.fetch = (input, init) => {
  const url =
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

  if (url.startsWith(GITHUB_ORIGIN)) {
    return realFetch(fakeBaseUrl + url.slice(GITHUB_ORIGIN.length), init);
  }

  return realFetch(input, init);
};
