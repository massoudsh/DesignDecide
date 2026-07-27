import type {
  DesignScenario,
  ScenarioGenerationInput,
  ScenarioItem,
} from "@/lib/types";
import { findProductsByCategory } from "@/lib/catalog/seed-data";

/**
 * موتور تولید سناریوی طراحی — قلب "design decisioning".
 * فاز ۱: پیاده‌سازی حداقلی مبتنی بر قوانین ساده (rule-based) روی کاتالوگ seed،
 * فقط برای تیر بودجه‌ی انتخاب‌شده‌ی کاربر — تا جریان end-to-end (فضا -> سناریو ->
 * تخمین قیمت) قابل تست باشد.
 *
 * TODO(phase-1): جایگزینی بخش انتخاب آیتم با یک LLM که با توجه به roomType،
 * preference.styleTags و photoAnalyses، توصیف و ترکیب آیتم را تولید کند
 * (نه فقط انتخاب ثابت از کاتالوگ).
 */
export async function generateScenario(
  input: ScenarioGenerationInput
): Promise<DesignScenario> {
  const { preference } = input;
  const categories = ["مبلمان", "فرش", "نورپردازی", "پرده", "دکور"];

  const items: ScenarioItem[] = categories
    .map((category) => {
      const candidates = findProductsByCategory(category, preference.budgetTier);
      const product = candidates[0];
      if (!product) return null;
      return {
        category,
        label: product.name,
        quantity: 1,
        product,
      } satisfies ScenarioItem;
    })
    .filter((x): x is ScenarioItem => x !== null);

  const estimatedCostToman = items.reduce(
    (sum, item) => sum + (item.product?.priceToman ?? 0) * item.quantity,
    0
  );

  return {
    tier: preference.budgetTier,
    title: `سناریوی ${tierLabel(preference.budgetTier)} برای ${input.roomType}`,
    description:
      "این سناریو به‌صورت خودکار و بر پایه‌ی کاتالوگ نمونه ساخته شده — در فاز ۱ باید با موتور LLM جایگزین شود.",
    items,
    estimatedCostToman,
  };
}

function tierLabel(tier: ScenarioGenerationInput["preference"]["budgetTier"]) {
  switch (tier) {
    case "ECONOMIC":
      return "اقتصادی";
    case "STANDARD":
      return "استاندارد";
    case "PREMIUM":
      return "پریمیوم";
  }
}
