import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../components/BottomNav";

import { useAuth } from "../context/AuthContext";

import api from "../lib/api";

import { mapApiService } from "../lib/serviceMapper";

import type { Service } from "../data/types";



export default function ProfileManagePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();

  const [myServices, setMyServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);



  const loadServices = useCallback(async () => {

    if (!user?.id) return;

    setLoading(true);

    try {

      const data = await api.get(`/api/users/${user.id}/services?all=1`);

      const list = Array.isArray(data) ? data : [];

      setMyServices(list.map(mapApiService));

    } catch {

      setMyServices([]);

    } finally {

      setLoading(false);

    }

  }, [user?.id]);



  useEffect(() => {
    refreshUser().catch(() => {});
    loadServices();
  }, [refreshUser, loadServices, location.key, (location.state as { refresh?: number } | null)?.refresh]);



  const statusLabel: Record<string, string> = {

    active: "AKTİF",

    paused: "DURDURULDU",

    draft: "TASLAK",

  };



  return (

    <div className="bg-background min-h-screen max-w-md mx-auto font-body-md text-on-surface">

      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/20 shadow-sm flex justify-between items-center h-[60px] px-margin-mobile max-w-md">

        <div className="flex items-center gap-md">

          <button

            type="button"

            onClick={() => navigate(-1)}

            className="material-symbols-outlined text-primary active:scale-95 transition-transform duration-200"

          >

            arrow_back

          </button>

          <h1 className="font-headline-md-mobile text-headline-md-mobile text-primary">Tamamdır!</h1>

        </div>

        <div className="relative">

          <div className="w-10 h-10 rounded-full bg-secondary-container overflow-hidden border border-outline-variant/30 flex items-center justify-center">

            {user?.avatar ? (

              <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />

            ) : (

              <span className="material-symbols-outlined text-on-secondary-container text-xl">person</span>

            )}

          </div>

        </div>

      </header>



      <main className="pt-[60px] pb-32">

        <section className="bg-inverse-surface pt-lg pb-xl px-margin-mobile relative overflow-hidden">

          <div className="relative z-10">

            <h2 className="font-bold text-[28px] leading-[36px] text-inverse-on-surface">{user?.name ?? ""}</h2>

            <p className="text-on-surface-variant font-label-bold text-label-bold text-surface-variant/80">

              {user?.department ?? "İYTE"} {user?.year ? `• ${user.year}` : ""}

            </p>

          </div>

        </section>



        <section className="px-margin-mobile -mt-xl relative z-20">

          <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant/10 p-md flex justify-between items-center text-center">

            <div className="flex-1">

              <p className="text-[24px] font-bold text-primary">{user?.completedServices ?? 0}</p>

              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tamamlanan</p>

            </div>

            <div className="w-px h-8 bg-outline-variant/30" />

            <div className="flex-1">

              <div className="flex justify-center items-center gap-1">

                <span className="material-symbols-outlined text-emerald-brand text-sm fill-icon">star</span>

                <p className="text-[24px] font-bold text-primary">{user?.rating && user.rating > 0 ? user.rating.toFixed(1) : "—"}</p>

              </div>

              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Puan</p>

            </div>

            <div className="w-px h-8 bg-outline-variant/30" />

            <div className="flex-1">

              <p className="text-[24px] font-bold text-primary">{user?.activeServices ?? 0}</p>

              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Hizmet</p>

            </div>

          </div>

        </section>



        <section className="mt-xl px-margin-mobile flex justify-between items-end">

          <div>

            <h3 className="font-headline-md-mobile text-headline-md-mobile text-on-surface">Hizmetlerim</h3>

            <p className="text-on-surface-variant font-label-sm text-label-sm">İlanlarını yönet</p>

          </div>

          <button

            type="button"

            onClick={() => navigate("/services/new")}

            className="bg-primary-container text-on-primary-container px-md py-sm rounded-xl font-label-bold text-label-bold flex items-center gap-xs shadow-sm active:scale-95 transition-all"

          >

            <span className="material-symbols-outlined text-[20px]">add</span>

            Yeni Ekle

          </button>

        </section>



        <section className="mt-md px-margin-mobile space-y-md">

          {loading ? (

            <div className="flex justify-center py-10">

              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>

            </div>

          ) : myServices.length === 0 ? (

            <div className="text-center py-10">

              <span className="material-symbols-outlined text-5xl text-outline-variant">storefront</span>

              <p className="text-on-surface-variant font-label-sm text-label-sm mt-2">Henüz hizmet eklemediniz.</p>

            </div>

          ) : (

            myServices.map((service) => (

              <div

                key={service.id}

                className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden flex shadow-[0_4px_12px_rgba(0,0,0,0.03)]"

              >

                <button

                  type="button"

                  onClick={() => navigate(`/services/${service.id}/manage`)}

                  className="w-32 h-32 flex-shrink-0 bg-surface-container-highest"

                >

                  <img src={service.image} alt={service.title} className="w-full h-full object-cover" />

                </button>

                <div className="p-md flex flex-col justify-between flex-1 min-w-0">

                  <div>

                    <div className="flex justify-between items-start gap-1">

                      <h4 className="font-label-bold text-label-bold text-on-surface leading-tight line-clamp-2">{service.title}</h4>

                      <span className="bg-primary-container/10 text-primary px-xs py-0.5 rounded text-[10px] font-bold flex-shrink-0">

                        {statusLabel[service.status ?? "active"]}

                      </span>

                    </div>

                    <div className="flex items-center gap-1 mt-1">

                      <span className="material-symbols-outlined text-[14px] text-emerald-brand fill-icon">star</span>

                      <span className="font-label-sm text-label-sm text-on-surface-variant">

                        {service.rating > 0 ? `${service.rating} (${service.reviewCount})` : "Yeni"}

                      </span>

                    </div>

                  </div>

                  <div className="flex justify-between items-center mt-2 gap-2">

                    <span className="font-headline-md-mobile text-primary text-[18px]">{service.price}</span>

                    <button

                      type="button"

                      onClick={() => navigate(`/services/${service.id}/manage`)}

                      className="text-xs font-bold text-primary px-2 py-1 rounded-lg bg-primary/10 active:bg-primary/20"

                    >

                      Düzenle

                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </section>

      </main>



      <BottomNav />

    </div>

  );

}


