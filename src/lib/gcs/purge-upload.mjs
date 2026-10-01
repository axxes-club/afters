import { objectKeyFromUrl } from "./core.mjs";
import { principalOwner } from "./router.mjs";
export async function purgeCompletedUpload({
  url,
  bucket,
  origins,
  app,
  route,
  store,
  registry,
}) {
  const key = objectKeyFromUrl(url, { bucket, origins });
  if (!key?.startsWith(`uploads/${app}/`)) return false;
  const id = key.split("/").at(-1);
  if (!/^[a-f0-9-]{36}$/.test(id)) return false;
  const receipt = await registry.get(id);
  if (
    !receipt ||
    receipt.app !== app ||
    receipt.route !== route ||
    receipt.key !== key ||
    receipt.result?.key !== key
  )
    return false;
  try {
    if (receipt.owner !== principalOwner(receipt.metadata)) return false;
  } catch {
    return false;
  }
  await store.assertPrivate();
  const file = await store.stat(key);
  if (!file) return true;
  if (
    file.metadata?.uploadid !== id ||
    file.metadata?.app !== app ||
    file.metadata?.route !== route
  )
    return false;
  await store.delete(key, file.generation);
  return true;
}
