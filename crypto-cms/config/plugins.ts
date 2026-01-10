// crypto-cms/config/plugins.ts

export default ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",

      providerOptions: {
        // Strapi v5: S3 config mora biti u s3Options
        s3Options: {
          endpoint: env("AWS_ENDPOINT"), // https://<accountid>.r2.cloudflarestorage.com
          region: env("AWS_REGION", "auto"),
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_SECRET_ACCESS_KEY"),
          },
        },

        // ✅ OVDE mora biti (ne u s3Options)
        forcePathStyle: true,

        // ✅ KRITIČNO – javni URL za slike (Cloudflare CDN)
        // npr: https://cdn.fullportlabs.com
        baseUrl: env("R2_PUBLIC_URL"),

        // Bucket + ACL
        params: {
          Bucket: env("AWS_BUCKET"),
          ACL: "public-read",
        },
      },
    },
  },
});
