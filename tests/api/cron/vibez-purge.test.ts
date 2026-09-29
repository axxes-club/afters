import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

/**
 * The purge endpoint deletes files. Its auth guard is the only thing between
 * that and the open internet, so these are pinned rather than assumed.
 */

vi.mock("@/lib/prisma", () => ({
  prisma: { vibezPost: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() } },
}))
vi.mock("@/lib/vibez-storage", () => ({
  purgeStoredFile: vi.fn().mockResolvedValue(true),
}))

import { GET } from "@/app/api/cron/vibez-purge/route"

const SECRET = "test-cron-secret"
const realEnv = process.env.CRON_SECRET

function req(auth?: string) {
  return new Request("https://afters.am/api/cron/vibez-purge", {
    headers: auth ? { authorization: auth } : {},
  })
}

describe("vibez purge auth", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = SECRET
  })
  afterEach(() => {
    if (realEnv === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = realEnv
  })

  it("accepts the bearer token Vercel Cron sends", async () => {
    const res = await GET(req(`Bearer ${SECRET}`))
    expect(res.status).toBe(200)
  })

  it("refuses a request with no token", async () => {
    expect((await GET(req())).status).toBe(401)
  })

  it("refuses a wrong token", async () => {
    expect((await GET(req("Bearer wrong"))).status).toBe(401)
  })

  it("refuses when CRON_SECRET is unset rather than running unauthenticated", async () => {
    // Regression: the guard was `if (cronSecret && ...)`, so an unset secret
    // meant no auth at all and this route would delete files for anyone.
    delete process.env.CRON_SECRET
    const res = await GET(req())
    expect(res.status).toBe(503)
  })
})
