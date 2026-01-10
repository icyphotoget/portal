export default [
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "img-src": [
            "'self'",
            "data:",
            "blob:",
            "https://*.r2.cloudflarestorage.com",
            // ako kasnije koristiš custom CDN domen:
            // "https://cdn.tvojdomain.com",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https://*.r2.cloudflarestorage.com",
          ],
        },
      },
    },
  },
  "strapi::cors",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
