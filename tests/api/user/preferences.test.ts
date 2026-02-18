import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist mocks to avoid initialization errors
const { mockAuth, mockPrisma } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
    },
    organizerProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { mockAuth, mockPrisma };
});

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

import { GET, PUT } from "@/app/api/user/preferences/route";

describe("User Preferences API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
  });

  describe("GET /api/user/preferences", () => {
    it("should return user preferences", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-123",
        organizerProfile: {
          sidebarLogoMode: "custom",
          sidebarCustomLogoUrl: "https://example.com/logo.png",
          sidebarCompact: true,
          uiAccentColor: "#00ff88",
          uiFontSize: "large",
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organizerProfile.sidebarLogoMode).toBe("custom");
      expect(data.organizerProfile.sidebarCustomLogoUrl).toBe("https://example.com/logo.png");
      expect(data.organizerProfile.sidebarCompact).toBe(true);
      expect(data.organizerProfile.uiAccentColor).toBe("#00ff88");
      expect(data.organizerProfile.uiFontSize).toBe("large");
    });

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if user not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch preferences");
    });
  });

  describe("PUT /api/user/preferences", () => {
    it("should update user preferences", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      });
      mockPrisma.organizerProfile.update.mockResolvedValue({
        sidebarLogoMode: "custom",
        sidebarCustomLogoUrl: "https://example.com/logo.png",
        sidebarCompact: true,
        uiAccentColor: "#00ff88",
        uiFontSize: "large",
      });

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sidebarLogoMode: "custom",
            sidebarCustomLogoUrl: "https://example.com/logo.png",
            sidebarCompact: true,
            uiAccentColor: "#00ff88",
            uiFontSize: "large",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sidebarLogoMode).toBe("custom");
      expect(data.uiAccentColor).toBe("#00ff88");
      expect(mockPrisma.organizerProfile.update).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        data: {
          sidebarLogoMode: "custom",
          sidebarCustomLogoUrl: "https://example.com/logo.png",
          sidebarCompact: true,
          uiAccentColor: "#00ff88",
          uiFontSize: "large",
        },
        select: {
          sidebarLogoMode: true,
          sidebarCustomLogoUrl: true,
          sidebarCompact: true,
          uiAccentColor: true,
          uiFontSize: true,
        },
      });
    });

    it("should return 401 if user is not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sidebarLogoMode: "afters",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if organizer profile is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sidebarLogoMode: "afters",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Organizer profile required");
    });

    it("should return 400 for invalid sidebar logo mode", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sidebarLogoMode: "invalid-mode",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid sidebar logo mode");
    });

    it("should return 400 for invalid font size", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uiFontSize: "huge",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid font size");
    });

    it("should accept all valid sidebar logo modes", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      });
      mockPrisma.organizerProfile.update.mockResolvedValue({
        sidebarLogoMode: "hidden",
        sidebarCustomLogoUrl: null,
        sidebarCompact: false,
        uiAccentColor: null,
        uiFontSize: "normal",
      });

      for (const mode of ["afters", "custom", "hidden"]) {
        const request = new Request(
          "http://localhost:3000/api/user/preferences",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sidebarLogoMode: mode,
            }),
          }
        );

        const response = await PUT(request);
        expect(response.status).toBe(200);
      }
    });

    it("should accept all valid font sizes", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockResolvedValue({
        id: "profile-123",
        userId: "user-123",
      });
      mockPrisma.organizerProfile.update.mockResolvedValue({
        sidebarLogoMode: "afters",
        sidebarCustomLogoUrl: null,
        sidebarCompact: false,
        uiAccentColor: null,
        uiFontSize: "normal",
      });

      for (const size of ["small", "normal", "large"]) {
        const request = new Request(
          "http://localhost:3000/api/user/preferences",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uiFontSize: size,
            }),
          }
        );

        const response = await PUT(request);
        expect(response.status).toBe(200);
      }
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockPrisma.organizerProfile.findUnique.mockRejectedValue(new Error("DB error"));

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sidebarLogoMode: "afters",
          }),
        }
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update preferences");
    });
  });
});
