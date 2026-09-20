"use client";

import { useRef, useTransition } from "react";
import { Newspaper, Trash2, Plus } from "lucide-react";
import { addArticle, deleteArticle } from "@/app/actions";

type Article = { id: number; title: string; featured: boolean };

export default function NewsPanel({ news }: { news: Article[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = (formData: FormData) => {
    startTransition(async () => {
      await addArticle(formData);
      formRef.current?.reset();
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      await deleteArticle(id);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-accent" />
        الأخبار
      </h2>

      {news.length === 0 ? (
        <p className="text-sm opacity-50">لا توجد أخبار بعد</p>
      ) : (
        <div className="flex flex-col gap-2">
          {news.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-3"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{a.title}</p>
                {a.featured && (
                  <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-semibold">
                    مميز
                  </span>
                )}
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
          placeholder="عنوان الخبر"
          required
          className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            name="featured"
            type="checkbox"
            className="w-4 h-4 accent-current"
          />
          خبر مميز (يظهر مثبت فوق)
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          نشر خبر
        </button>
      </form>
    </section>
  );
}
