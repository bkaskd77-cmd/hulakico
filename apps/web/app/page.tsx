import { HomeHero } from "@/app/home/HomeHero";
import { HomeSections } from "@/app/home/HomeSections";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { getHomepageContent } from "@/lib/data/homepage-content";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function Home() {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  const bookHref = user ? "/book" : "/signup";
  const content = getHomepageContent();

  return (
    <div className="shell-sky">
      <HomeHero bookHref={bookHref} signedIn={Boolean(user)} content={content} />
      <HomeSections bookHref={bookHref} content={content} />
    </div>
  );
}
