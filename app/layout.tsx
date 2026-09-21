import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Nav from "@/components/nav";
import Header from "@/components/header";
<<<<<<< HEAD
import PageTracker from "@/components/page-tracker";
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "مكتبة سيد بسام (تجريبي)",
  description: "معاملاتك، مشترياتك، وأخبارك بمكان وحد",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${tajawal.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <ThemeProvider>
<<<<<<< HEAD
          <PageTracker />
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
          <Header />
          <main className="flex-1 pb-24">{children}</main>
          <Nav />
        </ThemeProvider>
      </body>
    </html>
  );
}
