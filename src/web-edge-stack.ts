import * as ssm from "@aws-cdk/aws-ssm"
import * as cdk from "@aws-cdk/core"
import { WebAuth } from "./auth"

/**
 * Stack deployed in us-east-1 to hold "Lambda@edge" resource.
 */
export class WebEdgeStack extends cdk.Stack {
  public readonly webAuthLambdaVersionArnParameterName: string

  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
    },
  ) {
    super(scope, id, props)

    const webAuth = new WebAuth(this, "WebAuth", {
      paramsRegion: "eu-west-1",
      usernameParamName: `/${props.resourcePrefix}-web/basicauth-username`,
      passwordParamName: `/${props.resourcePrefix}-web/basicauth-password`,
    })

    this.webAuthLambdaVersionArnParameterName = `/${props.resourcePrefix}/web-auth-lambda-version-arn`

    new ssm.StringParameter(this, "WebAuthLambdaVersion", {
      stringValue: webAuth.version.functionArn,
      parameterName: this.webAuthLambdaVersionArnParameterName,
    })
  }
}
