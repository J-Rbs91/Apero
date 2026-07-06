import { describe, expect, it } from "vitest";
import { BADGE_DEFINITIONS, type BadgeIconName } from "./badges";

const validIconNames: BadgeIconName[] = [
  "institution",
  "location",
  "table",
  "emptyChair",
  "crown",
  "member",
  "ballot",
  "minister",
  "diplomat",
];

describe("badge definitions", () => {
  it("use iconName instead of emoji icon fields", () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect("icon" in badge).toBe(false);
      expect(validIconNames).toContain(badge.iconName);
    }
  });

  it("do not contain emoji code points in names or descriptions", () => {
    const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.name).not.toMatch(emojiPattern);
      expect(badge.description).not.toMatch(emojiPattern);
    }
  });
});
