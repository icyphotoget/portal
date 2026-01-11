"use strict";

module.exports = {
  async me(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Return bookmarks + article basic fields
    const items = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { user: user.id },
      populate: {
        article: {
          fields: ["title", "slug", "excerpt", "publishedAt"]
        }
      },
      sort: { createdAt: "desc" }
    });

    ctx.body = { data: items };
  },

  async status(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const articleId = Number(ctx.query.articleId);
    if (!articleId) return ctx.badRequest("Missing articleId");

    const found = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { user: user.id, article: articleId },
      limit: 1
    });

    ctx.body = { bookmarked: found.length > 0 };
  },

  async toggle(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { articleId } = ctx.request.body || {};
    const id = Number(articleId);
    if (!id) return ctx.badRequest("Missing articleId");

    // check existing
    const existing = await strapi.entityService.findMany("api::bookmark.bookmark", {
      filters: { user: user.id, article: id },
      limit: 1
    });

    if (existing.length > 0) {
      // delete
      await strapi.entityService.delete("api::bookmark.bookmark", existing[0].id);
      ctx.body = { bookmarked: false };
      return;
    }

    // create
    await strapi.entityService.create("api::bookmark.bookmark", {
      data: {
        user: user.id,
        article: id
      }
    });

    ctx.body = { bookmarked: true };
  }
};
