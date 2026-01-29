import { Header } from "@/components/layout/header"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { isSuperAdmin as checkSuperAdmin, isOrganizer, isArtist, isPersonal } from "@/lib/auth-utils"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isSuperAdmin = await checkSuperAdmin()
  const isOrg = await isOrganizer()
  const isArt = await isArtist()
  const isPers = await isPersonal()

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
  )
}
