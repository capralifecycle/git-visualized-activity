#!/usr/bin/env node
import * as cdk from "@aws-cdk/core"
import { buildEnv, incubatorEnv, projectName } from "../env"
import { getEcrAsset } from "../lib/asset"
import { jenkinsRoleName } from "../stacks/build"
import { WebDeployStack } from "../stacks/web-deploy"
import { AppStack as WorkerStack } from "../stacks/worker"
import { addStackTags } from "../util"

const app = new cdk.App()
addStackTags(app, projectName)

new WebDeployStack(app, `${incubatorEnv.resourcePrefix}-web-deploy`, {
  env: {
    account: incubatorEnv.accountId,
    region: incubatorEnv.region,
  },
  assumedJenkinsRoleArn: `arn:aws:iam::${
    buildEnv.accountId
  }:role/${jenkinsRoleName(buildEnv.resourcePrefix)}`,
  deployCodeS3Bucket:incubatorEnv.deployCodeS3Bucket,
  deployCodeS3Key:incubatorEnv.deployCodeS3Key,
  // TODO: Dynamically resolve.
  distributionId:incubatorEnv.distributionId,
  releasesBucketName: buildEnv.releasesBucketName,
  webBucketName: incubatorEnv.cloudfront.webBucketName,
  resourcePrefix: incubatorEnv.resourcePrefix,
})

new WorkerStack(app, `${incubatorEnv.resourcePrefix}-worker`, {
  env: {
    account:incubatorEnv.accountId,
    region:incubatorEnv.region,
  },
  resourcePrefix: incubatorEnv.region,
  vpcId:incubatorEnv.vpcId,
  webBucketName: web.webBucket.bucketName,
  workerAsset: getEcrAsset("worker"),
})
