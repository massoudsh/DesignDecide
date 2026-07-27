import type { CatalogProduct } from "@/lib/types";

// کاتالوگ seed فاز ۱ — نمونه‌ی محدود برای تست جریان تطبیق کالا و تخمین قیمت.
// در فاز ۲ این داده باید از دیتابیس واقعی تأمین‌کنندگان (اتصال API فروشگاه‌ها) بیاید.
export const seedCatalog: CatalogProduct[] = [
  {
    id: "sofa-eco-1",
    name: "مبل راحتی دو نفره پارچه‌ای",
    category: "مبلمان",
    tier: "ECONOMIC",
    priceToman: 8_500_000,
  },
  {
    id: "sofa-std-1",
    name: "مبل ال شکل استاندارد",
    category: "مبلمان",
    tier: "STANDARD",
    priceToman: 22_000_000,
  },
  {
    id: "sofa-prm-1",
    name: "مبل چرم طبیعی پریمیوم",
    category: "مبلمان",
    tier: "PREMIUM",
    priceToman: 65_000_000,
  },
  {
    id: "rug-eco-1",
    name: "فرش ماشینی طرح ساده ۶ متری",
    category: "فرش",
    tier: "ECONOMIC",
    priceToman: 4_200_000,
  },
  {
    id: "rug-std-1",
    name: "فرش ماشینی طرح مدرن ۹ متری",
    category: "فرش",
    tier: "STANDARD",
    priceToman: 9_800_000,
  },
  {
    id: "light-eco-1",
    name: "چراغ سقفی LED ساده",
    category: "نورپردازی",
    tier: "ECONOMIC",
    priceToman: 1_200_000,
  },
  {
    id: "light-std-1",
    name: "ست چراغ سقفی + آباژور",
    category: "نورپردازی",
    tier: "STANDARD",
    priceToman: 3_500_000,
  },
  {
    id: "curtain-eco-1",
    name: "پرده پارچه‌ای ساده",
    category: "پرده",
    tier: "ECONOMIC",
    priceToman: 2_000_000,
  },
  {
    id: "deco-eco-1",
    name: "پک دکور دیواری (تابلو + گیاه مصنوعی)",
    category: "دکور",
    tier: "ECONOMIC",
    priceToman: 1_500_000,
  },
];

export function findProductsByCategory(
  category: string,
  tier: string
): CatalogProduct[] {
  return seedCatalog.filter(
    (p) => p.category === category && p.tier === tier
  );
}
