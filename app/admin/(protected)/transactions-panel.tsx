"use client";

import { useEffect, useState, useTransition } from "react";
import { FileText, FileImage, FileDown } from "lucide-react";
import { toggleTransactionStatus, getTransactionDocuments } from "@/app/actions";

type Transaction = {
  id: number;
  fullName: string;
  phone: string;
  type: string;
  notes: string | null;
  status: "pending" | "ready";
};

type TransactionDocument = {
  id: number;
  fileName: string;
  fileType: string;
  fileData: string;
};

export default function TransactionsPanel({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [documents, setDocuments] = useState<TransactionDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const selected = transactions.find((t) => t.id === selectedId);

  useEffect(() => {
    if (selectedId == null) {
      setDocuments([]);
      return;
    }
    setLoadingDocs(true);
    getTransactionDocuments(selectedId)
      .then(setDocuments)
      .finally(() => setLoadingDocs(false));
  }, [selectedId]);

  const handleToggle = (id: number) => {
    startTransition(async () => {
      await toggleTransactionStatus(id);
    });
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold flex items-center gap-2">
        <FileText className="w-4 h-4 text-accent" />
        المعاملات
      </h2>

      {transactions.length === 0 ? (
        <p className="text-sm opacity-50">لا توجد معاملات بعد</p>
      ) : (
        <div className="flex flex-col gap-2">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-surface border border-border rounded-xl p-3"
            >
              <div>
                <p className="font-medium text-sm">{t.fullName}</p>
                <p className="text-xs opacity-60 mt-0.5">{t.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedId(t.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-neutral-500/15 opacity-80"
                >
                  تفاصيل
                </button>
                <button
                  onClick={() => handleToggle(t.id)}
                  disabled={isPending}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full disabled:opacity-50 ${
                    t.status === "ready"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-amber-500/15 text-amber-500"
                  }`}
                >
                  {t.status === "ready" ? "جاهز" : "طلب"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-background w-full max-w-sm mx-auto rounded-t-2xl p-4 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold">تفاصيل المعاملة</h3>
              <button onClick={() => setSelectedId(null)}>✕</button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs opacity-60">الاسم الثلاثي</p>
                <p className="text-sm font-medium mt-0.5">{selected.fullName}</p>
              </div>
              <div>
                <p className="text-xs opacity-60">رقم الهاتف</p>
                <p className="text-sm font-medium mt-0.5">{selected.phone}</p>
              </div>
              <div>
                <p className="text-xs opacity-60">نوع المعاملة</p>
                <p className="text-sm font-medium mt-0.5">{selected.type}</p>
              </div>
              {selected.notes && (
                <div>
                  <p className="text-xs opacity-60">ملاحظات</p>
                  <p className="text-sm font-medium mt-0.5">{selected.notes}</p>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <p className="text-xs opacity-60 flex items-center gap-1.5">
                  <FileImage className="w-4 h-4" />
                  المستندات المرفوعة
                </p>

                {loadingDocs && (
                  <p className="text-xs opacity-50">جاري التحميل...</p>
                )}

                {!loadingDocs && documents.length === 0 && (
                  <p className="text-xs opacity-50">الزبون ما رفع أي مستند</p>
                )}

                {!loadingDocs &&
                  documents.map((doc) => {
                    const src = `data:${doc.fileType};base64,${doc.fileData}`;
                    const isImage = doc.fileType.startsWith("image/");
                    return (
                      <a
                        key={doc.id}
                        href={src}
                        download={doc.fileName}
                        className="flex items-center gap-2 bg-neutral-500/10 rounded-lg p-2 text-xs"
                      >
                        {isImage ? (
                          // معاينة صغيرة للصورة - نفس المصدر base64
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={doc.fileName}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <FileDown className="w-5 h-5 opacity-60" />
                        )}
                        <span className="truncate flex-1">{doc.fileName}</span>
                      </a>
                    );
                  })}
              </div>
            </div>

            <button
              onClick={() => setSelectedId(null)}
              className="bg-surface border border-border rounded-lg py-2.5 text-sm font-medium mt-2"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
