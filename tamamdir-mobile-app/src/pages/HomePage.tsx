import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import ServiceCard from "../components/ServiceCard";
import { useServices } from "../context/ServicesContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { services, loading } = useServices();
  const popular = services.slice(0, 3);

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar />
      <main className="pt-16 pb-24">
        {/* Hero Section */}
        <section className="relative w-full h-[360px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: "url('https://picsum.photos/seed/iyte-campus/800/500')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent z-10" />
          <div className="relative z-20 h-full flex flex-col justify-end p-8">
            <h1 className="text-display-xl font-extrabold text-white mb-2 leading-tight" style={{ fontSize: 32, lineHeight: "40px" }}>
              Kampüsün Gücünü Keşfet.
            </h1>
            <p className="text-emerald-100/90 text-base mb-6 max-w-xs">
              İYTE öğrencileri için güvenilir, hızlı ve yetenek odaklı yardımlaşma pazarı.
            </p>
            <button
              onClick={() => navigate("/services")}
              className="bg-primary-container text-on-primary-container w-full px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined fill-icon">check_circle</span>
              Hemen Başla
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="px-4 -mt-6 relative z-30 grid grid-cols-2 gap-3">
          {[
            { icon: "verified_user", label: "Doğrulanmış", value: "1.200+ Öğrenci" },
            { icon: "bolt", label: "Tamamlanan", value: "450+ İşlem" },
          ].map((s) => (
            <div key={s.label} className="bg-white p-4 rounded-2xl shadow-card border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">{s.icon}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="font-bold text-sm">{s.value}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Popular Services */}
        <section className="mt-10 px-4">
          <div className="flex justify-between items-end mb-5">
            <div>
              <h2 className="font-bold text-xl text-on-surface">Popüler Hizmetler</h2>
              <p className="text-on-surface-variant text-sm">Öğrencilerden öğrencilere özel teklifler.</p>
            </div>
            <button
              onClick={() => navigate("/services")}
              className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
            >
              Tümünü Gör
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="flex flex-col gap-gutter">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-container-low rounded-2xl animate-pulse" />
              ))
            ) : (
              popular.map((s) => <ServiceCard key={s.id} service={s} />)
            )}
          </div>
        </section>

        {/* Promo Banner */}
        <section className="mt-10 px-4 mb-4">
          <div className="bg-primary text-on-primary rounded-[1.5rem] p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-700/20 rounded-full blur-3xl -ml-16 -mb-16" />
            <div className="relative z-10">
              <h2 className="font-bold text-2xl mb-3">Yeteneğini Kazanca Dönüştür.</h2>
              <p className="text-emerald-100/90 text-sm mb-6">
                Ders notların, hobi becerilerin veya uzmanlık alanın... Kampüste birileri tam da senin sunduğun hizmete ihtiyaç duyuyor olabilir.
              </p>
              <button className="bg-white text-primary px-6 py-3 rounded-full font-bold hover:bg-emerald-50 transition-colors text-sm">
                Hemen İlan Ver
              </button>
            </div>
            <div className="absolute right-6 bottom-6 opacity-20">
              <span className="material-symbols-outlined text-[80px]">rocket_launch</span>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
