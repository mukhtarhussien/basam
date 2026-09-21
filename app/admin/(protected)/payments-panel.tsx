"use client";

import { useTransition } from "react";
import { Wallet, Check, X } from "lucide-react";
import { reviewPayment } from "@/app/actions";

type Payment = {
  id: number;
  method: "zain_cash" | "asia_hawala";
  amount: number;
  referenceNumber: string | null;
  senderPhone: string | null;
  status: "pending" | "confirmed" | "rejected";
  transactionId: number | null;
  orderId: number | null;
};

const methodLabel: Record<Payment["method"], string> = {
  zain_cash: "زين كاش",
  asia_hawala: "آسياحوالة",
};

export default function PaymentsPanel({ payments }: { payments: Payment[] }) {
  const [isPending, startTransition] = useTransition();
  const pending = payments.filter((p) => p.status === "pending");

  const handleReview = (id: number, decision: "confirmed" | "rejected") => {
    startTransition(async () => {
      await reviewPayment(id, decision);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Wallet className="w-4 h-4 text-accent" />
        مراجعة المدفوعات
        {pending.length > 0 && (
          <span className="text-[10px] bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-semibold">
            {pending.length} بانتظار المراجعة
          </span>
        )}
      </h2>

      {pending.length === 0 ? (
        <p className="text-sm opacity-50">لا توجد مدفوعات بانتظار المراجعة</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 bg-surface border border-border rounded-xl p-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {methodLabel[p.method]} — {p.amount.toLocaleString("ar")} د.ع
                </p>
                <span className="text-xs opacity-50">
                  {p.transactionId
                    ? `معاملة #${p.transactionId}`
                    : p.orderId
                      ? `طلب #${p.orderId}`
                      : ""}
                </span>
              </div>
              <div className="text-xs opacity-70 flex flex-col gap-0.5">
                <span>الرقم المرجعي: {p.referenceNumber ?? "—"}</span>
                {p.senderPhone && <span>هاتف المرسل: {p.senderPhone}</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => handleReview(p.id, "confirmed")}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/15 text-emerald-500 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  تأكيد الدفع
                </button>
                <button
                  onClick={() => handleReview(p.id, "rejected")}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/15 text-red-500 rounded-lg py-2 text-xs font-semibold disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
