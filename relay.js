import { AppError } from "../utils/errors.js";

export function relay(res, upstream) {
  const { status, body } = upstream;

  if (status >= 200 && status < 300) {
    return res.status(status).json(body ?? { success: true });
  }

  if ([400, 401, 403, 404, 409, 422, 429, 502, 503].includes(status)) {
    const safe = body && typeof body === "object" ? { ...body } : {};
    if (safe.details) delete safe.details;
    return res.status(status).json(safe);
  }

  throw new AppError(502, "UPSTREAM_REJECTED", "Upstream service rejected the request");
}
