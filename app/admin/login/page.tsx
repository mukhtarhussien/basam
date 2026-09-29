import Link from "next/link";
import AdminLoginForm from "./form";
export default function AdminLoginPage(){return <main className="min-h-[calc(100vh-76px)] bg-[var(--brand-2)] px-4 py-16 text-white"><div className="mx-auto max-w-md"><Link href="/" className="text-sm text-white/60">← الرجوع للموقع</Link><h1 className="mt-6 text-4xl font-black">دخول الإدارة</h1><p className="mt-3 text-sm leading-7 text-white/60">المصادقة تحتاج كلمة المرور + رمز Authenticator.</p><div className="mt-8"><AdminLoginForm/></div></div></main>}
