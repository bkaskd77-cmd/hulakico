import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/app/home/PublicHeader";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { bodyToSections, getPublishedNotes, type StoredNote } from "@/lib/data/desk-notes-content";

type NotesParams = { slug?: string[] };

export async function generateStaticParams(): Promise<NotesParams[]> {
  const notes = await getPublishedNotes();
  return [{ slug: [] }, ...notes.map((note) => ({ slug: [note.slug] }))];
}

export async function generateMetadata({ params }: { params: Promise<NotesParams> }): Promise<Metadata> {
  const { slug } = await params;
  const key = slug?.[0];
  if (!key) return { title: "From the Kathmandu desk · Hulakico", description: "Notes on city runs, paperwork, pricing, and pickup." };
  const note = (await getPublishedNotes()).find((item) => item.slug === key);
  if (!note) return { title: "Note · Hulakico" };
  return { title: `${note.title} · Hulakico`, description: note.excerpt };
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell-sky min-h-dvh">
      <PublicHeader />
      {children}
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}

function NotesIndex({ notes }: { notes: StoredNote[] }) {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-6 py-14 sm:px-12">
        <Link href="/" className="inline-flex rounded-md border border-[#0e3d38] px-4 py-2 text-sm font-semibold text-[#0e3d38]">Back to homepage</Link>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a12]">Notes</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[#191919]">From the Kathmandu desk</h1>
        <p className="mt-3 max-w-xl text-[#3f3f3f]">Every note behind the homepage cards, plus the ones that did not fit there.</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <li key={note.slug}>
              <Link href={`/notes/${note.slug}`} className="group block h-full overflow-hidden rounded-xl border border-black/10 bg-white transition hover:border-[#ffcc00]">
                <div className="relative h-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={note.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a12]">{note.kicker}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold text-[#191919]">{note.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3f3f3f]">{note.excerpt}</p>
                  <p className="mt-4 text-sm font-semibold text-[#0e3d38]">Read the note →</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}

function NoteArticle({ note, notes }: { note: StoredNote; notes: StoredNote[] }) {
  const sections = bodyToSections(note.body);
  const others = notes.filter((item) => item.slug !== note.slug).slice(0, 4);
  return (
    <Shell>
      <article className="mx-auto grid max-w-6xl gap-12 px-6 py-14 sm:px-12 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div>
          <Link href="/" className="inline-flex rounded-md border border-[#0e3d38] px-4 py-2 text-sm font-semibold text-[#0e3d38]">Back to homepage</Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a12]">{note.kicker}</p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight text-[#191919] sm:text-5xl">{note.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#3f3f3f]">{note.lead}</p>
          {note.image ? (
            <div className="relative mt-8 h-72 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={note.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : null}
          {note.extraImage ? (
            <div className="relative mt-6 h-64 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={note.extraImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : null}
          {sections.map((section, index) => (
            <section key={`${section.heading}-${index}`} className="mt-8">
              {section.heading ? <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#191919]">{section.heading}</h2> : null}
              {section.body.split(/\n\n+/).filter(Boolean).map((paragraph, paragraphIndex) => (
                <p key={`${index}-${paragraphIndex}`} className="mt-3 text-base leading-8 text-[#3f3f3f]">{paragraph}</p>
              ))}
            </section>
          ))}
          <ul className="mt-8 space-y-3 border-l-4 border-[#ffcc00] bg-[#fff8dc] px-4 py-4">
            {note.points.map((point) => (
              <li key={point} className="text-sm font-medium text-[#191919]">{point}</li>
            ))}
          </ul>
        </div>
        <aside>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6a12]">More from the desk</p>
          <ul className="mt-4 space-y-4">
            {others.map((item) => (
              <li key={item.slug}>
                <Link href={`/notes/${item.slug}`} className="block rounded-lg border border-black/10 p-3 hover:border-[#ffcc00]">
                  <span className="block text-sm font-semibold text-[#191919]">{item.title}</span>
                  <span className="mt-1 block text-xs text-[#3f3f3f]">{item.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </article>
    </Shell>
  );
}

export default async function NotesPage({ params }: { params: Promise<NotesParams> }) {
  const { slug } = await params;
  const notes = await getPublishedNotes();
  if (!slug || slug.length === 0) return <NotesIndex notes={notes} />;
  if (slug.length > 1) notFound();
  const note = notes.find((item) => item.slug === slug[0]);
  if (!note) notFound();
  return <NoteArticle note={note} notes={notes} />;
}
