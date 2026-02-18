import { Header } from "@/components/layout/header"
import { SuperadminSidebar } from "@/components/layout/superadmin-sidebar"
import { requireSuperAdmin } from "@/lib/auth-utils"
import { redirect } from "next/navigation"

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireSuperAdmin()
  } catch {
    redirect("/d")
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="flex pt-16">
        <SuperadminSidebar />
        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6 bg-gradient-to-br from-black via-black to-[#ff1493]/5">{children}</main>
      </div>
    </div>
  )
}
