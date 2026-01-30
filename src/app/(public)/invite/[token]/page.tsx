import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { InviteAcceptClient } from "./InviteAcceptClient";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { userId } = await auth();

  // If not logged in, redirect to sign-in with return URL
  if (!userId) {
    redirect(`/sign-in?redirect_url=/invite/${token}`);
  }

  const invite = await prisma.staffInvite.findUnique({
    where: { token },
    include: {
      organizerProfile: {
        select: {
          displayName: true,
          logoUrl: true,
          slug: true,
        },
      },
    },
  });

  if (!invite) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black pt-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <svg
                className="size-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Invalid Invite
            </h1>
            <p className="text-muted-foreground">
              This invite link is invalid or has been revoked.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (invite.acceptedAt) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black pt-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="size-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <svg
                className="size-8 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Already Accepted
            </h1>
            <p className="text-muted-foreground">
              This invite has already been accepted.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (invite.expiresAt < new Date()) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black pt-16 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="size-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <svg
                className="size-8 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Invite Expired
            </h1>
            <p className="text-muted-foreground">
              This invite has expired. Please ask the organizer to send a new
              one.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <InviteAcceptClient
          token={token}
          organizerName={invite.organizerProfile.displayName}
          organizerLogo={invite.organizerProfile.logoUrl}
          role={invite.role}
        />
      </main>
      <Footer />
    </>
  );
}
