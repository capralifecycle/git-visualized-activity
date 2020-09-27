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
  }
}
