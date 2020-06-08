import * as cdk from "@aws-cdk/core"
import { EcsUpdateImageArtifactStatus, tagResources } from "@liflig/cdk"
import { WebDeployStack } from "./web-deploy-stack"
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
  lifligIoAcmCertifcateArn:
    "arn:aws:acm:eu-west-1:001112238813:certificate/5a23a7e4-e207-45b3-b577-fa311ddad70e",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  incubatorDevAcmCertificateArn:
    "arn:aws:acm:eu-west-1:001112238813:certificate/c25c1127-5901-43d4-aa6c-bebd8af4d4bb",
  // From https://github.com/capralifecycle/liflig-incubator-common-infra
  incubatorDevHostedZoneId: "Z07028931BZD2FT5LUHHH",
}

const incubatorEnv = {
  accountId: "001112238813",
  // Resources in us-east-1.
  cloudfront: {
    webBucketName: "incub-gva-web",
    region: "us-east-1",
  },
  // TODO: Must be resolved deploy-time due to cross-region.
  distributionId: "todo-not-resolved-yet",
  hostedZoneId: "TODO",
  region: "eu-west-1",
  vpcId: externalValues.vpcId,
}

const app = new cdk.App()
tagResources(app, (stack) => ({
  StackName: stack.stackName,
  Project: "git-visualized-activity",
  SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
}))

new WebDeployStack(app, `incub-gva-web-deploy`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  callerRoleArn: externalValues.jenkinsRoleArn,
  roleName: "incub-gva-jenkins",
  // TODO: Dynamically resolve.
  distributionId: incubatorEnv.distributionId,
  buildsBucketName: externalValues.buildBucketName,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  resourcePrefix: "incub-gva",
})

new WorkerStack(app, `incub-gva-worker`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  resourcePrefix: "incub-gva",
  vpcId: incubatorEnv.vpcId,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  ecrRepositoryArn: externalValues.buildEcrRepositoryArn,
  ecrRepositoryName: externalValues.buildEcrRepositoryName,
  artifactStatus: new EcsUpdateImageArtifactStatus({
    artifactPushedAndTagUpdated: true,
  }),
})

new WebStack(app, `incub-gva-web`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.cloudfront.region,
  },
  localEndpoint: {
    domainName: "gva.incubator.liflig.dev",
    acmCertificateArn: externalValues.incubatorDevAcmCertificateArn,
    hostedZoneId: externalValues.incubatorDevHostedZoneId,
  },
  externalEndpoint: {
    domainName: "gva.liflig.io",
    acmCertificateArn: externalValues.lifligIoAcmCertifcateArn,
  },
  resourcePrefix: "incub-gva",
  webBucketName: incubatorEnv.cloudfront.webBucketName,
})
