"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Slide = {
  title: string;
  subtitle: string;
  image: string | null;
  cta: string;
  href: string;
};

const defaultSlides: Slide[] = [
  {
    title: "كل ما تحتاجه في مكان واحد",
    subtitle: "كتب · مستلزمات · لوازم دراسية",
    image: null,
    cta: "تسوق الآن",
    href: "/store",
  },
  {
    title: "معاملاتك بسهولة وسرعة",
    subtitle: "قدم طلبك وتابع حالته من مكان واحد",
    image: null,
    cta: "قدم الآن",
    href: "/transactions",
  },
];

// الشرائح تجي من برا (منتجات/إعلانات حقيقية من قاعدة البيانات)،
// أو تستخدم النصين الثابتين فوق (وصف عام للمكتبة، بدون صور وهمية)
// إذا ما تم تمرير شي

// أقل مسافة سحب (بالبكسل) عشان تنعتبر "سحبة" وليس نقرة عادية
const SWIPE_THRESHOLD = 40;

export default function HeroBanner({ slides }: { slides?: Slide[] }) {
  const activeSlides = slides && slides.length > 0 ? slides : defaultSlides;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    setIndex(0);
  }, [activeSlides.length]);

  // مؤقت التبديل التلقائي - نعيد ضبطه (restart) كل مرة يتغير index،
  // سواء انتقل تلقائي أو بتفاعل المستخدم (سحب/ضغط نقطة)، حتى ما
  // يقفز للشريحة الجاية بسرعة بعد ما المستخدم يتفاعل يدوياً
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeSlides.length, index]);

  const goTo = (i: number) => {
    setIndex(((i % activeSlides.length) + activeSlides.length) % activeSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      // الموقع RTL: سحب لليمين (delta موجب) = الشريحة السابقة
      if (delta > 0) {
        goTo(index - 1);
      } else {
        goTo(index + 1);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const slide = activeSlides[index];

  return (
    <div
      className="relative rounded-2xl overflow-hidden h-52 bg-surface border border-border touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slide.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={slide.image}
          src={slide.image}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/70 to-black/95" />

      <div className="relative h-full flex flex-col justify-center gap-2 px-5 max-w-[70%] text-white">
        <h1 className="text-2xl font-bold leading-snug">{slide.title}</h1>
        <p className="text-sm text-neutral-300">{slide.subtitle}</p>
        <Link
          href={slide.href}
          className="mt-2 w-fit bg-accent text-white text-sm font-semibold rounded-full px-4 py-2"
        >
          {slide.cta}
        </Link>
      </div>

      {activeSlides.length > 1 && (
        <div className="absolute bottom-3 left-4 flex gap-1.5">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اذهب للشريحة ${i + 1}`}
              onClick={() => goTo(i)}
              className="p-1.5 -m-1.5"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-accent" : "w-1.5 bg-white/40"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
