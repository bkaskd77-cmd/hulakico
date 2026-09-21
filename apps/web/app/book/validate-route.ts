"use client";

import { createContext } from "react";
import type { FormState } from "./form-types";

export const RevealRouteErrors = createContext(false);

const PHONE_SHAPE = /^[+]?[\d\s()-]{7,30}$/;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RouteErrors = Partial<Record<keyof FormState, string>>;

function phoneError(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < 7) return "Phone must be at least 7 characters.";
  if (!PHONE_SHAPE.test(trimmed)) {
    return "Use digits, spaces, +, or dashes only.";
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return "Phone needs 7–15 digits.";
  }
  return undefined;
}

function emailError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!EMAIL_SHAPE.test(trimmed)) return "Enter a valid email or leave blank.";
  return undefined;
}

function requiredMin(value: string, min: number, label: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length < min) return `${label} is required.`;
  return undefined;
}

/** Live + continue-gate checks for shipper/consignee essentials. */
export function validateRouteForm(form: FormState): {
  ok: boolean;
  errors: RouteErrors;
  summary: string;
} {
  const errors: RouteErrors = {};
  const set = (key: keyof FormState, message: string | undefined) => {
    if (message) errors[key] = message;
  };

  set("originContactName", requiredMin(form.originContactName, 2, "Shipper name"));
  set("originPhone", phoneError(form.originPhone));
  set("originEmail", emailError(form.originEmail));
  set("originCity", requiredMin(form.originCity, 2, "Shipper city"));
  set("originCountry", requiredMin(form.originCountry, 2, "Shipper country"));
  set("originLine1", requiredMin(form.originLine1, 5, "Shipper address"));

  set(
    "destinationContactName",
    requiredMin(form.destinationContactName, 2, "Consignee name"),
  );
  set("destinationPhone", phoneError(form.destinationPhone));
  set("destinationEmail", emailError(form.destinationEmail));
  set("destinationCity", requiredMin(form.destinationCity, 2, "Consignee city"));
  set(
    "destinationCountry",
    requiredMin(form.destinationCountry, 2, "Consignee country"),
  );
  set(
    "destinationLine1",
    requiredMin(form.destinationLine1, 5, "Consignee address"),
  );

  const keys = Object.keys(errors);
  return {
    ok: keys.length === 0,
    errors,
    summary:
      keys.length === 0
        ? ""
        : "Fix highlighted party and address fields before continuing.",
  };
}

export function fieldError(
  form: FormState,
  key: keyof FormState,
): string | undefined {
  return validateRouteForm(form).errors[key];
}

export function detectFormLane(form: FormState): "DOMESTIC" | "INTERNATIONAL" {
  return form.originCountry.toUpperCase() === "NP" &&
    form.destinationCountry.toUpperCase() === "NP"
    ? "DOMESTIC"
    : "INTERNATIONAL";
}
