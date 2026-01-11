"use strict";

module.exports = {
  routes: [
    {
      method: "GET",
      path: "/bookmarks/status",
      handler: "bookmark.status",
      config: { auth: true }
    },
    {
      method: "POST",
      path: "/bookmarks/toggle",
      handler: "bookmark.toggle",
      config: { auth: true }
    },
    {
      method: "GET",
      path: "/bookmarks/me",
      handler: "bookmark.me",
      config: { auth: true }
    }
  ]
};
