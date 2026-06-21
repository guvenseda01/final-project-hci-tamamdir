import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProfileMenuDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Profil menüsü"
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="Profil" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-on-secondary-container text-xl">person</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-lg border border-outline-variant/30 py-2 z-[200]">
          <button
            type="button"
            onClick={() => { setOpen(false); navigate("/profile"); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-low active:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-outline text-xl">person</span>
            Profilim
          </button>
          <div className="border-t border-outline-variant/20 mt-1 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error font-bold hover:bg-error/5 active:bg-error/10 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
