import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateAdmin, createAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const result = await authenticateAdmin(password, code, ip);
  if (!result.ok) return NextResponse.json(result, { status: 401 });

  await createAdminSession();
  return NextResponse.json({ ok: true });
}
