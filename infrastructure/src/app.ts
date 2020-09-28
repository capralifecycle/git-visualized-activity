import * as codepipeline from "@aws-cdk/aws-codepipeline"
import * as codepipelineActions from "@aws-cdk/aws-codepipeline-actions"
import { BlockPublicAccess, Bucket, BucketEncryption } from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import { Construct, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { CdkPipeline } from "@aws-cdk/pipelines"
import { tagResources } from "@liflig/cdk"
import { WebEdgeStack } from "./web-edge-stack"
import { WebStack } from "./web-stack"
import { WorkerStack } from "./worker-stack"

// Values from external sources.
// TODO: Dynamically resolve these so we better understand
//  their source and can automate changes.
const externalValues = {
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  vpcId: "vpc-0a67807e4aca6bb84",
  // From buildtools setup.
  jenkinsRoleArn:
    "arn:aws:iam::923402097046:role/buildtools-jenkins-RoleJenkinsSlave-JQGYHR5WE6C5",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  buildBucketName: "incub-common-build-artifacts-001112238813-eu-west-1",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  buildEcrRepositoryArn:
    "arn:aws:ecr:eu-west-1:001112238813:repository/incub-common-builds",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  buildEcrRepositoryName: "incub-common-builds",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  lifligIoAcmCertifcateUsEast1Arn:
    "arn:aws:acm:us-east-1:001112238813:certificate/33ea50d8-da2b-4751-8da6-c8ff67abfba0",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  incubatorDevAcmCertificateUsEast1Arn:
    "arn:aws:acm:us-east-1:001112238813:certificate/6a82ce2d-fbe7-418a-8b8a-06e609b8d61d",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  incubatorDevHostedZoneId: "Z07028931BZD2FT5LUHHH",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  userPoolId: "eu-west-1_oGQHzXmbo",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  authDomain: "cognito.incubator.liflig.dev",
}

const incubatorAccountId = "001112238813"

const app = new cdk.App()

function applyTags(scope: Construct) {
  tagResources(scope, (stack) => ({
    StackName: stack.stackName,
    Project: "git-visualized-activity",
    SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
  }))
}

applyTags(app)

class GvaApp extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)

    applyTags(this)

    const webEdgeStack = new WebEdgeStack(this, "incub-gva-web-edge", {
      env: {
        account: incubatorAccountId,
        region: "us-east-1",
      },
      stackName: "incub-gva-web-edge",
      resourcePrefix: "incub-gva",
    })

    const webStack = new WebStack(this, `incub-gva-web`, {
      env: {
        account: incubatorAccountId,
        region: "eu-west-1",
      },
      stackName: "incub-gva-web",
      buildsBucketName: externalValues.buildBucketName,
      cloudfrontCertificateArn:
        externalValues.incubatorDevAcmCertificateUsEast1Arn,
      domainName: "gva.incubator.liflig.dev",
      hostedZoneId: externalValues.incubatorDevHostedZoneId,
      jenkinsRoleArn: externalValues.jenkinsRoleArn,
      resourcePrefix: "incub-gva",
      webEdgeStack,
      userPoolId: externalValues.userPoolId,
      authDomain: externalValues.authDomain,
    })

    new WorkerStack(this, `incub-gva-worker`, {
      env: {
        account: incubatorAccountId,
        region: "eu-west-1",
      },
      stackName: "incub-gva-worker",
      resourcePrefix: "incub-gva",
      vpcId: externalValues.vpcId,
      webStack,
    })
  }
}

class GvaPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props)

    const cloudAssemblyArtifact = new codepipeline.Artifact()

    const buildBucket = new Bucket(this, "BuildBucket", {
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(10),
        },
      ],
    })

    new cdk.CfnOutput(this, "BuildBucketName", {
      value: buildBucket.bucketName,
    })

    const codePipeline = new codepipeline.Pipeline(this, "CodePipeline", {
      stages: [
        {
          stageName: "Source",
          actions: [
            new codepipelineActions.S3SourceAction({
              actionName: "source",
              output: cloudAssemblyArtifact,
              bucket: buildBucket,
              bucketKey: "cloud-assembly-incubator.zip",
            }),
          ],
        },
      ],
      restartExecutionOnUpdate: true,
    })

    const cdkPipeline = new CdkPipeline(this, "CdkPipeline", {
      cloudAssemblyArtifact,
      codePipeline,
    })

    cdkPipeline.addApplicationStage(
      new GvaApp(this, "Incubator", {
        env: {
          account: incubatorAccountId,
          region: "eu-west-1",
        },
      }),
    )
  }
}

new GvaPipelineStack(app, "incub-gva-pipeline", {
  env: {
    account: incubatorAccountId,
    region: "eu-west-1",
  },
})
