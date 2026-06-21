import { useNavigate } from "react-router-dom";
import ProfileMenuDropdown from "./ProfileMenuDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

interface TopBarProps {
  showBack?: boolean;
  backTo?: string;
  title?: string;
  rightContent?: React.ReactNode;
  showNotifications?: boolean;
  showHelp?: boolean;
  showProfileMenu?: boolean;
}

export default function TopBar({
  showBack,
  backTo,
  title,
  rightContent,
  showNotifications = true,
  showHelp = false,
  showProfileMenu = true,
}: TopBarProps) {
  const navigate = useNavigate();

  const defaultRight = (
    <div className="flex items-center gap-1">
      {showNotifications && <NotificationsDropdown />}
      {showHelp && (
        <button
          type="button"
          onClick={() => navigate("/help")}
          className="p-2 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-full"
          aria-label="Yardım merkezi"
        >
          <span className="material-symbols-outlined text-slate-500">help</span>
        </button>
      )}
      {showProfileMenu && <ProfileMenuDropdown />}
    </div>
  );

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16 flex items-center px-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBack ? (
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="p-1 -ml-1 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-primary">school</span>
        )}
        <span className="text-primary font-extrabold tracking-tight text-lg truncate">
          {title || "Tamamdır!"}
        </span>
      </div>
      {rightContent ?? defaultRight}
    </header>
  );
}
