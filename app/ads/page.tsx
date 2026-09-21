import { Tag, Megaphone, ShoppingBag } from "lucide-react";
import { getAds, getProductsByPlacement } from "@/app/actions";
import StoreProductCard from "@/app/store/product-card";

export default async function Ads() {
  const [ads, featuredProducts] = await Promise.all([
    getAds(),
    getProductsByPlacement("ads"),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">الإعلانات</h1>
        <p className="text-sm opacity-60 mt-0.5">أحدث العروض والخصومات</p>
      </div>

      {featuredProducts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <ShoppingBag className="w-4 h-4 text-accent" />
            منتجات مميزة
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {featuredProducts.map((product) => (
              <StoreProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {ads.length === 0 ? (
        featuredProducts.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 opacity-50">
            <Megaphone className="w-8 h-8" />
            <p className="text-sm">لا توجد إعلانات حالياً</p>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-4">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              {ad.image && (
                <div className="w-full h-36 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex items-start gap-3">
                <div className="bg-accent text-white rounded-full p-2 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold">{ad.title}</p>
                  {ad.description && (
                    <p className="text-sm opacity-60 mt-1">{ad.description}</p>
                  )}
                  <p className="text-xs opacity-40 mt-1">
                    مدة العرض: {ad.duration}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
