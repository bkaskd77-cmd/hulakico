import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forgot password · Hulakico", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
