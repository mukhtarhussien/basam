"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/app/actions";

type NotificationRow = {
  id: number;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: Date;
};

// جرس الإشعارات - يظهر بالهيدر بس للمستخدم المسجل دخول (يمرر
// session من الهيدر نفسه، ما نستدعي useSession هنا مرة ثانية).
// إشعارات داخل التطبيق بس - ماكو SMS ولا بريد، لازم يفتح التطبيق
// ويسجل دخول عشان يشوفها.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUnreadNotificationCount().then(setUnread).catch(() => {});
    // فحص دوري بسيط كل دقيقة - بدون ربط أي مزود خارجي، بس تحديث
    // العداد لو فتح الأدمن معاملته وهو التطبيق مفتوح عند الزبون
    const interval = setInterval(() => {
      getUnreadNotificationCount().then(setUnread).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      startTransition(async () => {
        const rows = await getMyNotifications();
        setItems(rows);
        if (unread > 0) {
          await markNotificationsRead();
          setUnread(0);
        }
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-full bg-surface border border-border opacity-80"
        aria-label="الإشعارات"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg z-20">
          {isPending && (
            <p className="text-xs opacity-50 p-4 text-center">جاري التحميل...</p>
          )}
          {!isPending && items.length === 0 && (
            <p className="text-xs opacity-50 p-4 text-center">ماكو إشعارات</p>
          )}
          {!isPending &&
            items.map((n) => (
              <div
                key={n.id}
                className="p-3 border-b border-border last:border-0 text-sm"
              >
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-xs opacity-60 mt-0.5">{n.body}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
