import * as iam from "@aws-cdk/aws-iam"
import * as lambda from "@aws-cdk/aws-lambda"
import * as cdk from "@aws-cdk/core"
import { removeLeadingSlash } from "../utils"

export class WebAuth extends cdk.Construct {
  public readonly version: lambda.Version

  constructor(
    scope: cdk.Construct,
    id: string,
    props: {
      paramsRegion: string
      usernameParamName: string
      passwordParamName: string
    },
  ) {
    super(scope, id)

    const region = cdk.Stack.of(this).region

    if (region !== "us-east-1") {
      throw new Error("Region must be us-east-1 due to Lambda@edge")
    }

    const role = new iam.Role(this, "ServiceRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("lambda.amazonaws.com"),
        new iam.ServicePrincipal("edgelambda.amazonaws.com"),
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    })

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameters"],
        resources: [
          cdk.Arn.format(
            {
              service: "ssm",
              resource: "parameter",
              region: props.paramsRegion,
              resourceName: removeLeadingSlash(props.usernameParamName),
            },
            cdk.Stack.of(scope),
          ),
          cdk.Arn.format(
            {
              service: "ssm",
              resource: "parameter",
              region: props.paramsRegion,
              resourceName: removeLeadingSlash(props.passwordParamName),
            },
            cdk.Stack.of(scope),
          ),
        ],
      }),
    )

    const credentialsFunction = new lambda.Function(this, "Function", {
      code: lambda.Code.fromAsset("src/auth/handler"),
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      role,
      // Dummy value to cause change to lambda to fix temporary
      // error with version creation.
      description: "x",
    })

    this.version = credentialsFunction.currentVersion
  }
}
