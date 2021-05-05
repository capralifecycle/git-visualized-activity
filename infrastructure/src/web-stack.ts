import * as acm from "@aws-cdk/aws-certificatemanager"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import { UserPool, UserPoolIdentityProvider } from "@aws-cdk/aws-cognito"
import * as r53 from "@aws-cdk/aws-route53"
import * as cdk from "@aws-cdk/core"
import { Web } from "./web"
import { WebEdgeStack } from "./web-edge-stack"

interface Props extends cdk.StackProps {
  domainName: string
  cloudfrontCertificateArn: string
  hostedZoneId?: string
  webEdgeStack: WebEdgeStack
  userPoolId: string
  authDomain: string
}

export class WebStack extends cdk.Stack {
  public readonly webBucketName: string
  public readonly distribution: cloudfront.Distribution

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props)

    const hostedZone = props.hostedZoneId
      ? r53.HostedZone.fromHostedZoneId(this, "HostedZone", props.hostedZoneId)
      : undefined

    const cloudfrontCertificate = acm.Certificate.fromCertificateArn(
      this,
      "AcmCertificate",
      props.cloudfrontCertificateArn,
    )

    const userPool = UserPool.fromUserPoolId(this, "UserPool", props.userPoolId)
    userPool.registerIdentityProvider(
      UserPoolIdentityProvider.fromProviderName(
        this,
        "GoogleProvider",
        "Google",
      ),
    )

    const web = new Web(this, "Web", {
      cloudfrontCertificate,
      domainName: props.domainName,
      hostedZone,
      authLambdas: props.webEdgeStack.authLambdas,
      userPool,
      authDomain: props.authDomain,
    })

    this.webBucketName = web.webBucket.bucketName
    this.distribution = web.distribution

    // TODO: Cleanup.
    this.exportValue(web.webBucket.bucketName)
    this.exportValue(web.distribution.distributionId)
    ;(this.node
      .findChild("Exports")
      .node.findChild(
        'Output{"Ref":"WebWebBucketAF209868"}',
      ) as cdk.CfnOutput).exportName =
      "incub-gva-web:IncubatorincubgvawebExportsOutputRefWebWebBucketAF209868D3D0D698"
    ;(this.node
      .findChild("Exports")
      .node.findChild(
        'Output{"Ref":"WebDistributionCFDistributionE67D88CA"}',
      ) as cdk.CfnOutput).exportName =
      "incub-gva-web:IncubatorincubgvawebExportsOutputRefWebDistributionCFDistributionE67D88CA899576A5"
  }
}
