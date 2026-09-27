/** Gold monogram used only on the Admin platform. */
export function AdminMark() {
  return (
    <span className="flex items-center gap-3">
      <svg className="h-10 w-10 shrink-0" viewBox="0 0 40 40" aria-hidden>
        <rect width="40" height="40" rx="10" className="fill-[var(--gold)]" />
        <path
          d="M13 11h4.2v6.4h5.6V11H27v18h-4.2v-7.2h-5.6V29H13V11z"
          className="fill-[var(--navy)]"
        />
      </svg>
      <span>
        <span className="block font-[family-name:var(--font-display)] text-base font-extrabold leading-none tracking-tight text-[var(--off-white)]">
          Hulakico
        </span>
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Admin
        </span>
      </span>
    </span>
  );
}
