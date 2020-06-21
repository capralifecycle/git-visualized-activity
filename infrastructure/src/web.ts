import * as lambda from "@aws-cdk/aws-lambda"
import * as certificatemanager from "@aws-cdk/aws-certificatemanager"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import * as iam from "@aws-cdk/aws-iam"
import * as r53 from "@aws-cdk/aws-route53"
import * as r53t from "@aws-cdk/aws-route53-targets"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"
import { WebappDeployViaRole } from "@liflig/cdk"

interface Props {
  buildsBucket: s3.IBucket
  jenkinsRoleArn: string
  deployRoleName: string
  deployFunctionName: string
  domainName: string
  cloudfrontCertificate: certificatemanager.ICertificate
  hostedZone?: r53.IHostedZone
  webAuthLambdaVersion: lambda.IVersion
}

export class Web extends cdk.Construct {
  public readonly webBucket: s3.Bucket
  public readonly distribution: cloudfront.CloudFrontWebDistribution

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id)

    this.webBucket = new s3.Bucket(this, "WebBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
    })

    const accessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "AccessIdentity",
    )

    this.webBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        principals: [accessIdentity.grantPrincipal],
        resources: [
          this.webBucket.arnForObjects("data/*"),
          this.webBucket.arnForObjects("web/*"),
        ],
      }),
    )

    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
      props.cloudfrontCertificate,
      {
        aliases: [props.domainName],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
        sslMethod: cloudfront.SSLMethod.SNI,
      },
    )

    this.distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "Distribution",
      {
        defaultRootObject: "index.html",
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.webBucket,
              originAccessIdentity: accessIdentity,
            },
            originPath: "/web",
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
                forwardedValues: {
                  queryString: false,
                },
                lambdaFunctionAssociations: [
                  {
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    lambdaFunction: props.webAuthLambdaVersion,
                  },
                ],
              },
            ],
          },
          {
            s3OriginSource: {
              s3BucketSource: this.webBucket,
              originAccessIdentity: accessIdentity,
            },
            originPath: "",
            behaviors: [
              {
                pathPattern: "/data/*",
                compress: true,
                forwardedValues: {
                  queryString: false,
                },
                lambdaFunctionAssociations: [
                  {
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                    lambdaFunction: props.webAuthLambdaVersion,
                  },
                ],
              },
            ],
          },
        ],
      },
    )

    if (props.hostedZone != null) {
      new r53.ARecord(this, "DnsRecord", {
        zone: props.hostedZone,
        recordName: `${props.domainName}.`,
        target: r53.RecordTarget.fromAlias(
          new r53t.CloudFrontTarget(this.distribution),
        ),
      })
    }

    new WebappDeployViaRole(this, "Deploy", {
      webappDeploy: {
        buildsBucket: props.buildsBucket,
        functionName: props.deployFunctionName,
        distributionId: this.distribution.distributionId,
        webBucket: this.webBucket,
      },
      roleName: props.deployRoleName,
      externalRoleArn: props.jenkinsRoleArn,
    })
  }
}
