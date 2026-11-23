"use client";

import { useEffect, useState } from "react";

type Note = { verdict: string; message: string | null };

const WAIT_MS = 800;

/** Checks the typed city against the chosen country a moment after typing stops. */
export function CityCheckNote({ city, country }: { city: string; country: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const trimmed = city.trim();

  useEffect(() => {
    if (trimmed.length < 2 || country.length !== 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/addresses/place-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ city: trimmed, country }),
          signal: controller.signal,
        });
        if (response.ok) setNote((await response.json()) as Note);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("[CityCheckNote.tsx:check]", error instanceof Error ? error.message : error);
        }
      }
    }, WAIT_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setNote(null);
    };
  }, [trimmed, country]);

  if (!note?.message) return null;
  const blocking = note.verdict === "WRONG_COUNTRY";
  return (
    <p role={blocking ? "alert" : "status"} className={`mt-1 text-xs ${blocking ? "text-[var(--danger)]" : "text-[var(--gold)]"}`}>
      {note.message}
    </p>
  );
}
