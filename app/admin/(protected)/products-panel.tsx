"use client";

import { useRef, useState, useTransition } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  ChevronDown,
  Settings2,
} from "lucide-react";
import { addProduct, deleteProduct } from "@/app/actions";

type Product = {
  id: number;
  name: string;
  price: number;
  placement: ("ads" | "home")[];
};

const placementLabels: Record<"ads" | "home", string> = {
  ads: "الإعلانات",
  home: "الصفحة الرئيسية",
};

export default function ProductsPanel({ products }: { products: Product[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [placement, setPlacement] = useState<{ ads: boolean; home: boolean }>(
    { ads: false, home: false }
  );

  const togglePlacement = (key: "ads" | "home") => {
    setPlacement((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allSelected = placement.ads && placement.home;
  const toggleAll = () => {
    setPlacement((prev) => {
      const value = !(prev.ads && prev.home);
      return { ads: value, home: value };
    });
  };

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      await addProduct(formData);
      formRef.current?.reset();
      setPlacement({ ads: false, home: false });
      setAdvancedOpen(false);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteProduct(id);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-accent" />
        المتجر
      </h2>

      {products.length === 0 ? (
        <p className="text-sm opacity-50">لا توجد منتجات بعد</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-3"
            >
              <div>
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs opacity-60 mt-0.5">
                  {p.price.toLocaleString("ar")} د.ع
                </p>
                {p.placement.length > 0 && (
                  <p className="text-xs text-accent mt-0.5">
                    يظهر أيضاً بـ:{" "}
                    {p.placement.map((pl) => placementLabels[pl]).join(" و ")}
                  </p>
                )}
              </div>
              <button onClick={() => handleDelete(p.id)} disabled={isPending}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={handleAdd}
        className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-2"
      >
        <input
          name="name"
          type="text"
          placeholder="اسم المنتج"
          required
          className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          name="price"
          type="text"
          inputMode="numeric"
          placeholder="السعر (د.ع)"
          required
          className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
        />

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex items-center justify-between text-sm opacity-70 py-1"
        >
          <span className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            إعدادات متقدمة
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {advancedOpen && (
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            <p className="text-xs opacity-60">عرض المنتج في</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="placement"
                value="ads"
                checked={placement.ads}
                onChange={() => togglePlacement("ads")}
                className="accent-[var(--accent)]"
              />
              الإعلانات
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="placement"
                value="home"
                checked={placement.home}
                onChange={() => togglePlacement("home")}
                className="accent-[var(--accent)]"
              />
              الصفحة الرئيسية
            </label>

            <label className="flex items-center gap-2 text-sm font-medium border-t border-border pt-2 mt-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-[var(--accent)]"
              />
              الكل
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60 mt-1"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </button>
      </form>
    </section>
  );
}
