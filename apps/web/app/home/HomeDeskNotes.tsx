import Link from "next/link";
import { getPublishedNotes } from "@/lib/data/desk-notes-content";

/** Desk notes: three updates, two stories, then the rest of the library. */
export async function HomeDeskNotes() {
  const notes = await getPublishedNotes();
  const updates = notes.filter((note) => note.kind === "update").slice(0, 3);
  const stories = notes.filter((note) => note.kind === "story").slice(0, 2);
  if (updates.length === 0 && stories.length === 0) return null;
  return (
    <section className="border-t border-black/10 bg-white px-6 py-20 sm:px-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[#191919] sm:text-4xl">
          From the Kathmandu desk
        </h2>
        <p className="mt-3 max-w-xl text-base text-[#3f3f3f]">
          Practical notes on city runs, overseas paperwork, and what the pickup desk asks for.
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {updates.map((note) => (
            <li key={note.slug}>
              <Link href={`/notes/${note.slug}`} className="flex h-full gap-3 rounded-lg border border-black/10 bg-white p-4 transition hover:border-[#ffcc00]">
                <span aria-hidden className="mt-1 h-3 w-3 shrink-0 bg-[#ffcc00]" />
                <span>
                  <span className="block font-semibold text-[#191919]">{note.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-[#3f3f3f]">{note.excerpt}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-8 grid gap-6 lg:grid-cols-2">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link href={`/notes/${story.slug}`} className="group block overflow-hidden rounded-xl border border-black/10 bg-white transition hover:-translate-y-0.5 hover:border-[#ffcc00]">
                <div className="relative h-52 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6a12]">{story.kicker}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold text-[#191919]">{story.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3f3f3f]">{story.excerpt}</p>
                  <p className="mt-4 text-sm font-semibold text-[#0e3d38]">Read the note →</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/notes" className="mt-8 inline-flex rounded-md bg-[#0e3d38] px-6 py-3 text-sm font-semibold text-[#fff8e6]">
          See more notes
        </Link>
      </div>
    </section>
  );
}
