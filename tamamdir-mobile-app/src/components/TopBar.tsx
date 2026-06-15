import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface TopBarProps {
  showBack?: boolean;
  title?: string;
  rightContent?: React.ReactNode;
}

export default function TopBar({ showBack, title, rightContent }: TopBarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm fixed top-0 left-0 right-0 z-[100] h-16 flex items-center px-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 flex-1">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
        ) : (
          <span className="material-symbols-outlined text-primary">school</span>
        )}
        <span className="text-primary font-extrabold tracking-tight text-lg">
          {title || "Tamamdır!"}
        </span>
      </div>
      {rightContent || (
        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
          <img
            src={user?.avatar || "https://i.pravatar.cc/150?img=3"}
            alt="Profil"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </header>
  );
}
