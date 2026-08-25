"use client";

import { useState } from "react";
import type { BudgetTier, DesignScenario } from "@/lib/types";

const tiers: Array<{ id: BudgetTier; label: string }> = [
  { id: "ECONOMIC", label: "اقتصادی" },
  { id: "STANDARD", label: "استاندارد" },
  { id: "PREMIUM", label: "پریمیوم" },
];

export default function HomePage() {
  const [roomType, setRoomType] = useState("پذیرایی");
  const [areaSqm, setAreaSqm] = useState("35");
  const [style, setStyle] = useState("مینیمال");
  const [budgetMax, setBudgetMax] = useState("");
  const [mustKeep, setMustKeep] = useState("");
  const [notes, setNotes] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [email, setEmail] = useState("");
  const [spaceTitle, setSpaceTitle] = useState("پذیرایی خانه");
  const [images, setImages] = useState<FileList | null>(null);
  const [spaceSaved, setSpaceSaved] = useState(false);
  const [scenarios, setScenarios] = useState<DesignScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function saveSpace() {
    const form = new FormData();
    form.append("email", email);
    form.append("title", spaceTitle);
    form.append("roomType", roomType);
    form.append("usage", "FAMILY_HOME");
    form.append("areaSqm", areaSqm);
    if (images) Array.from(images).forEach((image) => form.append("images", image));
    const response = await fetch("/api/spaces", { method: "POST", body: form });
    if (response.ok) setSpaceSaved(true);
  }

  async function generateScenarios() {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        tiers.map(async ({ id }) => {
          const response = await fetch("/api/scenarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomType,
              usage: "FAMILY_HOME",
              areaSqm: Number(areaSqm) || undefined,
              preference: { styleTags: [style], budgetTier: id, budgetMaxToman: Number(budgetMax) || undefined, mustKeep: mustKeep.split(",").map((item) => item.trim()).filter(Boolean), notes: notes || undefined },
            }),
          });
          if (!response.ok) throw new Error("scenario_generation_failed");
          return (await response.json()).scenario as DesignScenario;
        })
      );
      setScenarios(results);
    } catch {
      setError("ساخت سناریو انجام نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fc] text-slate-900">
      <div className="absolute inset-x-0 top-0 -z-0 h-[420px] bg-[radial-gradient(circle_at_15%_0%,#c4b5fd_0,transparent_34%),radial-gradient(circle_at_85%_0%,#99f6e4_0,transparent_38%)] opacity-70" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-lg text-white shadow-lg shadow-slate-300">ط</div><div><p className="font-black tracking-tight">طرح‌یار</p><p className="text-xs text-slate-500">طراحی با تصمیم بهتر</p></div></div>
        <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur">نسخهٔ آزمایشی فاز ۱</span>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-10 lg:pt-20">
        <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-xs font-bold text-teal-700 shadow-sm backdrop-blur"><span className="h-2 w-2 rounded-full bg-teal-400" /> سناریوی مناسب فضای شما</div><h1 className="max-w-2xl text-5xl font-black leading-[1.15] tracking-tight md:text-7xl">فضایت را<br /><span className="text-teal-600">تصمیم‌پذیر</span> کن.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">با چند انتخاب ساده، سه مسیر طراحی قابل اجرا و قابل قیمت‌گذاری برای فضای ایرانی‌ات بساز.</p></div>
        <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-2xl shadow-slate-200/80 backdrop-blur-xl md:p-8">
          <div className="mb-7 flex items-center justify-between"><div><h2 className="text-xl font-black">فضای شما</h2><p className="mt-1 text-sm text-slate-500">بریف کوتاه طراحی را کامل کن</p></div><span className="text-2xl">+</span></div>
          <div className="space-y-5">
            <label className="block text-sm font-bold">نوع فضا<input value={roomType} onChange={(e) => setRoomType(e.target.value)} className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 transition focus:ring-2" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">مساحت تقریبی<input type="number" min="1" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label><label className="block text-sm font-bold">سبک مورد علاقه<input value={style} onChange={(e) => setStyle(e.target.value)} className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label></div>
            <label className="block text-sm font-bold">مواردی که باید حفظ شوند<input value={mustKeep} onChange={(e) => setMustKeep(e.target.value)} placeholder="مثلاً مبل فعلی، کتابخانه" className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">سقف بودجه<input type="number" min="0" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="اختیاری" className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label><label className="block text-sm font-bold">توضیحات تکمیلی<input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="حس‌وحال فضا" className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label></div>
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">نام فضای ذخیره‌شده<input value={spaceTitle} onChange={(e) => setSpaceTitle(e.target.value)} className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label><label className="block text-sm font-bold">ایمیل شما<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border-0 bg-slate-100 px-4 py-3.5 outline-none ring-teal-300 focus:ring-2" /></label></div><label className="block text-sm font-bold">عکس‌های فضا<input type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} className="mt-2 block w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm" /></label><button type="button" onClick={saveSpace} className="w-full rounded-2xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700">{spaceSaved ? "فضا ذخیره شد" : "ذخیره فضا و عکس‌ها"}</button>
            <button onClick={generateScenarios} disabled={loading} className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-bold text-white shadow-xl shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">{loading ? "در حال ساخت سناریوها..." : "ساخت سه سناریوی من"}</button>{error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          </div>
        </div>
      </section>

      {scenarios.length > 0 && <section className="relative mx-auto max-w-7xl px-6 pb-20 lg:px-10"><div className="mb-7 flex items-end justify-between"><div><p className="mb-2 text-sm font-bold text-teal-600">پیشنهادهای طرح‌یار</p><h2 className="text-3xl font-black">سه مسیر برای مقایسه</h2></div><span className="hidden text-sm text-slate-500 sm:block">قیمت‌ها تخمینی و بر پایه کاتالوگ نمونه‌اند</span></div><div className="grid gap-5 lg:grid-cols-3">{scenarios.map((scenario, index) => <article key={`${scenario.tier}-${index}`} className={`rounded-[1.75rem] border bg-white p-6 shadow-lg shadow-slate-200/50 ${index === 1 ? "border-teal-300 ring-2 ring-teal-100" : "border-slate-100"}`}><div className="mb-6 flex items-start justify-between"><div><span className="text-xs font-bold text-slate-400">مسیر {index + 1}</span><h3 className="mt-1 text-xl font-black">{tiers.find((tier) => tier.id === scenario.tier)?.label}</h3></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">{scenario.items.length} آیتم</span></div><p className="mb-6 text-sm leading-7 text-slate-500">{scenario.description}</p><div className="space-y-3 border-y border-slate-100 py-4">{scenario.items.map((item) => <div key={`${item.category}-${item.label}`} className="flex items-center justify-between text-sm"><span className="text-slate-500">{item.category}</span><strong>{item.product?.name ?? item.label}</strong></div>)}</div><div className="mt-5 flex items-end justify-between"><span className="text-xs text-slate-400">برآورد کل</span><strong className="text-xl">{scenario.estimatedCostToman.toLocaleString("fa-IR")} <small className="text-xs font-normal text-slate-400">تومان</small></strong></div></article>)}</div></section>}
      <section className="relative mx-auto max-w-7xl px-6 pb-16 lg:px-10"><div className="rounded-[2rem] bg-slate-950 p-7 text-white md:flex md:items-center md:justify-between md:p-10"><div><p className="text-sm font-bold text-teal-300">در جریان ادامه مسیر باشید</p><h2 className="mt-2 text-2xl font-black">نسخهٔ کامل طرح‌یار را زودتر ببینید</h2></div>{waitlistJoined ? <p className="mt-5 font-bold text-teal-300 md:mt-0">ایمیل شما ثبت شد.</p> : <form className="mt-5 flex gap-2 md:mt-0" onSubmit={async (event) => { event.preventDefault(); const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: waitlistEmail }) }); if (response.ok) setWaitlistJoined(true); }}><input type="email" required value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="ایمیل شما" className="w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none ring-teal-400 placeholder:text-slate-400 focus:ring-2 md:w-64" /><button className="rounded-xl bg-teal-400 px-4 py-3 font-bold text-slate-950">عضویت</button></form>}</div></section>
    </main>
  );
}
