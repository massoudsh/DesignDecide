import { describe, expect, it } from "vitest";
import { generateScenario } from "./scenario-generator";
import { findProductsByCategory } from "../catalog/seed-data";
import type { ScenarioGenerationInput } from "../types";

const baseInput: ScenarioGenerationInput = {
  roomType: "پذیرایی",
  usage: "FAMILY_HOME",
  photoAnalyses: [],
  preference: {
    styleTags: ["مینیمال"],
    budgetTier: "ECONOMIC",
    mustKeep: [],
  },
};

describe("catalog matching", () => {
  it("returns products only for the requested category and tier", () => {
    const products = findProductsByCategory("مبلمان", "STANDARD");

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: "sofa-std-1",
      category: "مبلمان",
      tier: "STANDARD",
    });
  });

  it("returns an empty list when no matching product exists", () => {
    expect(findProductsByCategory("مبلمان", "PREMIUM")).toEqual([
      expect.objectContaining({ id: "sofa-prm-1" }),
    ]);
    expect(findProductsByCategory("ناموجود", "ECONOMIC")).toEqual([]);
  });
});

describe("scenario generation", () => {
  it.each([
    ["ECONOMIC", 17_400_000],
    ["STANDARD", 35_300_000],
    ["PREMIUM", 65_000_000],
  ] as const)("builds a %s scenario with the catalog total", async (tier, total) => {
    const scenario = await generateScenario({
      ...baseInput,
      preference: { ...baseInput.preference, budgetTier: tier },
    });

    expect(scenario.tier).toBe(tier);
    expect(scenario.title).toContain("پذیرایی");
    expect(scenario.items).toHaveLength(tier === "ECONOMIC" ? 5 : tier === "STANDARD" ? 3 : 1);
    expect(scenario.estimatedCostToman).toBe(total);
  });

  it("keeps the generated item quantity in the estimate", async () => {
    const scenario = await generateScenario(baseInput);

    expect(scenario.items.every((item) => item.quantity === 1)).toBe(true);
    expect(scenario.estimatedCostToman).toBe(
      scenario.items.reduce(
        (total, item) => total + (item.product?.priceToman ?? 0) * item.quantity,
        0
      )
    );
  });
});
