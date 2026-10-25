import { Inter, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { organizationJsonLd, siteMetadata } from "@/lib/seo/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata = siteMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Per-request CSP nonce from proxy.ts; reading it also renders every page per request.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${manrope.variable} antialiased`}
        suppressHydrationWarning
      >
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: organizationJsonLd() }} />
        {children}
      </body>
    </html>
  );
}
