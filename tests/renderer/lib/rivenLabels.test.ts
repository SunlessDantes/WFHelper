import { describe, expect, it } from "vitest";

import { rivenStatLabel, rivenWeaponLabel } from "../../../src/lib/rivenLabels";

describe("rivenStatLabel", () => {
  const names = {
    "critical chance": "치명타 확률",
    "fire rate / attack speed": "연사력 / 공격 속도",
  };

  it("looks the English label up case-blind and keeps it on a miss", () => {
    expect(rivenStatLabel("Critical Chance", names)).toBe("치명타 확률");
    expect(rivenStatLabel("Fire Rate / Attack Speed", names)).toBe("연사력 / 공격 속도");
    expect(rivenStatLabel("Zoom", names)).toBe("Zoom");
    expect(rivenStatLabel(null, names)).toBe("");
  });
});

describe("rivenWeaponLabel", () => {
  const db = {
    "/Lotus/Soma": { name: "Soma", displayName: "소마" },
    "/Lotus/Braton": { name: "Braton" },
  };

  it("shows the game-language weapon name, falling back to the riven's English one", () => {
    expect(rivenWeaponLabel({ weaponName: "Soma", weaponUniqueName: "/Lotus/Soma" }, db)).toBe(
      "소마",
    );
    expect(rivenWeaponLabel({ weaponName: "Braton", weaponUniqueName: "/Lotus/Braton" }, db)).toBe(
      "Braton",
    );
    expect(rivenWeaponLabel({ weaponName: "Kuva Bramma", weaponUniqueName: "" }, db)).toBe(
      "Kuva Bramma",
    );
  });
});
