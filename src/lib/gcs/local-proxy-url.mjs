import { safeKey } from "./core.mjs";
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
