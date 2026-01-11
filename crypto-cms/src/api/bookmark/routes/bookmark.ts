export default {
  routes: [
    // ✅ ping (no auth)
    {
      method: "GET",
      path: "/bookmarks",
      handler: "bookmark.ping",
      config: { auth: false },
    },

    // ✅ endpoints (auth enabled, no special scope)
    {
      method: "GET",
      path: "/bookmarks/status",
      handler: "bookmark.status",
      config: { auth: {} },
    },
    {
      method: "POST",
      path: "/bookmarks/toggle",
      handler: "bookmark.toggle",
      config: { auth: {} },
    },
    {
      method: "GET",
      path: "/bookmarks/me",
      handler: "bookmark.me",
      config: { auth: {} },
    },
  ],
};
