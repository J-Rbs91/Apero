import { describe, expect, it } from "vitest";
import {
  buildInvitePath,
  buildInviteUrl,
  maskInviteUrl,
  parseInviteKeysFromSearch,
  parseInviteLinkFromHash,
} from "./inviteLink";

describe("buildInvitePath", () => {
  it("construit le chemin routeur avec les clés en query", () => {
    expect(
      buildInvitePath("apero_7F92Kx91", { encryptionKey: "CLE-K", writeKey: "CLE-W" }),
    ).toBe("/invite/apero_7F92Kx91?k=CLE-K&w=CLE-W");
  });

  it("omet les clés absentes", () => {
    expect(buildInvitePath("apero_7F92Kx91", {})).toBe("/invite/apero_7F92Kx91");
    expect(buildInvitePath("apero_7F92Kx91", { encryptionKey: "K" })).toBe(
      "/invite/apero_7F92Kx91?k=K",
    );
  });
});

describe("buildInviteUrl", () => {
  it("assemble base + fragment HashRouter sans double slash", () => {
    expect(
      buildInviteUrl({
        aperoId: "apero_7F92Kx91",
        encryptionKey: "K",
        writeKey: "W",
        appBaseUrl: "https://j-rbs91.github.io/Apero/",
      }),
    ).toBe("https://j-rbs91.github.io/Apero/#/invite/apero_7F92Kx91?k=K&w=W");
  });
});

describe("maskInviteUrl", () => {
  it("masque les clés pour l'affichage", () => {
    expect(
      maskInviteUrl("https://exemple.test/Apero/#/invite/apero_X12345?k=SECRET&w=SECRET"),
    ).toBe("https://exemple.test/Apero/#/invite/apero_X12345?…");
  });

  it("laisse intact un lien sans query", () => {
    expect(maskInviteUrl("https://exemple.test/#/invite/apero_X12345")).toBe(
      "https://exemple.test/#/invite/apero_X12345",
    );
  });
});

describe("parseInviteKeysFromSearch", () => {
  it("lit k et w depuis le search react-router", () => {
    expect(parseInviteKeysFromSearch("?k=CLE-K&w=CLE-W")).toEqual({
      encryptionKey: "CLE-K",
      writeKey: "CLE-W",
    });
  });

  it("tolère les clés manquantes ou vides", () => {
    expect(parseInviteKeysFromSearch("")).toEqual({
      encryptionKey: undefined,
      writeKey: undefined,
    });
    expect(parseInviteKeysFromSearch("?k=&w=W")).toEqual({
      encryptionKey: undefined,
      writeKey: "W",
    });
  });
});

describe("parseInviteLinkFromHash", () => {
  it("parse la forme HashRouter de l'app", () => {
    expect(parseInviteLinkFromHash("#/invite/apero_7F92Kx91?k=K&w=W")).toEqual({
      aperoId: "apero_7F92Kx91",
      keys: { encryptionKey: "K", writeKey: "W" },
    });
  });

  it("parse la forme « pure » de la spec (#k=…&w=…)", () => {
    expect(parseInviteLinkFromHash("#k=K&w=W")).toEqual({
      keys: { encryptionKey: "K", writeKey: "W" },
    });
  });

  it("retourne des clés vides pour un fragment quelconque", () => {
    expect(parseInviteLinkFromHash("#/agenda")).toEqual({ keys: {} });
    expect(parseInviteLinkFromHash("")).toEqual({ keys: {} });
  });

  it("gère un lien d'invitation sans query", () => {
    expect(parseInviteLinkFromHash("#/invite/apero_7F92Kx91")).toEqual({
      aperoId: "apero_7F92Kx91",
      keys: { encryptionKey: undefined, writeKey: undefined },
    });
  });
});
