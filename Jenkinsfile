#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library("cals") _

def ecrPublish = new no.capraconsulting.buildtools.cdk.EcrPublish()
def webapp = new no.capraconsulting.buildtools.cdk.Webapp()

def workerPublishConfig = ecrPublish.config {
  repositoryUri = "001112238813.dkr.ecr.eu-west-1.amazonaws.com/incub-common-builds"
  applicationName = "gva-worker"
  roleArn = "arn:aws:iam::001112238813:role/incub-common-build-artifacts-ci"
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

    stage("Build worker") {
      dir("worker") {
        ecrPublish.withEcrLogin(workerPublishConfig) {
          // We only store cache image since CDK builds the final image,
          // which means this is only doing testing.
          ecrPublish.buildImage(workerPublishConfig)
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

          createCloudAssemblyZip()
        }
      }
    }

    def cdkAllowDeploy = env.BRANCH_NAME == "master"
    if (cdkAllowDeploy) {
      stage("Triggering CDK deployment") {
        dir("infrastructure") {
          uploadCloudAssemblyZip(
            roleArn: "arn:aws:iam::001112238813:role/incub-gva-cdk-upload-liflig-jenkins",
            bucketName: "incub-gva-cdk-001112238813-eu-west-1",
            bucketKey: "cloud-assembly-incubator.zip",
          )
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

// TODO: Move to pipeline lib.
/**
 * Run cdk synth to produce a Cloud Assembly and package this
 * as a zip-file ready to be uploaded.
 *
 * The built assembly will be present at cloud-assembly.zip.
 */
def createCloudAssemblyZip() {
  sh """
    rm -rf cdk.out
    npm run cdk -- synth >/dev/null
    cd cdk.out
    zip -r ../cloud-assembly.zip .
  """
}

/**
 * Upload a built Cloud Assembly zip-file.
 *
 * The zip-file must be present as cloud-assembly.zip.
 *
 * Params:
 *   - roleArn
 *   - bucketName
 *   - bucketKey
 */
def uploadCloudAssemblyZip(Map args) {
  if (!args.containsKey("roleArn")) {
    throw new Exception("Missing roleArn")
  }
  if (!args.containsKey("bucketName")) {
    throw new Exception("Missing bucketName")
  }
  if (!args.containsKey("bucketKey")) {
    throw new Exception("Missing bucketKey")
  }

  def s3Url = "s3://${args.bucketName}/${args.bucketKey}"

  withAwsRole(args.roleArn) {
    sh "aws s3 cp cloud-assembly.zip $s3Url"
  }
}
