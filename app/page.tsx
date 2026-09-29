import Link from "next/link";
import { ArrowLeft, BookMarked, ChevronLeft, Gem, Newspaper, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { getNews, getOffers, getProducts, getSettings } from "@/lib/db";
import StoreProductCard from "@/app/store/product-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, products, offers, news] = await Promise.all([
    getSettings(),
    getProducts(),
    getOffers(),
    getNews()
  ]);

  const s = settings ?? {
    brand_name: "بسّام",
    brand_tagline: "",
    announcement: "",
    hero_title: "",
    hero_description: "",
    hero_image: null,
    featured_title: "",
    offer_title: "",
    news_title: "",
    show_featured: true,
    show_offers: true,
    show_news: true,
    show_about: true
  };

  return (
    <main>
      <section className="shell pt-8 md:pt-12">
        <div className="hero-grid relative overflow-hidden rounded-[36px] bg-[var(--brand-2)] p-7 text-white shadow-[0_32px_100px_rgba(8,56,47,.28)] md:min-h-[520px] md:p-14">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--gold)]/20 blur-3xl" />
          <div className="absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-[var(--brand)]/35 blur-3xl" />
          {s.hero_image && <img src={s.hero_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
          <div className="absolute inset-0 bg-gradient-to-l from-black/15 via-transparent to-black/30" />
          <div className="relative grid min-h-[420px] items-end gap-12 lg:grid-cols-[1.3fr_.7fr]">
            <div className="max-w-3xl self-center reveal">
              {s.announcement && <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-bold tracking-wide text-white/85"><Sparkles size={14}/>{s.announcement}</div>}
              <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-.03em] md:text-7xl">{s.hero_title || "الواجهة بانتظار إعداد الإدارة"}</h1>
              {s.hero_description && <p className="mt-6 max-w-2xl text-sm leading-7 text-white/72 md:text-lg md:leading-8">{s.hero_description}</p>}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/store" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-[var(--brand-2)] transition hover:-translate-y-0.5">تصفح المتجر <ArrowLeft size={17}/></Link>
                <Link href="/orders" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/7 px-5 py-3.5 text-sm font-black text-white transition hover:bg-white/12">أرسل طلباً</Link>
              </div>
            </div>
            <div className="hidden self-end lg:block">
              <div className="glass rounded-[30px] p-5 text-white">
                <div className="mb-6 flex items-center justify-between"><span className="text-xs text-white/55">تجربة بسّام</span><Gem size={18} className="text-[var(--gold)]"/></div>
                <div className="grid grid-cols-2 gap-3">
                  {[['محتوى واضح','01'],['طلب سريع','02'],['عروض مرنة','03'],['إدارة مركزية','04']].map(([a,b]) => <div key={a} className="rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-[10px] text-white/40">{b}</span><p className="mt-2 text-sm font-extrabold">{a}</p></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {s.show_about && <section className="shell py-10 md:py-14"><div className="grid gap-4 md:grid-cols-3">{[
        {icon:PackageCheck,title:"منتجات مرتبة",text:"تصفح واضح بدون عناصر عائمة أو ازدحام."},
        {icon:ShieldCheck,title:"إدارة محمية",text:"لوحة مستقلة مع Password + Authenticator."},
        {icon:BookMarked,title:"API جاهز",text:"نفس البيانات قابلة للاستهلاك من تطبيق Flutter."}
      ].map(({icon:Icon,title,text})=><div key={title} className="panel p-6"><div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-[var(--surface-2)] text-[var(--brand)]"><Icon size={19}/></div><h2 className="font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p></div>)}</div></section>}

      {s.show_featured && products.some((p:any)=>p.featured) && <section className="shell pb-12 md:pb-16"><div className="mb-5 flex items-end justify-between gap-4"><div>{s.featured_title && <span className="text-xs font-black uppercase tracking-[.2em] text-[var(--brand)]">Selected</span>}<h2 className="mt-1 text-2xl font-black md:text-4xl">{s.featured_title || "منتجات مميزة"}</h2></div><Link href="/store" className="hidden items-center gap-1 text-sm font-black text-[var(--brand)] md:flex">كل المنتجات <ChevronLeft size={17}/></Link></div><div className="stagger grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{products.filter((p:any)=>p.featured).slice(0,4).map((product:any)=><StoreProductCard key={product.id} product={product}/>)}</div></section>}

      {s.show_offers && offers.length > 0 && <section className="shell pb-12 md:pb-16"><div className="panel relative overflow-hidden p-7 md:p-10"><div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-[var(--rose)]/12 blur-3xl"/><div className="relative grid gap-7 lg:grid-cols-[.6fr_1.4fr]"><div><span className="text-xs font-black uppercase tracking-[.2em] text-[var(--rose)]">Offers</span><h2 className="mt-2 text-3xl font-black">{s.offer_title || "العروض"}</h2></div><div className="grid gap-4 md:grid-cols-2">{offers.slice(0,2).map((offer:any)=><Link href={offer.href || "/store"} key={offer.id} className="group overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface-2)]">{offer.image && <img src={offer.image} alt={offer.title} className="h-40 w-full object-cover transition duration-500 group-hover:scale-[1.03]"/>}<div className="p-5"><p className="font-black">{offer.title}</p>{offer.description && <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{offer.description}</p>}</div></Link>)}</div></div></div></section>}

      {s.show_news && news.length > 0 && <section className="shell pb-16 md:pb-24"><div className="mb-5"><span className="text-xs font-black uppercase tracking-[.2em] text-[var(--gold)]">Journal</span><h2 className="mt-1 text-2xl font-black md:text-4xl">{s.news_title || "الأخبار"}</h2></div><div className="grid gap-4 md:grid-cols-2">{news.slice(0,2).map((item:any)=><Link href="/news" key={item.id} className="panel overflow-hidden transition hover:-translate-y-1">{item.image && <img src={item.image} alt={item.title} className="h-52 w-full object-cover"/>}<div className="p-6"><div className="mb-3 flex items-center gap-2 text-xs text-[var(--muted)]"><Newspaper size={14}/>{new Date(item.created_at).toLocaleDateString("ar-IQ")}</div><h3 className="text-xl font-black">{item.title}</h3>{item.excerpt && <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{item.excerpt}</p>}</div></Link>)}</div></section>}

      <footer className="border-t border-[var(--line)] py-10"><div className="shell flex flex-col gap-4 text-sm text-[var(--muted)] md:flex-row md:items-center md:justify-between"><div><strong className="text-[var(--ink)]">{s.brand_name || "بسّام"}</strong>{s.brand_tagline ? <> — {s.brand_tagline}</> : null}</div><Link href="/admin/login" className="font-bold hover:text-[var(--ink)]">دخول الإدارة</Link></div></footer>
    </main>
  );
}
