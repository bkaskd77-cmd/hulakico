import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminMark } from "@/app/admin/AdminMark";
import { TwoStepSetupForm } from "@/app/admin/two-step/TwoStepSetupForm";
import { getStaffBySessionToken } from "@/lib/data/staff-auth";
import { beginTwoStepSetup, staffHasTwoStep } from "@/lib/data/staff-totp";
import { totpUri } from "@/lib/domain/totp";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "Two-step login", robots: { index: false, follow: false } };

/** Staff must link an authenticator app before using Admin. Signed in by password only at this point. */
export default async function TwoStepSetupPage() {
  const token = await readStaffSessionToken();
  const staff = token ? await getStaffBySessionToken(token) : null;
  if (!staff) redirect("/admin");
  if (await staffHasTwoStep(staff.id)) redirect("/admin");

  const setup = await beginTwoStepSetup(staff.id);
  const panel = "w-full max-w-lg rounded-lg border border-[color-mix(in_srgb,var(--gold)_28%,transparent)] bg-[var(--navy-elevated)] p-8";

  return (
    <div className="shell-sky flex min-h-dvh items-center justify-center px-6 py-16">
      <div className={panel}>
        <AdminMark />
        <h1 className="font-display mt-5 text-2xl font-bold text-[var(--off-white)]">Turn on two-step login</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Admin now asks for a code from your phone as well as your password. Set it up once; it takes a minute.
        </p>
        {"error" in setup ? (
          <p role="alert" className="mt-6 text-sm text-[var(--danger)]">{setup.error}</p>
        ) : (
          <>
            <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
              <li>Install Google Authenticator, Microsoft Authenticator, or any authenticator app on your phone.</li>
              <li>
                In the app choose <span className="text-[var(--off-white)]">Add account → Enter a setup key</span>, use
                account name <span className="break-all text-[var(--off-white)]">{staff.email}</span>, type <span className="text-[var(--off-white)]">Time based</span>, and this key:
                <code className="mt-2 block select-all break-all rounded-md bg-[var(--navy)] px-3 py-2 font-mono text-base tracking-[0.15em] text-[var(--gold)]">
                  {setup.secret.match(/.{1,4}/g)?.join(" ")}
                </code>
                <span className="mt-1 block text-xs">
                  On this phone? <a href={totpUri(setup.secret, staff.email)} className="text-[var(--teal)] underline">Open in authenticator app</a>
                </span>
              </li>
              <li>Enter the 6-digit code the app shows.</li>
            </ol>
            <TwoStepSetupForm />
            <p className="mt-4 text-xs text-[var(--muted)]">Keep this key private. If you lose your phone, ask the site owner to reset your staff login.</p>
          </>
        )}
      </div>
    </div>
  );
}
