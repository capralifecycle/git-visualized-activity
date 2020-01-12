#!/usr/bin/env node
import * as ec2 from "@aws-cdk/aws-ec2"
import * as cdk from "@aws-cdk/core"
import { getEcrAsset } from "./asset"
import { BuildStack } from "./build"
import { WebStack } from "./web"
import { AppStack as WorkerStack } from "./worker"
import { WebDeployStack } from "./web-deploy"

enum Target {
  INCUBATOR,
}

const envs = {
  [Target.INCUBATOR]: {
    accountId: "001112238813",
    mainRegion: "eu-central-1",
    webRegion: "us-east-1",
    resourcePrefix: "incubator-gva",
    // FIXME: Refactor.
    build: {
      accountId: "923402097046",
      region: "eu-central-1",
    },
    // See https://github.com/capraconsulting/webapp-deploy-lambda
    deployCodeS3Bucket: "capra-webapp-deploy-lambda-releases",
    deployCodeS3Key: "release-0.1.0.zip",
    // Certificate in us-east-1 region for CloudFront usage.
    certificateArn:
      "arn:aws:acm:us-east-1:923402097046:certificate/8c02e2fe-9399-4c51-8801-3c1af58eba1b",
    domainName: "gva.incubator.capra.tv",
    hostedZoneId: "TODO",
    vpcId: "vpc-93f214fa",
    subnetIdList: ["subnet-29616151", "subnet-95bd9ddf", "subnet-b6c425df"],
    jenkinsSlaveRoleArn: "arn:aws:iam::923402097046:role/buildtools-jenkins-RoleJenkinsSlave-JQGYHR5WE6C5"
  },
}

function getEnv() {
  const target = app.node.tryGetContext("target") as Target | undefined
  if (target == null) {
    throw new Error("Missing target")
  }
  if (!(target in envs)) {
    throw new Error(`Unknown target: ${target}`)
  }

  return envs[target]
}

const env = getEnv()
const resourcePrefix = env.resourcePrefix

const app = new cdk.App()

app.node.applyAspect({
  visit(construct: cdk.IConstruct) {
    if (construct instanceof cdk.Construct) {
      const stack = construct.node.scopes.find(cdk.Stack.isStack)
      if (stack != null) {
        cdk.Tag.add(construct, "StackName", stack.stackName)
        cdk.Tag.add(construct, "project", "git-visualized-activity")
      }
    }
  },
})

const build = new BuildStack(app, `${resourcePrefix}-build`, {
  env: {
    account: env.build.accountId,
    region: env.build.region,
  },
  resourcePrefix,
  jenkinsSlaveRoleArn: env.jenkinsSlaveRoleArn,
})

const web = new WebStack(app, `${resourcePrefix}-web`, {
  env: {
    account: env.accountId,
    region: env.webRegion,
  },
  resourcePrefix,
  acmCertificateArn: env.certificateArn,
  domainName: env.domainName,
  hostedZoneId: env.hostedZoneId,
})

new WebDeployStack(app, `${resourcePrefix}-web-deploy`, {
  env: {
    account: env.accountId,
    region: env.mainRegion,
  },
  assumedJenkinsRole: build.jenkinsRole,
  webStack: web,
  deployCodeS3Bucket: env.deployCodeS3Bucket,
  deployCodeS3Key: env.deployCodeS3Key,
  releasesBucket: build.releases,
  targetBucket: web.webBucket,
  resourcePrefix,
})

new WorkerStack(app, `${resourcePrefix}-worker`, {
  env: {
    account: env.accountId,
    region: env.mainRegion,
  },
  resourcePrefix,
  vpc: ec2.Vpc.fromLookup(app, "Vpc", {
    vpcId: env.vpcId,
  }),
  webBucketName: web.webBucket.bucketName,
  workerAsset: getEcrAsset("worker"),
})
