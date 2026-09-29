import {
  neon,
  type NeonQueryFunction,
} from "@neondatabase/serverless";

type DatabaseClient = NeonQueryFunction<false, false>;

let client: DatabaseClient | null = null;

function db(): DatabaseClient | null {
  const url = process.env.DATABASE_URL;

  if (!url) return null;

  if (!client) {
    client = neon(url, {
      fullResults: false,
      arrayMode: false,
    });
  }

  return client;
}

export type SiteSettings = {
  id: number;
  brand_name: string;
  brand_tagline: string;
  announcement: string;
  hero_title: string;
  hero_description: string;
  hero_image: string | null;
  featured_title: string;
  offer_title: string;
  news_title: string;
  show_featured: boolean;
  show_offers: boolean;
  show_news: boolean;
  show_about: boolean;
};

export async function ensureDatabase() {
  const q = db();

  if (!q) return false;

  await q`CREATE TABLE IF NOT EXISTS site_settings (
    id integer PRIMARY KEY,
    brand_name text NOT NULL DEFAULT 'بسّام',
    brand_tagline text NOT NULL DEFAULT '',
    announcement text NOT NULL DEFAULT '',
    hero_title text NOT NULL DEFAULT '',
    hero_description text NOT NULL DEFAULT '',
    hero_image text,
    featured_title text NOT NULL DEFAULT '',
    offer_title text NOT NULL DEFAULT '',
    news_title text NOT NULL DEFAULT '',
    show_featured boolean NOT NULL DEFAULT true,
    show_offers boolean NOT NULL DEFAULT true,
    show_news boolean NOT NULL DEFAULT true,
    show_about boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;

  await q`CREATE TABLE IF NOT EXISTS products (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL,
    description text NOT NULL DEFAULT '',
    price integer NOT NULL DEFAULT 0,
    image text,
    featured boolean NOT NULL DEFAULT false,
    visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await q`CREATE TABLE IF NOT EXISTS news (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    excerpt text NOT NULL DEFAULT '',
    content text NOT NULL DEFAULT '',
    image text,
    featured boolean NOT NULL DEFAULT false,
    visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await q`CREATE TABLE IF NOT EXISTS offers (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    image text,
    href text NOT NULL DEFAULT '/store',
    visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  await q`CREATE TABLE IF NOT EXISTS orders (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id integer,
    customer_name text NOT NULL,
    phone text NOT NULL,
    note text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
  )`;

  return true;
}

export async function getSettings(): Promise<SiteSettings | null> {
  const q = db();

  if (!q) return null;

  await ensureDatabase();

  const rows = await q`
    SELECT *
    FROM site_settings
    WHERE id = 1
    LIMIT 1
  `;

  return (rows[0] as SiteSettings | undefined) ?? null;
}

export async function getProducts() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      name,
      category,
      description,
      price,
      image,
      featured,
      visible,
      created_at
    FROM products
    WHERE visible = true
    ORDER BY featured DESC, created_at DESC
  `;
}

export async function getAllProducts() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      name,
      category,
      description,
      price,
      image,
      featured,
      visible,
      created_at
    FROM products
    ORDER BY created_at DESC
  `;
}

export async function getProduct(id: number) {
  const q = db();

  if (!q) return null;

  await ensureDatabase();

  const rows = await q`
    SELECT
      id,
      name,
      category,
      description,
      price,
      image,
      featured,
      visible,
      created_at
    FROM products
    WHERE id = ${id}
      AND visible = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function getNews() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      title,
      excerpt,
      content,
      image,
      featured,
      visible,
      created_at
    FROM news
    WHERE visible = true
    ORDER BY featured DESC, created_at DESC
  `;
}

export async function getAllNews() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      title,
      excerpt,
      content,
      image,
      featured,
      visible,
      created_at
    FROM news
    ORDER BY created_at DESC
  `;
}

export async function getOffers() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      title,
      description,
      image,
      href,
      visible,
      created_at
    FROM offers
    WHERE visible = true
    ORDER BY created_at DESC
  `;
}

export async function getAllOffers() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      id,
      title,
      description,
      image,
      href,
      visible,
      created_at
    FROM offers
    ORDER BY created_at DESC
  `;
}

export async function getOrders() {
  const q = db();

  if (!q) return [];

  await ensureDatabase();

  return q`
    SELECT
      o.id,
      o.customer_name,
      o.phone,
      o.note,
      o.status,
      o.created_at,
      p.name AS product_name,
      p.price AS product_price
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    ORDER BY o.created_at DESC
  `;
}

export function getDatabaseClient() {
  return db();
  }
