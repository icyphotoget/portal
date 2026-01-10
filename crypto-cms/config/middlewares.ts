// crypto-cms/config/middlewares.ts

export default [
  "strapi::logger",
  "strapi::errors",

  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://*.r2.cloudflarestorage.com",
            "https://cdn.fullportlabs.com", // 👈 TVOJ CDN
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.fullportlabs.com",
          ],
        },
      },
    },
  },

  "strapi::cors",
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
