import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import { useServices } from "../context/ServicesContext";
import { useAuth } from "../context/AuthContext";

export default function ProfileManagePage() {
  const navigate = useNavigate();
  const { services } = useServices();
  const { user, logout } = useAuth();

  const myServices = services.filter((s) => s.providerId === user?.id);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const statusLabel: Record<string, string> = {
    active: "AKTİF",
    paused: "DURDURULDU",
    draft: "TASLAK",
  };

  return (
    <div className="bg-background min-h-screen max-w-md mx-auto font-body-md text-on-surface">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/20 shadow-sm flex justify-between items-center h-[60px] px-margin-mobile max-w-md">
        <div className="flex items-center gap-md">
          <button
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-primary active:scale-95 transition-transform duration-200"
          >
            arrow_back
          </button>
          <h1 className="font-headline-md-mobile text-headline-md-mobile text-primary">Tamamdır!</h1>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border border-outline-variant/30">
            <img src={user?.avatar} alt="Profil" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-verified rounded-full border-2 border-surface-container-lowest flex items-center justify-center">
            <span className="material-symbols-outlined text-[10px] text-white fill-icon">check_circle</span>
          </div>
        </div>
      </header>

      <main className="pt-[60px] pb-32">
        {/* Hero Profile Section */}
        <section className="bg-inverse-surface pt-lg pb-xl px-margin-mobile relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-bold text-[28px] leading-[36px] text-inverse-on-surface">
              {user?.name}
            </h2>
            <p className="text-on-surface-variant font-label-bold text-label-bold text-surface-variant/80">
              {user?.department} • {user?.year}
            </p>
            <div className="mt-md flex gap-xs">
              <span className="px-sm py-base bg-emerald-brand/20 text-emerald-brand rounded-full text-micro font-micro border border-emerald-brand/30 uppercase">
                Verified Student
              </span>
            </div>
          </div>
        </section>

        {/* Stats Bridge Card */}
        <section className="px-margin-mobile -mt-xl relative z-20">
          <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant/10 p-md flex justify-between items-center text-center">
            <div className="flex-1">
              <p className="text-[24px] font-bold text-primary">{user?.completedServices ?? 0}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Done</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/30" />
            <div className="flex-1">
              <div className="flex justify-center items-center gap-1">
                <span className="material-symbols-outlined text-emerald-brand text-sm fill-icon">star</span>
                <p className="text-[24px] font-bold text-primary">{user?.rating ?? 0}</p>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Rating</p>
            </div>
            <div className="w-px h-8 bg-outline-variant/30" />
            <div className="flex-1">
              <p className="text-[24px] font-bold text-primary">{myServices.length}</p>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Services</p>
            </div>
          </div>
        </section>

        {/* Your Services Header */}
        <section className="mt-xl px-margin-mobile flex justify-between items-end">
          <div>
            <h3 className="font-headline-md-mobile text-headline-md-mobile text-on-surface">Your Services</h3>
            <p className="text-on-surface-variant font-label-sm text-label-sm">
              Manage your active academic offers
            </p>
          </div>
          <button
            onClick={() => navigate("/services/new")}
            className="bg-primary-container text-on-primary-container px-md py-sm rounded-xl font-label-bold text-label-bold flex items-center gap-xs shadow-sm active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add New
          </button>
        </section>

        {/* Services List */}
        <section className="mt-md px-margin-mobile space-y-md">
          {myServices.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-outline-variant">storefront</span>
              <p className="text-on-surface-variant font-label-sm text-label-sm mt-2">
                Henüz hizmet eklemediniz.
              </p>
            </div>
          ) : (
            myServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/services/${service.id}/manage`)}
                className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden flex shadow-[0_4px_12px_rgba(0,0,0,0.03)] active:bg-surface-container transition-colors cursor-pointer"
              >
                <div className="w-32 h-32 flex-shrink-0 bg-surface-container-highest">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-md flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-label-bold text-label-bold text-on-surface leading-tight line-clamp-2">
                        {service.title}
                      </h4>
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
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-headline-md-mobile text-primary text-[18px]">
                      {service.price}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/services/${service.id}/manage`);
                      }}
                      className="material-symbols-outlined text-on-surface-variant hover:text-primary"
                    >
                      more_vert
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Account Settings */}
        <section className="mt-xl px-margin-mobile pb-8">
          <h3 className="font-label-bold text-label-bold text-on-surface-variant mb-md px-base uppercase tracking-widest">
            Account Settings
          </h3>
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
            <button className="w-full flex items-center justify-between p-md active:bg-surface-container transition-colors border-b border-outline-variant/10">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">verified_user</span>
                </div>
                <span className="font-label-bold text-label-bold">Verify Identity</span>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-md active:bg-surface-container transition-colors border-b border-outline-variant/10">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <span className="font-label-bold text-label-bold">Payout Methods</span>
              </div>
              <span className="material-symbols-outlined text-outline">chevron_right</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-md active:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center text-error">
                  <span className="material-symbols-outlined">logout</span>
                </div>
                <span className="font-label-bold text-label-bold text-error">Logout</span>
              </div>
            </button>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
