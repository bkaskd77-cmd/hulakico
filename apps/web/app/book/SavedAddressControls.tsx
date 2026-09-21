"use client";

import { useState } from "react";
import type { SavedAddress } from "@/lib/data/addresses";
import { formSideToSavedInput } from "./apply-address";
import { PARTY_KEYS } from "./party-keys";
import type { FormState } from "./form-types";

export function SavedAddressControls({
  side,
  form,
  addresses,
  field,
  onPick,
  onSaved,
}: {
  side: keyof typeof PARTY_KEYS;
  form: FormState;
  addresses: SavedAddress[];
  field: string;
  onPick: (address: SavedAddress) => void;
  onSaved: (address: SavedAddress) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [label, setLabel] = useState("");

  async function saveCurrent() {
    setError(null);
    setPending(true);
    const useLabel =
      label.trim() ||
      form[PARTY_KEYS[side].contactName] ||
      form[PARTY_KEYS[side].city];
    try {
      const response = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSideToSavedInput(form, side, useLabel)),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not save address.");
        return;
      }
      const input = formSideToSavedInput(form, side, useLabel);
      onSaved({
        id: data.id as string,
        label: useLabel,
        contactName: input.contactName,
        company: input.company ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        country: input.country,
        city: input.city,
        postalCode: input.postalCode ?? null,
        line1: input.line1,
        line2: input.line2 ?? null,
        isResidential: false,
        createdAt: new Date().toISOString(),
      });
      setLabel("");
    } catch (err) {
      console.error("[SavedAddressControls.tsx:saveCurrent]", err);
      setError("Could not save address.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-3 space-y-2">
      <label className="block text-sm text-[var(--muted)]">
        Saved address
        <select
          className={field}
          defaultValue=""
          onChange={(event) => {
            const found = addresses.find((item) => item.id === event.target.value);
            if (found) onPick(found);
            event.target.value = "";
          }}
        >
          <option value="">Choose from address book…</option>
          {addresses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} — {item.city}, {item.country}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${field} mt-0 max-w-[12rem]`}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Label (optional)"
        />
        <button
          type="button"
          onClick={saveCurrent}
          disabled={pending}
          className="rounded-md border border-[var(--teal)] px-3 py-2 text-xs font-semibold text-[var(--teal)] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save to address book"}
        </button>
      </div>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
