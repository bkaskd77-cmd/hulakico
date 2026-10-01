import { revalidatePath } from "next/cache";
import { RateCardEditor, type EditableRate } from "@/app/admin/(staff)/carriers/RateCardEditor";
import { listAdapterKeys } from "@/lib/carriers/adapter";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { listCarriersWithDetails } from "@/lib/data/carriers-query";
import { updateRateCard } from "@/lib/data/rate-cards";
import { canAccess } from "@/lib/domain/staff-permissions";
import { requireStaffPage } from "@/lib/http/require-staff";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";

async function saveRateAction(input: {
  id: string;
  currency: string;
  baseAmount: number;
  perKgAmount: number;
}): Promise<{ ok: true } | { error: string }> {
  "use server";
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok) return { error: "Staff sign in required." };
    if (!canAccess(access.staff.role, "carriers")) {
      return { error: "Your staff role cannot edit rate cards." };
    }
    const result = await updateRateCard(input);
    if ("error" in result) return result;
    revalidatePath("/admin/carriers");
    return { ok: true };
  } catch (error) {
    console.error("[carriers/page.tsx:saveRateAction]", error instanceof Error ? error.message : error);
    return { error: "Could not save the rate card." };
  }
}

function ratesFor(services: Awaited<ReturnType<typeof listCarriersWithDetails>>[number]["services"]): EditableRate[] {
  return services.flatMap((service) =>
    service.rates.map((rate) => ({
      id: rate.id,
      serviceName: service.name,
      zoneLabel: rate.zoneLabel,
      currency: rate.currency,
      baseAmount: rate.baseAmount,
      perKgAmount: rate.perKgAmount,
    })),
  );
}

export default async function AdminCarriersPage() {
  await requireStaffPage("carriers");
  let carriers: Awaited<ReturnType<typeof listCarriersWithDetails>> = [];
  let error: string | null = null;
  try {
    carriers = await listCarriersWithDetails();
  } catch (err) {
    console.error("[admin/carriers/page.tsx]", err instanceof Error ? err.message : err);
    error = "Could not load carriers.";
  }

  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--off-white)]">
        Carriers & rate cards
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        The first amount is the charge for the first 0.5 kg. The second is each extra kilogram. Quotes use these figures immediately.
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">Adapters ready: {listAdapterKeys().join(", ")}</p>
      {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}
      {!error ? (
        <ul className="mt-8 space-y-4">
          {carriers.map((carrier) => (
            <li key={carrier.id} className="rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5">
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--off-white)]">{carrier.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {carrier.code} · {carrier.transportMode} · {carrier.scope} · {carrier.isActive ? "active" : "inactive"} · adapter {carrier.adapterKey}
              </p>
              <RateCardEditor rates={ratesFor(carrier.services)} saveAction={saveRateAction} />
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
