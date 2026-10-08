import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { mockAuth, mockPrisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth/session", () => ({
  getUserId: async () => (await mockAuth())?.userId ?? null,
}));

vi.mock("@/lib/api-keys", () => ({
  validateApiKey: vi.fn(),
  checkApiRateLimit: vi.fn(),
  hasScope: vi.fn(),
}));

import { GET } from "@/app/api/user/profile/route";

function createMockRequest(): NextRequest {
  return {
    headers: new Headers(),
    url: "http://localhost:3000/api/user/profile",
  } as NextRequest;
}

describe("User Profile API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
  });

  describe("GET /api/user/profile", () => {
    it("should return user profile with organizer data", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        createdAt: new Date("2024-01-01"),
        organizerProfile: {
          id: "profile-123",
          displayName: "Test Organizer",
          slug: "test-organizer",
          bio: "Test bio",
          _count: {
            events: 5,
          },
        },
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe("test@example.com");
      expect(data.organizerProfile.displayName).toBe("Test Organizer");
      expect(data.organizerProfile._count.events).toBe(5);
    });

    it("should return 404 if user not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should return user without organizer profile", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        createdAt: new Date("2024-01-01"),
        organizerProfile: null,
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.email).toBe("test@example.com");
      expect(data.organizerProfile).toBeNull();
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch profile");
    });
  });
});
