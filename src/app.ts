import * as cdk from "@aws-cdk/core"
import { EcsUpdateImageArtifactStatus, tagResources } from "@liflig/cdk"
import { WebDeployStack } from "./web-deploy-stack"
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
}

const incubatorAccountId = "001112238813"

const app = new cdk.App()
tagResources(app, (stack) => ({
  StackName: stack.stackName,
  Project: "git-visualized-activity",
  SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
}))

const webEdgeStack = new WebEdgeStack(app, "incub-gva-web-edge", {
  env: {
    account: incubatorAccountId,
    region: "us-east-1",
  },
  resourcePrefix: "incub-gva",
})

const webStack = new WebStack(app, `incub-gva-web`, {
  env: {
    account: incubatorAccountId,
    region: "eu-west-1",
  },
  localEndpoint: {
    domainName: "gva.incubator.liflig.dev",
    acmCertificateArn: externalValues.incubatorDevAcmCertificateUsEast1Arn,
    hostedZoneId: externalValues.incubatorDevHostedZoneId,
  },
  externalEndpoint: {
    domainName: "gva.liflig.io",
    acmCertificateArn: externalValues.lifligIoAcmCertifcateUsEast1Arn,
  },
  resourcePrefix: "incub-gva",
  webEdgeStack,
})

new WebDeployStack(app, `incub-gva-web-deploy`, {
  env: {
    account: incubatorAccountId,
    region: "eu-west-1",
  },
  callerRoleArn: externalValues.jenkinsRoleArn,
  roleName: "incub-gva-jenkins",
  webStack,
  buildsBucketName: externalValues.buildBucketName,
  resourcePrefix: "incub-gva",
})

new WorkerStack(app, `incub-gva-worker`, {
  env: {
    account: incubatorAccountId,
    region: "eu-west-1",
  },
  resourcePrefix: "incub-gva",
  vpcId: externalValues.vpcId,
  webStack,
  ecrRepositoryArn: externalValues.buildEcrRepositoryArn,
  ecrRepositoryName: externalValues.buildEcrRepositoryName,
  artifactStatus: new EcsUpdateImageArtifactStatus({
    artifactPushedAndTagUpdated: true,
  }),
})
