"use client";

import { useState, type FormEvent } from "react";
import { FIELD, LABEL } from "@/app/admin/(staff)/homepage/AdminFields";
import { addCarrierAction } from "@/app/admin/(staff)/carriers/actions";

const SAVE = "rounded-md bg-[#ffcc00] px-3 py-2.5 text-sm font-semibold text-[#191919] disabled:opacity-60";

export function AddCarrierForm() {
  const [name, setName] = useState("");
  const [scope, setScope] = useState("DOMESTIC");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await addCarrierAction({ name, scope });
    setPending(false);
    if ("error" in result) {
      setMessage(result.error);
      return;
    }
    setName("");
    setMessage("Carrier added. Choose it in the list below.");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-3 rounded-lg border border-[color-mix(in_srgb,var(--off-white)_14%,transparent)] bg-[var(--navy-elevated)] p-5 sm:grid-cols-3 sm:items-end">
      <label className="block">
        <span className={LABEL}>Carrier name</span>
        <input className={FIELD} required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label className="block">
        <span className={LABEL}>Coverage</span>
        <select className={FIELD} value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="DOMESTIC">National</option>
          <option value="INTERNATIONAL">International</option>
          <option value="BOTH">National and International</option>
        </select>
      </label>
      <button type="submit" disabled={pending} className={SAVE}>{pending ? "Adding…" : "Add carrier"}</button>
      {message ? <p className="text-xs text-[var(--muted)] sm:col-span-3">{message}</p> : null}
    </form>
  );
}
