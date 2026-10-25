"use client";

import { useState } from "react";

type SaveResult = { ok: true } | { error: string };

/** Two-click remove for a city page staff added; built-in pages refuse on the server. */
export function RemovePage({ slug, name, removeAction }: { slug: string; name: string; removeAction: (slug: string) => Promise<SaveResult> }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function remove() {
    if (!confirming) return setConfirming(true);
    const result = await removeAction(slug);
    setMessage("error" in result ? result.error : `${name} page removed.`);
    setConfirming(false);
  }
  return (
    <p className="mt-3 flex flex-wrap items-center gap-3 text-xs">
      <button type="button" onClick={remove} className="rounded-md border border-[var(--danger)] px-2.5 py-1 font-semibold text-[var(--danger)]">
        {confirming ? `Click again to remove ${name}` : `Remove the ${name} page`}
      </button>
      {message ? <span className="text-[var(--muted)]">{message}</span> : null}
    </p>
  );
}
