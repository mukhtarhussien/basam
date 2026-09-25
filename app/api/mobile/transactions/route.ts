import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, session.user.id))
    .orderBy(desc(transactions.createdAt));

  return NextResponse.json({
    transactions: rows,
  });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "INVALID_JSON" },
      { status: 400 }
    );
  }

  const fullName =
    typeof body.fullName === "string"
      ? body.fullName.trim()
      : "";

  const phone =
    typeof body.phone === "string"
      ? body.phone.trim()
      : "";

  const type =
    typeof body.type === "string"
      ? body.type.trim()
      : "";

  const notes =
    typeof body.notes === "string"
      ? body.notes.trim()
      : "";

  if (!fullName || !phone || !type) {
    return NextResponse.json(
      { error: "الاسم ورقم الهاتف ونوع المعاملة مطلوبة" },
      { status: 400 }
    );
  }

  if (
    fullName.length > 500 ||
    phone.length > 30 ||
    type.length > 500 ||
    notes.length > 2000
  ) {
    return NextResponse.json(
      { error: "أحد الحقول أطول من المسموح" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(transactions)
    .values({
      userId: session.user.id,
      fullName,
      phone,
      type,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(
    {
      success: true,
      transaction: created,
    },
    { status: 201 }
  );
}
