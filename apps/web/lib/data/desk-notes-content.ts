import { cache } from "react";
import { DESK_NOTES, type DeskSection } from "@/lib/domain/desk-notes";
import { getSql } from "@/lib/sql";

const SLUG = "desk-notes";
const SLUG_OK = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS = ["update", "story", "more"] as const;

export type NoteKind = (typeof KINDS)[number];
export type StoredNote = {
  slug: string;
  title: string;
  kicker: string;
  excerpt: string;
  image: string;
  extraImage: string;
  kind: NoteKind;
  lead: string;
  body: string;
  points: string[];
};

const LIMITS = { notes: 24, body: 12000, lead: 700, excerpt: 320, title: 140, point: 180, points: 8 };

function text(value: unknown, fallback: string, max: number): string {
  const raw = typeof value === "string" ? value : fallback;
  return raw.trim().slice(0, max);
}

function seedBody(sections: DeskSection[]): string {
  return sections.map((section) => `# ${section.heading}\n\n${section.body}`).join("\n\n");
}

export function bodyToSections(body: string): DeskSection[] {
  const parts = body.split(/\n\n+/).map((part) => part.trim()).filter(Boolean);
  const sections: DeskSection[] = [];
  let current: DeskSection | null = null;
  for (const part of parts) {
    if (part.startsWith("# ")) {
      if (current) sections.push(current);
      current = { heading: part.slice(2).slice(0, 120), body: "" };
    } else if (current) {
      current.body = current.body ? `${current.body}\n\n${part}` : part;
    } else {
      current = { heading: "", body: part };
    }
  }
  if (current) sections.push(current);
  return sections.slice(0, 16);
}

function seedNotes(): StoredNote[] {
  return DESK_NOTES.map((note) => ({
    slug: note.slug,
    title: note.title,
    kicker: note.kicker,
    excerpt: note.excerpt,
    image: note.image,
    extraImage: "",
    kind: note.kind,
    lead: note.lead,
    body: seedBody(note.sections),
    points: [...note.points],
  }));
}

function asNote(raw: unknown, index: number, used: Set<string>): StoredNote {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const seed = seedNotes()[index];
  const title = text(row.title, seed?.title ?? "New note", LIMITS.title);
  const base = text(row.slug, "", 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || seed?.slug || `note-${index + 1}`;
  let slug = base.slice(0, 60);
  for (let n = 2; used.has(slug); n += 1) slug = `${base.slice(0, 54)}-${n}`;
  used.add(slug);
  const kind = KINDS.includes(row.kind as NoteKind) ? (row.kind as NoteKind) : seed?.kind ?? "more";
  const points = Array.isArray(row.points)
    ? row.points.filter((line): line is string => typeof line === "string").map((line) => line.trim()).filter(Boolean).slice(0, LIMITS.points)
    : seed?.points ?? [];
  return {
    slug,
    title,
    kicker: text(row.kicker, seed?.kicker ?? "Desk", 40),
    excerpt: text(row.excerpt, seed?.excerpt ?? "", LIMITS.excerpt),
    image: text(row.image, seed?.image ?? "", 400),
    extraImage: text(row.extraImage, "", 400),
    kind,
    lead: text(row.lead, seed?.lead ?? "", LIMITS.lead),
    body: text(row.body, seed?.body ?? "", LIMITS.body),
    points: points.map((line) => line.slice(0, LIMITS.point)),
  };
}

export function normalizeNotes(data: unknown): StoredNote[] {
  const raw = data && typeof data === "object" && Array.isArray((data as { notes?: unknown }).notes)
    ? (data as { notes: unknown[] }).notes
    : null;
  const used = new Set<string>();
  if (!raw) return seedNotes().map((note, index) => asNote(note, index, used));
  return raw.slice(0, LIMITS.notes).map((row, index) => asNote(row, index, used));
}

export function validateNotes(notes: StoredNote[]): string | null {
  if (notes.some((note) => !note.title.trim())) return "Every note needs a title.";
  if (notes.some((note) => !SLUG_OK.test(note.slug))) return "Each web address must use lowercase letters, numbers, and hyphens.";
  if (notes.some((note) => note.body.length >= LIMITS.body)) return "One note is too long. Keep each story under 12000 characters (about 2000 words).";
  if (notes.some((note) => note.image && !note.image.startsWith("/") && !note.image.startsWith("https://"))) return "Photos must be an uploaded image.";
  if (notes.some((note) => note.extraImage && !note.extraImage.startsWith("/") && !note.extraImage.startsWith("https://"))) return "Photos must be an uploaded image.";
  return null;
}

async function loadNotes(): Promise<StoredNote[]> {
  try {
    const row = (await (await getSql()).prepare(`SELECT content_json FROM site_content WHERE slug = ?`).get(SLUG)) as { content_json: string } | undefined;
    if (!row) return normalizeNotes(null);
    return normalizeNotes(JSON.parse(row.content_json));
  } catch (error) {
    console.error("[desk-notes-content.ts:loadNotes]", error instanceof Error ? error.message : error);
    return normalizeNotes(null);
  }
}

export async function saveDeskNotes(notes: StoredNote[]): Promise<{ ok: true } | { error: string }> {
  try {
    const content = normalizeNotes({ notes });
    const problem = validateNotes(content);
    if (problem) return { error: problem };
    await (await getSql()).prepare(`INSERT INTO site_content (slug, content_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`).run(SLUG, JSON.stringify({ notes: content }), new Date().toISOString());
    return { ok: true };
  } catch (error) {
    console.error("[desk-notes-content.ts:saveDeskNotes]", error instanceof Error ? error.message : error);
    return { error: "Could not save notes." };
  }
}

export const getPublishedNotes = cache(loadNotes);
