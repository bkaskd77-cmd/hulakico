import type { Metadata } from "next";
import Link from "next/link";
import { confirmEmail } from "@/lib/data/email-verification";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false, follow: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  const raw = typeof token === "string" ? token : "";
  const result = raw ? await confirmEmail(raw) : { error: "This page needs the link from your verification email." };
  const ok = "ok" in result;

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-8">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--off-white)]">
          {ok ? "Email confirmed" : "Link not valid"}
        </h1>
        <p role={ok ? "status" : "alert"} className="mt-4 text-sm text-[var(--muted)]">
          {ok
            ? "Thank you. Your email is confirmed and you can now book shipments."
            : `${result.error} Sign in and use "Send a new link" on your account page.`}
        </p>
        <Link href={ok ? "/book" : "/account"} className="mt-6 block w-full rounded-md bg-[var(--gold)] px-4 py-3 text-center text-sm font-semibold text-[var(--navy)]">
          {ok ? "Book a shipment" : "Go to my account"}
        </Link>
      </div>
    </div>
  );
}
