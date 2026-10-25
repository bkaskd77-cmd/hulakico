import type { CommercialInvoice } from "@/lib/domain/invoice";

export type DocQcSnapshot = {
  severity: string;
  passed?: boolean;
  warnings: Array<{ code: string; message: string }>;
};

/** Merge commercial-invoice completeness into intelligence Doc QC for international drafts. */
export function mergeInvoiceIntoDocQc(
  docQc: DocQcSnapshot | null,
  invoice: CommercialInvoice | null,
  lane: string,
): DocQcSnapshot | null {
  if (!docQc || lane !== "INTERNATIONAL") return docQc;

  const warnings = docQc.warnings.filter((item) => item.code !== "INVOICE_HINT");

  if (!invoice || invoice.lines.length === 0) {
    warnings.push({
      code: "INVOICE_MISSING",
      message:
        "Save a commercial invoice with goods lines before booking. Use Open digital invoice document after saving.",
    });
  } else {
    if (invoice.lines.some((line) => !line.hsCode?.trim())) {
      warnings.push({
        code: "INVOICE_HS_MISSING",
        message: "Every invoice line needs an HS / commodity code for customs.",
      });
    }
    if (invoice.lines.some((line) => !line.countryOfOrigin?.trim())) {
      warnings.push({
        code: "INVOICE_ORIGIN_MISSING",
        message: "Every invoice line needs a country of manufacture.",
      });
    }
    if (invoice.lines.some((line) => line.weightKg == null || line.weightKg <= 0)) {
      warnings.push({
        code: "INVOICE_WEIGHT_MISSING",
        message: "Every invoice line needs weight per item (kg) before booking.",
      });
    }
  }

  const severity = severityFromWarnings(warnings);
  return {
    severity,
    passed: severity === "OK",
    warnings,
  };
}

function severityFromWarnings(
  warnings: Array<{ code: string }>,
): "OK" | "WARN" | "BLOCKER" {
  if (
    warnings.some(
      (item) => item.code.endsWith("MISSING") || item.code.includes("MISMATCH"),
    )
  ) {
    return "BLOCKER";
  }
  if (warnings.length > 0) return "WARN";
  return "OK";
}

/**
 * Why a commercial invoice is not ready for customs, or null when it is.
 * Same rule everywhere: every line needs description, HS code, origin, quantity, value, weight.
 */
export function invoiceProblem(invoice: CommercialInvoice | null): string | null {
  if (!invoice || invoice.lines.length === 0) return "Add the customs invoice: list each item in the box with its value.";
  const incomplete = invoice.lines.some((line) =>
    !line.description.trim() || !line.hsCode?.trim() || !line.countryOfOrigin?.trim() ||
    !(line.quantity > 0) || !(line.unitValue > 0) || line.weightKg == null || !(line.weightKg > 0));
  return incomplete ? "Every invoice item needs a description, HS code, country of origin, quantity, value, and weight." : null;
}
