"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound } from "lucide-react";
import { submitAdminPassword, submitAdminTotp } from "./actions";

type Step = "password" | "totp";

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePasswordSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await submitAdminPassword(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsTotpSetup) {
        router.push("/admin/totp-setup");
        return;
      }
      if (result.needsTotp) {
        setStep("totp");
      }
    });
  };

  const handleTotpSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await submitAdminTotp(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-6">
      <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center">
        {step === "password" ? (
          <Lock className="w-7 h-7" />
        ) : (
          <KeyRound className="w-7 h-7" />
        )}
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">دخول لوحة التحكم</h1>
        <p className="text-sm opacity-60 mt-1">
          {step === "password"
            ? "هذي الصفحة خاصة بإدارة المكتبة"
            : "عبّي كود التحقق من تطبيق Authenticator"}
        </p>
      </div>

      {step === "password" ? (
        <form
          action={handlePasswordSubmit}
          className="w-full max-w-xs flex flex-col gap-3"
        >
          <input
            name="password"
            type="password"
            placeholder="الباسوورد"
            required
            autoFocus
            className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent text-center"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
          >
            {isPending ? "جاري التحقق..." : "متابعة"}
          </button>
        </form>
      ) : (
        <form
          action={handleTotpSubmit}
          className="w-full max-w-xs flex flex-col gap-3"
        >
          <input
            name="code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            maxLength={6}
            required
            autoFocus
            className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent text-center text-lg tracking-[0.3em]"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
          >
            {isPending ? "جاري التحقق..." : "دخول"}
          </button>
        </form>
      )}
    </main>
  );
}
