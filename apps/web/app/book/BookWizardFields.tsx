"use client";

type FormState = {
  originCountry: string;
  originCity: string;
  originAddress: string;
  destinationCountry: string;
  destinationCity: string;
  destinationAddress: string;
  packageType: string;
  serviceClass: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  currency: string;
  contents: string;
  wantsCod: boolean;
};

type UpdateFn = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

export function RouteFields({
  form,
  update,
  field,
}: {
  form: FormState;
  update: UpdateFn;
  field: string;
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-[var(--muted)]">
        Origin country (ISO)
        <input className={field} value={form.originCountry} onChange={(e) => update("originCountry", e.target.value)} required maxLength={2} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Origin city
        <input className={field} value={form.originCity} onChange={(e) => update("originCity", e.target.value)} required />
      </label>
      <label className="sm:col-span-2 text-sm text-[var(--muted)]">
        Origin address
        <input className={field} value={form.originAddress} onChange={(e) => update("originAddress", e.target.value)} required />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Destination country (ISO)
        <input className={field} value={form.destinationCountry} onChange={(e) => update("destinationCountry", e.target.value)} required maxLength={2} />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Destination city
        <input className={field} value={form.destinationCity} onChange={(e) => update("destinationCity", e.target.value)} required />
      </label>
      <label className="sm:col-span-2 text-sm text-[var(--muted)]">
        Destination address
        <input className={field} value={form.destinationAddress} onChange={(e) => update("destinationAddress", e.target.value)} required />
      </label>
    </div>
  );
}

export function PackageFields({
  form,
  update,
  field,
  lane,
}: {
  form: FormState;
  update: UpdateFn;
  field: string;
  lane: string;
}) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-[var(--muted)]">
        Package type
        <select className={field} value={form.packageType} onChange={(e) => update("packageType", e.target.value)}>
          <option value="DOCUMENT">Document</option>
          <option value="PARCEL">Parcel</option>
          <option value="FREIGHT_LITE">Freight lite</option>
        </select>
      </label>
      <label className="text-sm text-[var(--muted)]">
        Service class
        <select className={field} value={form.serviceClass} onChange={(e) => update("serviceClass", e.target.value)}>
          <option value="EXPRESS">Express</option>
          <option value="ECONOMY">Economy</option>
          <option value="FREIGHT_ASSIST">Freight assist</option>
        </select>
      </label>
      <label className="text-sm text-[var(--muted)]">
        Weight (kg)
        <input className={field} type="number" min="0.1" step="0.1" value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} required />
      </label>
      <label className="text-sm text-[var(--muted)]">
        Currency
        <select className={field} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
          <option value="NPR">NPR</option>
          <option value="USD">USD</option>
        </select>
      </label>
      <label className="sm:col-span-2 text-sm text-[var(--muted)]">
        Contents
        <input className={field} value={form.contents} onChange={(e) => update("contents", e.target.value)} required />
      </label>
      {lane === "DOMESTIC" ? (
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-[var(--off-white)]">
          <input type="checkbox" checked={form.wantsCod} onChange={(e) => update("wantsCod", e.target.checked)} />
          Cash on delivery (COD)
        </label>
      ) : null}
    </div>
  );
}

export function Review({ form, lane }: { form: FormState; lane: string }) {
  return (
    <div className="mt-6 space-y-2 text-sm text-[var(--muted)]">
      <p className="text-[var(--off-white)]">
        {form.originCity}, {form.originCountry} → {form.destinationCity},{" "}
        {form.destinationCountry}
      </p>
      <p>
        {form.packageType} · {form.serviceClass} · {form.weightKg} kg · {form.currency}
      </p>
      <p>{form.contents}</p>
      <p>COD: {lane === "DOMESTIC" && form.wantsCod ? "Yes" : "No"}</p>
    </div>
  );
}
