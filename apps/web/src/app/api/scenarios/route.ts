import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateScenario } from "@/lib/ai/scenario-generator";
import type { ScenarioGenerationInput } from "@/lib/types";

const bodySchema = z.object({
  roomType: z.string(),
  usage: z.enum([
    "FAMILY_HOME",
    "RENTAL_UNIT",
    "SHORT_STAY",
    "SMALL_SPACE",
    "OFFICE",
  ]),
  areaSqm: z.number().optional(),
  preference: z.object({
    styleTags: z.array(z.string()),
    budgetTier: z.enum(["ECONOMIC", "STANDARD", "PREMIUM"]),
    budgetMaxToman: z.number().optional(),
    mustKeep: z.array(z.string()),
    notes: z.string().optional(),
  }),
});

// POST /api/scenarios — تولید سناریوی طراحی برای یک فضا
// ورودی: metadata فضا + پروفایل سلیقه/بودجه — خروجی: یک DesignScenario
export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ورودی نامعتبر", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const input: ScenarioGenerationInput = {
    ...parsed.data,
    photoAnalyses: [], // فاز ۱: هنوز به تحلیل تصویر متصل نشده
  };

  const scenario = await generateScenario(input);
  return NextResponse.json({ scenario });
}
