import type { SpacePhotoAnalysis } from "@/lib/types";

/**
 * تحلیل بصری عکس فضا — مرحله "spatial understanding".
 * فاز ۱: استاب — قرارداد ورودی/خروجی مشخص است تا لایه AI واقعی (Vision API)
 * بدون تغییر در بقیه‌ی pipeline جایگزین شود.
 *
 * TODO(phase-1): اتصال به یک Vision-capable LLM (مثلاً از طریق OPENAI_API_KEY)
 * برای استخراج roomType، شرایط نور، آیتم‌های موجود و مشکلات فضا از روی عکس.
 */
export async function analyzeSpacePhoto(
  photoUrl: string
): Promise<SpacePhotoAnalysis> {
  throw new Error(
    "analyzeSpacePhoto: پیاده‌سازی نشده — نیاز به اتصال Vision API (فاز ۱، issue مربوطه در GitHub)"
  );
}
