import * as cdk from "@aws-cdk/core"
import { SsmParameterReader } from "./ssm-parameter-reader"
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
      webBucketName: string
      resourcePrefix: string
      webStack: WebStack
    },
  ) {
    super(scope, id, props)

    const distributionIdReader = new SsmParameterReader(
      this,
      "DistributionIdReader",
      {
        parameterName: props.webStack.distributionIdParam.parameterName,
        region: props.webStack.region,
      },
    )

    const distributionId = distributionIdReader.getParameterValue()

    new WebappDeploy(this, "WebappDeploy", {
      callerRoleArn: props.callerRoleArn,
      roleName: props.roleName,
      buildsBucketName: props.buildsBucketName,
      webBucketName: props.webBucketName,
      resourcePrefix: props.resourcePrefix,
      distributionId,
    })
  }
}
