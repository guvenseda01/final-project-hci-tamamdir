import { useState } from "react";

interface TamamdirButtonProps {
  label?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function TamamdirButton({
  label = "Tamamdır!",
  onClick,
  className = "",
  disabled = false,
}: TamamdirButtonProps) {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    if (disabled) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 700);
    onClick?.();
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative w-full h-14 bg-primary text-on-primary rounded-xl font-headline-md text-base flex items-center justify-center gap-2 shadow-btn-primary active:scale-[0.98] transition-all overflow-hidden disabled:opacity-50 ${className}`}
    >
      {animating && (
        <span className="absolute inset-0 flex items-center justify-center animate-ping bg-primary-fixed-dim/30 rounded-xl pointer-events-none" />
      )}
      <span
        className={`material-symbols-outlined fill-icon transition-transform ${animating ? "scale-125" : ""}`}
      >
        check_circle
      </span>
      <span>{label}</span>
    </button>
  );
}
