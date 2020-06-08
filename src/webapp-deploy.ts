import * as iam from "@aws-cdk/aws-iam"
import * as lambda from "@aws-cdk/aws-lambda"
import * as s3 from "@aws-cdk/aws-s3"
import * as ssm from "@aws-cdk/aws-ssm"
import * as cdk from "@aws-cdk/core"

/**
 * Resources to deploy a webapp from a build artifact into an existing
 * S3 Bucket and CloudFront Distribution.
 *
 * Uses the setup described at https://github.com/capraconsulting/webapp-deploy-lambda.
 * See the link for more details.
 */
export class WebappDeploy extends cdk.Construct {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      callerRoleArn: string
      roleName: string
      buildsBucketName: string
      webBucketName: string
      resourcePrefix: string
      distributionId: string
    },
  ) {
    super(scope, id)

    // See https://github.com/capraconsulting/webapp-deploy-lambda
    // TODO: Keep this up-to-date somehow. We can probably use
    //  Renovate regex manager with github-releases datasource.
    const deployCodeS3Bucket = "capra-webapp-deploy-lambda-releases"
    const deployCodeS3Key = "release-0.2.2.zip"

    const roleToBeAssumed = new iam.Role(this, "Role", {
      assumedBy: new iam.ArnPrincipal(props.callerRoleArn),
      roleName: props.roleName,
    })

    const buildsBucket = s3.Bucket.fromBucketName(
      this,
      "BuildsBucket",
      props.buildsBucketName,
    )
    const webBucket = s3.Bucket.fromBucketName(
      this,
      "WebBucket",
      props.webBucketName,
    )
    const codeBucket = s3.Bucket.fromBucketName(
      this,
      "CodeBucket",
      deployCodeS3Bucket,
    )

    const deployFunction = new lambda.Function(this, "DeployFunction", {
      code: lambda.Code.fromBucket(codeBucket, deployCodeS3Key),
      environment: {
        TARGET_BUCKET_URL: `s3://${webBucket.bucketName}/web`,
        DEPLOY_LOG_BUCKET_URL: `s3://${webBucket.bucketName}/deployments.log`,
        CF_DISTRIBUTION_ID: props.distributionId,
      },
      functionName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      handler: "webapp_deploy.main.handler",
      reservedConcurrentExecutions: 1,
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: cdk.Duration.minutes(2),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["s3:HeadObject", "s3:GetObject"],
          resources: [buildsBucket.arnForObjects("*")],
        }),
        new iam.PolicyStatement({
          actions: ["s3:PutObject", "s3:DeleteObject"],
          resources: [webBucket.arnForObjects("web/*")],
        }),
        new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3WebDeployStack:PutObject"],
          resources: [webBucket.arnForObjects("deployments.log")],
        }),
        new iam.PolicyStatement({
          actions: ["cloudfront:CreateInvalidation"],
          // Cannot be restricted
          resources: ["*"],
        }),
      ],
    })

    const functionName = new ssm.StringParameter(this, "FunctionName", {
      parameterName: `/${props.resourcePrefix}/deploy-fn-name`,
      stringValue: deployFunction.functionName,
    })

    functionName.grantRead(roleToBeAssumed)
    deployFunction.grantInvoke(roleToBeAssumed)
  }
}
