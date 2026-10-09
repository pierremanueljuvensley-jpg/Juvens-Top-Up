import { AppError } from "../utils/errors.js";
import { getUser } from "../services/supabase.js";

// Authentification réelle : le JWT est validé par Supabase Auth (signature, expiration, utilisateur existant).
// Le token est ensuite transmis tel quel aux Edge Functions / RPC, qui appliquent RLS et autorisation admin.
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();

    if (!token || token.length > 4096) {
      throw new AppError(401, "AUTH_REQUIRED", "Authentication required");
    }

    const user = await getUser(token);
    if (!user) throw new AppError(401, "INVALID_TOKEN", "Invalid or expired token");

    req.accessToken = token;
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
