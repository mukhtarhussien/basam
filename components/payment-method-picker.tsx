"use client";

import { useState } from "react";
import { Wallet, Smartphone } from "lucide-react";

type Method = "" | "zain_cash" | "asia_hawala";

// أرقام/محافظ الاستلام - عدّلها لأرقامك الحقيقية بمجرد ما تجهز.
// ملاحظة مهمة: لحد ما تنحط أرقام حقيقية هنا، خيارات الدفع تظهر
// "قريباً" ومعطّلة (راجع DISABLED تحت) — هذا يمنع أي زبون من
// تحويل فلوس لرقم وهمي بالغلط.
const RECEIVING_INFO: Record<Exclude<Method, "">, { label: string; value: string }> = {
  zain_cash: { label: "رقم محفظة زين كاش", value: "" },
  asia_hawala: { label: "رقم محفظة آسياحوالة", value: "" },
};

// فعّل الطريقة بحط true بمجرد ما يصير عندك رقم محفظة حقيقي فوق
const ENABLED: Record<Exclude<Method, "">, boolean> = {
  zain_cash: false,
  asia_hawala: false,
};

// fixedAmount: مرّرها إذا كان المبلغ معروف مسبقاً (مثل سعر منتج بالمتجر)
// فيصير المبلغ للعرض فقط بدل ما الزبون يكتبه يدوياً
export default function PaymentMethodPicker({
  fixedAmount,
}: {
  fixedAmount?: number;
} = {}) {
  const [method, setMethod] = useState<Method>("");

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        طريقة الدفع {fixedAmount === undefined && "(اختياري)"}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!ENABLED.zain_cash}
          onClick={() => setMethod(method === "zain_cash" ? "" : "zain_cash")}
          className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-sm ${
            !ENABLED.zain_cash
              ? "border-border bg-surface opacity-40 cursor-not-allowed"
              : method === "zain_cash"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface opacity-70"
          }`}
        >
          <Wallet className="w-5 h-5" />
          زين كاش
          {!ENABLED.zain_cash && (
            <span className="absolute -top-2 -left-2 bg-neutral-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
              قريباً
            </span>
          )}
        </button>

        <button
          type="button"
          disabled={!ENABLED.asia_hawala}
          onClick={() => setMethod(method === "asia_hawala" ? "" : "asia_hawala")}
          className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-sm ${
            !ENABLED.asia_hawala
              ? "border-border bg-surface opacity-40 cursor-not-allowed"
              : method === "asia_hawala"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border bg-surface opacity-70"
          }`}
        >
          <Smartphone className="w-5 h-5" />
          آسياحوالة
          {!ENABLED.asia_hawala && (
            <span className="absolute -top-2 -left-2 bg-neutral-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
              قريباً
            </span>
          )}
        </button>
      </div>

      {!ENABLED.zain_cash && !ENABLED.asia_hawala && (
        <p className="text-xs opacity-50 text-center">
          الدفع الإلكتروني غير متوفر حالياً — راح نفعّله قريباً
        </p>
      )}

      {method && (
        <div className="flex flex-col gap-3 bg-surface border border-border rounded-xl p-3">
          <input type="hidden" name="paymentMethod" value={method} />

          <p className="text-xs opacity-70 leading-relaxed">
            حوّل المبلغ إلى {RECEIVING_INFO[method].label}:{" "}
            <span className="font-semibold text-foreground" dir="ltr">
              {RECEIVING_INFO[method].value}
            </span>{" "}
            وبعدها عبّي رقم الحوالة أو رقم الهاتف المرسل حتى نأكدها.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs opacity-60">المبلغ (د.ع)</label>
            {fixedAmount !== undefined ? (
              <>
                <p className="bg-background border border-border rounded-lg p-2.5 text-sm font-semibold">
                  {fixedAmount.toLocaleString("ar")} د.ع
                </p>
                <input type="hidden" name="paymentAmount" value={fixedAmount} />
              </>
            ) : (
              <input
                name="paymentAmount"
                type="text"
                inputMode="numeric"
                placeholder="مثال: 5000"
                className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs opacity-60">الرقم المرجعي للحوالة</label>
            <input
              name="paymentReference"
              type="text"
              placeholder="رقم العملية / رقم الحوالة"
              className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs opacity-60">رقم الهاتف المرسل</label>
            <input
              name="paymentSenderPhone"
              type="tel"
              placeholder="07xxxxxxxxx"
              className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}
