export default ({ env }) => ({
  upload: {
    config: {
      provider: '@strapi/provider-upload-aws-s3',
      providerOptions: {
        s3Options: {
          region: 'auto',
          endpoint: env('R2_ENDPOINT'),
          credentials: {
            accessKeyId: env('R2_ACCESS_KEY_ID'),
            secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
          },
        },
        params: {
          Bucket: env('R2_BUCKET'),
        },
      },
    },
  },
});
