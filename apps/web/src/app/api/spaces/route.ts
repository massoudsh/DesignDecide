import { NextRequest, NextResponse } from "next/server";

// POST /api/spaces — ثبت فضای جدید (metadata + مسیر عکس‌های آپلودشده)
// فاز ۱: استاب — نیاز به اتصال دیتابیس (Prisma) و storage آپلود عکس.
// TODO(phase-1): پیاده‌سازی واقعی پس از راه‌اندازی Postgres + object storage.
export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "پیاده‌سازی نشده — نیازمند اتصال دیتابیس (issue مربوطه در GitHub)" },
    { status: 501 }
  );
}
