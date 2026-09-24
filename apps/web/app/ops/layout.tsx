export const runtime = "nodejs";

/** Legacy Ops pages redirect via next.config; forms under /ops stay importable. */
export default function OpsLegacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
