"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [hasOrganizerProfile, setHasOrganizerProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const checkOrganizerProfile = async () => {
      if (!isLoaded || !isSignedIn || !userId) {
        return;
      }

      try {
        const response = await fetch(`/api/check-profile`, { signal: controller.signal });
        if (response.ok) {
          const { hasProfile } = await response.json();
          setHasOrganizerProfile(hasProfile);

          if (!hasProfile) {
            router.push('/b');
          } else {
            setCheckingProfile(false);
          }
        } else {
          router.push('/b');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error checking organizer profile:', error);
          router.push('/b');
        }
      }
    };

    if (isLoaded && isSignedIn) {
      checkOrganizerProfile();
    }
    return () => controller.abort();
  }, [isLoaded, isSignedIn, userId, router]);

  // Show loading state while checking authentication and profile
  if (!isLoaded || checkingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  // Only render children if user is authenticated and has organizer profile
  if (hasOrganizerProfile) {
    return <>{children}</>;
  }

  // If we got here, the user is being redirected to dashboard
  return null;
}
