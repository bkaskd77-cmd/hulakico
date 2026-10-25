import { getSql } from "@/lib/sql";

/**
 * Website content (homepage, services, pages, contact, notes, city and lane pages) lives in
 * one site_content row per slug. It changes only when staff save in Admin, so it is kept in
 * memory: public pages stop querying the remote database on every visit. Saves go through
 * writeSiteContent, which updates the copy at once; the TTL is only a safety net.
 */
const TTL_MS = 10 * 60 * 1000;
const memory = new Map<string, { row: { content_json: string } | undefined; at: number }>();

export async function readSiteContent(slug: string): Promise<{ content_json: string } | undefined> {
  const hit = memory.get(slug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.row;
  const row = (await (await getSql())
    .prepare(`SELECT content_json FROM site_content WHERE slug = ?`)
    .get(slug)) as { content_json: string } | undefined;
  memory.set(slug, { row, at: Date.now() });
  return row;
}

export async function writeSiteContent(slug: string, contentJson: string): Promise<void> {
  await (await getSql())
    .prepare(
      `INSERT INTO site_content (slug, content_json, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(slug) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`,
    )
    .run(slug, contentJson, new Date().toISOString());
  memory.set(slug, { row: { content_json: contentJson }, at: Date.now() });
}
