"use client";

import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        body: form,
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "تعذر تسجيل الدخول.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("تعذر الاتصال بالخادم.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck size={21}/></div>

      <label className="mb-2 block text-xs font-bold text-white/60">كلمة المرور</label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/15 px-4">
        <KeyRound size={16} className="text-white/40"/>
        <input name="password" required type="password" autoComplete="current-password" className="w-full bg-transparent py-4 outline-none" />
      </div>

      <label className="mb-2 mt-5 block text-xs font-bold text-white/60">Authenticator</label>
      <input name="code" required inputMode="numeric" pattern="\\d{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000" className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-center text-2xl tracking-[.35em] outline-none" />

      {error && <p className="mt-4 rounded-2xl bg-red-500/12 p-3 text-sm font-bold text-red-200">{error}</p>}

      <button disabled={pending} className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-[var(--brand-2)] disabled:opacity-50">
        {pending ? "جارٍ التحقق..." : "دخول آمن"}
      </button>

      <p className="mt-5 text-center text-[11px] leading-5 text-white/35">Password + Authenticator + HttpOnly session.</p>
    </form>
  );
}
