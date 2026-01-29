import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks to avoid initialization errors
const { mockAuth, mockCurrentUser, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockCurrentUser = vi.fn();
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    organizerProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { mockAuth, mockCurrentUser, mockPrisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

import { POST, PUT, DELETE, GET } from "@/app/api/organizer/profile/route";

describe("Organizer Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
  });

  describe("POST /api/organizer/profile", () => {
    it("should create a new organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        emailAddresses: [{ id: "email-1", emailAddress: "test@example.com" }],
        primaryEmailAddressId: "email-1",
        firstName: "Test",
        lastName: "User",
        imageUrl: "https://example.com/avatar.jpg",
      } as any);

      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null);
      mockPrisma.organizerProfile.findUnique.mockResolvedValueOnce(null); // Check existing profile
      mockPrisma.organizerProfile.findUnique.mockResolvedValueOnce(null); // Check slug taken
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
      } as any);

      mockPrisma.organizerProfile.create.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        displayName: "Test Organizer",
        slug: "test-organizer",
        bio: "Test bio",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockPrisma.user.update.mockResolvedValue({} as any);

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test Organizer",
            slug: "test-organizer",
            bio: "Test bio",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.slug).toBe("test-organizer");
      expect(mockPrisma.organizerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          displayName: "Test Organizer",
          slug: "test-organizer",
          bio: "Test bio",
        },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { role: "ORGANIZER" },
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            slug: "test",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if required fields are missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            // slug is missing
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("required");
    });

    it("should return 400 if slug format is invalid", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            slug: "Invalid Slug!",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("lowercase letters, numbers, and hyphens");
    });

    it("should return 400 if user already has organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "existing-profile",
        userId: "user-123",
      } as any);

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            slug: "test",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already have an organizer profile");
    });

    it("should return 400 if slug is already taken", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique
        .mockResolvedValueOnce(null) // No existing profile for user
        .mockResolvedValueOnce({ id: "other-profile", slug: "test" } as any); // Slug taken

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            slug: "test",
          }),
        },
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already taken");
    });
  });

  describe("PUT /api/organizer/profile", () => {
    it("should update an existing organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        slug: "test-organizer",
      } as any);

      mockPrisma.organizerProfile.update.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        displayName: "Updated Name",
        slug: "test-organizer",
        bio: "Updated bio",
      } as any);

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Updated Name",
            slug: "test-organizer",
            bio: "Updated bio",
          }),
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.displayName).toBe("Updated Name");
      expect(mockPrisma.organizerProfile.update).toHaveBeenCalled();
    });

    it("should return 404 if profile does not exist", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/organizer/profile",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: "Test",
            slug: "test",
          }),
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("DELETE /api/organizer/profile", () => {
    it("should delete organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        events: [],
      } as any);

      mockPrisma.organizerProfile.delete.mockResolvedValue({} as any);
      mockPrisma.user.update.mockResolvedValue({} as any);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain("deleted successfully");
      expect(mockPrisma.organizerProfile.delete).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { role: "USER" },
      });
    });

    it("should return 400 if profile has events", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        events: [{ id: "event-1" }],
      } as any);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("existing events");
    });

    it("should return 404 if profile does not exist", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null);

      const response = await DELETE();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });

  describe("GET /api/organizer/profile", () => {
    it("should return organizer profile with stats", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
        displayName: "Test Organizer",
        slug: "test-organizer",
        events: [],
        followers: [],
        _count: {
          events: 5,
          followers: 10,
        },
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.displayName).toBe("Test Organizer");
      expect(data._count.events).toBe(5);
      expect(data._count.followers).toBe(10);
    });

    it("should return 404 if profile does not exist", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain("not found");
    });
  });
});
