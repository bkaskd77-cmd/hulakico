"use client";

import { useEffect } from "react";

export const OPEN_QUOTE_FLAG = "hk-open-quote";

/** Opens the quote panel only from explicit Get a Quote clicks — never from URL/refresh. */
export function useQuoteReveal(setOpen: (open: boolean) => void) {
  useEffect(() => {
    if (window.location.hash === "#quote") {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    try {
      if (window.sessionStorage.getItem(OPEN_QUOTE_FLAG) === "1") {
        window.sessionStorage.removeItem(OPEN_QUOTE_FLAG);
        setOpen(true);
      }
    } catch (error) {
      console.error("[use-quote-reveal.ts:useQuoteReveal] sessionStorage unavailable:", error);
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
