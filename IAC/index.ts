import * as aws from "@pulumi/aws";
import { config } from "dotenv";
config();

// Create an S3 bucket
const bucket = new aws.s3.Bucket(process.env.BUCKET_NAME!, {
  forceDestroy: true,
});

// Bucket policy for full public access (NOT recommended for production)
const publicPolicy = new aws.s3.BucketPolicy("public-bucket-policy", {
  bucket: bucket.id,
  policy: bucket.id.apply((bucketName) =>
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:*",
          Resource: [
            `arn:aws:s3:::${bucketName}`,
            `arn:aws:s3:::${bucketName}/*`,
          ],
        },
      ],
    })
  ),
});

// Export bucket details
export const bucketName = bucket.bucket;
export const bucketArn = bucket.arn;
export const bucketWebsiteUrl = bucket.websiteEndpoint;
