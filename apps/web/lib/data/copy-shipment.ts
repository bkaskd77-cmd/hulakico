import { getDb } from "@/lib/db";
import type { DraftBookingInput } from "@/lib/domain/booking";
import { detectLane } from "@/lib/domain/booking";
import type { FormState } from "@/app/book/form-types";
import { INITIAL_BOOK_FORM } from "@/app/book/form-types";

type Row = {
  package_type: string; service_class: string;
  origin_country: string; origin_city: string; origin_address: string;
  origin_contact_name: string | null; origin_company: string | null;
  origin_phone: string | null; origin_email: string | null;
  origin_line1: string | null; origin_line2: string | null;
  origin_postal_code: string | null;
  destination_country: string; destination_city: string; destination_address: string;
  destination_contact_name: string | null; destination_company: string | null;
  destination_phone: string | null; destination_email: string | null;
  destination_line1: string | null; destination_line2: string | null;
  destination_postal_code: string | null;
  weight_kg: number; length_cm: number | null; width_cm: number | null;
  height_cm: number | null; declared_value: number | null;
  currency: string; contents: string; wants_cod: number;
};

function text(value: string | null | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  return trimmed || fallback;
}

function loadCopyRow(userId: string, shipmentId: string): Row | null {
  const sql = `SELECT package_type, service_class,
    origin_country, origin_city, origin_address,
    origin_contact_name, origin_company, origin_phone, origin_email,
    origin_line1, origin_line2, origin_postal_code,
    destination_country, destination_city, destination_address,
    destination_contact_name, destination_company, destination_phone,
    destination_email, destination_line1, destination_line2, destination_postal_code,
    weight_kg, length_cm, width_cm, height_cm, declared_value,
    currency, contents, wants_cod
    FROM shipments WHERE id = ? AND user_id = ?`;
  return (getDb().prepare(sql).get(shipmentId, userId) as Row | undefined) ?? null;
}

function toDraftInput(row: Row): DraftBookingInput | { error: string } {
  const originLine1 = text(row.origin_line1, row.origin_address);
  const destinationLine1 = text(row.destination_line1, row.destination_address);
  const originPhone = text(row.origin_phone, "");
  const destinationPhone = text(row.destination_phone, "");
  if (originPhone.length < 7 || destinationPhone.length < 7) {
    return { error: "Cannot copy — shipper and consignee phones are required." };
  }
  if (originLine1.length < 5 || destinationLine1.length < 5) {
    return { error: "Cannot copy — address lines are incomplete." };
  }
  const originCountry = row.origin_country.trim().toUpperCase();
  const destinationCountry = row.destination_country.trim().toUpperCase();
  const lane = detectLane(originCountry, destinationCountry);
  const currency = row.currency === "NPR" || row.currency === "USD" ? row.currency : "USD";
  return {
    packageType: row.package_type as DraftBookingInput["packageType"],
    serviceClass: row.service_class as DraftBookingInput["serviceClass"],
    originContactName: text(row.origin_contact_name, "Shipper"),
    originCompany: row.origin_company?.trim() || undefined,
    originPhone, originEmail: row.origin_email?.trim() || undefined,
    originCountry, originCity: row.origin_city.trim(),
    originPostalCode: row.origin_postal_code?.trim() || undefined,
    originLine1, originLine2: row.origin_line2?.trim() || undefined,
    destinationContactName: text(row.destination_contact_name, "Consignee"),
    destinationCompany: row.destination_company?.trim() || undefined,
    destinationPhone, destinationEmail: row.destination_email?.trim() || undefined,
    destinationCountry, destinationCity: row.destination_city.trim(),
    destinationPostalCode: row.destination_postal_code?.trim() || undefined,
    destinationLine1, destinationLine2: row.destination_line2?.trim() || undefined,
    weightKg: row.weight_kg > 0 ? row.weight_kg : 1,
    lengthCm: row.length_cm ?? undefined, widthCm: row.width_cm ?? undefined,
    heightCm: row.height_cm ?? undefined, declaredValue: row.declared_value ?? undefined,
    currency, contents: text(row.contents, "Goods"),
    wantsCod: lane === "DOMESTIC" ? row.wants_cod === 1 : false,
  };
}

/** Prefill booking wizard from a past shipment (review Route → Package → Review). */
export function getCopyFormState(
  userId: string,
  shipmentId: string,
): FormState | { error: string } {
  try {
    const row = loadCopyRow(userId, shipmentId);
    if (!row) return { error: "Shipment not found." };
    const input = toDraftInput(row);
    if ("error" in input) return input;
    const n = (v: number | undefined) => (v != null ? String(v) : "");
    return {
      ...INITIAL_BOOK_FORM,
      originContactName: input.originContactName,
      originCompany: input.originCompany ?? "",
      originPhone: input.originPhone,
      originEmail: input.originEmail ?? "",
      originCountry: input.originCountry,
      originCity: input.originCity,
      originPostalCode: input.originPostalCode ?? "",
      originLine1: input.originLine1,
      originLine2: input.originLine2 ?? "",
      destinationContactName: input.destinationContactName,
      destinationCompany: input.destinationCompany ?? "",
      destinationPhone: input.destinationPhone,
      destinationEmail: input.destinationEmail ?? "",
      destinationCountry: input.destinationCountry,
      destinationCity: input.destinationCity,
      destinationPostalCode: input.destinationPostalCode ?? "",
      destinationLine1: input.destinationLine1,
      destinationLine2: input.destinationLine2 ?? "",
      packageType: input.packageType,
      serviceClass: input.serviceClass,
      weightKg: String(input.weightKg),
      lengthCm: n(input.lengthCm),
      widthCm: n(input.widthCm),
      heightCm: n(input.heightCm),
      declaredValue: n(input.declaredValue),
      currency: input.currency,
      contents: input.contents,
      wantsCod: input.wantsCod,
    };
  } catch (error) {
    console.error(
      "[copy-shipment.ts:getCopyFormState]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not load shipment to copy." };
  }
}
