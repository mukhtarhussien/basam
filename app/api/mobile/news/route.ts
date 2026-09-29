import { getNews } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ data: await getNews(), meta: { version: 1 } }); }
