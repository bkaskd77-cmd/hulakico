import type { Metadata } from "next";
import { PublicHeader } from "@/app/home/PublicHeader";

export const metadata: Metadata = { title: "My account · Hulakico", robots: { index: false, follow: false } };

/** Site header above every account page (each page checks the session itself). */
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader signedIn />
      {children}
    </>
  );
}
