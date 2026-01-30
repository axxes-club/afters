import { Header } from "@/components/layout/header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import {
  isSuperAdmin as checkSuperAdmin,
  hasOrganizerProfile,
  hasArtistProfile,
  hasPersonalProfile,
} from "@/lib/auth-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isSuperAdmin = await checkSuperAdmin();
  const isOrg = await hasOrganizerProfile();
  const isArt = await hasArtistProfile();
  const isPers = await hasPersonalProfile();

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-16">
        <DashboardSidebar
          isSuperAdmin={isSuperAdmin}
          isOrganizer={isOrg}
          isArtist={isArt}
          isPersonal={isPers}
        />
        {/* Add padding-bottom on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
