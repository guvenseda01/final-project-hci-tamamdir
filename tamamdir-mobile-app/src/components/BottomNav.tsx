import { NavLink } from "react-router-dom";
import { usePreferences } from "../context/PreferencesContext";
import type { TranslationKey } from "../lib/i18n";

const NAV_ITEMS: { to: string; icon: string; labelKey: TranslationKey; exact: boolean }[] = [
  { to: "/", icon: "home", labelKey: "nav.home", exact: true },
  { to: "/services", icon: "storefront", labelKey: "nav.services", exact: false },
  { to: "/messages", icon: "chat_bubble", labelKey: "nav.messages", exact: false },
  { to: "/history", icon: "assignment_turned_in", labelKey: "nav.history", exact: false },
  { to: "/profile", icon: "account_circle", labelKey: "nav.profile", exact: false },
];

export default function BottomNav() {
  const { t } = usePreferences();

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
                <span className="text-[10px] font-bold">{t(item.labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
