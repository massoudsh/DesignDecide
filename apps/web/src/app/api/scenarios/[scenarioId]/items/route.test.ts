import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  remove: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  version: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    scenarioItem: { findFirst: mocks.findFirst, delete: mocks.remove, findMany: mocks.findMany },
    scenario: { update: mocks.update },
  },
}));
vi.mock("@/lib/scenario-versions", () => ({ createScenarioVersion: mocks.version }));

import { DELETE } from "./route";

describe("item removal totals", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.findFirst.mockResolvedValue({ id: "item-1" });
    mocks.version.mockResolvedValue({ version: 2 });
  });

  it.each([
    { items: [], cost: 0, quantity: 0 },
    { items: [{ quantity: 3, product: { priceToman: 100 } }, { quantity: 2, product: null }], cost: 300, quantity: 5 },
  ])("calculates totals from the remaining items: $quantity units", async ({ items, cost, quantity }) => {
    mocks.findMany.mockResolvedValue(items);
    const response = await DELETE(new NextRequest("http://localhost/api/scenarios/scenario-1/items", {
      method: "DELETE",
      body: JSON.stringify({ itemId: "item-1" }),
      headers: { "Content-Type": "application/json" },
    }), { params: { scenarioId: "scenario-1" } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: 2, estimatedCost: cost, itemCount: quantity });
    expect(mocks.findMany).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "scenario-1" }, data: { estimatedCost: cost } });
  });
});
