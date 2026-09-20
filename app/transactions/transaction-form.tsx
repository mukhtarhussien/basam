"use client";

import { useState, useTransition } from "react";
import { FileUp, CheckCircle2 } from "lucide-react";
import { submitTransaction } from "@/app/actions";
import PaymentMethodPicker from "@/components/payment-method-picker";

export default function TransactionForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await submitTransaction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setDone(result.transactionId);
      }
    });
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 bg-surface border border-border rounded-xl p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        <p className="font-semibold">تم استلام طلبك</p>
        <p className="text-sm opacity-60">
          رقم المعاملة: {done} — راح نتابعها وتوصلك إشعار بالتطبيق لما تخلص
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">الاسم الكامل</label>
        <input
          name="fullName"
          type="text"
          placeholder="اسمك الثلاثي"
          required
          className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">رقم الهاتف</label>
        <input
          name="phone"
          type="tel"
          placeholder="07xxxxxxxxx"
          required
          className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">نوع المعاملة</label>
        <input
          name="type"
          type="text"
          placeholder="مثال: راتب رعاية اجتماعية"
          required
          className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">تفاصيل إضافية</label>
        <textarea
          name="notes"
          placeholder="أي معلومات تساعدنا نخدمك أحسن"
          rows={3}
          className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent resize-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">رفع مستندات (اختياري)</label>
        <label className="flex items-center justify-center gap-2 border border-dashed border-border rounded-lg p-6 opacity-80 text-sm cursor-pointer hover:opacity-100">
          <FileUp className="w-5 h-5" />
          {fileName ?? "اضغط لرفع صورة أو PDF"}
          <input
            type="file"
            name="document"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        <p className="text-xs opacity-50">
          صورة (jpg/png/webp) أو PDF — حجم أقصى 5 ميغا
        </p>
      </div>

      <PaymentMethodPicker />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="bg-accent text-white rounded-lg p-3 font-semibold mt-2 disabled:opacity-60"
      >
        {isPending ? "جاري الإرسال..." : "إرسال الطلب"}
      </button>
    </form>
  );
}
