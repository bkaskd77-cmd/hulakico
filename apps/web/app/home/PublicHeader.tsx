import { SiteHeader } from "@/app/home/SiteHeader";
import { getServices } from "@/lib/data/services-content";

type Services = Awaited<ReturnType<typeof getServices>>;

/** Live service list for the header; undefined lets SiteHeader use its defaults. */
async function loadServices(): Promise<Services | undefined> {
  try {
    return await getServices();
  } catch (error) {
    console.error("[PublicHeader.tsx:loadServices]", error instanceof Error ? error.message : error);
    return undefined;
  }
}

/** Loads the live service list into the public header. */
export async function PublicHeader({ onHome, signedIn }: { onHome?: boolean; signedIn?: boolean }) {
  const services = await loadServices();
  return <SiteHeader onHome={onHome} signedIn={signedIn} services={services} />;
}
