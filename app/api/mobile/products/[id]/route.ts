import { getProduct } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Response.json({ error: "معرّف المنتج غير صحيح" }, { status: 400 });
  }
  const product = await getProduct(numericId);
  if (!product) return Response.json({ error: "المنتج غير موجود" }, { status: 404 });
  return Response.json({ data: product, meta: { version: 1 } });
}
