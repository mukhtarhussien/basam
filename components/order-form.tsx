"use client";
import { useActionState } from "react";
import { CheckCircle2,Send } from "lucide-react";
import { submitOrder } from "@/app/actions";
export default function OrderForm({productId,productName,products=[]}:{productId:number;productName:string;products?:any[]}){
 const [state,action,pending]=useActionState(submitOrder,null);
 if(state?.success)return <div className="rounded-3xl bg-[var(--surface-2)] p-6 text-center"><CheckCircle2 size={35} className="mx-auto text-[var(--brand)]"/><p className="mt-3 font-black">تم إرسال الطلب</p><p className="mt-2 text-sm text-[var(--muted)]">وصل للإدارة وسيتم التواصل معك.</p></div>;
 return <form action={action} className="grid gap-4"><input type="hidden" name="product_id" value={productId}/>{products.length>0?<select name="product_id" defaultValue={productId} className="field">{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>:<div className="rounded-2xl bg-[var(--surface-2)] p-4 text-sm font-bold">{productName}</div>}<input name="customer_name" required placeholder="الاسم الكامل" className="field"/><input name="phone" required inputMode="tel" placeholder="07xxxxxxxxx" className="field"/><textarea name="note" rows={4} placeholder="ملاحظة (اختياري)" className="field resize-none"/>{state?.error&&<p className="text-sm font-bold text-red-500">{state.error}</p>}<button disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-sm font-black text-[var(--bg)] disabled:opacity-50"><Send size={16}/>{pending?"جاري الإرسال...":"إرسال الطلب"}</button></form>;
}
