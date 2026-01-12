import type { Core } from "@strapi/strapi";
import { createRemoteJWKSet, jwtVerify } from "jose";

type SupabasePayload = {
  sub?: string; // user id
  email?: string;
  role?: string;
  aud?: string | string[];
};

function getBearer(ctx: any) {
  const h = ctx.request?.header?.authorization || ctx.request?.headers?.authorization;
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

const jwkCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export default (config: any, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: any, next: any) => {
    const token = getBearer(ctx);
    if (!token) return ctx.unauthorized("Missing Bearer token");

    const supabaseUrl = process.env.SUPABASE_URL;
    const legacySecret = process.env.SUPABASE_JWT_SECRET; // opcionalno (HS256 legacy)

    try {
      let payload: SupabasePayload | null = null;

      // ✅ Prefer JWKS (novo) – radi s P-256 keyevima
      if (supabaseUrl) {
        const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", supabaseUrl);
        const jwks = jwkCache.get(jwksUrl.toString()) ?? createRemoteJWKSet(jwksUrl);
        jwkCache.set(jwksUrl.toString(), jwks);

        const res = await jwtVerify(token, jwks, {
          // Supabase izdaje aud=authenticated najčešće, ali varira; ne forsiramo
          issuer: undefined,
          audience: undefined,
        });

        payload = res.payload as SupabasePayload;
      } else if (legacySecret) {
        // ⚠️ fallback HS256 (ako baš nemaš SUPABASE_URL)
        // jose hoće KeyLike; za HS256 može string kao Uint8Array
        const key = new TextEncoder().encode(legacySecret);
        const res = await jwtVerify(token, key);
        payload = res.payload as SupabasePayload;
      } else {
        return ctx.unauthorized("Missing SUPABASE_URL (recommended) or SUPABASE_JWT_SECRET");
      }

      const sub = payload?.sub;
      if (!sub) return ctx.unauthorized("Invalid Supabase token (missing sub)");

      // spremi user info u ctx.state
      ctx.state.supabase = {
        userId: sub,
        email: payload?.email ?? null,
        raw: payload,
      };

      return await next();
    } catch (e: any) {
      strapi.log.warn(`[supabase-auth] token verify failed: ${e?.message ?? e}`);
      return ctx.unauthorized("Invalid token");
    }
  };
};
