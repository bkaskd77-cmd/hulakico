import type { Instrumentation } from "next";

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
