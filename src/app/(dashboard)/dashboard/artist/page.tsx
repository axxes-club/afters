import { requireArtist } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function ArtistPage() {
  try {
    await requireArtist();
  } catch (error) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Artist Profile</h1>
        <p className="text-muted-foreground">Manage your artist profile and upcoming performances.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">My Profile</h3>
          <p className="text-sm text-muted-foreground">Edit your artist profile and bio.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Upcoming Shows</h3>
          <p className="text-sm text-muted-foreground">View events you're performing at.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Fan Analytics</h3>
          <p className="text-sm text-muted-foreground">Track your fan engagement and reach.</p>
        </div>
      </div>
    </div>
  );
}