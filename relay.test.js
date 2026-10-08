import test from "node:test";
import assert from "node:assert/strict";
import { relay } from "../src/services/relay.js";

test("relay passes successful response", () => {
  const result = {};
  const res = {
    status(code) { result.status = code; return this; },
    json(body) { result.body = body; return this; }
  };
  relay(res, { status: 200, body: { success: true } });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
});
