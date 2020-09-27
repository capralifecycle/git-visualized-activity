import * as lambda from "@aws-cdk/aws-lambda"
import * as cdk from "@aws-cdk/core"
import { AuthLambdas } from "@henrist/cdk-cloudfront-auth"
import { SsmParameterBackedResource } from "@liflig/cdk"
import { WebAuth } from "./auth"
import { isSnapshot } from "./utils"

/**
 * Stack deployed in us-east-1 to hold "Lambda@edge" resource.
 */
export class WebEdgeStack extends cdk.Stack {
  public readonly webAuthLambdaVersion: SsmParameterBackedResource<
    lambda.IVersion
  >

  public readonly authLambdas: AuthLambdas

  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
    },
  ) {
    super(scope, id, props)

    // TODO: Remove old auth setup after migrated to Cognito setup.

    const webAuth = new WebAuth(this, "WebAuth", {
      paramsRegion: "eu-west-1",
      usernameParamName: `/${props.resourcePrefix}-web/basicauth-username`,
      passwordParamName: `/${props.resourcePrefix}-web/basicauth-password`,
    })

    this.webAuthLambdaVersion = new SsmParameterBackedResource<lambda.IVersion>(
      this,
      "VersionParam",
      {
        nonce: isSnapshot ? "snapshot" : undefined,
        parameterName: `/cf/region/${this.region}/stack/${this.stackName}/web-auth-lambda-version-arn`,
        referenceToResource: (scope, id, reference) =>
          lambda.Version.fromVersionArn(scope, id, reference),
        regions: ["eu-west-1"],
        resource: webAuth.version,
        resourceToReference: (resource) => resource.functionArn,
      },
    )

    this.authLambdas = new AuthLambdas(this, "AuthLambdas", {
      regions: ["eu-west-1"],
    })
  }
}
