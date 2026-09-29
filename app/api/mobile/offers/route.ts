import { getOffers } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ data: await getOffers(), meta: { version: 1 } }); }
