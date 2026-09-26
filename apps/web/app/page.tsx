import { HomeFeatures, HomeHighlights, HomeServices } from "@/app/home/HomeContentSections";
import { HomeHero } from "@/app/home/HomeHero";
import { HomeQuoteForm } from "@/app/home/HomeQuoteForm";
import { HomeTrackSection } from "@/app/home/HomeTrackSection";
import { SiteFooter } from "@/app/home/SiteFooter";
import { WhatsAppButton } from "@/app/home/WhatsAppButton";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getHomepageContent, type HomepageContent, type HomeSectionKey } from "@/lib/data/homepage-content";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

function renderSection(key: HomeSectionKey, content: HomepageContent) {
  if (key === "track") {
    return <HomeTrackSection key={key} title={content.trackTitle} placeholder={content.hubTrackPlaceholder} />;
  }
  if (key === "highlights") return <HomeHighlights key={key} items={content.towerAlerts} />;
  if (key === "services") return <HomeServices key={key} content={content} />;
  return <HomeFeatures key={key} content={content} />;
}

export default async function Home() {
  const token = await readSessionToken();
  const user = token ? await getUserBySessionToken(token) : null;
  const bookHref = user ? "/book" : "/signup";
  const content = await getHomepageContent();

  return (
    <div className="shell-sky">
      <HomeHero bookHref={bookHref} signedIn={Boolean(user)} content={content} />
      {content.sectionOrder
        .filter((key) => !content.hiddenSections.includes(key))
        .map((key) => renderSection(key, content))}
      <SiteFooter />
      <HomeQuoteForm bookHref={bookHref} />
      <WhatsAppButton />
    </div>
  );
}
