// config/middlewares.ts

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
            "https://portal-production-2544.up.railway.app",
          ],
          "media-src": [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.fullportlabs.com",
            "https://portal-production-2544.up.railway.app",
          ],
          "connect-src": [
            "'self'",
            "https://portal-production-2544.up.railway.app",
            "https://*.supabase.co",
            "wss://*.supabase.co",
          ],
        },
      },
    },
  },

  // ✅ CORS – PRODUKCIJA + LOKAL
  {
    name: "strapi::cors",
    config: {
      origin: [
        // local
        "http://localhost:3000",
        "http://127.0.0.1:3000",

        // production frontend
        "https://fullportlabs.com",
        "https://www.fullportlabs.com",
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
