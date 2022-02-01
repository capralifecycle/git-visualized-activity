import * as constructs from "constructs"
import * as acm from "aws-cdk-lib/aws-certificatemanager"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import { UserPool, UserPoolIdentityProvider } from "aws-cdk-lib/aws-cognito"
import * as r53 from "aws-cdk-lib/aws-route53"
import * as cdk from "aws-cdk-lib"
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

  constructor(scope: constructs.Construct, id: string, props: Props) {
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
  }
}
