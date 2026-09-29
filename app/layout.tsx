import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import ThemeToggle from "@/components/theme-toggle";

export const metadata: Metadata = { title: "بسّام | مكتبة ومتجر", description: "كتب، مستلزمات، عروض وطلبات في تجربة واحدة." };

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang="ar" dir="rtl"><body><Header themeToggle={<ThemeToggle/>}/>{children}</body></html>;
}
