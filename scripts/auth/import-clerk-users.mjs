#!/usr/bin/env node
/**
 * Move every Clerk user into afters' own sign-in tables (auth_user, auth_account).
 *
 *   CLERK_SECRET_KEY=… DATABASE_URL=… node scripts/auth/import-clerk-users.mjs           # dry run
 *   CLERK_SECRET_KEY=… DATABASE_URL=… node scripts/auth/import-clerk-users.mjs --apply   # write
 *
 * - Ids are kept (`user_…`), so every afters row that points at a person still does.
 * - Clerk's API does not return password hashes. A person who had a password gets
 *   `clerk:<id>` as theirs; their first password sign-in checks it with Clerk once
 *   and stores afters' own hash (src/lib/auth/clerk-bridge.ts). Everyone can also
 *   sign in with an email code or "Continue with AXXES" from day one.
 * - If a Clerk CSV export is given (--hashes export.csv), its bcrypt hashes are
 *   used instead, and nobody needs Clerk again.
 * - Idempotent: people already in auth_user are left alone (use --hashes again to
 *   upgrade `clerk:` passwords to real hashes).
 * - Duplicate accounts listed in MERGES are folded into the real one first.
 * - Runs in one transaction; requires scripts/auth/001-auth-tables.sql first.
 */
import { readFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import pg from "pg"

const APPLY = process.argv.includes("--apply")
const hashesArg = process.argv.indexOf("--hashes")
const HASHES_FILE = hashesArg > -1 ? process.argv[hashesArg + 1] : null

/**
 * Decided by the owner on 2026-10-08: the afters superadmin is Jose Viscasillas,
 * viscasillas@me.com / +1 910-550-5068. His Clerk account (phone sign-in, no
 * password) carried hello@axxes.club (unverified) and jose.viscasillas@gmail.com.
 * Moving it to viscasillas@me.com lets "Continue with AXXES" land on it, because
 * that is his verified AXXES email.
 */
const OVERRIDES = {
  user_3937VFzDBVzBI9ENna3ix2V15om: { email: "viscasillas@me.com", emailVerified: true, phoneNumber: "+19105505068" },
}

/**
 * Duplicate accounts folded into the real one before anything is moved.
 * 2026-10-08: once viscasillas@me.com was verified on AXXES, "Continue with
 * AXXES" (still on Clerk) found no afters account with that email and made a
 * new, non-admin one (user_3KPt…), where a draft event was then created. Its
 * events go to the owner's organizer profile and the empty duplicate is removed.
 * If anything else is attached to it, the run stops instead of deleting it.
 */
const MERGES = {
  user_3KPtpSbWuHm3ymdsCXIPUcN8rU7: "user_3937VFzDBVzBI9ENna3ix2V15om",
}

/** Rows that belong to an organizer profile and simply move with it. */
const PROFILE_CHILDREN = [
  ["Event", "organizerId"],
  ["EventSeries", "organizerId"],
  ["StaffInvite", "organizerProfileId"],
  ["StaffMember", "organizerProfileId"],
  ["Subscription", "organizerProfileId"],
]

/** Tables pointing at "User"(id), checked to be empty before the duplicate is removed. */
const USER_TABLES = [
  "ApiKey", "ArtistProfile", "NotificationPreference", "OAuthAccessToken", "OAuthApp",
  "OAuthAuthorizationCode", "OAuthConnection", "Order", "OrganizerProfile", "PersonalProfile",
  "PushSubscription", "SavedEvent", "StaffMember", "Ticket", "UserActivity", "VibezPost",
]

async function merge(db, fromId, intoId) {
  const from = await db.query(`SELECT id FROM "User" WHERE id = $1`, [fromId])
  if (!from.rowCount) return
  const fromProfile = (await db.query(`SELECT id FROM "OrganizerProfile" WHERE "userId" = $1`, [fromId])).rows[0]
  const intoProfile = (await db.query(`SELECT id FROM "OrganizerProfile" WHERE "userId" = $1`, [intoId])).rows[0]
  if (fromProfile) {
    if (!intoProfile) throw new Error(`merge ${fromId}: target ${intoId} has no organizer profile`)
    for (const [table, column] of PROFILE_CHILDREN) {
      const r = await db.query(`UPDATE "${table}" SET "${column}" = $1 WHERE "${column}" = $2`, [intoProfile.id, fromProfile.id])
      if (r.rowCount) console.log(`merge ${fromId}: moved ${r.rowCount} ${table} row(s) to ${intoId}`)
    }
    await db.query(`DELETE FROM "OrganizerProfile" WHERE id = $1`, [fromProfile.id])
  }
  // UserActivity is a log of the duplicate's own visits; it goes with it.
  await db.query(`DELETE FROM "UserActivity" WHERE "userId" = $1`, [fromId])
  for (const table of USER_TABLES) {
    const left = await db.query(`SELECT count(*)::int AS n FROM "${table}" WHERE "userId" = $1`, [fromId])
    if (left.rows[0].n) throw new Error(`merge ${fromId}: ${left.rows[0].n} ${table} row(s) still attached; nothing was changed`)
  }
  await db.query(`DELETE FROM "User" WHERE id = $1`, [fromId])
  console.log(`merge ${fromId}: folded into ${intoId}`)
}

const key = process.env.CLERK_SECRET_KEY
if (!key) throw new Error("CLERK_SECRET_KEY is required")
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")

async function clerkUsers() {
  const all = []
  for (let offset = 0; ; offset += 100) {
    const res = await fetch(`https://api.clerk.com/v1/users?limit=100&offset=${offset}&order_by=created_at`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) throw new Error(`Clerk list failed: ${res.status}`)
    const page = await res.json()
    all.push(...page)
    if (page.length < 100) return all
  }
}

/** Clerk CSV export: id, …, password_digest, password_hasher. Only bcrypt is accepted. */
function hashesFromExport(file) {
  if (!file) return new Map()
  const [header, ...rows] = readFileSync(file, "utf8").trim().split(/\r?\n/)
  const cols = header.split(",")
  const id = cols.indexOf("id")
  const digest = cols.indexOf("password_digest")
  const hasher = cols.indexOf("password_hasher")
  const map = new Map()
  for (const row of rows) {
    const cells = row.split(",")
    if (cells[hasher] === "bcrypt" && /^\$2[aby]\$/.test(cells[digest] ?? "")) map.set(cells[id], cells[digest])
  }
  return map
}

const users = await clerkUsers()
const hashes = hashesFromExport(HASHES_FILE)

const plan = users.map((u) => {
  const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id) ?? u.email_addresses[0]
  const phone = u.phone_numbers.find((p) => p.id === u.primary_phone_number_id) ?? u.phone_numbers[0]
  const o = OVERRIDES[u.id] ?? {}
  return {
    id: u.id,
    email: (o.email ?? primary?.email_address ?? "").toLowerCase(),
    emailVerified: o.emailVerified ?? primary?.verification?.status === "verified",
    name: [u.first_name, u.last_name].filter(Boolean).join(" ") || (primary?.email_address ?? "").split("@")[0],
    image: u.has_image ? u.image_url : null,
    phoneNumber: o.phoneNumber ?? phone?.phone_number ?? null,
    banned: Boolean(u.banned),
    password: u.password_enabled ? (hashes.get(u.id) ?? `clerk:${u.id}`) : null,
    createdAt: new Date(u.created_at),
  }
})

