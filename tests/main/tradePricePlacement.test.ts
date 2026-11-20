import { describe, expect, it } from "vitest";

import { priceWarningPlacement } from "../../config/shared/tradePrice";

describe("priceWarningPlacement", () => {
  const size = { width: 555, height: 156 };

  it("centres the toast and drops it a fifth of the way down the work area", () => {
    expect(priceWarningPlacement({ x: 0, y: 0, width: 2560, height: 1400 }, size)).toEqual({
      x: 1003,
      y: 280,
    });
  });

  it("measures from the display's own origin", () => {
    expect(priceWarningPlacement({ x: 1920, y: 40, width: 1920, height: 1000 }, size)).toEqual({
      x: 1920 + 683,
      y: 240,
    });
  });
});
