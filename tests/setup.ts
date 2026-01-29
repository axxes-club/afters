import { expect, afterEach, vi, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Set up environment variables for tests
beforeAll(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  process.env.CLERK_SECRET_KEY = "test-clerk-secret";
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-clerk-publishable";
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
}));

// Mock Clerk
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ userId: "test-user-id" })),
  currentUser: vi.fn(() => ({
    id: "test-user-id",
    emailAddresses: [
      {
        id: "email-id",
        emailAddress: "test@example.com",
      },
    ],
    primaryEmailAddressId: "email-id",
    firstName: "Test",
    lastName: "User",
    imageUrl: "https://example.com/avatar.jpg",
  })),
}));

vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn(() => ({
    user: {
      id: "test-user-id",
      emailAddresses: [
        {
          id: "email-id",
          emailAddress: "test@example.com",
        },
      ],
      firstName: "Test",
      lastName: "User",
      fullName: "Test User",
      imageUrl: "https://example.com/avatar.jpg",
    },
    isLoaded: true,
    isSignedIn: true,
  })),
  SignIn: vi.fn(),
  SignUp: vi.fn(),
  UserButton: vi.fn(),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(
    (namespace: string) => (key: string) => `${namespace}.${key}`,
  ),
  NextIntlClientProvider: vi.fn(({ children }) => children),
}));

// Mock Prisma - will be overridden per test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    organizerProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    artistProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    personalProfile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    savedEvent: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Global test utilities
global.testUser = {
  id: "test-user-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "USER",
};

declare global {
  var testUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}
