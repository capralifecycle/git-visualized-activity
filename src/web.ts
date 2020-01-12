import * as acm from "@aws-cdk/aws-certificatemanager"
import * as cloudfront from "@aws-cdk/aws-cloudfront"
import * as iam from "@aws-cdk/aws-iam"
import * as r53 from "@aws-cdk/aws-route53"
import * as r53t from "@aws-cdk/aws-route53-targets"
import * as s3 from "@aws-cdk/aws-s3"
import * as ssm from "@aws-cdk/aws-ssm"
import * as cdk from "@aws-cdk/core"
import { WebAuth } from "./auth"

export class WebStack extends cdk.Stack {
  public readonly webBucket: s3.Bucket
  public readonly distribution: cloudfront.CloudFrontWebDistribution

  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
      hostedZoneId: string
      domainName: string
      acmCertificateArn: string
    },
  ) {
    super(scope, id, props)

    const webAuth = new WebAuth(this, "WebAuth")

    const hostedZone = r53.HostedZone.fromHostedZoneId(
      this,
      "HostedZone",
      props.hostedZoneId,
    )

    this.webBucket = new s3.Bucket(this, "WebBucket", {
      bucketName: `${props.resourcePrefix}-web`,
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
          this.webBucket.arnForObjects("web/*"),
          this.webBucket.arnForObjects("data/*"),
        ],
      }),
    )

    // TODO: What is this used for?
    new ssm.StringParameter(this, "WebBucketNameParam", {
      parameterName: `/${props.resourcePrefix}/web-bucket-name`,
      stringValue: this.webBucket.bucketName,
    })

    const acmCertificate = acm.Certificate.fromCertificateArn(
      this,
      "AcmCertificate",
      props.acmCertificateArn,
    )

    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
      acmCertificate,
      {
        aliases: [props.domainName],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        sslMethod: cloudfront.SSLMethod.SNI,
      },
    )

    const distribution = new cloudfront.CloudFrontWebDistribution(
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
                    lambdaFunction: webAuth.version,
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
                    lambdaFunction: webAuth.version,
                  },
                ],
              },
            ],
          },
        ],
      },
    )

    new r53.ARecord(this, "DnsRecord", {
      zone: hostedZone,
      recordName: `${props.domainName}.`,
      target: r53.RecordTarget.fromAlias(
        new r53t.CloudFrontTarget(distribution),
      ),
    })
  }
}
