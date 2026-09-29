import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function Header({themeToggle}:{themeToggle:ReactNode}){
 const links=[["الرئيسية","/"],["المتجر","/store"],["الأخبار","/news"],["الطلبات","/orders"]];
 return <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_78%,transparent)] backdrop-blur-2xl">
  <div className="shell flex min-h-[76px] items-center justify-between gap-5">
   <Link href="/" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[16px] bg-[var(--brand)] text-white shadow-[0_14px_34px_rgba(17,107,91,.28)]"><BookOpen size={21}/></span><span><strong className="block text-[17px]">بسّام</strong><small className="block text-[11px] text-[var(--muted)]">مكتبة ومتجر</small></span></Link>
   <nav className="hidden items-center gap-1 md:flex">{links.map(([l,h])=><Link key={h} href={h} className="rounded-2xl px-4 py-2.5 text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">{l}</Link>)}</nav>
   <div className="flex items-center gap-2">{themeToggle}<Link href="/admin" className="hidden items-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold md:flex"><ShieldCheck size={16}/>الإدارة</Link></div>
  </div>
  <div className="shell pb-3 md:hidden"><nav className="grid grid-cols-4 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1">{links.map(([l,h])=><Link key={h} href={h} className="rounded-xl py-2.5 text-center text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">{l}</Link>)}</nav></div>
 </header>;
}
