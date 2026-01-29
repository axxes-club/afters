import { requirePersonal } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  try {
    await requirePersonal();
  } catch (error) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
        <p className="text-muted-foreground">Manage your personal account settings.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">Update your personal information.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Privacy</h3>
          <p className="text-sm text-muted-foreground">Manage your privacy settings.</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Notifications</h3>
          <p className="text-sm text-muted-foreground">Configure notification preferences.</p>
        </div>
      </div>
    </div>
  );
}