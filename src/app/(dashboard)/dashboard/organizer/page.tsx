import { requireOrganizer } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function OrganizerPage() {
  try {
    await requireOrganizer();
  } catch (error) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
        <p className="text-muted-foreground">Manage your events and organization profile.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">My Events</h3>
          <p className="text-sm text-muted-foreground">View and manage events you're organizing.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Organization Profile</h3>
          <p className="text-sm text-muted-foreground">Manage your organization details.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Analytics</h3>
          <p className="text-sm text-muted-foreground">Track event performance and attendance.</p>
        </div>
      </div>
    </div>
  );
}