import * as cdk from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as aws_cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as aws_cloudfront_origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as aws_s3 from "aws-cdk-lib/aws-s3";
import * as aws_s3_deployment from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import path = require("node:path");

export class AppSyncEventsChatStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Events Api
    const eventsApi = new appsync.EventApi(this, "EventsApi", {
      apiName: "EventsChat",
    });
    eventsApi.addChannelNamespace("chat");

    // S3 Bucket
    const clientBucket = new aws_s3.Bucket(this, "ClientBucket", {
      accessControl: aws_s3.BucketAccessControl.PRIVATE,
    });
    new aws_s3_deployment.BucketDeployment(this, "clientDeployment", {
      destinationBucket: clientBucket,
      sources: [
        aws_s3_deployment.Source.asset(
          path.resolve(__dirname, "..", "..", "client", "dist")
        ),
      ],
    });

    // CloudFront Distribution
    new aws_cloudfront.Distribution(this, "Distribution", {
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin:
          aws_cloudfront_origins.S3BucketOrigin.withOriginAccessControl(
            clientBucket
          ),
      },
    });
  }
}
