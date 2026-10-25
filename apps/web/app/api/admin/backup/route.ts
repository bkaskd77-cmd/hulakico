import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveStaffAccess } from "@/lib/data/admin-guard";
import { writeAudit } from "@/lib/data/audit-log";
import { backupDir, latestBackup, runNightlyBackup } from "@/lib/data/db-backup";
import { requestIp } from "@/lib/http/rate-limit";
import { readStaffSessionToken } from "@/lib/http/staff-session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin only: download the newest nightly database backup (creates today's first if missing).
 * It holds every customer record, so each download is written to the activity log.
 */
export async function GET(request: Request) {
  try {
    const access = await resolveStaffAccess(await readStaffSessionToken());
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
    if (access.staff.role !== "ADMIN") return NextResponse.json({ error: "Only the Admin can download backups." }, { status: 403 });
    const dir = backupDir();
    if (!dir) return NextResponse.json({ error: "Backups are not set up on this server." }, { status: 404 });
    if (!(await latestBackup())) await runNightlyBackup();
    const latest = await latestBackup();
    if (!latest) return NextResponse.json({ error: "No backup file yet. Try again in a few minutes." }, { status: 404 });
    const file = await readFile(path.join(dir, latest.name));
    await writeAudit(access.staff, "backup.download", latest.name, `${Math.round(latest.bytes / 1024)} KB`, requestIp(request));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${latest.name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/admin/backup/route.ts:GET]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Could not read the backup." }, { status: 500 });
  }
}
