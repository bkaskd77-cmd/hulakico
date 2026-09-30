/** Brand lockup used on the Admin platform. */
export function AdminMark() {
  return (
    <span className="inline-flex flex-col items-start gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-[#ffcc00] px-2 py-1 leading-none">
        <svg viewBox="0 0 80 64" className="h-8 w-auto shrink-0" aria-hidden>
          <polyline points="8,36 40,8 72,36" fill="none" stroke="#0e766e" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="butt" />
          <polyline points="8,52 40,24 72,52" fill="none" stroke="#011f4b" strokeWidth="10" strokeLinejoin="miter" strokeLinecap="butt" />
        </svg>
        <span className="font-[family-name:var(--font-display)] text-xl font-bold uppercase leading-none tracking-[0.14em] text-[#011f4b]">
          HULAKICO
          <span className="mt-[0.2em] flex w-0 min-w-full justify-between text-[0.28em] font-bold leading-none tracking-normal">
            {"DELIVERED TO YOUR DOOR".split("").map((char, index) => (
              <span key={index}>{char === " " ? "\u00a0" : char}</span>
            ))}
          </span>
        </span>
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Admin</span>
    </span>
  );
}
