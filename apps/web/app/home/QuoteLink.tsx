"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { OPEN_QUOTE_FLAG } from "@/app/home/use-quote-reveal";

/** Opens the homepage quote panel: in place on "/", or via a one-time flag from other pages. */
export function QuoteLink({
  onHome = false,
  className,
  children,
}: {
  onHome?: boolean;
  className: string;
  children: ReactNode;
}) {
  if (onHome) {
    return (
      <button type="button" data-open-quote className={className}>
        {children}
      </button>
    );
  }
  function rememberQuote() {
    try {
      window.sessionStorage.setItem(OPEN_QUOTE_FLAG, "1");
    } catch (error) {
      console.error("[QuoteLink.tsx:rememberQuote] sessionStorage unavailable:", error);
    }
  }
  return (
    <Link href="/" onClick={rememberQuote} className={className}>
      {children}
    </Link>
  );
}
