import { db } from "@/lib/db";

export async function createScenarioVersion(scenarioId: string) {
  const scenario = await db.scenario.findUnique({
    where: { id: scenarioId },
    include: { items: { include: { product: true } }, versions: { select: { version: true } } },
  });
  if (!scenario) throw new Error("scenario_not_found");

  const version = Math.max(0, ...scenario.versions.map(({ version: value }) => value)) + 1;
  const snapshot = {
    title: scenario.title,
    description: scenario.description,
    estimatedCost: scenario.estimatedCost,
    items: scenario.items.map((item) => ({
      category: item.category,
      label: item.label,
      productId: item.productId,
      quantity: item.quantity,
      notes: item.notes,
    })),
  };

  return db.scenarioVersion.create({
    data: { scenarioId, version, estimatedCost: scenario.estimatedCost, snapshot },
  });
}
