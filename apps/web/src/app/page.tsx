export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-50 text-brand-900">
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="mb-3 text-sm text-brand-500">DesignDecide</p>
        <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl">
          طرح‌یار
        </h1>
        <p className="mb-10 text-lg text-brand-600">
          کوپایلوت هوشمند طراحی داخلی، قیمت‌گذاری و تأمین برای فضاهای ایرانی.
          عکس فضایت را بگذار، بودجه و سلیقه‌ات را بگو، چند سناریوی قابل اجرا
          و قابل قیمت‌گذاری بگیر.
        </p>
        <div className="inline-flex gap-3">
          <a
            href="#waitlist"
            className="rounded-full bg-brand-500 px-6 py-3 font-medium text-white hover:bg-brand-600"
          >
            ثبت‌نام در لیست انتظار
          </a>
        </div>
      </section>
    </main>
  );
}
