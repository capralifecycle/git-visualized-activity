#!/usr/bin/env node
import * as cdk from "@aws-cdk/core"
import { buildEnv, projectName } from "../env"
import { BuildStack } from "../stacks/build"
import { addStackTags } from "../util"

const app = new cdk.App()
addStackTags(app, projectName)

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
