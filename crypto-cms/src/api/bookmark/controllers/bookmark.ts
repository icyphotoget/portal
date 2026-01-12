import jwt from "jsonwebtoken";

type SupabaseClaims = {
  sub: string; // supabase user id (uuid)
  email?: string;
  aud?: string;
  iss?: string;
  exp?: number;
  iat?: number;
};

function getSupabaseJwtFromRequest(ctx: any) {
  const h = ctx.request?.headers || {};
  const fromCustom = h["x-supabase-token"];
  if (typeof fromCustom === "string" && fromCustom.trim()) return fromCustom.trim();

  const auth = h["authorization"];
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }

  return null;
}

function requireSupabaseUser(ctx: any): SupabaseClaims {
  const token = getSupabaseJwtFromRequest(ctx);
  if (!token) ctx.unauthorized("Missing Supabase token");

  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) ctx.throw(500, "Missing SUPABASE_JWT_SECRET in env");

  try {
    // Supabase token koji si pokazao je HS256 (header: alg HS256)
    const claims = jwt.verify(token, secret) as SupabaseClaims;

    if (!claims?.sub) ctx.unauthorized("Invalid token (missing sub)");
    return claims;
  } catch (e: any) {
    // tipično: "jwt malformed" / "invalid signature" / "jwt expired"
    ctx.unauthorized(`Supabase JWT invalid: ${e?.message ?? "unknown"}`);
  }
}

export default {
  async ping(ctx: any) {
    ctx.body = { ok: true, msg: "bookmark routes loaded" };
  },

  async me(ctx: any) {
    const user = requireSupabaseUser(ctx);

    const items = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { supabase_user_id: user.sub } as any,
      populate: {
        article: {
          fields: ["title", "slug", "excerpt", "publishedAt"],
        },
      },
      sort: { createdAt: "desc" } as any,
    });

    ctx.body = { data: items };
  },

  async status(ctx: any) {
    const user = requireSupabaseUser(ctx);

    const articleId = Number(ctx.query?.articleId);
    if (!articleId) return ctx.badRequest("Missing articleId");

    const found = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { supabase_user_id: user.sub, article: articleId } as any,
      limit: 1,
    });

    ctx.body = { bookmarked: found.length > 0 };
  },

  async toggle(ctx: any) {
    const user = requireSupabaseUser(ctx);

    const { articleId } = ctx.request?.body || {};
    const id = Number(articleId);
    if (!id) return ctx.badRequest("Missing articleId");

    const existing = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { supabase_user_id: user.sub, article: id } as any,
      limit: 1,
    });

    if (existing.length > 0) {
      await strapi.entityService.delete("api::bookmark.bookmark", (existing[0] as any).id);
      ctx.body = { bookmarked: false };
      return;
    }

    await strapi.entityService.create("api::bookmark.bookmark", {
      data: {
        supabase_user_id: user.sub,
        article: id,
      } as any,
    });

    ctx.body = { bookmarked: true };
  },
};
