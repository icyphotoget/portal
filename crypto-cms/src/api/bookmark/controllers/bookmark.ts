export default {
  async ping(ctx: any) {
    ctx.body = { ok: true, msg: "bookmark routes loaded" };
  },

  async me(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const items = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: {
        user: { id: user.id }, // ✅ v5 typed relation filter
      },
      populate: {
        article: { fields: ["title", "slug", "excerpt", "publishedAt"] },
      },
      sort: { createdAt: "desc" },
    });

    ctx.body = { data: items };
  },

  async status(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const articleId = Number(ctx.query.articleId);
    if (!articleId) return ctx.badRequest("Missing articleId");

    const found = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: {
        user: { id: user.id },          // ✅
        article: { id: articleId },     // ✅ FIX (was: article: articleId)
      },
      limit: 1,
    });

    ctx.body = { bookmarked: found.length > 0 };
  },

  async toggle(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { articleId } = ctx.request.body || {};
    const id = Number(articleId);
    if (!id) return ctx.badRequest("Missing articleId");

    const existing = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: {
        user: { id: user.id },      // ✅
        article: { id },            // ✅ FIX (was: article: id)
      },
      limit: 1,
    });

    if (existing.length > 0) {
      await strapi.entityService.delete("api::bookmark.bookmark", (existing as any)[0].id);
      ctx.body = { bookmarked: false };
      return;
    }

    await strapi.entityService.create("api::bookmark.bookmark", {
      data: {
        user: user.id,
        article: id,
      },
    });

    ctx.body = { bookmarked: true };
  },
};
