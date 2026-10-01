import test from "node:test";
import assert from "node:assert/strict";
import { purgeCompletedUpload } from "../../src/lib/gcs/purge-upload.mjs";
test("purge retry succeeds after deleted bytes and failed database flag update only with completed owned receipt", async () => {
  const id = "12345678-1234-1234-1234-123456789abc",
    key = `uploads/afters/owner/${id}`,
    url = `https://afters.am/api/assets/gcp?key=${encodeURIComponent(key)}`;
  let file = {
      generation: "7",
      metadata: { uploadid: id, app: "afters", route: "vibezPost" },
    },
    deletes = 0;
  const receipt = {
    app: "afters",
    route: "vibezPost",
    owner: "event:e:subject:guest",
    metadata: { eventId: "e", subject: "guest" },
    key,
    result: { key },
  };
  const options = {
    url,
    bucket: "private-bucket",
    origins: ["https://afters.am"],
    app: "afters",
    route: "vibezPost",
    store: {
      assertPrivate: async () => {},
      stat: async () => file,
      delete: async (k, g) => {
        assert.equal(g, "7");
        deletes++;
        file = null;
      },
    },
    registry: { get: async () => receipt },
  };
  assert.equal(await purgeCompletedUpload(options), true);
  assert.equal(await purgeCompletedUpload(options), true);
  assert.equal(deletes, 1);
  receipt.result = null;
  assert.equal(await purgeCompletedUpload(options), false);
  receipt.result = { key };
  receipt.owner = "event:other:subject:guest";
  assert.equal(await purgeCompletedUpload(options), false);
  assert.equal(
    await purgeCompletedUpload({
      ...options,
      url: "https://afters.am/api/assets/gcp?key=imports%2Fprovider",
    }),
    false,
  );
});
