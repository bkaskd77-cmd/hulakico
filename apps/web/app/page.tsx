import Link from "next/link";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function Home() {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;

  return (
    <div className="shell-sky relative overflow-hidden">
      <div
        aria-hidden
        className="shell-route pointer-events-none absolute inset-x-0 top-[28%] h-px bg-gradient-to-r from-transparent via-[var(--teal)] to-transparent"
      />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--off-white)]">
          Hulakico
        </p>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span className="text-[var(--muted)]">{user.name}</span>
              <Link
                href="/account"
                className="rounded-md bg-[var(--teal)] px-3 py-1.5 font-medium text-[var(--off-white)]"
              >
                Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-[var(--muted)] hover:text-[var(--off-white)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-[var(--teal)] px-3 py-1.5 font-medium text-[var(--off-white)]"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] max-w-3xl flex-col justify-center px-6 pb-24 sm:px-10">
        <p className="shell-rise font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.05] tracking-tight text-[var(--off-white)] sm:text-7xl">
          Hulakico
        </p>
        <h1 className="shell-rise-delay mt-6 max-w-xl font-[family-name:var(--font-display)] text-xl font-bold leading-snug text-[var(--off-white)] sm:text-2xl">
          One booking brain for Nepal and the world — every carrier, one
          timeline.
        </h1>
        <p className="shell-rise-delay mt-4 max-w-lg font-[family-name:var(--font-body)] text-sm leading-relaxed text-[var(--muted)]">
          Book domestic and international shipments through Hulakico. We
          orchestrate trusted third-party agents today, ready for our own fleet
          tomorrow.
        </p>
        <div className="shell-rise-delay mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={user ? "/book" : "/signup"}
            className="inline-flex items-center justify-center rounded-md bg-[var(--gold)] px-6 py-3 font-[family-name:var(--font-body)] text-sm font-semibold text-[var(--navy)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal)]"
          >
            Book a shipment
          </Link>
        </div>
      </main>
    </div>
  );
}
