import { AddCarrierForm } from "@/app/admin/(staff)/carriers/AddCarrierForm";
import { RateCardEditor, type DeskCarrier } from "@/app/admin/(staff)/carriers/RateCardEditor";
import { listCarriersWithDetails } from "@/lib/data/carriers-query";
import { requireStaffPage } from "@/lib/http/require-staff";

export const runtime = "nodejs";

function toDesk(carriers: Awaited<ReturnType<typeof listCarriersWithDetails>>): DeskCarrier[] {
  return carriers.filter((carrier) => carrier.isActive).map((carrier) => ({
    id: carrier.id,
    name: carrier.name,
    scope: carrier.scope,
    services: carrier.services
      .filter((service) => service.serviceClass === "EXPRESS" || service.serviceClass === "ECONOMY")
      .map((service) => ({
        id: service.id,
        label: service.serviceClass === "EXPRESS" ? "Express" : "Standard",
      })),
    rates: carrier.services.flatMap((service) =>
      service.rates
        .filter((rate) => rate.placeName && rate.lane)
        .map((rate) => ({
          id: rate.id,
          placeName: rate.placeName ?? "",
          lane: rate.lane ?? "",
          serviceLabel: service.serviceClass === "EXPRESS" ? "Express" : "Standard",
          currency: rate.currency,
          baseAmount: rate.baseAmount,
          perKgAmount: rate.perKgAmount,
        })),
    ),
  }));
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
        Add a carrier, then choose it below. Type the city, and choose Express or Standard and National or International.
        The first amount covers the first 0.5 kg. The second is each extra kilogram. The street can be anywhere in that city.
      </p>
      {error ? <p className="mt-8 text-[var(--danger)]">{error}</p> : null}
      {!error ? (
        <>
          <AddCarrierForm />
          <RateCardEditor carriers={toDesk(carriers)} />
        </>
      ) : null}
    </>
  );
}
