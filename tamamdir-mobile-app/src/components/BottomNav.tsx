import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: "home", label: "Ana Sayfa", exact: true },
  { to: "/services", icon: "storefront", label: "Hizmetler", exact: false },
  { to: "/messages", icon: "chat_bubble", label: "Mesajlar", exact: false },
  { to: "/history", icon: "assignment_turned_in", label: "Geçmiş", exact: false },
  { to: "/profile", icon: "account_circle", label: "Profil", exact: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] max-w-md mx-auto">
      <div className="flex justify-around items-center px-2 pt-2 pb-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-150 ${
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-slate-400 hover:text-primary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[22px] ${isActive ? "fill-icon" : ""}`}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-bold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