const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
await db.connect()
try {
  await db.query("BEGIN")
  for (const [fromId, intoId] of Object.entries(MERGES)) await merge(db, fromId, intoId)

  let created = 0
  let upgraded = 0
  for (const p of plan) {
    if (MERGES[p.id]) {
      console.log(`skip ${p.id}: merged into ${MERGES[p.id]}`)
      continue
    }
    if (!p.email) {
      console.log(`skip ${p.id}: no email`)
      continue
    }
    const exists = await db.query(`SELECT id FROM auth_user WHERE id = $1 OR email = $2`, [p.id, p.email])
    if (exists.rowCount) {
      // Already moved. Only a real bcrypt hash may replace a pending `clerk:` password.
      if (p.password?.startsWith("$2")) {
        const r = await db.query(
          `UPDATE auth_account SET password = $1, "updatedAt" = now() WHERE "userId" = $2 AND "providerId" = 'credential' AND password LIKE 'clerk:%'`,
          [p.password, p.id]
        )
        upgraded += r.rowCount
      }
      continue
    }
    await db.query(
      `INSERT INTO auth_user (id, name, email, "emailVerified", image, "phoneNumber", banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
      [p.id, p.name, p.email, p.emailVerified, p.image, p.phoneNumber, p.banned, p.createdAt]
    )
    if (p.password) {
      await db.query(
        `INSERT INTO auth_account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
        [`acc_${randomBytes(12).toString("hex")}`, p.id, p.password]
      )
    }
    created++
    console.log(
      `${APPLY ? "moved" : "would move"} ${p.id}  verified:${p.emailVerified}  password:${p.password ? (p.password.startsWith("clerk:") ? "via-clerk" : "bcrypt") : "none"}${p.banned ? "  BANNED" : ""}`
    )
  }

  // The afters profile follows the owner's email change.
  for (const [id, o] of Object.entries(OVERRIDES)) {
    const r = await db.query(`UPDATE "User" SET email = $1, "updatedAt" = now() WHERE id = $2 AND email <> $1`, [o.email, id])
    if (r.rowCount) console.log(`${APPLY ? "set" : "would set"} User ${id} email to the owner's`)
  }

  console.log(`\n${created} to move, ${upgraded} passwords upgraded, ${plan.length} Clerk users in total.`)
  await db.query(APPLY ? "COMMIT" : "ROLLBACK")
  console.log(APPLY ? "Committed." : "Dry run: rolled back. Re-run with --apply to write.")
} catch (error) {
  await db.query("ROLLBACK")
  throw error
} finally {
  await db.end()
}
