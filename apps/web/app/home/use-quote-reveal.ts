"use client";

import { useEffect } from "react";

/** Opens quote panel only from explicit Get the Quote clicks — never from URL/refresh. */
export function useQuoteReveal(setOpen: (open: boolean) => void) {
  useEffect(() => {
    if (window.location.hash === "#quote") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest?.("[data-open-quote]")) return;
      event.preventDefault();
      setOpen(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [setOpen]);
}
