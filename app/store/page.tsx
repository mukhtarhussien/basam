import { Search, PackageOpen } from "lucide-react";
import { getProducts } from "@/app/actions";
import StoreProductCard from "./product-card";

export default async function Store() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-5">
      <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-4 py-2.5">
        <Search className="w-4 h-4 opacity-60" />
        <span className="text-sm opacity-60">ابحث عن منتج...</span>
      </div>

      <div>
        <h1 className="text-xl font-bold">المتجر</h1>
        <p className="text-sm opacity-60 mt-0.5">كتب وقرطاسية وأشياء جانبية</p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 opacity-50">
          <PackageOpen className="w-8 h-8" />
          <p className="text-sm">لا توجد منتجات حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <StoreProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
