import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: { scenarioId: string } }) {
  const versions = await db.scenarioVersion.findMany({
    where: { scenarioId: params.scenarioId },
    select: { id: true, version: true, estimatedCost: true, snapshot: true, createdAt: true },
    orderBy: { version: "desc" },
  });
  return NextResponse.json({ versions });
}
