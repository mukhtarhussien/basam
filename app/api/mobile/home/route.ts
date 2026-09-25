import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, news, ads } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const [productsRows, newsRows, adsRows] = await Promise.all([
    db.select().from(products).orderBy(desc(products.createdAt)),
    db.select().from(news).orderBy(desc(news.createdAt)),
    db.select().from(ads).orderBy(desc(ads.createdAt)),
  ]);

  return NextResponse.json({
    products: productsRows,
    news: newsRows,
    ads: adsRows,
  });
}
