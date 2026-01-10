// crypto-cms/config/plugins.ts

export default ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        // Strapi v5 očekuje da je S3 config unutar s3Options
        s3Options: {
          endpoint: env("AWS_ENDPOINT"), // npr. https://...r2.cloudflarestorage.com
          region: env("AWS_REGION", "auto"), // za R2 je "auto" ok
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_SECRET_ACCESS_KEY"),
          },

          // R2 radi najstabilnije s path-style
          forcePathStyle: true,
        },

        // Bucket + ACL
        params: {
          Bucket: env("AWS_BUCKET"),
          ACL: "public-read",
        },
      },
    },
  },
});
