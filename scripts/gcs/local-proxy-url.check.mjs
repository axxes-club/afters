import test from "node:test";
import assert from "node:assert/strict";
import { localProxyUrl } from "../../src/lib/gcs/local-proxy-url.mjs";
test("private Afters image aliases use viewer origin without rewriting foreign URLs", () => {
  const key = "uploads/afters/owner/image";
  assert.equal(
    localProxyUrl(`https://afters.am/api/assets/gcp?key=${key}`),
    `/api/assets/gcp?key=${encodeURIComponent(key)}`,
  );
  assert.equal(
    localProxyUrl(`https://afters.xxx/api/assets/gcp?key=${key}`),
    `/api/assets/gcp?key=${encodeURIComponent(key)}`,
  );
  for (const url of [
    `https://foreign.example/api/assets/gcp?key=${key}`,
    `https://afters.am.evil.example/api/assets/gcp?key=${key}`,
    "https://afters.am/api/assets/gcp?key=uploads/afters/../other",
  ])
    assert.equal(localProxyUrl(url), url);
});
