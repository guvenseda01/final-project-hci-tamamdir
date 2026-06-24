import { useNavigate } from "react-router-dom";
import NotificationsDropdown from "./NotificationsDropdown";

interface HeaderActionButtonsProps {
  showNotifications?: boolean;
  showHelp?: boolean;
}

export default function HeaderActionButtons({
  showNotifications = true,
  showHelp = false,
}: HeaderActionButtonsProps) {
  const navigate = useNavigate();
  const btnClass = "p-2 hover:bg-slate-50 active:bg-slate-100 transition-colors rounded-full";

  return (
    <div className="flex items-center gap-1">
      {showNotifications && <NotificationsDropdown />}
      {showHelp && (
        <button
          type="button"
          onClick={() => navigate("/help")}
          className={btnClass}
          aria-label="Yardım merkezi"
        >
          <span className="material-symbols-outlined text-slate-500">help</span>
        </button>
      )}
    </div>
  );
}
