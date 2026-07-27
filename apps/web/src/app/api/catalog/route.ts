import { NextResponse } from "next/server";
import { seedCatalog } from "@/lib/catalog/seed-data";

// GET /api/catalog — لیست کاتالوگ کالای فعلی (فاز ۱: داده seed ثابت)
export async function GET() {
  return NextResponse.json({ products: seedCatalog });
}
