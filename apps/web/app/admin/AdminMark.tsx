/** Brand lockup used on the Admin platform. */
export function AdminMark() {
  return (
    <span className="inline-flex flex-col items-start gap-2">
      <span className="inline-flex rounded-md bg-[#ffcc00] px-2.5 py-1 leading-none">
        <span className="font-[family-name:var(--font-display)] text-xl font-extrabold uppercase leading-none tracking-tight text-[#011f4b]">
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
