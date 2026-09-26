import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";

export type SavedAddress = {
  id: string;
  label: string;
  contactName: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  country: string;
  city: string;
  postalCode: string | null;
  line1: string;
  line2: string | null;
  isResidential: boolean;
  createdAt: string;
};

export type SavedAddressInput = {
  label: string;
  contactName: string;
  company?: string;
  phone?: string;
  email?: string;
  country: string;
  city: string;
  postalCode?: string;
  line1: string;
  line2?: string;
  isResidential?: boolean;
};

export async function createSavedAddress(
  userId: string,
  input: SavedAddressInput,
): Promise<{ id: string } | { error: string }> {
  try {
    const label = input.label.trim();
    const contactName = input.contactName.trim();
    const line1 = input.line1.trim();
    const city = input.city.trim();
    const country = input.country.trim().toUpperCase();
    if (!label || !contactName || !line1 || !city || country.length !== 2) {
      return { error: "Label, name, line1, city, and country are required." };
    }

    const id = newId("adr");
    const now = new Date().toISOString();
    await (await getSql())
      .prepare(
        `INSERT INTO saved_addresses (
           id, user_id, label, contact_name, company, phone, email,
           country, city, postal_code, line1, line2, is_residential, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        userId,
        label,
        contactName,
        input.company?.trim() || null,
        input.phone?.trim() || null,
        input.email?.trim().toLowerCase() || null,
        country,
        city,
        input.postalCode?.trim() || null,
        line1,
        input.line2?.trim() || null,
        input.isResidential ? 1 : 0,
        now,
      );
    return { id };
  } catch (error) {
    console.error(
      "[addresses.ts:createSavedAddress]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Could not save address." };
  }
}

export async function listSavedAddresses(userId: string): Promise<SavedAddress[]> {
  try {
    const rows = (await (await getSql())
      .prepare(
        `SELECT id, label, contact_name, company, phone, email, country, city,
                postal_code, line1, line2, is_residential, created_at
         FROM saved_addresses WHERE user_id = ?
         ORDER BY created_at DESC`,
      )
      .all(userId)) as Array<{
      id: string;
      label: string;
      contact_name: string;
      company: string | null;
      phone: string | null;
      email: string | null;
      country: string;
      city: string;
      postal_code: string | null;
      line1: string;
      line2: string | null;
      is_residential: number;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      label: row.label,
      contactName: row.contact_name,
      company: row.company,
      phone: row.phone,
      email: row.email,
      country: row.country,
      city: row.city,
      postalCode: row.postal_code,
      line1: row.line1,
      line2: row.line2,
      isResidential: row.is_residential === 1,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error(
      "[addresses.ts:listSavedAddresses]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not list saved addresses.");
  }
}
