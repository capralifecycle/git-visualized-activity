import * as ec2 from "@aws-cdk/aws-ec2"
import * as ecr from "@aws-cdk/aws-ecr"
import * as ecs from "@aws-cdk/aws-ecs"
import * as events from "@aws-cdk/aws-events"
import * as targets from "@aws-cdk/aws-events-targets"
import * as iam from "@aws-cdk/aws-iam"
import * as lambda from "@aws-cdk/aws-lambda"
import * as logs from "@aws-cdk/aws-logs"
import * as s3 from "@aws-cdk/aws-s3"
import * as ssm from "@aws-cdk/aws-ssm"
import * as cdk from "@aws-cdk/core"
import type { Handler } from "aws-lambda"
import type * as _AWS from "aws-sdk"
import { EcrAsset } from "./asset"
import { WebStack } from "./web-stack"

export class WorkerStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: cdk.StackProps & {
      resourcePrefix: string
      vpcId: string
      webStack: WebStack
      workerAsset: EcrAsset
    },
  ) {
    super(scope, id, props)

    const region = cdk.Stack.of(this).region
    const account = cdk.Stack.of(this).account

    const vpc = ec2.Vpc.fromLookup(this, "Vpc", {
      vpcId: props.vpcId,
    })

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    })

    const image = ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryAttributes(this, "EcrRepo", {
        repositoryArn: props.workerAsset.ecrRepoArn,
        repositoryName: props.workerAsset.ecrRepoName,
      }),
      props.workerAsset.dockerTag,
    )

    const webBucket = s3.Bucket.fromBucketName(
      this,
      "WebBucket",
      props.webStack.webBucketName,
    )

    // The actual application being run as a task.

    const logGroup = new logs.LogGroup(this, "LogGroup", {
      retention: logs.RetentionDays.ONE_MONTH,
    })

    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      family: `${props.resourcePrefix}-worker`,
      cpu: 1024,
      memoryLimitMiB: 2048,
    })

    taskDef.addContainer("app", {
      image,
      logging: ecs.LogDriver.awsLogs({
        logGroup,
        streamPrefix: "app",
      }),
      environment: {
        BUCKET_NAME: webBucket.bucketName,
        CF_DISTRIBUTION: props.webStack.distribution.distributionId,
        PARAMS_PREFIX: `/${props.resourcePrefix}-worker`,
      },
    })

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [webBucket.arnForObjects("*")],
      }),
    )

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation"],
        resources: ["*"], // Cannot be restricted.
      }),
    )

    taskDef.addToTaskRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${region}:${account}:parameter/${props.resourcePrefix}-worker/*`,
        ],
      }),
    )

    // No need for any inbound rules, but we need a security group to start task.
    const securityGroup = new ec2.SecurityGroup(this, "SecurityGroup", {
      vpc,
    })

    // We use a lambda to execute the task, so that we can easily
    // run the task outside the schedule if needed.

    const launcher = new lambda.Function(this, "Launcher", {
      environment: {
        CLUSTER_NAME: cluster.clusterName,
        SUBNETS: vpc.publicSubnets.map((it) => it.subnetId).join(","),
        SECURITY_GROUPS: securityGroup.securityGroupName,
        TASK_DEFINITION: taskDef.taskDefinitionArn,
      },
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      code: new lambda.InlineCode(`exports.handler = ${runTask.toString()};`),
      timeout: cdk.Duration.minutes(1),
    })

    launcher.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ecs:RunTask"],
        resources: [taskDef.taskDefinitionArn],
        conditions: {
          ArnEquals: {
            "ecs:cluster": cluster.clusterArn,
          },
        },
      }),
    )

    launcher.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        resources: [taskDef.taskRole.roleArn, taskDef.executionRole!.roleArn],
      }),
    )

    new ssm.StringParameter(this, "LauncherParam", {
      parameterName: `/cf/stack/${this.stackName}/launcher-fn-arn`,
      stringValue: launcher.functionArn,
    })

    new cdk.CfnOutput(this, "LauncherArn", {
      value: launcher.functionArn,
    })

    const scheduleRule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.expression("cron(0 4 * * ? *)"),
    })

    scheduleRule.addTarget(new targets.LambdaFunction(launcher))
  }
}

const runTask: Handler = async () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AWS = require("aws-sdk")
  const ecs = new AWS.ECS() as _AWS.ECS

  await ecs
    .runTask({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      cluster: process.env["CLUSTER_NAME"]!,
      launchType: "FARGATE",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      taskDefinition: process.env["TASK_DEFINITION"]!,
      count: 1,
      platformVersion: "LATEST",
      networkConfiguration: {
        awsvpcConfiguration: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          subnets: process.env["SUBNETS"]!.split(","),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          securityGroups: process.env["SECURITY_GROUPS"]!.split(","),
          assignPublicIp: "ENABLED",
        },
      },
    })
    .promise()
}
