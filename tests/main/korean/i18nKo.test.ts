import { describe, expect, it } from "vitest";

import ko from "../../../src/i18n/ko.json";
import { en } from "../../../src/i18n/en";

// tests/main/i18n.test.ts runs these checks for de and zh; this copy runs them for ko,
// except completeness: a key Korean lacks falls back to English, so new English
// text never waits on a Korean translation.

const ENGLISH_ONLY = [
  "common.whisperBuy",
  "common.whisperSell",
  "common.whisperBuyBulk",
  "common.whisperSellBulk",
];

const placeholders = (value: string): string[] =>
  [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();

const dict: Record<string, string> = ko;

describe("Korean catalogue", () => {
  it("keeps placeholders identical to English", () => {
    const mismatched = Object.entries(dict)
      .filter(([key, value]) => {
        const source = en[key as keyof typeof en];
        return source !== undefined && placeholders(source).join() !== placeholders(value).join();
      })
      .map(([key]) => key);

    expect(mismatched).toEqual([]);
  });

  it("has no entry for strings sent to other players", () => {
    for (const key of ENGLISH_ONLY) expect(dict).not.toHaveProperty(key);
  });

  it("has no key English does not define", () => {
    expect(Object.keys(dict).filter((key) => !(key in en))).toEqual([]);
  });

  it("leaves a key out rather than copying the English text", () => {
    const copied = Object.entries(dict)
      .filter(([key, value]) => en[key as keyof typeof en] === value)
      .map(([key]) => key);

    expect(copied).toEqual([]);
  });

  it("spells ellipses as three ASCII dots", () => {
    expect(Object.keys(dict).filter((key) => dict[key].includes("…"))).toEqual([]);
  });
});
