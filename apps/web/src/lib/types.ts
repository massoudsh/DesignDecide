// نوع‌های مشترک دامنه — مطابق با prisma/schema.prisma
// این فایل قرارداد بین لایه AI، کاتالوگ و API است.

export type BudgetTier = "ECONOMIC" | "STANDARD" | "PREMIUM";

export type SpaceUsage =
  | "FAMILY_HOME"
  | "RENTAL_UNIT"
  | "SHORT_STAY"
  | "SMALL_SPACE"
  | "OFFICE";

export interface SpacePhotoAnalysis {
  roomType: string;
  estimatedAreaSqm?: number;
  lightingCondition: "low" | "medium" | "high";
  existingItems: string[];
  issues: string[]; // مشکلات تشخیص‌داده‌شده (نور کم، شلوغی، چیدمان ضعیف و ...)
}

export interface TastePreference {
  styleTags: string[];
  budgetTier: BudgetTier;
  budgetMaxToman?: number;
  mustKeep: string[];
  notes?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  category: string;
  tier: BudgetTier;
  priceToman: number;
  vendor?: string;
  imageUrl?: string;
  sourceUrl?: string;
}

export interface ScenarioItem {
  category: string;
  label: string;
  quantity: number;
  product?: CatalogProduct;
  notes?: string;
}

export interface DesignScenario {
  tier: BudgetTier;
  title: string;
  description: string;
  items: ScenarioItem[];
  estimatedCostToman: number;
}

export interface ScenarioGenerationInput {
  roomType: string;
  usage: SpaceUsage;
  areaSqm?: number;
  photoAnalyses: SpacePhotoAnalysis[];
  preference: TastePreference;
}
