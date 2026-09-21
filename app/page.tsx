import Link from "next/link";
import {
  Bell,
  Search,
  Newspaper,
  ShoppingCart,
  FileText,
  ChevronLeft,
  Tag,
  Send,
  Megaphone,
} from "lucide-react";
import HeroBanner from "@/components/hero-banner";
import { getProductsByPlacement, getAds, getSiteSettings } from "@/app/actions";
import StoreProductCard from "@/app/store/product-card";

export default async function Home() {
  const [homeProducts, ads, settings] = await Promise.all([
    getProductsByPlacement("home"),
    getAds(),
    getSiteSettings(),
  ]);

  // نبني خريطة سريعة (key -> section) عشان نعرف حالة كل قسم
  // (ظاهر أو مخفي) والعنوان اللي حطه الأدمن. لو قسم غير موجود
  // بالإعدادات المخزنة (مثلاً أضيف بتحديث لاحق)، يبقى ظاهر
  // بعنوانه الافتراضي بدل ما يختفي بالغلط.
  const sectionMap = new Map(settings.homeSections.map((s) => [s.key, s]));
  const isVisible = (key: string) => sectionMap.get(key)?.visible ?? true;
  const titleFor = (key: string, fallback: string) =>
    sectionMap.get(key)?.title || fallback;

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full bg-surface border border-border">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2.5">
          <Search className="w-4 h-4 opacity-60" />
          <span className="text-sm opacity-60">ابحث عن كتاب، مؤلف، أو أي شيء...</span>
        </div>
      </div>

      <HeroBanner
        slides={
          ads.length > 0
            ? ads.slice(0, 4).map((ad) => ({
                title: ad.title,
                subtitle: ad.description ?? `مدة العرض: ${ad.duration}`,
                image: ad.image,
                cta: "شوف العرض",
                href: "/ads",
              }))
            : undefined
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/news"
          className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-3"
        >
          <span className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Newspaper className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold flex items-center justify-between">
              الأخبار <ChevronLeft className="w-4 h-4 opacity-50" />
            </p>
            <p className="text-xs opacity-60 mt-0.5">آخر الكتب والعروض</p>
          </div>
        </Link>

        <Link
          href="/store"
          className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-3"
        >
          <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold flex items-center justify-between">
              المتجر <ChevronLeft className="w-4 h-4 opacity-50" />
            </p>
            <p className="text-xs opacity-60 mt-0.5">تصفح واشتري بسهولة</p>
          </div>
        </Link>

        <Link
          href="/transactions"
          className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-3"
        >
          <span className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-semibold flex items-center justify-between">
              المعاملات <ChevronLeft className="w-4 h-4 opacity-50" />
            </p>
            <p className="text-xs opacity-60 mt-0.5">طلباتك وحسابك</p>
          </div>
        </Link>
      </div>

      {homeProducts.length > 0 && isVisible("featured_products") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              {titleFor("featured_products", "منتجات مميزة")}{" "}
              <Tag className="w-4 h-4 text-accent" />
            </h2>
            <Link
              href="/store"
              className="text-sm opacity-70 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> عرض الكل
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {homeProducts.map((product) => (
              <StoreProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {isVisible("exclusive_ads") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              {titleFor("exclusive_ads", "عروض حصرية")}{" "}
              <Megaphone className="w-4 h-4 text-accent" />
            </h2>
            <Link href="/ads" className="text-sm opacity-70 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> عرض الكل
            </Link>
          </div>

          {ads.length === 0 ? (
            <p className="text-sm opacity-50 py-4 text-center">
              لا توجد عروض حالياً
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {ads.slice(0, 2).map((ad) => (
                <Link
                  key={ad.id}
                  href="/ads"
                  className="relative rounded-xl overflow-hidden h-36 bg-surface border border-border"
                >
                  {ad.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  <div className="relative h-full flex flex-col justify-end p-3 text-white">
                    <p className="text-sm font-semibold">{ad.title}</p>
                    {ad.description && (
                      <p className="text-xs text-neutral-300">
                        {ad.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {(settings.tiktokUrl || settings.instagramUrl || settings.telegramUrl) && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-sm opacity-60">تابعنا على</p>
          <div className="flex items-center gap-4">
            {settings.tiktokUrl && (
              <a
                href={settings.tiktokUrl}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold"
              >
                TT
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-sm font-bold"
              >
                IG
              </a>
            )}
            {settings.telegramUrl && (
              <a
                href={settings.telegramUrl}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs opacity-50 pb-2">
        © {new Date().getFullYear()} {settings.footerText || "حقوق النشر والطباعة محفوظة"}
      </p>
    </main>
  );
}
