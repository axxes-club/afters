"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [hasOrganizerProfile, setHasOrganizerProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkOrganizerProfile = async () => {
      if (!isLoaded || !isSignedIn || !userId) {
        return;
      }

      try {
        // Check if user has an organizer profile
        const response = await fetch(`/api/check-profile`);
        if (response.ok) {
          const { hasProfile } = await response.json();
          setHasOrganizerProfile(hasProfile);

          if (!hasProfile) {
            router.push('/dashboard/onboarding');
          } else {
            setCheckingProfile(false);
          }
        } else {
          // If there's an error checking profile, redirect to onboarding anyway
          router.push('/dashboard/onboarding');
        }
      } catch (error) {
        console.error('Error checking organizer profile:', error);
        router.push('/dashboard/onboarding');
      }
    };

    if (isLoaded && isSignedIn) {
      checkOrganizerProfile();
    }
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

  // If we got here, the user is being redirected to onboarding
  return null;
}