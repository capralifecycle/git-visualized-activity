#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library("cals") _

import no.capraconsulting.buildtools.cdk.EcrPublish
import no.capraconsulting.buildtools.cdk.Webapp

def ecrPublish = new EcrPublish()
def webapp = new Webapp()

def workerPublishConfig = ecrPublish.config {
  repositoryUri = "001112238813.dkr.ecr.eu-west-1.amazonaws.com/incub-common-builds"
  applicationName = "gva-worker"
  roleArn = "arn:aws:iam::001112238813:role/incub-common-build-artifacts-ci"
}

buildConfig([
  jobProperties: [
    parameters([
      booleanParam(
        defaultValue: false,
        description: "Skip branch check - force deploy",
        name: "overrideBranchCheck"
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
        insideToolImage("node:12-alpine") {
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
          roleArn = "arn:aws:iam::001112238813:role/incub-common-build-artifacts-ci"
          bucketName = "incub-common-build-artifacts-001112238813-eu-west-1"
        }
      }
    }

    def workerTagName
    stage("Build worker") {
      dir("worker") {
        ecrPublish.withEcrLogin(workerPublishConfig) {
          def (img, isSameImageAsLast) = ecrPublish.buildImage(workerPublishConfig)

          workerTagName = ecrPublish.generateLongTag(workerPublishConfig)
          img.push(workerTagName)
        }
      }
    }

    stage("Build cdk") {
      dir("infrastructure") {
        insideToolImage("node:12-alpine") {
          sh """
            npm ci
            npm run lint
            npm run snapshots
            git status .
            git diff --exit-code .
          """
        }
      }
    }

    def allowDeploy = env.BRANCH_NAME == "master" || params.overrideBranchCheck
    if (allowDeploy) {
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
