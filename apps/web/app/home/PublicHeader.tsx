import { SiteHeader } from "@/app/home/SiteHeader";
import { getServices } from "@/lib/data/services-content";

/** Loads the live service list into the public header. */
export async function PublicHeader({ onHome, signedIn }: { onHome?: boolean; signedIn?: boolean }) {
  try {
    const services = await getServices();
    return <SiteHeader onHome={onHome} signedIn={signedIn} services={services} />;
  } catch (error) {
    console.error("[PublicHeader.tsx:PublicHeader]", error instanceof Error ? error.message : error);
    return <SiteHeader onHome={onHome} signedIn={signedIn} />;
  }
}
