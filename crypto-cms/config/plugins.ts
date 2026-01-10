export default ({ env }) => ({
  upload: {
    config: {
      provider: "aws-s3",
      providerOptions: {
        s3Options: {
          region: env("AWS_REGION"),
          credentials: {
            accessKeyId: env("AWS_ACCESS_KEY_ID"),
            secretAccessKey: env("AWS_ACCESS_SECRET"),
          },
          endpoint: env("AWS_ENDPOINT"), // opcionalno (R2/Spaces)
          forcePathStyle: env.bool("AWS_FORCE_PATH_STYLE", false), // često true za R2/minio
        },
        params: {
          Bucket: env("AWS_BUCKET"),
        },
      },
    },
  },
});
