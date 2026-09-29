/** Brand lockup used on the Admin platform. */
export function AdminMark() {
  return (
    <span className="inline-flex flex-col items-start gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/hulakico-logo.png" alt="Hulakico" className="h-12 w-auto rounded-md bg-[#CDE7F8] px-2 py-1" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">Admin</span>
    </span>
  );
}
