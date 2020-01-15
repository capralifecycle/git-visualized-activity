#!/usr/bin/env node
import * as cdk from "@aws-cdk/core"
import { incubatorEnv, projectName } from "../env"
import { WebStack } from "../stacks/web"
import { addStackTags } from "../util"

const app = new cdk.App()
addStackTags(app, projectName)

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
