import { ensureDatabase, getDatabaseClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown) { return String(value ?? "").trim(); }

export async function POST(request: Request) {
  const q = getDatabaseClient();
  if (!q) return Response.json({ error: "الخدمة غير مهيأة حالياً" }, { status: 503 });
  await ensureDatabase();

  let body: any;
  try { body = await request.json(); } catch { return Response.json({ error: "JSON غير صالح" }, { status: 400 }); }

  const productId = Number(body?.product_id);
  const customerName = clean(body?.customer_name);
  const phone = clean(body?.phone).replace(/\s+/g, "");
  const note = clean(body?.note);

  if (!Number.isInteger(productId) || productId <= 0 || !customerName || !phone) {
    return Response.json({ error: "product_id والاسم ورقم الهاتف مطلوبة" }, { status: 400 });
  }
  if (!/^07\d{9}$/.test(phone)) return Response.json({ error: "رقم الهاتف غير صحيح" }, { status: 400 });

  const product = await q`SELECT id FROM products WHERE id=${productId} AND visible=true LIMIT 1`;
  if (!product.length) return Response.json({ error: "المنتج غير متاح" }, { status: 404 });

  const rows = await q`INSERT INTO orders(product_id,customer_name,phone,note,status) VALUES(${productId},${customerName},${phone},${note},'pending') RETURNING id,status,created_at`;
  return Response.json({ data: rows[0], meta: { version: 1 } }, { status: 201 });
}
