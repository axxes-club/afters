import { redirect } from "next/navigation";

export default async function LegacyDashboardRedirect({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  const targetPath = path ? `/b/${path.join("/")}` : "/b";
  redirect(targetPath);
}
