import { getNews, getOffers, getProducts, getSettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, products, offers, news] = await Promise.all([
    getSettings(),
    getProducts(),
    getOffers(),
    getNews()
  ]);

  return Response.json({
    data: { settings, products, offers, news },
    meta: { version: 1 }
  });
}
