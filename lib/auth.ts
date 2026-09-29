import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const COOKIE = "basam_admin_session";
const TTL = 8 * 60 * 60 * 1000;
const failures = new Map<string, { count: number; resetAt: number }>();

function sessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = input.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Invalid TOTP secret.");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function validTotp(code: string, secretBase32: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / 30);

  for (let offset = -1; offset <= 1; offset++) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + offset));
    const digest = createHmac("sha1", key).update(buffer).digest();
    const index = digest[digest.length - 1] & 15;
    const binary =
      ((digest[index] & 127) << 24) |
      ((digest[index + 1] & 255) << 16) |
      ((digest[index + 2] & 255) << 8) |
      (digest[index + 3] & 255);
    const candidate = String(binary % 1000000).padStart(6, "0");
    if (timingSafeEqual(Buffer.from(candidate), Buffer.from(code))) return true;
  }
  return false;
}

async function validPassword(password: string) {
  const encoded = process.env.ADMIN_PASSWORD_HASH;
  if (!encoded) return false;
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, n, r, p, saltB64, hashB64] = parts;
  const derived = (await scrypt(password, Buffer.from(saltB64, "base64"), 64, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024
  })) as Buffer;
  const stored = Buffer.from(hashB64, "base64");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

function isBlocked(ip: string) {
  const item = failures.get(ip);
  if (!item) return false;
  if (Date.now() > item.resetAt) {
    failures.delete(ip);
    return false;
  }
  return item.count >= 6;
}

function recordFailure(ip: string) {
  const current = failures.get(ip);
  failures.set(ip, {
    count: (current?.count ?? 0) + 1,
    resetAt: Date.now() + 10 * 60 * 1000
  });
}

export async function authenticateAdmin(password: string, code: string, ip: string) {
  if (isBlocked(ip)) return { ok: false, error: "محاولات كثيرة. جرّب بعد دقائق." };

  const passwordOk = await validPassword(password);
  const totpSecret = process.env.ADMIN_TOTP_SECRET_BASE32 ?? "";
  const codeOk = totpSecret ? validTotp(code, totpSecret) : false;

  if (!passwordOk || !codeOk) {
    recordFailure(ip);
    return { ok: false, error: "بيانات الدخول أو رمز Authenticator غير صحيح." };
  }

  failures.delete(ip);
  return { ok: true as const };
}

export async function createAdminSession() {
  const issued = Date.now();
  const payload = `${issued}.${randomBytes(18).toString("base64url")}`;
  const token = `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL / 1000,
    path: "/admin"
  });
}

export async function logoutAdmin() {
  (await cookies()).set(COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/admin"
  });
  redirect("/admin/login");
}

async function hasValidSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;

  try {
    const payload = Buffer.from(encoded, "base64url").toString("utf8");
    const expected = sign(payload);
    if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;
    const issued = Number(payload.split(".")[0]);
    return Number.isFinite(issued) && Date.now() - issued < TTL;
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await hasValidSession())) redirect("/admin/login");
}
