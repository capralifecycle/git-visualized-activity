import * as iam from "@aws-cdk/aws-iam"
import * as ssm from "@aws-cdk/aws-ssm"
import * as lambda from "@aws-cdk/aws-lambda"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import { WebStack } from "./web"

export class WebDeployStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      assumedJenkinsRole: iam.Role
      webStack: WebStack
      deployCodeS3Bucket: string
      deployCodeS3Key: string
      releasesBucket: s3.Bucket
      targetBucket: s3.Bucket
      resourcePrefix: string
    },
  ) {
    super(scope, id, props)

    const codeBucket = s3.Bucket.fromBucketName(
      this,
      "CodeBucket",
      props.deployCodeS3Bucket,
    )

    const deployFunction = new lambda.Function(this, "DeployFunction", {
      code: lambda.Code.fromBucket(codeBucket, props.deployCodeS3Key),
      environment: {
        TARGET_BUCKET_URL: `s3://${props.targetBucket.bucketName}/web`,
        DEPLOY_LOG_BUCKET_URL: `s3://${props.targetBucket.bucketName}/deployments.log`,
        CF_DISTRIBUTION_ID: props.webStack.distribution.distributionId,
      },
      handler: "webapp_deploy.main.handler",
      reservedConcurrentExecutions: 1,
      runtime: lambda.Runtime.PYTHON_3_7,
      timeout: cdk.Duration.minutes(2),
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ["s3:HeadObject", "s3:GetObject"],
          resources: [props.releasesBucket.arnForObjects("*")],
        }),
        new iam.PolicyStatement({
          actions: ["s3:PutObject", "s3:DeleteObject"],
          resources: [props.targetBucket.arnForObjects("web/*")],
        }),
        new iam.PolicyStatement({
          actions: ["s3:GetObject", "s3WebDeployStack:PutObject"],
          resources: [props.targetBucket.arnForObjects("deployments.log")],
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

    functionName.grantRead(props.assumedJenkinsRole)
    deployFunction.grantInvoke(props.assumedJenkinsRole)
  }
}
