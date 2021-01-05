import * as certificatemanager from "@aws-cdk/aws-certificatemanager"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import * as origins from "@aws-cdk/aws-cloudfront-origins"
import { IUserPool } from "@aws-cdk/aws-cognito"
import * as r53 from "@aws-cdk/aws-route53"
import * as r53t from "@aws-cdk/aws-route53-targets"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import * as webappDeploy from "@capraconsulting/webapp-deploy-lambda"
import { AuthLambdas, CloudFrontAuth } from "@henrist/cdk-cloudfront-auth"
import * as path from "path"

interface Props {
  domainName: string
  cloudfrontCertificate: certificatemanager.ICertificate
  hostedZone?: r53.IHostedZone
  authLambdas: AuthLambdas
  userPool: IUserPool
  authDomain: string
}

export class Web extends cdk.Construct {
  public readonly webBucket: s3.Bucket
  public readonly distribution: cloudfront.Distribution

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    this.webBucket = new s3.Bucket(this, "WebBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
    })

    const auth = new CloudFrontAuth(this, "Auth", {
      cognitoAuthDomain: props.authDomain,
      authLambdas: props.authLambdas,
      userPool: props.userPool,
      requireGroupAnyOf: ["liflig-active"],
    })

    const webOrigin = new origins.S3Origin(this.webBucket, {
      originPath: "/web",
    })
    const dataOrigin = new origins.S3Origin(this.webBucket)

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: auth.createProtectedBehavior(webOrigin),
      defaultRootObject: "index.html",
      certificate: props.cloudfrontCertificate,
      domainNames: [props.domainName],
      additionalBehaviors: {
        ...auth.createAuthPagesBehaviors(webOrigin),
        "/data/*": auth.createProtectedBehavior(dataOrigin),
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    })

    // Workaround to keep old logical ID.
    ;(this.distribution.node
      .defaultChild as cloudfront.CfnDistribution).overrideLogicalId(
      "WebDistributionCFDistributionE67D88CA",
    )

    auth.updateClient("ClientUpdate", {
      signOutUrl: `https://${props.domainName}${auth.signOutRedirectTo}`,
      callbackUrl: `https://${props.domainName}${auth.callbackPath}`,
    })

    if (props.hostedZone != null) {
      new r53.ARecord(this, "DnsRecord", {
        zone: props.hostedZone,
        recordName: `${props.domainName}.`,
        target: r53.RecordTarget.fromAlias(
          new r53t.CloudFrontTarget(this.distribution),
        ),
      })
    }

    new webappDeploy.WebappDeploy(this, "Deploy", {
      distribution: this.distribution,
      webBucket: this.webBucket,
      source: webappDeploy.Source.asset(
        path.join(__dirname, "../../webapp/dist"),
      ),
    })
  }
}
