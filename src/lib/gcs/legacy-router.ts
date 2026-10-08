import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { UploadThingError, UTApi } from "uploadthing/server";
import { getUserId } from "@/lib/auth/session";
import { requireOrganizer } from "@/lib/auth-utils";
import { canPost, uploadBudget, vibezAccess } from "@/lib/vibez";
import { resolveViewer } from "@/lib/vibez-identity";
import { getVibezSettings, type VibezAccessMode } from "@/lib/vibez-settings";
import { verifyTicket } from "@/lib/vibez-ticket";

const f = createUploadthing();

export async function organizerMiddleware() {
  try {
    const user = await requireOrganizer();
    return { userId: user.id };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unauthorized")) {
      throw new UploadThingError("Unauthorized");
    }
    throw err;
  }
}

export async function authMiddleware() {
  const userId = await getUserId();
  if (!userId) throw new UploadThingError("Unauthorized");
  return { userId };
}

export const ourFileRouter = {
  eventFlyer: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      // v7 uses 'url', older versions used 'ufsUrl'
      const fileUrl = file.url || file.ufsUrl;
      console.log("Uploaded event flyer:", fileUrl);
      return { url: fileUrl };
    }),
  // Event gallery images
  eventGallery: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl;
      console.log("Uploaded gallery image:", fileUrl);
      return { url: fileUrl };
    }),
  // Feedback screenshots
  feedbackScreenshot: f({ image: { maxFileSize: "4MB", maxFileCount: 3 } })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl;
      console.log("Uploaded feedback screenshot:", fileUrl);
      return { url: fileUrl };
    }),
  // Custom logo for sidebar
  customLogo: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(organizerMiddleware)
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl;
      console.log("Uploaded custom logo:", fileUrl);
      return { url: fileUrl };
    }),
  // VIBEZ (BETA): attendee feed images.
  //
  // The client asks /api/events/[eventId]/vibez/upload-ticket first; that
  // endpoint decides whether this person may post here, right now. Without
  // that check any signed-in account could push 4MB files at our storage and
  // then be told no at the last step — the bytes would already be spent. The
  // ticket is short-lived, single-event, and useless to anyone else.
  vibezPost: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .input(z.object({ eventId: z.string().min(1), ticket: z.string().min(1) }))
    .middleware(async ({ input }) => {
      // The validated `input` is used, not `req.formData()`. Reading the
      // multipart body here consumed the stream before UploadThing could hand
      // the file to storage, and it also meant the values were unvalidated
      // whatever shape they arrived in.
      const { eventId, ticket } =
        input ?? ({} as { eventId?: string; ticket?: string });
      if (!eventId || !ticket) {
        throw new UploadThingError("Missing upload ticket");
      }

      // A guest holding a redeemed ticket is an attendee, so this no longer
      // requires a signed-in session. resolveViewer is the same resolver the feed
      // API uses, which is the point: one definition of "who is asking".
      const viewer = await resolveViewer(eventId);
      if (!viewer.subject) {
        throw new UploadThingError("Unauthorized");
      }

      if (!verifyTicket(ticket, viewer.subject, eventId)) {
        throw new UploadThingError("Upload ticket is invalid or expired");
      }

      // Re-checked here, not just at ticket time: a ban may have landed in
      // between, and this middleware is the last gate before the bytes land.
      //
      // The settings are read here as well as in the route, because this is the
      // last gate before bytes land. Deciding access differently here from the
      // route that minted the ticket is how an organizer's "tickets only" gets
      // quietly ignored for uploads.
      const settings = await getVibezSettings(eventId);
      const access = await vibezAccess(
        eventId,
        viewer.userId,
        viewer.email,
        viewer.isGuest ? viewer.subject : null,
        viewer.spotIds,
        settings.accessMode as VibezAccessMode,
      );
      if (access === "banned")
        throw new UploadThingError("Banned from this feed");
      if (!canPost(access)) {
        throw new UploadThingError("Only attendees can post to the VIBEZ feed");
      }

      const budget = await uploadBudget(
        eventId,
        viewer.userId ?? "",
        viewer.subject,
        {
          perGuestPerHour: settings.maxPerGuestPerHour,
        },
      );
      if (!budget.allowed)
        throw new UploadThingError(budget.reason ?? "Too many uploads");

      return { subject: viewer.subject, eventId, spotId: viewer.spotId };
    })
    .onUploadComplete(async ({ file }) => {
      const fileUrl = file.url || file.ufsUrl;
      return { url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// Server-side API for uploading from URLs
export const utapi = new UTApi();
