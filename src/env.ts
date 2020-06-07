export const projectName = "git-visualized-activity"

export const incubatorEnv = {
  accountId: "001112238813",
  // Resources in us-east-1.
  cloudfront: {
    webBucketName: "liflig-incubator-gva-web",
    region: "us-east-1",
    certificateArn:
      "arn:aws:acm:us-east-1:923402097046:certificate/8c02e2fe-9399-4c51-8801-3c1af58eba1b",
  },
  // TODO: Must be resolved deploy-time due to cross-region.
  distributionId: "todo-not-resolved-yet",
  domainName: "gva.incubator.capra.tv",
  hostedZoneId: "TODO",
  region: "eu-west-1",
  resourcePrefix: "liflig-incubator-gva",
  // TODO: Update to use incubator subnets.
  subnetIdList: ["subnet-29616151", "subnet-95bd9ddf", "subnet-b6c425df"],
  vpcId: "vpc-0f0d43198daee2247",
}

// See https://github.com/capraconsulting/webapp-deploy-lambda
export const deployCodeS3Bucket = "capra-webapp-deploy-lambda-releases"
export const deployCodeS3Key = "release-0.1.0.zip"
