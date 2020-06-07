import * as cdk from "@aws-cdk/core"
import { tagResources } from "@liflig/cdk"
import {
  deployCodeS3Bucket,
  deployCodeS3Key,
  incubatorEnv,
  projectName,
} from "./env"
import { getEcrAsset } from "./lib/asset"
import { WebStack } from "./stacks/web"
import { WebDeployStack } from "./stacks/web-deploy"
import { WorkerStack } from "./stacks/worker"

const jenkinsRoleArn =
  "arn:aws:iam::923402097046:role/buildtools-jenkins-RoleJenkinsSlave-JQGYHR5WE6C5"
const buildBucketName = "incub-common-build-artifacts-001112238813-eu-west-1"

const app = new cdk.App()
tagResources(app, (stack) => ({
  StackName: stack.stackName,
  Project: projectName,
  SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
}))

new WebDeployStack(app, `${incubatorEnv.resourcePrefix}-web-deploy`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  callerRoleArn: jenkinsRoleArn,
  roleName: "liflig-incubator-gva-jenkins",
  deployCodeS3Bucket,
  deployCodeS3Key,
  // TODO: Dynamically resolve.
  distributionId: incubatorEnv.distributionId,
  buildsBucketName: buildBucketName,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  resourcePrefix: incubatorEnv.resourcePrefix,
})

new WorkerStack(app, `${incubatorEnv.resourcePrefix}-worker`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  resourcePrefix: incubatorEnv.region,
  vpcId: incubatorEnv.vpcId,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  workerAsset: getEcrAsset("worker"),
})

new WebStack(app, `${incubatorEnv.resourcePrefix}-web`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.cloudfront.region,
  },
  acmCertificateArn: incubatorEnv.cloudfront.certificateArn,
  domainName: incubatorEnv.domainName,
  hostedZoneId: incubatorEnv.hostedZoneId,
  resourcePrefix: incubatorEnv.resourcePrefix,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
})
