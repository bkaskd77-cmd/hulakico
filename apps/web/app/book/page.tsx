import { listSavedAddresses } from "@/lib/data/addresses";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getCopyFormState } from "@/lib/data/copy-shipment";
import { readSessionToken } from "@/lib/http/session-cookie";
import { BookWizard } from "./BookWizard";
import type { FormState } from "./form-types";

export const runtime = "nodejs";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ copyFrom?: string; editDraft?: string }>;
}) {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  let addresses: Awaited<ReturnType<typeof listSavedAddresses>> = [];
  let initialForm: FormState | undefined;
  let rebookHint: string | null = null;
  let initialStep: 1 | 2 | 3 | 4 = 1;

  const params = await searchParams;
  const copyFrom = params.copyFrom?.trim();
  const editDraft = params.editDraft?.trim();
  const sourceId = editDraft || copyFrom;

  if (user) {
    try {
      addresses = await listSavedAddresses(user.id);
    } catch (error) {
      console.error(
        "[book/page.tsx:addresses]",
        error instanceof Error ? error.message : error,
      );
    }
    if (sourceId) {
      const loaded = await getCopyFormState(user.id, sourceId);
      if ("error" in loaded) {
        rebookHint = loaded.error;
      } else {
        initialForm = loaded;
        if (editDraft) {
          initialStep = 3;
          rebookHint = "Draft loaded — fix only what needs changing, then save again.";
        } else {
          rebookHint = "Rebooking — review each step, then save a new draft.";
        }
      }
    }
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <BookWizard
        initialAddresses={addresses}
        initialForm={initialForm}
        initialStep={initialStep}
        rebookHint={rebookHint}
      />
    </div>
  );
}
