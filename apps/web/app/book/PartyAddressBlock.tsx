"use client";

import { useContext, useState } from "react";
import type { SavedAddress } from "@/lib/data/addresses";
import type { PlaceSuggestion } from "@/lib/data/intelligence-client";
import { BOOKING_COUNTRIES } from "./countries";
import { NP_CITIES, PARTY_KEYS } from "./party-keys";
import { PlaceSuggestControls } from "./PlaceSuggestControls";
import { SavedAddressControls } from "./SavedAddressControls";
import type { FormState, FormUpdate } from "./form-types";
import { fieldError, RevealRouteErrors } from "./validate-route";

type Key = keyof FormState;

export function PartyAddressBlock({
  title,
  side,
  form,
  update,
  field,
  lane,
  addresses,
  onPick,
  onSaved,
  onPlacePick,
}: {
  title: string;
  side: keyof typeof PARTY_KEYS;
  form: FormState;
  update: FormUpdate;
  field: string;
  lane: string;
  addresses: SavedAddress[];
  onPick: (address: SavedAddress) => void;
  onSaved: (address: SavedAddress) => void;
  onPlacePick: (place: PlaceSuggestion) => void;
}) {
  const k = PARTY_KEYS[side];
  const revealErrors = useContext(RevealRouteErrors);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const bookAddresses =
    lane === "DOMESTIC"
      ? addresses.filter((item) => item.country === "NP")
      : addresses;
  const hint = (key: Key) =>
    revealErrors || touched[key] ? fieldError(form, key) : undefined;
  const blur = (key: Key) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  return (
    <section>
      <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--gold)]">
        {title}
      </h2>
      <SavedAddressControls side={side} form={form} addresses={bookAddresses} field={field} onPick={onPick} onSaved={onSaved} />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-[var(--muted)]">
          Contact name
          <input className={field} value={form[k.contactName]} onChange={(e) => update(k.contactName, e.target.value)} onBlur={blur(k.contactName)} required minLength={2} />
          {hint(k.contactName) ? <p className="mt-1 text-xs text-[var(--danger)]">{hint(k.contactName)}</p> : null}
        </label>
        <label className="text-sm text-[var(--muted)]">
          Company
          <input className={field} value={form[k.company]} onChange={(e) => update(k.company, e.target.value)} />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Phone
          <input className={field} value={form[k.phone]} onChange={(e) => update(k.phone, e.target.value)} onBlur={blur(k.phone)} required minLength={7} inputMode="tel" autoComplete="tel" />
          {hint(k.phone) ? <p className="mt-1 text-xs text-[var(--danger)]">{hint(k.phone)}</p> : null}
        </label>
        <label className="text-sm text-[var(--muted)]">
          Email
          <input className={field} type="email" value={form[k.email]} onChange={(e) => update(k.email, e.target.value)} onBlur={blur(k.email)} autoComplete="email" />
          {hint(k.email) ? <p className="mt-1 text-xs text-[var(--danger)]">{hint(k.email)}</p> : null}
        </label>
        <label className="text-sm text-[var(--muted)]">
          Country
          {lane === "DOMESTIC" ? (
            <input className={field} value="Nepal" readOnly aria-readonly />
          ) : (
            <select
              className={field}
              value={form[k.country]}
              onChange={(e) => {
                update(k.country, e.target.value);
                update(k.city, "");
                update(k.postal, "");
              }}
              onBlur={blur(k.country)}
              required
            >
              {BOOKING_COUNTRIES.map((item) => (
                <option key={item.code} value={item.code}>{item.name}</option>
              ))}
            </select>
          )}
        </label>
        <label className="text-sm text-[var(--muted)]">
          City
          <input
            className={field}
            value={form[k.city]}
            onChange={(e) => update(k.city, e.target.value)}
            onBlur={blur(k.city)}
            required
            placeholder={lane === "DOMESTIC" ? "e.g. Kathmandu" : "City or town"}
          />
          {hint(k.city) ? <p className="mt-1 text-xs text-[var(--danger)]">{hint(k.city)}</p> : null}
          {lane === "DOMESTIC" ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {NP_CITIES.map((city) => (
                <button key={city} type="button" onClick={() => update(k.city, city)} className="rounded border border-[color-mix(in_srgb,var(--teal)_45%,transparent)] px-2 py-0.5 text-[10px] text-[var(--teal)]">{city}</button>
              ))}
            </div>
          ) : null}
        </label>
        <label className="text-sm text-[var(--muted)]">
          Postal code
          <input className={field} value={form[k.postal]} onChange={(e) => update(k.postal, e.target.value)} />
        </label>
        <PlaceSuggestControls
          value={form[k.line1]}
          onChange={(next) => update(k.line1, next)}
          onBlur={blur(k.line1)}
          field={field}
          lane={lane}
          countryHint={form[k.country]}
          cityHint={form[k.city]}
          onPick={onPlacePick}
        />
        {hint(k.line1) ? (
          <p className="sm:col-span-2 -mt-2 text-xs text-[var(--danger)]">{hint(k.line1)}</p>
        ) : null}
        <label className="sm:col-span-2 text-sm text-[var(--muted)]">
          Address line 2
          <input className={field} value={form[k.line2]} onChange={(e) => update(k.line2, e.target.value)} placeholder="Building, floor, c/o" />
        </label>
      </div>
    </section>
  );
}
