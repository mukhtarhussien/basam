"use client";

import { useRef, useTransition } from "react";
import { Tag, Trash2, Plus } from "lucide-react";
import { addAd, deleteAd } from "@/app/actions";

type Ad = { id: number; title: string; duration: string };

const durationOptions = ["ساعة", "يوم", "3 أيام", "أسبوع", "أسبوعين", "شهر"];

export default function AdsPanel({ ads }: { ads: Ad[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      await addAd(formData);
      formRef.current?.reset();
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteAd(id);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Tag className="w-4 h-4 text-accent" />
        الإعلانات
      </h2>

      {ads.length === 0 ? (
        <p className="text-sm opacity-50">لا توجد إعلانات بعد</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ads.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-3"
            >
              <div>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs opacity-60 mt-0.5">
                  مدة العرض: {a.duration}
                </p>
              </div>
              <button onClick={() => handleDelete(a.id)} disabled={isPending}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        action={handleAdd}
        className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-3"
      >
        <input
          name="title"
          type="text"
          placeholder="نص الإعلان"
          required
          className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs opacity-60">مدة ظهور الإعلان</label>
          <select
            name="duration"
            defaultValue="أسبوع"
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          >
            {durationOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          نشر إعلان
        </button>
      </form>
    </section>
  );
}
