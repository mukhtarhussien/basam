"use client";

import { useState, useTransition } from "react";
import { LogOut, KeyRound, CheckCircle2 } from "lucide-react";
import { logoutAdmin, changeAdminPasswordAction } from "@/app/actions";

export default function AccountPanel() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [logoutPending, startLogoutTransition] = useTransition();

  const handleChangePassword = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await changeAdminPasswordAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      // الجلسة الحالية انطردت بمجرد ما تغيّر الباسوورد - يروح
      // مباشرة لصفحة الدخول
      setDone(true);
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">إعدادات الحساب</h2>
        <button
          onClick={() => startLogoutTransition(() => logoutAdmin())}
          disabled={logoutPending}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-surface border border-border opacity-70"
        >
          <LogOut className="w-3.5 h-3.5" />
          تسجيل خروج
        </button>
      </div>

      {done ? (
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 rounded-xl p-3 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          تم تغيير الباسوورد — راح ترجع لصفحة الدخول...
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 bg-surface border border-border rounded-xl p-3 text-sm"
        >
          <KeyRound className="w-4 h-4" />
          تغيير الباسوورد
        </button>
      ) : (
        <form
          action={handleChangePassword}
          className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-3"
        >
          <p className="text-xs opacity-60">
            تنبيه: تغيير الباسوورد يسجل خروج من كل الأجهزة المفتوحة
            حالياً (يشمل هذا الجهاز نفسه)
          </p>

          <input
            name="newPassword"
            type="password"
            placeholder="الباسوورد الجديد (8 أحرف على الأقل)"
            required
            minLength={8}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="أعد كتابة الباسوورد الجديد"
            required
            minLength={8}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-accent text-white rounded-lg p-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 rounded-lg border border-border text-sm"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
