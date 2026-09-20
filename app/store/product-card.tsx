"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, ImageOff, X, CheckCircle2 } from "lucide-react";
import PaymentMethodPicker from "@/components/payment-method-picker";
import { submitOrder } from "@/app/actions";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string | null;
};

export default function StoreProductCard({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    formData.set("productId", String(product.id));
    startTransition(async () => {
      const result = await submitOrder(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setDone(result.orderId);
      }
    });
  };

  return (
    <>
      <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="w-full h-28 overflow-hidden bg-background flex items-center justify-center">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 opacity-30" />
          )}
        </div>
        <div className="p-3 flex flex-col gap-2">
          <div>
            <p className="font-semibold text-sm">{product.name}</p>
            <p className="opacity-60 text-xs mt-1">
              {product.price.toLocaleString("ar")} د.ع
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg py-2 text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            اطلب الآن
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background w-full max-w-sm mx-auto rounded-t-2xl p-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">طلب: {product.name}</h3>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="font-semibold">تم استلام طلبك</p>
                <p className="text-sm opacity-60">
                  رقم الطلب: {done} — راح نأكد الدفع ونتواصل وياك
                </p>
              </div>
            ) : (
              <form action={handleSubmit} className="flex flex-col gap-4">
                <p className="text-sm">
                  السعر:{" "}
                  <span className="font-semibold">
                    {product.price.toLocaleString("ar")} د.ع
                  </span>
                </p>

                <PaymentMethodPicker fixedAmount={product.price} />

                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
                >
                  {isPending ? "جاري الإرسال..." : "تأكيد الطلب"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
