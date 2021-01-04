#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library("cals") _

def pipelines = new no.capraconsulting.buildtools.lifligcdkpipelines.LifligCdkPipelines()

def artifactsBucketName = "incub-common-build-artifacts-001112238813-eu-west-1"
def artifactsRoleArn = "arn:aws:iam::001112238813:role/incub-common-build-artifacts-liflig-jenkins"

def ecrPublish = new no.capraconsulting.buildtools.cdk.EcrPublish()
def webapp = new no.capraconsulting.buildtools.cdk.Webapp()

def workerPublishConfig = ecrPublish.config {
  repositoryUri = "001112238813.dkr.ecr.eu-west-1.amazonaws.com/incub-common-builds"
  applicationName = "gva-worker"
  roleArn = artifactsRoleArn
}

buildConfig([
  slack: [channel: "#cals-dev-info"],
  jobProperties: [
    parameters([
      booleanParam(
        defaultValue: false,
        description: "Skip branch check for webapp - force deploy",
        name: "webappOverrideBranchCheck"
      ),
      ecrPublish.dockerSkipCacheParam(),
    ]),
  ],
]) {
  dockerNode {
    stage("Checkout source") {
      checkout scm
    }

    def webappS3Url
    stage("Build webapp") {
      dir("webapp") {
        insideToolImage("node:14") {
          sh """
            npm ci
            ../worker/generate-commits.sh clean
            npm run lint
            npm test
            npm run build
          """

          analyzeSonarCloudForJs([
            "sonar.organization": "capraconsulting",
            "sonar.projectKey": "capraconsulting_git-visualized-activity",
          ])
        }

        webappS3Url = webapp.publish {
          name = "gva"
          buildDir = "dist"
          roleArn = artifactsRoleArn
          bucketName = artifactsBucketName
        }
      }
    }

    stage("Build worker") {
      dir("worker") {
        ecrPublish.withEcrLogin(workerPublishConfig) {
          // We only store cache image since CDK builds the final image,
          // which means this is only doing testing.
          ecrPublish.buildImage(workerPublishConfig)
        }
      }
    }

    dir("infrastructure") {
      insideToolImage("node:14") {
        stage("Build cdk") {
          sh """
            npm ci
            npm run lint
            npm run snapshots
            git status .
            git diff --exit-code .
          """
        }

        def bucketKey

        stage("Package and upload Cloud Assembly") {
          bucketKey = pipelines.createAndUploadCloudAssembly(
            bucketName: artifactsBucketName,
            roleArn: artifactsRoleArn,
          )
        }

        def cdkAllowDeploy = env.BRANCH_NAME == "master"
        if (cdkAllowDeploy) {
          stage("Trigger pipeline") {
            pipelines.configureAndTriggerPipelinesV2(
              cloudAssemblyBucketKey: bucketKey,
              artifactsBucketName: artifactsBucketName,
              artifactsRoleArn: artifactsRoleArn,
              pipelines: ["incub-gva"],
            )
          }
        }
      }
    }

    def webappAllowDeploy = env.BRANCH_NAME == "master" || params.webappOverrideBranchCheck
    if (webappAllowDeploy) {
      stage("Deploy webapp") {
        webapp.deploy {
          artifactS3Url = webappS3Url
          roleArn = "arn:aws:iam::001112238813:role/incub-gva-web-deploy"
          functionArn = "arn:aws:lambda:eu-west-1:001112238813:function:incub-gva-web-deploy"
        }
      }
    }
  }
}
