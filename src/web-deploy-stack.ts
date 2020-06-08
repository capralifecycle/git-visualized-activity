import * as cdk from "@aws-cdk/core"
import { WebappDeploy } from "./webapp-deploy"

export class WebDeployStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      callerRoleArn: string
      roleName: string
      buildsBucketName: string
      webBucketName: string
      resourcePrefix: string
      distributionId: string
    },
  ) {
    super(scope, id, props)

    new WebappDeploy(this, "WebappDeploy", props)
  }
}
