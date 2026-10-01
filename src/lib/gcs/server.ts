import { verifyCompletedUpload } from "./owned-upload.mjs";
import { principalOwner } from "./router.mjs";
import { ourFileRouter } from "@/lib/uploadthing";
import { PrismaRegistry } from "./prisma-registry.mjs";
import { prisma } from "@/lib/prisma";
import { Adapter, StorageError, safeKey, objectKeyFromUrl } from "./core.mjs";
import { GoogleStore } from "./google-store.mjs";
import { compileRouter } from "./router.mjs";
import { policies } from "./policies.mjs";
import { handlers } from "./http-server.mjs";
import { loadAliases } from "./aliases.mjs";
import { authorizeAssetRead } from "./permissions";
const bucket =
  process.env.GCS_ASSETS_BUCKET || "gravy-meta-axxes-production-assets";
const baseUrl = (
  process.env.GCS_ASSETS_PUBLIC_ORIGIN || "https://afters.am"
).replace(/\/$/, "");
const origins = Array.from(
  new Set([
    baseUrl,
    ...(process.env.GCS_ASSETS_ALLOWED_ORIGINS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  ]),
);
const aliases = loadAliases({
  bucket,
  manifestObject: process.env.GCS_ALIAS_MANIFEST_OBJECT,
  progressObject: process.env.GCS_COPY_PROGRESS_OBJECT,
});
export function storageEnabled() {
  return process.env.GCS_STORAGE_ENABLED === "true";
}
let instance: Adapter | undefined;
export function storageAdapter() {
  if (!instance) {
    const routePolicies = policies.afters;
    const routes = compileRouter(
      ourFileRouter,
      Object.fromEntries(
        Object.entries(routePolicies).map(([key, value]) => [
          key,
          value.visibility,
        ]),
      ),
    );
    instance = new Adapter({
      app: "afters",
      bucket,
      baseUrl,
      origins,
      routes,
      store: new GoogleStore({ bucket }),
      registry: new PrismaRegistry(prisma),
    });
  }
  return instance;
}
export async function keyForUrl(url: string) {
  const local = objectKeyFromUrl(url, { bucket, origins });
  if (local?.startsWith("uploads/")) return local;
  const state = await aliases();
  return objectKeyFromUrl(url, {
    bucket,
    origins,
    aliases: state.aliases,
    verifiedKeys: state.verifiedKeys,
  });
}
export function stableAssetUrl(key: string) {
  return baseUrl + "/api/assets/gcp?key=" + encodeURIComponent(safeKey(key));
}
export async function originalAssetUrls(key: string) {
  return key.startsWith("imports/")
    ? ((await aliases()).reverse[key] ?? [])
    : [];
}
export function storageHandlers() {
  const adapter = storageAdapter();
  return handlers(adapter, {
    resolveKey: async (request: Request) => {
      const url = new URL(request.url);
      const raw = url.searchParams.get("key");
      if (raw) {
        const key = safeKey(raw);
        if (
          key.startsWith("imports/") &&
          !(await aliases()).verifiedKeys.has(key)
        )
          throw new StorageError("Asset has not been verified", 404);
        return key;
      }
      const source = url.searchParams.get("source");
      const key = source ? await keyForUrl(source) : null;
      if (!key) throw new StorageError("Unknown asset", 404);
      return key;
    },
    authorizeRead: async (request: Request | null, key: string, file: import("./contracts.mjs").StoredFile) => {
      const id = file.metadata?.uploadId ?? file.metadata?.uploadid;
      const record = id ? await adapter.registry.get(id) : null;
      return authorizeAssetRead(request, {
        key,
        record,
        urls: [stableAssetUrl(key), ...(await originalAssetUrls(key))],
      });
    },
    authorizeDelete: async () => false,
  });
}
// Internal calls only: callers must authenticate and select DB-unreferenced URLs first.
// No public DELETE route is exposed.
export async function deleteStoredUrls(urls: string[]) {
  if (!storageEnabled()) return 0;
  const adapter = storageAdapter();
  let deleted = 0;
  for (const url of urls) {
    const key = await keyForUrl(url);
    if (!key || key.startsWith("imports/")) continue;
    if (await adapter.remove(null, key, async () => true)) deleted++;
  }
  return deleted;
}

export async function isOwnedStoredUpload(
  url: string,
  route: string,
  metadata: Record<string, unknown>,
) {
  let owner: string;
  try {
    owner = principalOwner(metadata);
  } catch {
    return false;
  }
  const adapter = storageAdapter();
  return verifyCompletedUpload({
    url,
    bucket,
    origins,
    app: "afters",
    owner,
    route,
    store: adapter.store,
    registry: adapter.registry,
  });
}

// Authenticated retention job only. A durable receipt proves a missing object
// was this app's completed Vibez upload, so DB-flag retries can finish safely.
export async function purgeVibezUpload(url: string) {
  if (!storageEnabled()) return false;
  const { purgeCompletedUpload } = await import("./purge-upload.mjs");
  const adapter = storageAdapter();
  return purgeCompletedUpload({
    url,
    bucket,
    origins,
    app: "afters",
    route: "vibezPost",
    store: adapter.store,
    registry: adapter.registry,
  });
}
