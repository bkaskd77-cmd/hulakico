import { cache } from "react";
import { COMPANY_CONTACT } from "@/lib/data/info-pages";
import { isAllowedImageUrl } from "@/lib/domain/homepage-rules";
import { getSql } from "@/lib/sql";

const SLUG = "company-contact";
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAP_HOSTS = ["google.com", "www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl", "openstreetmap.org", "www.openstreetmap.org"];
const LIMITS = { phones: 4, addressLines: 4, label: 30, number: 30, line: 120, name: 80, email: 120, url: 400 };

/** What staff edit in Admin. */
export type ContactPhone = { label: string; number: string };
export type ContactSettings = {
  name: string;
  phones: ContactPhone[];
  email: string;
  whatsapp: string;
  address: string[];
  mapsUrl: string;
  bankName: string; // bank / QR details customers pay into until wallets are live (optional)
  bankAccountName: string;
  bankAccountNumber: string;
  paymentQr: string;
};

/** What the public site renders. Same shape as the old COMPANY_CONTACT constant. */
export type CompanyContact = {
  name: string;
  phones: { label: string; display: string; href: string }[];
  email: string;
  whatsappHref: string;
  address: string[];
  mapsHref: string;
};

function text(value: unknown, max: number): string {
  return (typeof value === "string" ? value : "").trim().slice(0, max);
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function seedSettings(): ContactSettings {
  return {
    name: COMPANY_CONTACT.name,
    phones: COMPANY_CONTACT.phones.map((p) => ({ label: p.label, number: p.display })),
    email: COMPANY_CONTACT.email,
    whatsapp: `+${digits(COMPANY_CONTACT.whatsappHref)}`,
    address: [...COMPANY_CONTACT.address],
    mapsUrl: COMPANY_CONTACT.mapsHref,
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    paymentQr: "",
  };
}

export function normalizeContact(data: unknown): ContactSettings {
  if (!data || typeof data !== "object") return seedSettings();
  const row = data as Record<string, unknown>;
  const phones = Array.isArray(row.phones)
    ? row.phones.slice(0, LIMITS.phones).map((raw) => {
        const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
        return { label: text(p.label, LIMITS.label), number: text(p.number, LIMITS.number) };
      }).filter((p) => p.number)
    : [];
  const address = Array.isArray(row.address)
    ? row.address.map((line) => text(line, LIMITS.line)).filter(Boolean).slice(0, LIMITS.addressLines)
    : [];
  return {
    name: text(row.name, LIMITS.name),
    phones,
    email: text(row.email, LIMITS.email).toLowerCase(),
    whatsapp: text(row.whatsapp, LIMITS.number),
    address,
    mapsUrl: text(row.mapsUrl, LIMITS.url),
    bankName: text(row.bankName, LIMITS.name),
    bankAccountName: text(row.bankAccountName, LIMITS.name),
    bankAccountNumber: text(row.bankAccountNumber, 40),
    paymentQr: text(row.paymentQr, LIMITS.url),
  };
}

function mapsUrlOk(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && MAP_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

export function validateContact(c: ContactSettings): string | null {
  if (c.name.length < 2) return "Add the company name.";
  if (c.phones.length === 0) return "Add at least one phone number.";
  if (c.phones.some((p) => !p.label)) return "Give every phone number a label, such as Mobile or Office.";
  if (c.phones.some((p) => digits(p.number).length < 7 || digits(p.number).length > 15)) return "Phone numbers need 7 to 15 digits.";
  if (!EMAIL_OK.test(c.email)) return "Enter a valid email address.";
  if (digits(c.whatsapp).length < 7 || digits(c.whatsapp).length > 15) return "The WhatsApp number needs 7 to 15 digits, with the country code.";
  if (c.address.length === 0) return "Add at least one address line.";
  if (!mapsUrlOk(c.mapsUrl)) return "The map link must be an https Google Maps or OpenStreetMap link.";
  const bankFilled = [c.bankName, c.bankAccountName, c.bankAccountNumber].filter(Boolean).length;
  if (bankFilled > 0 && bankFilled < 3) return "For bank payments, fill in the bank name, account name, and account number.";
  if (c.bankAccountNumber && !/^[0-9A-Za-z -]{6,40}$/.test(c.bankAccountNumber)) return "The account number may use only letters, numbers, spaces, and dashes.";
  if (c.paymentQr && !isAllowedImageUrl(c.paymentQr)) return "The payment QR must be an uploaded image.";
  return null;
}

export function toPublicContact(c: ContactSettings): CompanyContact {
  return {
    name: c.name,
    phones: c.phones.map((p) => ({ label: p.label, display: p.number, href: `tel:+${digits(p.number)}` })),
    email: c.email,
    whatsappHref: `https://wa.me/${digits(c.whatsapp)}`,
    address: c.address,
    mapsHref: c.mapsUrl,
  };
}

async function loadSettings(): Promise<ContactSettings> {
  try {
    const row = (await (await getSql()).prepare(`SELECT content_json FROM site_content WHERE slug = ?`).get(SLUG)) as { content_json: string } | undefined;
    if (!row) return seedSettings();
    const settings = normalizeContact(JSON.parse(row.content_json));
    return validateContact(settings) ? seedSettings() : settings;
  } catch (error) {
    console.error("[company-contact-content.ts:loadSettings]", error instanceof Error ? error.message : error);
    return seedSettings();
  }
}

export async function saveContactSettings(input: ContactSettings): Promise<{ ok: true } | { error: string }> {
  try {
    const settings = normalizeContact(input);
    const problem = validateContact(settings);
    if (problem) return { error: problem };
    await (await getSql()).prepare(`INSERT INTO site_content (slug, content_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`).run(SLUG, JSON.stringify(settings), new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[company-contact-content.ts:saveContactSettings]", error instanceof Error ? error.message : error);
    return { error: "Could not save contact details." };
  }
}

/** Editable form for Admin. Falls back to the built-in details if nothing valid is saved. */
export const getContactSettings = cache(loadSettings);

/** Public shape used site-wide. */
export const getCompanyContact = cache(async (): Promise<CompanyContact> => toPublicContact(await loadSettings()));
