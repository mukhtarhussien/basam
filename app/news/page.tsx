import { Newspaper } from "lucide-react";
import { getNews } from "@/app/actions";

export default async function News() {
  const articles = await getNews();

  return (
    <main className="min-h-screen bg-background text-foreground p-4 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">الأخبار</h1>
        <p className="text-sm opacity-60 mt-0.5">آخر التبليغات والمستجدات</p>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 opacity-50">
          <Newspaper className="w-8 h-8" />
          <p className="text-sm">لا توجد أخبار حالياً</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-surface border border-border rounded-xl overflow-hidden relative"
            >
              {article.featured && (
                <span className="absolute top-2 right-2 bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-full z-10">
                  خبر مميز
                </span>
              )}
              {article.image && (
                <div className="w-full h-36 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col gap-1">
                <p className="text-xs opacity-50">
                  {new Intl.DateTimeFormat("ar-IQ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(article.createdAt)}
                </p>
                <p className="font-semibold">{article.title}</p>
                {article.excerpt && (
                  <p className="text-sm opacity-60">{article.excerpt}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
