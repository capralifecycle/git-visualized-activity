import * as ecr from "@aws-cdk/aws-ecr"
import * as iam from "@aws-cdk/aws-iam"
import * as s3 from "@aws-cdk/aws-s3"
import * as cdk from "@aws-cdk/core"

export class BuildStack extends cdk.Stack {
  public readonly ecrRepo: ecr.Repository
  public readonly releases: s3.Bucket
  public readonly jenkinsRole: iam.Role

  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
      jenkinsSlaveRoleArn: string
    },
  ) {
    super(scope, id, props)

    this.ecrRepo = new ecr.Repository(this, "EcrRepo", {
      repositoryName: `${props.resourcePrefix}/worker`,
    })

    this.releases = new s3.Bucket(this, "ReleasesBucket", {
      bucketName: `${props.resourcePrefix}-build-releases`,
      encryption: s3.BucketEncryption.S3_MANAGED,
    })

    this.jenkinsRole = new iam.Role(this, "JenkinsRole", {
      assumedBy: new iam.ArnPrincipal(props.jenkinsSlaveRoleArn),
      roleName: `${props.resourcePrefix}-jenkins`,
    })

    this.releases.grantReadWrite(this.jenkinsRole)
    this.ecrRepo.grantPullPush(this.jenkinsRole)
  }
}
