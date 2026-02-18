import { redirect } from "next/navigation";

export default async function LegacyDashboardRedirect({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const targetPath = path ? `/overview/${path.join("/")}` : "/overview";
  redirect(targetPath);
}
