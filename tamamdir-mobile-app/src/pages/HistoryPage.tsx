import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ProfileMenuDropdown from "../components/ProfileMenuDropdown";
import BottomNav from "../components/BottomNav";
import type { ServiceHistory } from "../data/types";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

type Tab = "requested" | "provided";

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("requested");
  const [history, setHistory] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    api.get('/api/orders')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : [];
        setHistory(list.map((o: any) => {
          const isBuyer = o.buyer_id === user?.id;
          return {
            id: o.id,
            serviceTitle: o.service_title ?? o.title ?? "Hizmet",
            amount: `₺${o.amount ?? o.price ?? 0}`,
            partnerName: isBuyer ? (o.provider_name ?? "") : (o.buyer_name ?? ""),
            partnerAvatar: isBuyer ? (o.provider_avatar ?? "") : (o.buyer_avatar ?? ""),
            status: (o.status === "completed" ? "completed" : o.status === "cancelled" ? "cancelled" : "pending") as ServiceHistory["status"],
            date: o.created_at ? new Date(o.created_at).toLocaleDateString("tr-TR") : "",
            type: (isBuyer ? "requested" : "provided") as ServiceHistory["type"],
          };
        }));
      })
      .catch(() => {});
  }, [user?.id]);

  const filtered = history.filter((h) => h.type === tab);
  const totalCompleted = history.filter((h) => h.status === "completed").length;
  const totalEarnings = history.filter((h) => h.type === "provided" && h.status === "completed")
    .reduce((sum, h) => sum + parseInt(h.amount.replace(/\D/g, "")), 0);

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar
        rightContent={
          <div className="flex items-center gap-1">
            <NotificationsDropdown />
            <ProfileMenuDropdown />
          </div>
        }
      />

      <main className="pt-16 px-gutter pb-24 max-w-md mx-auto">
        <div className="mt-8 mb-6">
          <h1 className="font-bold text-2xl text-on-surface">Hizmet Geçmişi</h1>
          <p className="text-on-surface-variant text-sm">Tamamlanan kampüs görevlerinizi inceleyin</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-sm mb-lg">
          <div className="bg-white p-md rounded-xl shadow-card border border-slate-50">
            <div className="flex items-center gap-base mb-xs">
              <span className="material-symbols-outlined text-primary text-xl">assignment_turned_in</span>
              <span className="text-xs text-on-surface-variant">Tamamlanan</span>
            </div>
            <p className="font-bold text-2xl text-on-surface">{totalCompleted}</p>
            <p className="text-primary font-bold text-[10px]">Geçmiş hizmetler</p>
          </div>
          <div className="bg-white p-md rounded-xl shadow-card border border-slate-50">
            <div className="flex items-center gap-base mb-xs">
              <span className="material-symbols-outlined text-tertiary text-xl">payments</span>
              <span className="text-xs text-on-surface-variant">Toplam Kazanç</span>
            </div>
            <p className="font-bold text-2xl text-on-surface">₺{totalEarnings.toLocaleString("tr-TR")}</p>
            <p className="text-tertiary font-bold text-[10px]">İlk %5 Öğrenci</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 bg-background/80 backdrop-blur-md z-40 py-sm">
          <div className="relative flex bg-surface-container rounded-full p-1">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300"
              style={{ transform: tab === "provided" ? "translateX(100%)" : "translateX(0)" }}
            />
            {(["requested", "provided"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-center z-10 font-bold text-sm transition-colors ${tab === t ? "text-primary" : "text-on-surface-variant"}`}
              >
                {t === "requested" ? "Talep Ettim" : "Sağladım"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="mt-sm space-y-gutter">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-2">history</span>
              <p className="text-on-surface-variant">Henüz kayıt yok.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden shadow-card transition-all active:scale-[0.98]"
              >
                <div className="p-md flex gap-gutter">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.partnerAvatar}
                      alt={item.partnerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-base text-on-surface">{item.serviceTitle}</h3>
                      <span className="font-bold text-sm text-on-surface flex-shrink-0 ml-2">{item.amount}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mb-xs mt-0.5">
                      {item.type === "requested" ? "Sağlayan" : "Müşteri"}: {item.partnerName}
                    </p>
                    <div className="flex items-center gap-xs">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined fill-icon text-xs">check_circle</span>
                        TAMAMLANDI
                      </span>
                      <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wide">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
