// Browser-safe containment; this client module must not import Node server adapters.
function safeKey(key) {
  if (
    typeof key !== "string" ||
    key.length > 1024 ||
    /[\\%\x00-\x1f\x7f]/.test(key) ||
    !key
      .split("/")
      .every(
        (p) => p && p !== "." && p !== ".." && /^[A-Za-z0-9._ -]+$/.test(p),
      ) ||
    (!key.startsWith("uploads/") && !key.startsWith("imports/"))
  )
    throw Error("Invalid object key");
  return key;
}
const origins = new Set([
  "https://afters.am",
  "https://afters.xxx",
  "https://afters.axxes.club",
  "https://vbz.axxes.club",
]);
export function localProxyUrl(raw) {
  try {
    const url = new URL(raw);
    if (
      !origins.has(url.origin) ||
      url.username ||
      url.password ||
      url.pathname != "/api/assets/gcp"
    )
      return raw;
    const key = safeKey(url.searchParams.get("key"));
    return `/api/assets/gcp?${new URLSearchParams({ key })}`;
  } catch {
    return raw;
  }
}
