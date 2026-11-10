# طرح‌یار (DesignDecide)

کوپایلوت هوشمند طراحی داخلی، قیمت‌گذاری و تأمین برای فضاهای ایرانی.
AI Interior Design & Procurement Copilot for Iranian Spaces.

## مسئله

بازار ایران کوپایلوت طراحی داخلی‌ای ندارد که فضا، کاربری، سلیقه، بودجه و داده‌ی
واقعی تأمین‌کنندگان را کنار هم بفهمد و چند سناریوی قابل اجرا، قابل قیمت‌گذاری
و قابل تأمین بسازد. طرح‌یار طراحی داخلی را از الهام پراکنده به **تصمیم قابل خرید**
تبدیل می‌کند.

## معماری فاز ۱

اپ تک‌جداره (Next.js App Router) به‌جای سرویس‌های جدا، برای سرعت توسعه‌ی MVP:

```
apps/web/
  src/app/            صفحات + Route Handlers (API)
  src/lib/ai/          لایه هوش مصنوعی (تحلیل تصویر، تولید سناریو)
  src/lib/catalog/     کاتالوگ کالا (فاز ۱: seed ثابت)
  src/lib/types.ts     قرارداد نوع‌های دامنه
  prisma/schema.prisma مدل داده (Space, Preference, Scenario, Product, ...)
```

جزئیات کامل معماری و مدل داده در ویکی پروژه (`.noqte/wiki/`) نگهداری می‌شود.

## نقشه راه

جزئیات کامل فازها در [ROADMAP.md](./ROADMAP.md).

## توسعه

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev
```

> نصب پکیج‌ها و اجرای دیتابیس واقعی به دلیل حجم بالا در محیط توسعه‌ی سبک
> توصیه نمی‌شود — برای تست کامل روی سرور استقرار انجام شود.

## استقرار production

پیش‌نیاز: Node.js 20+ و PostgreSQL 14+.

```bash
npm ci
npm run prisma:generate -w apps/web
npm run prisma:deploy -w apps/web
npm run build -w apps/web
npm run start -w apps/web
```

متغیرهای لازم در `apps/web/.env`:

- `DATABASE_URL` — اتصال PostgreSQL production
- `OPENAI_API_KEY` — فقط زمانی لازم است که لایهٔ AI واقعی فعال شود

برای health check از `GET /api/health` استفاده کنید؛ پاسخ سالم `{ "status": "ok" }` است. فایل‌های آپلودی فعلاً در `public/uploads` ذخیره می‌شوند؛ در محیط چندنمونه‌ای باید این مسیر روی volume پایدار یا object storage mount شود.

## استقرار با Docker

روی سرور دارای Docker Engine و Compose v2، از ریشهٔ پروژه اجرا کنید. بیلد image باید روی سرور انجام شود.

در محیط استقرار `POSTGRES_PASSWORD` و `DATABASE_URL` را به‌صورت امن تنظیم کنید؛ آن‌ها را در Git یا دستورهای دارای مقدار واقعی ثبت نکنید. قالب اتصال داخل شبکهٔ Compose:

```text
postgresql://tarhyar:<URL_ENCODED_PASSWORD>@db:5432/tarhyar?schema=public
```

رمز داخل URL باید نسخهٔ percent-encoded مقدار `POSTGRES_PASSWORD` باشد. این تنظیم برای دیتابیس جدید Compose است؛ دادهٔ دیتابیس قبلی VPS خودکار منتقل نمی‌شود.

```bash
docker compose build --pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 web migrate
```

Compose ابتدا سلامت PostgreSQL را بررسی می‌کند، سپس migration را با image جدا اجرا می‌کند و فقط پس از موفقیت آن اپ را بالا می‌آورد. اجرای مجدد پس از تغییر کد:

```bash
docker compose build --pull
docker compose up -d db
docker compose run --rm migrate
docker compose up -d --no-deps web
```

اپ با Node.js 22 و کاربر غیر root اجرا می‌شود؛ health check آن `/api/health` است. پورت پیش‌فرض فقط روی loopback سرور منتشر می‌شود؛ برای انتشار عمومی، reverse proxy دارای HTTPS را به پورت `3000` متصل کنید. اگر سرویس قبلی همین پورت را گرفته است، `WEB_PORT` را تغییر دهید و سرویس قبلی را بدون برنامهٔ انتقال متوقف نکنید.

volumeهای `postgres-data` و `uploads-data` مستقل از عمر container هستند. برای دادهٔ production backup جدا داشته باشید؛ از `docker compose down -v` استفاده نکنید مگر با قصد حذف کامل داده‌ها. PostgreSQL هیچ پورت عمومی منتشر نمی‌کند. فایل‌های محیطی، پیوست‌ها و ابزارهای توسعه از build context حذف شده‌اند.

## لایسنس

Apache License 2.0 — جزئیات در [LICENSE](./LICENSE).
