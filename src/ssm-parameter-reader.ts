import * as cdk from "@aws-cdk/core"
import * as cr from "@aws-cdk/custom-resources"

const isSnapshot = process.env.IS_SNAPSHOT === "true"

interface Props {
  parameterName: string
  region: string
}

export class SsmParameterReader extends cr.AwsCustomResource {
  constructor(scope: cdk.Construct, name: string, props: Props) {
    super(scope, name, {
      onUpdate: {
        service: "SSM",
        action: "getParameter",
        parameters: {
          Name: props.parameterName,
        },
        region: props.region,
        // Update physical id to always fetch the latest version.
        physicalResourceId: cr.PhysicalResourceId.of(
          isSnapshot ? "snapshot-value" : Date.now().toString(),
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [
          cdk.Arn.format(
            {
              service: "ssm",
              region: props.region,
              resource: "parameter",
              resourceName: props.parameterName,
            },
            cdk.Stack.of(scope),
          ),
        ],
      }),
    })
  }

  public getParameterValue(): string {
    return this.getResponseField("Parameter.Value")
  }
}
