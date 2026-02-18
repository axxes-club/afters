import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Events listing is superadmin only - guests access events via direct links
export default async function EventsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user is superadmin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "SUPERADMIN") {
    // Organizers go to their dashboard, everyone else gets 404
    const isOrg = await prisma.organizerProfile.findUnique({
      where: { userId },
    });
    
    if (isOrg) {
      redirect("/b/events");
    }
    
    redirect("/");
  }

  // Superadmins get redirected to the superadmin events page
  redirect("/superadmin/events");
}
