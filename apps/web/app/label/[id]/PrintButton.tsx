"use client";

/** Opens the browser print dialog for the label. */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white">
      Print label
    </button>
  );
}
