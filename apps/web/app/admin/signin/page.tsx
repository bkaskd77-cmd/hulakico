import { redirect } from "next/navigation";

export const runtime = "nodejs";

/** Legacy path — Admin platform entry is `/admin`. */
export default async function AdminSigninRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  redirect(params.denied === "1" ? "/admin?denied=1" : "/admin");
}
