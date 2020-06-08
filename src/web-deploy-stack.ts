import * as cdk from "@aws-cdk/core"
import { WebStack } from "./web-stack"
import { WebappDeploy } from "./webapp-deploy"

export class WebDeployStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      callerRoleArn: string
      roleName: string
      buildsBucketName: string
      resourcePrefix: string
      webStack: WebStack
    },
  ) {
    super(scope, id, props)

    new WebappDeploy(this, "WebappDeploy", {
      callerRoleArn: props.callerRoleArn,
      roleName: props.roleName,
      buildsBucketName: props.buildsBucketName,
      webBucketName: props.webStack.webBucketName,
      distributionId: props.webStack.distribution.distributionId,
      deployFnNameParameterName: `/${props.resourcePrefix}/deploy-fn-name`,
    })
  }
}
