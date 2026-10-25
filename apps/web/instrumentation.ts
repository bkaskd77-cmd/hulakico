import type { Instrumentation } from "next";

/** Starts the nightly database backup (production server only, when BACKUP_DIR is set). */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production" || !process.env.BACKUP_DIR) return;
  const { backupState, runNightlyBackup } = await import("@/lib/data/db-backup");
  backupState().scheduled = true;
  const run = () => void runNightlyBackup();
  // First run shortly after start, then hourly; it skips once today's file exists.
  setTimeout(run, 2 * 60 * 1000).unref();
  setInterval(run, 60 * 60 * 1000).unref();
}

/** Emails the owner when a page, API route, or server action crashes in production. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const message = error instanceof Error ? error.message : String(error);
    const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : "";
    // Path without the query string: queries can carry tokens or personal details.
    const path = request.path.split("?")[0];
    const { sendOpsAlert } = await import("@/lib/data/ops-alerts");
    await sendOpsAlert(
      `error:${context.routePath}`,
      `Server error on ${path}`,
      [`${request.method} ${path}`, `Route: ${context.routePath} (${context.routeType})`, `Error: ${message}`, digest ? `Digest: ${digest}` : ""]
        .filter(Boolean)
        .join("\n"),
    );
  } catch (reportError) {
    console.error("[instrumentation.ts:onRequestError]", reportError instanceof Error ? reportError.message : reportError);
  }
};
