import { NextResponse } from "next/server";
import { seedCarriers } from "@/lib/data/carriers";
import type { QuoteOptionView } from "@/lib/data/quotes";
import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { billableKg, calculateQuoteAmount, lowestQuoteOption, pickRateForCity } from "@/lib/domain/quoting";
import { enforceRateLimit, requestIp } from "@/lib/http/rate-limit";

export const runtime = "nodejs";

type Body = {
  originCountry?: string;
  originCity?: string;
  destinationCountry?: string;
  destinationCity?: string;
  weightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  serviceClass?: string;
  packageType?: string;
  contents?: string;
};

async function buildOptions(
  lane: "DOMESTIC" | "INTERNATIONAL",
  destinationCity: string,
  weightKg: number,
  serviceClass: string,
): Promise<QuoteOptionView[]> {
  await seedCarriers();
  const db = await getSql();
  const scopes = lane === "DOMESTIC" ? ["DOMESTIC", "BOTH"] : ["INTERNATIONAL", "BOTH"];
  const services = (await db
    .prepare(
      `SELECT cs.id as service_id, cs.name as service_name, cs.eta_days_min, cs.eta_days_max,
              c.name as carrier_name, c.scope
       FROM carrier_services cs JOIN carriers c ON c.id = cs.carrier_id
       WHERE c.is_active = 1 AND cs.service_class = ?`,
    )
    .all(serviceClass)) as Array<{
    service_id: string; service_name: string; eta_days_min: number; eta_days_max: number;
    carrier_name: string; scope: string;
  }>;
  const options: QuoteOptionView[] = [];
  for (const service of services) {
    if (!scopes.includes(service.scope)) continue;
    const rates = (
      (await db.prepare(`SELECT currency, base_amount, per_kg_amount, zone_label, lane, place_name FROM rate_cards WHERE carrier_service_id = ?`)
        .all(service.service_id)) as Array<{ currency: string; base_amount: number; per_kg_amount: number; zone_label: string; lane: string | null; place_name: string | null }>
    ).map((r) => ({ currency: r.currency, baseAmount: r.base_amount, perKgAmount: r.per_kg_amount, zoneLabel: r.zone_label, lane: r.lane, placeName: r.place_name }));
    const rate = pickRateForCity(rates, lane, destinationCity);
    if (!rate) continue;
    options.push({
      id: newId("qopt"),
      carrierName: service.carrier_name,
      serviceName: service.service_name,
      currency: rate.currency,
      amount: calculateQuoteAmount(rate.baseAmount, rate.perKgAmount, weightKg),
      etaDaysMin: service.eta_days_min,
      etaDaysMax: service.eta_days_max,
      zoneLabel: rate.placeName || rate.zoneLabel,
    });
  }
  return options.sort((a, b) => a.amount - b.amount);
}

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit("quote-preview", requestIp(request), 30, 15 * 60 * 1000);
    if ("retry" in ipLimit) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const body = (await request.json()) as Body;
    const originCity = (body.originCity ?? "").trim();
    const destinationCity = (body.destinationCity ?? "").trim();
    const originCountry = (body.originCountry ?? "NP").trim().toUpperCase();
    const destinationCountry = (body.destinationCountry ?? "NP").trim().toUpperCase();
    const weightKg = Number(body.weightKg);
    const lengthCm = Number(body.lengthCm);
    const widthCm = Number(body.widthCm);
    const heightCm = Number(body.heightCm);
    const serviceClass = (body.serviceClass ?? "EXPRESS").trim().toUpperCase();
    const lane =
      originCountry === "NP" && destinationCountry === "NP" ? "DOMESTIC" : "INTERNATIONAL";

    if (!originCity || !destinationCity) {
      return NextResponse.json({ error: "From and To cities are required." }, { status: 400 });
    }
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 1000) {
      return NextResponse.json({ error: "Enter a valid weight (kg)." }, { status: 400 });
    }
    if (![lengthCm, widthCm, heightCm].every((n) => Number.isFinite(n) && n > 0)) {
      return NextResponse.json({ error: "Enter length, width, and height (cm)." }, { status: 400 });
    }
    const ratedClass = serviceClass === "STANDARD" ? "ECONOMY" : serviceClass;
    if (ratedClass !== "EXPRESS" && ratedClass !== "ECONOMY") {
      return NextResponse.json({ error: "Invalid service class." }, { status: 400 });
    }

    const charged = billableKg(weightKg, lengthCm, widthCm, heightCm, lane);
    const base = await buildOptions(lane, destinationCity, charged, ratedClass);
    const chosen = lowestQuoteOption(base, lane);
    if (!chosen) {
      return NextResponse.json({ error: "No rate is set for this city yet." }, { status: 400 });
    }
    const option = {
      ...chosen,
      serviceName: ratedClass === "EXPRESS" ? "Express" : "Standard",
      rank: 1,
      rankScore: 0,
      rankReason: "",
    };

    return NextResponse.json({
      originCity, destinationCity, originCountry, destinationCountry, lane,
      weightKg, billableKg: charged, lengthCm, widthCm, heightCm,
      packageType: (body.packageType ?? "PARCEL").trim(),
      contents: (body.contents ?? "").trim(),
      rankedByAi: false,
      options: [option],
    });
  } catch (error) {
    console.error("[quotes/preview/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not generate quotes." }, { status: 500 });
  }
}
