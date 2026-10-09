import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const base = { NODE_ENV: "production", SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_ok", CORS_ORIGINS: "https://juvenstopup.pages.dev" };
const load = (env) =>
  spawnSync(process.execPath, ["--input-type=module", "-e", "const {env}=await import('./src/config/env.js');console.log(JSON.stringify(env.CORS_ORIGIN))"], {
    env: { PATH: process.env.PATH, ...env }, encoding: "utf8"
  });

test("config production valide", () => {
  const r = load(base);
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout), "https://juvenstopup.pages.dev");
});

test("refuse : CORS vide, wildcard, clé secrète, JWT service_role", () => {
  assert.notEqual(load({ ...base, CORS_ORIGINS: "" }).status, 0);
  assert.notEqual(load({ ...base, CORS_ORIGINS: "*" }).status, 0);
  assert.notEqual(load({ ...base, SUPABASE_ANON_KEY: "sb_secret_abc" }).status, 0);
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  assert.notEqual(load({ ...base, SUPABASE_ANON_KEY: `a.${payload}.b` }).status, 0);
});

test("CORS_ORIGIN (ancien nom) toujours accepté", () => {
  const r = load({ ...base, CORS_ORIGINS: "", CORS_ORIGIN: "https://juvenstopup.com/" });
  assert.equal(JSON.parse(r.stdout), "https://juvenstopup.com");
});

test("TOPUP_MIN/MAX invalides ou incohérents -> refus au démarrage", () => {
  assert.notEqual(load({ ...base, TOPUP_MAX_AMOUNT: "abc" }).status, 0);
  assert.notEqual(load({ ...base, TOPUP_MIN_AMOUNT: "100", TOPUP_MAX_AMOUNT: "10" }).status, 0);
  assert.notEqual(load({ ...base, SUPABASE_FUNCTIONS_URL: "http://x.test/functions/v1" }).status, 0);
});
