import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: 0 | 1 | boolean;
  ref_id: string | null;
  created_at: string;
}

function isUnread(n: Notification) {
  return n.is_read === 0 || n.is_read === false;
}

function typeIcon(type: string) {
  if (type.includes("message")) return "chat";
  if (type.includes("review")) return "rate_review";
  if (type.includes("order")) return "shopping_bag";
  if (type.includes("service")) return "design_services";
  return "notifications";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} sa önce`;
  return new Date(iso).toLocaleDateString("tr-TR");
}

export default function NotificationsDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter(isUnread).length;

  const load = useCallback(async () => {
    try {
      const data = await api.get("/api/notifications");
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    function onFocus() {
      load();
    }
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    load();
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, load]);

  async function markRead(id: string) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 as const } : n)));
    } catch {}
  }

  async function markAllRead() {
    try {
      await api.patch("/api/notifications/read-all");
      setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {}
  }

  function handleItemClick(n: Notification) {
    if (isUnread(n)) markRead(n.id);
    setOpen(false);

    if (n.type.includes("message") && n.ref_id) {
      navigate("/messages", { state: { openConversationId: n.ref_id } });
      return;
    }
    if (n.type.includes("review") && n.ref_id) {
      navigate(`/services/${n.ref_id}/manage`);
      return;
    }
    if (n.type.includes("order")) {
      navigate("/history");
      return;
    }
    if (n.type.includes("service")) {
      navigate(n.ref_id ? `/services/${n.ref_id}` : "/services");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-full"
        aria-label="Bildirimler"
      >
        <span className="material-symbols-outlined text-slate-500">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-lg border border-outline-variant/30 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
            <h3 className="font-bold text-sm text-on-surface">Bildirimler</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-bold text-primary hover:underline"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-on-surface-variant">
                Henüz bildirim yok.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`w-full flex gap-3 px-4 py-3 text-left border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low transition-colors ${
                    isUnread(n) ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnread(n) ? "bg-primary/15 text-primary" : "bg-surface-container-high text-outline"
                  }`}>
                    <span className="material-symbols-outlined text-lg">{typeIcon(n.type)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm truncate ${isUnread(n) ? "font-bold text-on-surface" : "text-on-surface"}`}>
                        {n.title}
                      </p>
                      {isUnread(n) && (
                        <span className="w-2 h-2 bg-error rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-outline mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
