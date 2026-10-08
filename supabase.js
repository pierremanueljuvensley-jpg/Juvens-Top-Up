import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

function headers(token) {
  const h = { Accept: "application/json", "Content-Type": "application/json" };
  if (env.SUPABASE_ANON_KEY) h.apikey = env.SUPABASE_ANON_KEY;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.UPSTREAM_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }
    return { response, body };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AppError(504, "UPSTREAM_TIMEOUT", "Supabase request timed out");
    }
    throw new AppError(502, "SUPABASE_UNREACHABLE", "Supabase is unreachable");
  } finally {
    clearTimeout(timer);
  }
}

export async function callFunction(name, { token, method = "POST", body } = {}) {
  const base = env.SUPABASE_FUNCTIONS_URL.replace(/\/$/, "");
  const { response, body: data } = await request(`${base}/${name}`, {
    method,
    headers: headers(token),
    ...(method === "GET" ? {} : { body: JSON.stringify(body ?? {}) })
  });
  return { status: response.status, ok: response.ok, body: data };
}

export async function callRpc(name, { token, params = {} } = {}) {
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/${name}`;
  const { response, body } = await request(url, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify(params)
  });
  return { status: response.status, ok: response.ok, body };
}

export async function ping() {
  const { response } = await request(
    `${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/health`,
    { method: "GET", headers: headers() }
  );
  return response.ok;
}
