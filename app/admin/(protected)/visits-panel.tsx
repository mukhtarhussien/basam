import { BarChart3 } from "lucide-react";
import { getVisitStats } from "@/app/actions";

const pathLabels: Record<string, string> = {
  "/": "الرئيسية",
  "/store": "المتجر",
  "/news": "الأخبار",
  "/ads": "الإعلانات",
  "/transactions": "المعاملات",
  "/login": "تسجيل الدخول",
};

function labelFor(path: string) {
  return pathLabels[path] ?? path;
}

export default async function VisitsPanel() {
  const stats = await getVisitStats();
  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.count));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        الزيارات
      </h2>
      <p className="text-xs opacity-60 -mt-2">
        زيارات لوحة التحكم نفسها مستثناة من هذي الأرقام
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">اليوم</p>
          <p className="font-bold mt-1">{stats.today}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">هذا الأسبوع</p>
          <p className="font-bold mt-1">{stats.week}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">هذا الشهر</p>
          <p className="font-bold mt-1">{stats.month}</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3">
        <p className="text-xs opacity-60">زوار فريدون (آخر 30 يوم)</p>
        <p className="font-bold mt-1">{stats.uniqueVisitorsMonth}</p>
      </div>

      {stats.daily.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-3">
          <p className="text-xs opacity-60 mb-3">آخر 7 أيام</p>
          <div className="flex items-end gap-2 h-24">
            {stats.daily.map((d) => (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full bg-accent/70 rounded-t"
                  style={{
                    height: `${Math.max(4, (d.count / maxDaily) * 100)}%`,
                  }}
                  title={`${d.count} زيارة - ${d.day}`}
                />
                <span className="text-[9px] opacity-50">
                  {d.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topPages.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-2">
          <p className="text-xs opacity-60">أكثر الصفحات زيارة</p>
          {stats.topPages.map((p) => (
            <div key={p.path} className="flex items-center justify-between">
              <span className="text-sm">{labelFor(p.path)}</span>
              <span className="text-sm font-medium opacity-70">
                {p.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
