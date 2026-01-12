export default [
  // Logger & errors
  "strapi::logger",
  "strapi::errors",

  // Security (CSP)
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
            "https://cdn.fullportlabs.com",
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

  // ✅ CORS – OBAVEZNO za Supabase JWT header
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      headers: [
        "Content-Type",
        "Authorization",
        "x-supabase-token",
      ],
      credentials: true,
    },
  },

  // Ostali standardni middlewarei
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
