import { TrendingUp } from "lucide-react";
import { getSalesStats } from "@/app/actions";

// تنسيق الأرقام بفواصل آلاف - يخلي "1250000" تنقرأ "1,250,000"
function formatMoney(n: number) {
  return n.toLocaleString("en-US");
}

export default async function SalesPanel() {
  const stats = await getSalesStats();

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.total));

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        المبيعات
      </h2>
      <p className="text-xs opacity-60 -mt-2">
        تحسب بس الدفعات المؤكدة - المعلّقة والمرفوضة ما تُحتسب
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">اليوم</p>
          <p className="font-bold mt-1">{formatMoney(stats.todayTotal)}</p>
          <p className="text-[10px] opacity-50">{stats.todayOrdersCount} عملية</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">هذا الأسبوع</p>
          <p className="font-bold mt-1">{formatMoney(stats.weekTotal)}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-3 text-center">
          <p className="text-xs opacity-60">هذا الشهر</p>
          <p className="font-bold mt-1">{formatMoney(stats.monthTotal)}</p>
          <p className="text-[10px] opacity-50">{stats.monthOrdersCount} عملية</p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3">
        <p className="text-xs opacity-60">متوسط قيمة العملية (هذا الشهر)</p>
        <p className="font-bold mt-1">{formatMoney(stats.avgOrderValue)}</p>
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
                    height: `${Math.max(4, (d.total / maxDaily) * 100)}%`,
                  }}
                  title={`${formatMoney(d.total)} - ${d.day}`}
                />
                <span className="text-[9px] opacity-50">
                  {d.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
