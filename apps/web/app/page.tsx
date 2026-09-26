import { HomeHero } from "@/app/home/HomeHero";
import { HomeQuoteForm } from "@/app/home/HomeQuoteForm";
import { HomeSections } from "@/app/home/HomeSections";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getHomepageContent } from "@/lib/data/homepage-content";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function Home() {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  const bookHref = user ? "/book" : "/signup";
  const content = getHomepageContent();

  return (
    <div className="shell-sky">
      <HomeHero bookHref={bookHref} signedIn={Boolean(user)} content={content} />
      <HomeSections content={content} />
      <SiteFooter />
      <HomeQuoteForm bookHref={bookHref} />
      <WhatsAppButton />
    </div>
  );
}
