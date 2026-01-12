export default {
  routes: [
    // ping
    {
      method: "GET",
      path: "/bookmarks",
      handler: "bookmark.ping",
      config: { auth: false },
    },

    // needs Supabase token (but Strapi auth off -> mi radimo provjeru u controlleru)
    {
      method: "GET",
      path: "/bookmarks/me",
      handler: "bookmark.me",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/bookmarks/status",
      handler: "bookmark.status",
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/bookmarks/toggle",
      handler: "bookmark.toggle",
      config: { auth: false },
    },
  ],
};
