"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, ShoppingCart, Newspaper, Tag } from "lucide-react";

export default function Nav() {
  const pathname = usePathname();

  const links = [
    { href: "/transactions", label: "المعاملات", icon: FileText },
    { href: "/store", label: "المتجر", icon: ShoppingCart },
  ];

  const links2 = [
    { href: "/news", label: "الأخبار", icon: Newspaper },
    { href: "/ads", label: "الإعلانات", icon: Tag },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed bottom-0 inset-x-0 border-t border-border bg-background/90 backdrop-blur">
      <div className="max-w-sm mx-auto relative grid grid-cols-5 text-xs items-end pb-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 py-2 mx-1 rounded-2xl ${
              isActive(link.href)
                ? "bg-accent/15 text-accent"
                : "opacity-70"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}

        <Link href="/" className="flex flex-col items-center gap-1 -mt-6">
          <span
            className={`flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg ${
              isActive("/") ? "bg-accent" : "bg-neutral-700"
            }`}
          >
            <Home className="w-5 h-5" />
          </span>
          <span className={isActive("/") ? "text-accent" : "opacity-70"}>
            الرئيسية
          </span>
        </Link>

        {links2.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-1 py-2 mx-1 rounded-2xl ${
              isActive(link.href)
                ? "bg-accent/15 text-accent"
                : "opacity-70"
            }`}
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
