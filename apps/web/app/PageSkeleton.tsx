const block = "rounded bg-[color-mix(in_srgb,var(--off-white)_10%,transparent)]";

function SkeletonBody({ cards }: { cards: number }) {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className={`h-8 w-56 ${block}`} />
      <div className={`mt-3 h-4 w-80 max-w-full ${block}`} />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`h-24 rounded-lg ${block}`} />
        ))}
      </div>
      <ul className="mt-8 space-y-3">
        {Array.from({ length: cards }).map((_, i) => (
          <li key={i} className={`h-16 rounded-lg ${block}`} />
        ))}
      </ul>
    </div>
  );
}

/** Instant placeholder while a server-rendered page loads. */
export function PageSkeleton({ shell = true, cards = 4 }: { shell?: boolean; cards?: number }) {
  if (!shell) {
    return (
      <div role="status" aria-label="Loading">
        <SkeletonBody cards={cards} />
      </div>
    );
  }
  return (
    <div role="status" aria-label="Loading" className="shell-sky min-h-dvh px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <SkeletonBody cards={cards} />
      </div>
    </div>
  );
}
