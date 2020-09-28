import { CfnFunction } from "@aws-cdk/aws-lambda"
import * as cdk from "@aws-cdk/core"
import { AuthLambdas } from "@henrist/cdk-cloudfront-auth"

/**
 * Stack deployed in us-east-1 to hold "Lambda@edge" resource.
 */
export class WebEdgeStack extends cdk.Stack {
  public readonly authLambdas: AuthLambdas

  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
    },
  ) {
    super(scope, id, props)

    this.authLambdas = new AuthLambdas(this, "AuthLambdas", {
      regions: ["eu-west-1"],
    })

    // Workaround to force change to lambda so that we can avoid
    // the error "A version for this Lambda function exists ( 3 ).
    // Modify the function to create a new version."
    // This can likely be removed later.
    for (const n of [
      "CheckAuthFunction",
      "HttpHeadersFunction",
      "ParseAuthFunction",
      "RefreshAuthFunction",
      "SignOutFunction",
    ]) {
      const f = this.authLambdas.node.findChild(n).node
        .defaultChild as CfnFunction
      f.description = "Fn2"
    }
  }
}
