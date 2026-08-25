import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const metadataSchema = z.object({
  email: z.string().email().max(320),
  title: z.string().trim().min(1).max(200),
  roomType: z.string().trim().min(1).max(100),
  usage: z.enum(["FAMILY_HOME", "RENTAL_UNIT", "SHORT_STAY", "SMALL_SPACE", "OFFICE"]),
  areaSqm: z.coerce.number().positive().max(10_000).optional(),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const parsed = metadataSchema.safeParse({
    email: form.get("email"),
    title: form.get("title"),
    roomType: form.get("roomType"),
    usage: form.get("usage"),
    areaSqm: form.get("areaSqm") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "اطلاعات فضا معتبر نیست" }, { status: 400 });

  const images = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (images.length > 5) return NextResponse.json({ error: "حداکثر پنج تصویر مجاز است" }, { status: 400 });
  if (images.some((image) => !image.type.startsWith("image/") || image.size > 10 * 1024 * 1024)) {
    return NextResponse.json({ error: "هر فایل باید تصویر و حداکثر ۱۰ مگابایت باشد" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.upsert({ where: { email }, create: { email }, update: {} });
  const space = await db.space.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      roomType: parsed.data.roomType,
      usage: parsed.data.usage,
      areaSqm: parsed.data.areaSqm,
    },
  });

  const uploadDir = join(process.cwd(), "public", "uploads", space.id);
  await mkdir(uploadDir, { recursive: true });
  for (const image of images) {
    const extension = image.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(uploadDir, filename), Buffer.from(await image.arrayBuffer()));
    await db.photo.create({ data: { spaceId: space.id, url: `/uploads/${space.id}/${filename}` } });
  }

  return NextResponse.json({ spaceId: space.id, photoCount: images.length }, { status: 201 });
}
