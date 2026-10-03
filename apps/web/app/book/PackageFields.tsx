"use client";

import type { FormState, FormUpdate } from "./form-types";
import { contentsHint, contentsPlaceholder } from "./contents-hint";
import { codCue, currencyCue } from "./country-defaults";
import { validatePackageForm } from "./validate-route";

const SIZE_FIELDS = [
  { key: "lengthCm", label: "Length (cm)" },
  { key: "widthCm", label: "Width (cm)" },
  { key: "heightCm", label: "Height (cm)" },
] as const;

function Required() {
  return <span className="text-[var(--danger)]" aria-hidden> *</span>;
}

export function PackageFields({
  form,
  update,
  field,
  lane,
  reveal,
}: {
  form: FormState;
  update: FormUpdate;
  field: string;
  lane: string;
  reveal: boolean;
}) {
  const errors = reveal ? validatePackageForm(form).errors : {};
  const needsSize = form.packageType !== "DOCUMENT";
  const needsValue = lane === "INTERNATIONAL" || form.wantsCod;
  const cls = (key: keyof FormState) =>
    errors[key] ? `${field} border-[var(--danger)]` : field;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-[var(--muted)]">
        {lane === "INTERNATIONAL"
          ? "International: clear contents and declared value help document QC."
          : "Domestic: add COD if the receiver pays on delivery."}
        <span className="mt-1 block text-xs"><Required /> Required</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-[var(--muted)]">
          Package type
          <select
            className={field}
            value={form.packageType}
            onChange={(e) => update("packageType", e.target.value)}
          >
            <option value="DOCUMENT">Document</option>
            <option value="PARCEL">Parcel</option>
            <option value="FREIGHT_LITE">Freight lite</option>
          </select>
        </label>
        <label className="text-sm text-[var(--muted)]">
          Service
          <select
            className={field}
            value={form.serviceClass}
            onChange={(e) => update("serviceClass", e.target.value)}
          >
            <option value="EXPRESS">Express</option>
            <option value="ECONOMY">Economy</option>
            <option value="FREIGHT_ASSIST">Freight assist</option>
          </select>
        </label>
        <label className="text-sm text-[var(--muted)]">
          Weight (kg)<Required />
          <input
            className={cls("weightKg")}
            type="number"
            min="0.1"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => update("weightKg", e.target.value)}
            required
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Currency
          <select
            className={field}
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
          >
            <option value="NPR">NPR</option>
            <option value="USD">USD</option>
          </select>
          <span className="mt-1 block text-xs text-[var(--teal)]">
            {currencyCue(lane)}
          </span>
        </label>
        {SIZE_FIELDS.map(({ key, label }) => (
          <label key={key} className="text-sm text-[var(--muted)]">
            {label}{needsSize ? <Required /> : null}
            <input
              className={cls(key)}
              type="number"
              min="1"
              value={form[key]}
              onChange={(e) => update(key, e.target.value)}
              required={needsSize}
            />
          </label>
        ))}
        <label className="text-sm text-[var(--muted)]">
          Declared value{needsValue ? <Required /> : null}
          <input
            className={cls("declaredValue")}
            type="number"
            min="0"
            value={form.declaredValue}
            onChange={(e) => update("declaredValue", e.target.value)}
            required={needsValue}
            placeholder={lane === "DOMESTIC" ? "Needed for COD" : "For customs"}
          />
        </label>
        <label className="sm:col-span-2 text-sm text-[var(--muted)]">
          Contents<Required />
          <input
            className={cls("contents")}
            value={form.contents}
            onChange={(e) => update("contents", e.target.value)}
            required
            placeholder={contentsPlaceholder(form.packageType)}
          />
          <span className="mt-1.5 block text-xs text-[var(--teal)]">
            {contentsHint(form.packageType)}
          </span>
        </label>
        {lane === "DOMESTIC" ? (
          <label className="sm:col-span-2 flex items-start gap-2 text-sm text-[var(--off-white)]">
            <input
              className="mt-1"
              type="checkbox"
              checked={form.wantsCod}
              onChange={(e) => update("wantsCod", e.target.checked)}
            />
            <span>
              Cash on delivery (COD)
              <span className="mt-0.5 block text-xs text-[var(--muted)]">
                {codCue(lane)} Receiver pays the goods value on delivery.
                You do not prepay freight by wallet — next step is book, not pay.
              </span>
            </span>
          </label>
        ) : (
          <p className="sm:col-span-2 text-xs text-[var(--gold)]">{codCue(lane)}</p>
        )}
      </div>
    </div>
  );
}
