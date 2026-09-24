import { NextResponse } from "next/server";
import { seedCarriers } from "@/lib/data/carriers";
import { rankQuoteOptions } from "@/lib/data/intelligence-client";
import type { QuoteOptionView } from "@/lib/data/quotes";
import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";
import {
  calculateQuoteAmount,
  pickRateForZone,
  resolveZoneLabel,
} from "@/lib/domain/quoting";

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

function billableKg(
  weightKg: number,
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  lane: "DOMESTIC" | "INTERNATIONAL",
): number {
  const vol = (lengthCm * widthCm * heightCm) / (lane === "INTERNATIONAL" ? 5000 : 6000);
  return Math.round(Math.max(weightKg, vol) * 100) / 100;
}

function buildOptions(
  lane: "DOMESTIC" | "INTERNATIONAL",
  destinationCity: string,
  weightKg: number,
  serviceClass: string,
): QuoteOptionView[] {
  seedCarriers();
  const db = getDb();
  const zone = resolveZoneLabel(lane, destinationCity);
  const scopes = lane === "DOMESTIC" ? ["DOMESTIC", "BOTH"] : ["INTERNATIONAL", "BOTH"];
  const services = db
    .prepare(
      `SELECT cs.id as service_id, cs.name as service_name, cs.eta_days_min, cs.eta_days_max,
              c.name as carrier_name, c.scope
       FROM carrier_services cs JOIN carriers c ON c.id = cs.carrier_id
       WHERE c.is_active = 1 AND cs.service_class = ?`,
    )
    .all(serviceClass) as Array<{
    service_id: string; service_name: string; eta_days_min: number; eta_days_max: number;
    carrier_name: string; scope: string;
  }>;
  const options: QuoteOptionView[] = [];
  for (const service of services) {
    if (!scopes.includes(service.scope)) continue;
    const rates = (
      db.prepare(`SELECT currency, base_amount, per_kg_amount, zone_label FROM rate_cards WHERE carrier_service_id = ?`)
        .all(service.service_id) as Array<{ currency: string; base_amount: number; per_kg_amount: number; zone_label: string }>
    ).map((r) => ({ currency: r.currency, baseAmount: r.base_amount, perKgAmount: r.per_kg_amount, zoneLabel: r.zone_label }));
    const rate = pickRateForZone(rates, zone);
    if (!rate) continue;
    options.push({
      id: newId("qopt"),
      carrierName: service.carrier_name,
      serviceName: service.service_name,
      currency: rate.currency,
      amount: calculateQuoteAmount(rate.baseAmount, rate.perKgAmount, weightKg),
      etaDaysMin: service.eta_days_min,
      etaDaysMax: service.eta_days_max,
      zoneLabel: rate.zoneLabel,
    });
  }
  return options.sort((a, b) => a.amount - b.amount);
}

export async function POST(request: Request) {
  try {
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
    if (serviceClass !== "EXPRESS" && serviceClass !== "STANDARD") {
      return NextResponse.json({ error: "Invalid service class." }, { status: 400 });
    }

    const charged = billableKg(weightKg, lengthCm, widthCm, heightCm, lane);
    const base = buildOptions(lane, destinationCity, charged, serviceClass);
    if (base.length === 0) {
      return NextResponse.json({ error: "No rates matched this route." }, { status: 400 });
    }

    let options = base.map((option, index) => ({
      ...option, rank: index + 1, rankScore: 0, rankReason: "Sorted by price",
    }));
    let rankedByAi = false;
    try {
      options = await rankQuoteOptions({ options: base, wantsCod: false });
      rankedByAi = true;
    } catch (error) {
      console.error("[quotes/preview/route.ts:POST]", error instanceof Error ? error.message : error);
    }

    return NextResponse.json({
      originCity, destinationCity, originCountry, destinationCountry, lane,
      weightKg, billableKg: charged, lengthCm, widthCm, heightCm,
      packageType: (body.packageType ?? "PARCEL").trim(),
      contents: (body.contents ?? "").trim(),
      rankedByAi, options,
    });
  } catch (error) {
    console.error("[quotes/preview/route.ts:POST]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not generate quotes." }, { status: 500 });
  }
}
