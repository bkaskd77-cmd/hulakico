import Link from "next/link";
import { redirect } from "next/navigation";
import { listCarriersWithDetails } from "@/lib/data/carriers-query";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";
import { listAdapterKeys } from "@/lib/carriers/adapter";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

export default async function OpsCarriersPage() {
  await requireStaffPage("operations");
  const token = await readSessionToken();
  if (!token || !(await getUserBySessionToken(token))) {
    redirect("/signin");
  }

  let carriers: Awaited<ReturnType<typeof listCarriersWithDetails>> = [];
  let error: string | null = null;
  try {
    carriers = await listCarriersWithDetails();
  } catch (err) {
    console.error(
      "[ops/carriers/page.tsx]",
      err instanceof Error ? err.message : err,
    );
    error = "Could not load carriers.";
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
              Ops control
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
              Carriers & rate cards
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Adapters ready: {listAdapterKeys().join(", ")}
            </p>
          </div>
          <Link href="/account" className="text-sm text-[var(--teal)] underline">
            Account
          </Link>
        </div>

        {error ? (
          <p className="mt-8 text-[var(--danger)]">{error}</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {carriers.map((carrier) => (
              <li
                key={carrier.id}
                className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">
                    {carrier.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {carrier.code} · {carrier.transportMode} · {carrier.scope} ·{" "}
                    {carrier.isActive ? "active" : "inactive"} · adapter{" "}
                    {carrier.adapterKey}
                  </p>
                </div>
                <ul className="mt-4 space-y-3">
                  {carrier.services.map((service) => (
                    <li key={service.id} className="text-sm text-[var(--muted)]">
                      <span className="text-[var(--off-white)]">
                        {service.name}
                      </span>{" "}
                      ({service.serviceClass}, ETA {service.etaDaysMin}-
                      {service.etaDaysMax}d
                      {service.supportsCod ? ", COD" : ""})
                      <ul className="mt-1 pl-4">
                        {service.rates.map((rate) => (
                          <li key={rate.id}>
                            {rate.zoneLabel}: {rate.currency} {rate.baseAmount}{" "}
                            + {rate.perKgAmount}/kg
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
