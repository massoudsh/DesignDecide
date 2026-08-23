import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createScenarioVersion } from "@/lib/scenario-versions";

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  notes: z.string().max(1_000).optional(),
});

const replacementSchema = z.object({
  itemId: z.string().min(1),
  productId: z.string().min(1),
});

const removalSchema = z.object({ itemId: z.string().min(1) });

async function recalculateScenarioCost(scenarioId: string) {
  const total = await db.scenarioItem.aggregate({
    where: { scenarioId },
    _sum: { quantity: true },
  });
  const items = await db.scenarioItem.findMany({
    where: { scenarioId },
    include: { product: { select: { priceToman: true } } },
  });
  const estimatedCost = items.reduce(
    (sum, item) => sum + (item.product?.priceToman ?? 0) * item.quantity,
    0
  );
  await db.scenario.update({ where: { id: scenarioId }, data: { estimatedCost } });
  return { estimatedCost, itemCount: total._sum.quantity ?? 0 };
}

export async function POST(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });

  const [scenario, product] = await Promise.all([
    db.scenario.findUnique({ where: { id: params.scenarioId } }),
    db.product.findUnique({ where: { id: parsed.data.productId } }),
  ]);
  if (!scenario || !product) return NextResponse.json({ error: "سناریو یا محصول یافت نشد" }, { status: 404 });

  const item = await db.scenarioItem.create({
    data: {
      scenarioId: scenario.id,
      category: product.category,
      label: product.name,
      productId: product.id,
      quantity: parsed.data.quantity,
      notes: parsed.data.notes,
    },
    include: { product: true },
  });
  const summary = await recalculateScenarioCost(scenario.id);
  const version = await createScenarioVersion(scenario.id);
  return NextResponse.json({ item, version: version.version, ...summary }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  const parsed = replacementSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });

  const [item, product] = await Promise.all([
    db.scenarioItem.findFirst({ where: { id: parsed.data.itemId, scenarioId: params.scenarioId } }),
    db.product.findUnique({ where: { id: parsed.data.productId } }),
  ]);
  if (!item || !product) return NextResponse.json({ error: "آیتم یا محصول یافت نشد" }, { status: 404 });
  if (product.category !== item.category) {
    return NextResponse.json({ error: "محصول جایگزین باید هم‌رده باشد" }, { status: 422 });
  }

  const updated = await db.scenarioItem.update({
    where: { id: item.id },
    data: { productId: product.id, label: product.name },
    include: { product: true },
  });
  const summary = await recalculateScenarioCost(params.scenarioId);
  const version = await createScenarioVersion(params.scenarioId);
  return NextResponse.json({ item: updated, version: version.version, ...summary });
}

export async function DELETE(req: NextRequest, { params }: { params: { scenarioId: string } }) {
  const parsed = removalSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "ورودی نامعتبر" }, { status: 400 });

  const item = await db.scenarioItem.findFirst({
    where: { id: parsed.data.itemId, scenarioId: params.scenarioId },
  });
  if (!item) return NextResponse.json({ error: "آیتم یافت نشد" }, { status: 404 });

  await db.scenarioItem.delete({ where: { id: item.id } });
  const summary = await recalculateScenarioCost(params.scenarioId);
  const version = await createScenarioVersion(params.scenarioId);
  return NextResponse.json({ version: version.version, ...summary });
}
