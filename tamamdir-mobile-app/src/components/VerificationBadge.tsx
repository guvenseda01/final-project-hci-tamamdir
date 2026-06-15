export default function VerificationBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-secondary-container text-on-secondary-fixed-variant rounded-full border border-outline-variant/30 font-bold uppercase tracking-wide ${
        small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span
        className="material-symbols-outlined fill-icon"
        style={{ fontSize: small ? "11px" : "13px" }}
      >
        verified
      </span>
      Doğrulanmış
    </span>
  );
}
