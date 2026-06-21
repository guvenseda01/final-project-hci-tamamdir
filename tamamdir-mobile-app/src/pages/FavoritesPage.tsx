import { useCallback, useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import ServiceCard from "../components/ServiceCard";
import Toast from "../components/Toast";
import { usePreferences } from "../context/PreferencesContext";
import api from "../lib/api";
import { mapApiService, type ApiService } from "../lib/serviceMapper";
import type { Service } from "../data/types";

export default function FavoritesPage() {
  const { t } = usePreferences();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const ids: string[] = await api.get("/api/favorites");
      const list = Array.isArray(ids) ? ids : [];
      if (list.length === 0) {
        setServices([]);
        return;
      }
      const loaded = await Promise.all(
        list.map(async (id) => {
          try {
            const svc = await api.get(`/api/services/${id}`);
            return mapApiService(svc as ApiService);
          } catch {
            return null;
          }
        })
      );
      setServices(loaded.filter(Boolean) as Service[]);
    } catch {
      setServices([]);
      setToastMessage(t("favorites.loadError"));
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function removeFavorite(serviceId: string) {
    try {
      await api.del(`/api/favorites/${serviceId}`);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      setToastMessage(t("favorites.removed"));
      setToastVisible(true);
    } catch {
      setToastMessage(t("favorites.removeError"));
      setToastVisible(true);
    }
  }

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      <TopBar showBack backTo="/profile" title={t("favorites.title")} />

      <main className="pt-20 px-gutter pb-24">
        <p className="text-on-surface-variant text-sm mb-4">{t("favorites.sub")}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-2">favorite</span>
            <p className="text-on-surface-variant">{t("favorites.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="relative">
                <ServiceCard service={service} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(service.id);
                  }}
                  className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-card flex items-center justify-center text-error active:scale-95"
                  aria-label={t("favorites.removeAria")}
                >
                  <span className="material-symbols-outlined fill-icon text-base">favorite</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
