"use client";

import { useState, useTransition } from "react";
import { Layout, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { updateSiteSettings, type HomeSection } from "@/app/actions";

type Props = {
  homeSections: HomeSection[];
  tiktokUrl: string | null;
  instagramUrl: string | null;
  telegramUrl: string | null;
  footerText: string | null;
};

export default function HomepagePanel({
  homeSections,
  tiktokUrl,
  instagramUrl,
  telegramUrl,
  footerText,
}: Props) {
  // حالة محلية للأقسام عشان الأدمن يقدر يرتب ويخفي قبل ما يحفظ.
  // ننسخها هنا (useState) بدل ما نعتمد على الـ props مباشرة، لأن
  // props تتغير بس بعد إعادة تحميل من السيرفر (revalidatePath)
  const [sections, setSections] = useState<HomeSection[]>(homeSections);
  const [isPending, startTransition] = useTransition();
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setSections(copy);
  };

  const toggleVisible = (index: number) => {
    const copy = [...sections];
    copy[index] = { ...copy[index], visible: !copy[index].visible };
    setSections(copy);
  };

  const updateTitle = (index: number, title: string) => {
    const copy = [...sections];
    copy[index] = { ...copy[index], title };
    setSections(copy);
  };

  const handleSubmit = (formData: FormData) => {
    // نحط ترتيب الأقسام كـ JSON بحقل مخفي قبل الإرسال، لأن state
    // بالمكوّن ما ينبعث تلقائياً كجزء من FormData
    formData.set("homeSections", JSON.stringify(sections));
    startTransition(async () => {
      const result = await updateSiteSettings(formData);
      if (result?.success) {
        setSavedMsg("انحفظت التغييرات ✅");
        setTimeout(() => setSavedMsg(null), 3000);
      } else if (result?.error) {
        setSavedMsg(result.error);
      }
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <Layout className="w-4 h-4 text-accent" />
        الواجهة الرئيسية
      </h2>
      <p className="text-xs opacity-60 -mt-2">
        رتّب الأقسام، خلّي بعضها مخفي، وغيّر روابط التواصل - كل شي
        ينعكس بالموقع مباشرة بدون تعديل كود
      </p>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium opacity-70">أقسام الرئيسية</p>
          {sections.map((section, index) => (
            <div
              key={section.key}
              className="flex items-center gap-2 bg-surface border border-border rounded-xl p-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  className="p-1 disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  className="p-1 disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={section.title}
                onChange={(e) => updateTitle(index, e.target.value)}
                maxLength={100}
                className="flex-1 bg-background border border-border rounded-lg p-2 text-sm outline-none focus:border-accent"
              />

              <button
                type="button"
                onClick={() => toggleVisible(index)}
                className={`p-2 rounded-lg ${
                  section.visible
                    ? "text-emerald-500"
                    : "text-neutral-500 opacity-60"
                }`}
                title={section.visible ? "ظاهر" : "مخفي"}
              >
                {section.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium opacity-70">روابط التواصل</p>
          <input
            name="tiktokUrl"
            type="url"
            defaultValue={tiktokUrl ?? ""}
            placeholder="رابط TikTok"
            maxLength={300}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            name="instagramUrl"
            type="url"
            defaultValue={instagramUrl ?? ""}
            placeholder="رابط Instagram"
            maxLength={300}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />
          <input
            name="telegramUrl"
            type="url"
            defaultValue={telegramUrl ?? ""}
            placeholder="رابط Telegram"
            maxLength={300}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs opacity-60">نص أسفل الصفحة</label>
          <input
            name="footerText"
            type="text"
            defaultValue={footerText ?? ""}
            maxLength={200}
            className="bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="bg-accent text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
        >
          حفظ التغييرات
        </button>

        {savedMsg && (
          <p className="text-xs text-center opacity-80">{savedMsg}</p>
        )}
      </form>
    </section>
  );
}
