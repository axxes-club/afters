import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ profile: vi.fn(), event: vi.fn(), update: vi.fn(), where: vi.fn(), context: vi.fn() }));
vi.mock("@/lib/auth-utils", () => ({ getEffectiveUserId: async () => "staff" }));
vi.mock("@/lib/organizer-context", () => ({ organizerWhere: m.where, getOrganizerContext: m.context }));
vi.mock("@/lib/prisma", () => ({ prisma: { organizerProfile: { findUnique: m.profile }, event: { findUnique: m.event, update: m.update } } }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(), generateEventRescheduledEmailHtml: vi.fn() }));
import { PATCH } from "@/app/api/events/[eventId]/route";
import { GET as testTicket, POST as resetTicket } from "@/app/api/events/[eventId]/test-ticket/route";
const params = { params: Promise.resolve({ eventId: "event" }) };
beforeEach(() => { vi.resetAllMocks(); m.profile.mockResolvedValue({ id: "selected" }); m.event.mockResolvedValue({ id: "event", organizerId: "selected" }); m.where.mockResolvedValue({ id: "selected" }); m.context.mockResolvedValue(null); });
describe("workspace permission boundaries", () => {
  it.each([{ isPublished: true }, { status: "PUBLISHED" }, { isPublished: false }, { status: "CANCELLED" }])("rejects publication/status changes by edit-only staff: %j", async body => {
    const response = await PATCH(new Request("http://localhost/api/events/event", { method: "PATCH", body: JSON.stringify(body) }), params);
    expect(response.status).toBe(403); expect(m.context).toHaveBeenCalledWith("events.publish"); expect(m.update).not.toHaveBeenCalled();
  });
  it("cannot edit an event belonging to another workspace", async () => {
    m.event.mockResolvedValue({ id: "event", organizerId: "foreign" });
    const response = await PATCH(new Request("http://localhost/api/events/event", { method: "PATCH", body: JSON.stringify({ title: "Changed" }) }), params);
    expect(response.status).toBe(404); expect(m.update).not.toHaveBeenCalled();
  });
  it.each([testTicket, resetTicket])("requires ownership for test ticket creation/reset", async handler => {
    m.profile.mockResolvedValue(null);
    const response = await handler(new Request("http://localhost/api/events/event/test-ticket", { method: "POST", body: "{}" }), params);
    expect(response.status).toBe(400); expect(m.where).toHaveBeenCalledWith("owner"); expect(m.event).not.toHaveBeenCalled();
  });
});
