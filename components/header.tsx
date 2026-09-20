"use client";

import Link from "next/link";
import { useTheme } from "./theme-provider";
import { useState } from "react";
import { Sun, Moon, MoonStar, ChevronDown, LogIn, LogOut } from "lucide-react";
import { useSession, signIn, signOut } from "@/lib/auth-client";
import NotificationBell from "./notification-bell";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const options = [
    { key: "light" as const, label: "فاتح", icon: Sun },
    { key: "dark" as const, label: "غامق", icon: Moon },
    { key: "black" as const, label: "أسود نقي", icon: MoonStar },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="max-w-sm mx-auto px-4 py-3 flex items-center justify-between relative">
        <Link href="/" className="font-bold text-lg">
          مكتبة سيد بسام (تجريبي)
        </Link>

        <div className="flex items-center gap-2">
          {session && <NotificationBell />}

          {session ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-surface border border-border opacity-70"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() =>
                signIn.social({ provider: "google", callbackURL: "/" })
              }
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-surface border border-border opacity-70"
            >
              <LogIn className="w-3.5 h-3.5" />
              دخول
            </button>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-sm opacity-70"
          >
            {theme === "light" && <Sun className="w-4 h-4" />}
            {theme === "dark" && <Moon className="w-4 h-4" />}
            {theme === "black" && <MoonStar className="w-4 h-4" />}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {open && (
          <div className="absolute top-full left-4 mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setTheme(opt.key);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:opacity-70 whitespace-nowrap"
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
