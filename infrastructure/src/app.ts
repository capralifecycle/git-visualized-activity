import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import { Construct, Stack, StackProps, Stage, StageProps } from "@aws-cdk/core"
import { cdkPipelines, tagResources } from "@liflig/cdk"
import { WebEdgeStack } from "./web-edge-stack"
import { WebStack } from "./web-stack"
import { WorkerStack } from "./worker-stack"

// Values from external sources.
// TODO: Dynamically resolve these so we better understand
//  their source and can automate changes.
const externalValues = {
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  vpcId: "vpc-0a67807e4aca6bb84",
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
    SourceRepo: "github/capraconsulting/git-visualized-activity",
  }))
}

applyTags(app)

class GvaApp extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props)

    applyTags(this)

    const webEdgeStack = new WebEdgeStack(this, "incub-gva-web-edge", {
      env: {
        region: "us-east-1",
      },
      stackName: "incub-gva-web-edge",
      resourcePrefix: "incub-gva",
    })

    const webStack = new WebStack(this, "incub-gva-web", {
      env: {
        region: "eu-west-1",
      },
      stackName: "incub-gva-web",
      cloudfrontCertificateArn:
        externalValues.incubatorDevAcmCertificateUsEast1Arn,
      domainName: "gva.incubator.liflig.dev",
      hostedZoneId: externalValues.incubatorDevHostedZoneId,
      webEdgeStack,
      userPoolId: externalValues.userPoolId,
      authDomain: externalValues.authDomain,
    })

    new WorkerStack(this, "incub-gva-worker", {
      env: {
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

    const artifactsBucket = s3.Bucket.fromBucketName(
      this,
      "ArtifactsBucket",
      externalValues.buildBucketName,
    )

    const pipeline = new cdkPipelines.LifligCdkPipeline(this, "Pipeline", {
      pipelineName: "incub-gva",
      sourceType: "cloud-assembly",
      artifactsBucket,
    })

    pipeline.cdkPipeline.addStage(
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
