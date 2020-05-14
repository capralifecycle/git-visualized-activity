#!/usr/bin/env node
import * as cdk from "@aws-cdk/core"
import { tagResources } from "@liflig/cdk"
import {
  buildEnv,
  deployCodeS3Bucket,
  deployCodeS3Key,
  incubatorEnv,
  projectName,
} from "./env"
import { getEcrAsset } from "./lib/asset"
import { BuildStack } from "./stacks/build"
import { WebStack } from "./stacks/web"
import { WebDeployStack } from "./stacks/web-deploy"
import { AppStack as WorkerStack } from "./stacks/worker"

const app = new cdk.App()
tagResources(app, stack => ({
  StackName: stack.stackName,
  Project: projectName,
  SourceRepo: "github/capraconsulting/git-visualized-activity-infra",
}))

new BuildStack(app, `${buildEnv.resourcePrefix}-build`, {
  env: {
    account: buildEnv.accountId,
    region: buildEnv.region,
  },
  jenkinsRoleName: buildEnv.jenkinsRoleName,
  jenkinsSlaveRoleArn: buildEnv.jenkinsSlaveRoleArn,
  releasesBucketName: buildEnv.releasesBucketName,
  resourcePrefix: buildEnv.resourcePrefix,
})

new WebDeployStack(app, `${incubatorEnv.resourcePrefix}-web-deploy`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  assumedJenkinsRoleArn: `arn:aws:iam::${buildEnv.accountId}:role/${buildEnv.jenkinsRoleName}`,
  deployCodeS3Bucket,
  deployCodeS3Key,
  // TODO: Dynamically resolve.
  distributionId: incubatorEnv.distributionId,
  releasesBucketName: buildEnv.releasesBucketName,
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
