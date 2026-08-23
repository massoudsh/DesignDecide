import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createScenarioVersion } from "@/lib/scenario-versions";

const snapshotSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedCost: z.number().int().nullable(),
  items: z.array(
    z.object({
      category: z.string(),
      label: z.string(),
      productId: z.string().nullable(),
      quantity: z.number().int().positive(),
      notes: z.string().nullable(),
    })
  ),
});

export async function POST(_req: Request, { params }: { params: { scenarioId: string; versionId: string } }) {
  const version = await db.scenarioVersion.findFirst({
    where: { id: params.versionId, scenarioId: params.scenarioId },
  });
  if (!version) return NextResponse.json({ error: "نسخه یافت نشد" }, { status: 404 });

  const snapshot = snapshotSchema.safeParse(version.snapshot);
  if (!snapshot.success) return NextResponse.json({ error: "نسخه نامعتبر است" }, { status: 422 });

  await db.$transaction([
    db.scenarioItem.deleteMany({ where: { scenarioId: params.scenarioId } }),
    db.scenario.update({
      where: { id: params.scenarioId },
      data: {
        title: snapshot.data.title,
        description: snapshot.data.description,
        estimatedCost: snapshot.data.estimatedCost,
      },
    }),
    db.scenarioItem.createMany({
      data: snapshot.data.items.map((item) => ({ scenarioId: params.scenarioId, ...item })),
    }),
  ]);
  const restored = await createScenarioVersion(params.scenarioId);
  return NextResponse.json({ version: restored.version, estimatedCost: restored.estimatedCost });
}
