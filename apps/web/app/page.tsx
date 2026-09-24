import { HomeHero } from "@/app/home/HomeHero";
import { HomeSections } from "@/app/home/HomeSections";
import { getUserBySessionToken } from "@/lib/data/auth-store";
import { readSessionToken } from "@/lib/http/session-cookie";

export const runtime = "nodejs";

export default async function Home() {
  const token = await readSessionToken();
  const user = token ? getUserBySessionToken(token) : null;
  const bookHref = user ? "/book" : "/signup";

  return (
    <div className="shell-sky">
      <HomeHero bookHref={bookHref} signedIn={Boolean(user)} />
      <HomeSections bookHref={bookHref} />
    </div>
  );
}
