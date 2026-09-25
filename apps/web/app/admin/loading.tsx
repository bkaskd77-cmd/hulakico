/** Instant shell while Admin RSC streams — keeps nav feeling responsive. */
export default function AdminLoading() {
  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-8 h-10 w-48 rounded bg-[color-mix(in_srgb,var(--off-white)_12%,transparent)]" />
        <div className="mb-6 flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 rounded-md bg-[color-mix(in_srgb,var(--off-white)_10%,transparent)]"
            />
          ))}
        </div>
        <div className="h-8 w-56 rounded bg-[color-mix(in_srgb,var(--off-white)_14%,transparent)]" />
        <div className="mt-2 h-4 w-80 rounded bg-[color-mix(in_srgb,var(--off-white)_8%,transparent)]" />
        <ul className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="h-24 rounded-lg bg-[color-mix(in_srgb,var(--off-white)_8%,transparent)]"
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
