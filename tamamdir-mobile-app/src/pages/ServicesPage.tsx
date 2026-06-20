import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import ServiceCard from "../components/ServiceCard";
import { useServices } from "../context/ServicesContext";

export default function ServicesPage() {
  const navigate = useNavigate();
  const { services } = useServices();
  const CATEGORIES = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category)));
    return ["Tümü", ...cats];
  }, [services]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tümü");

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.providerName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "Tümü" || s.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, search, activeCategory]);

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto">
      <TopBar
        rightContent={
          <div className="flex gap-1">
            <button className="p-2 hover:bg-slate-50 transition-colors rounded-full">
              <span className="material-symbols-outlined text-slate-500">notifications</span>
            </button>
            <button className="p-2 hover:bg-slate-50 transition-colors rounded-full">
              <span className="material-symbols-outlined text-slate-500">settings</span>
            </button>
          </div>
        }
      />

      <main className="pt-20 px-margin-mobile pb-24">
        {/* Search */}
        <section className="mb-lg">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-surface-container-lowest border-none rounded-xl shadow-card focus:ring-2 focus:ring-primary/30 text-body-md text-on-surface transition-all outline-none"
              placeholder="Hizmet ara..."
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </section>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar -mx-margin-mobile px-margin-mobile mb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap active:scale-95 transition-all ${
                activeCategory === cat
                  ? "bg-primary text-on-primary shadow-sm"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div className="flex flex-col gap-gutter mt-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-3">search_off</span>
              <p className="text-on-surface-variant font-medium">Sonuç bulunamadı.</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("Tümü"); }}
                className="mt-3 text-primary font-bold text-sm hover:underline"
              >
                Filtreleri temizle
              </button>
            </div>
          ) : (
            filtered.map((s) => <ServiceCard key={s.id} service={s} />)
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => navigate("/services/new")}
        className="fixed right-4 bottom-24 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform z-40 max-w-md mx-auto"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      <BottomNav />
    </div>
  );
}
