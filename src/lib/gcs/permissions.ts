import { isSuperAdmin, getSessionUser } from "@/lib/auth-utils";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { resolveViewer } from "@/lib/vibez-identity";
import { canView, vibezAccess } from "@/lib/vibez";
import { getVibezSettings, type VibezAccessMode } from "@/lib/vibez-settings";
export async function authorizeAssetRead(
  _request: Request,
  { record, urls }: any,
) {
  const privateReceipt =
    record && ["feedbackScreenshot", "vibezPost"].includes(record.route);
  const publicEvent =
    !privateReceipt &&
    (await prisma.event.findFirst({
      where: {
        isPublished: true,
        OR: [
          { flyerUrl: { in: urls } },
          ...urls.map((url: string) => ({
            gallery: { array_contains: [url] },
          })),
        ],
      },
    }));
  if (publicEvent) return true;
  const branding =
    !privateReceipt &&
    (await prisma.organizerProfile.findFirst({
      where: {
        OR: [{ logoUrl: { in: urls } }, { sidebarCustomLogoUrl: { in: urls } }],
      },
    }));
  if (branding) return true;
  const feedback = await prisma.feedback.findFirst({
    where: { screenshotUrl: { in: urls } },
  });
  if (feedback || record?.route === "feedbackScreenshot") {
    const { userId } = await auth();
    return (
      (await isSuperAdmin()) ||
      (!!userId &&
        userId ===
          (record?.route === "feedbackScreenshot"
            ? record.metadata.userId
            : feedback?.userId))
    );
  }
  const post = await prisma.vibezPost.findFirst({
    where: {
      imageUrl: { in: urls },
      filePurgedAt: null,
      ...(record?.route === "vibezPost"
        ? { eventId: record.metadata.eventId }
        : {}),
    },
  });
  const eventId = record?.metadata.eventId ?? post?.eventId;
  if (!eventId) {
    const user = await getSessionUser();
    if (!user) return false;
    const draft = await prisma.event.findFirst({
      where: {
        OR: [
          { flyerUrl: { in: urls } },
          ...urls.map((url: string) => ({
            gallery: { array_contains: [url] },
          })),
        ],
        ...(user.role === "SUPERADMIN"
          ? {}
          : { organizer: { userId: user.id } }),
      },
    });
    return !!draft;
  }
  const viewer = await resolveViewer(eventId);
  const settings = await getVibezSettings(eventId);
  const access = await vibezAccess(
    eventId,
    viewer.userId,
    viewer.email,
    viewer.isGuest ? viewer.subject : null,
    viewer.spotIds,
    settings.accessMode as VibezAccessMode,
  );
  if (!canView(access)) return false;
  if (post)
    return (
      access === "staff" ||
      (!post.removedAt &&
        (post.moderationStatus === "approved" ||
          (!!viewer.subject && post.authorSubject === viewer.subject)))
    );
  return !!viewer.subject && viewer.subject === record?.metadata.subject;
}
