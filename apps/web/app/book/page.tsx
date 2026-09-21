import { listSavedAddresses } from "@/lib/data/addresses";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";
import { BookWizard } from "./BookWizard";

export const runtime = "nodejs";

export default async function BookPage() {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  let addresses: ReturnType<typeof listSavedAddresses> = [];
  if (user) {
    try {
      addresses = listSavedAddresses(user.id);
    } catch (error) {
      console.error(
        "[book/page.tsx]",
        error instanceof Error ? error.message : error,
      );
    }
  }

  return (
    <div className="shell-sky min-h-dvh px-6 py-12 sm:px-10">
      <BookWizard initialAddresses={addresses} />
    </div>
  );
}
