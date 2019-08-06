#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library('cals') _

buildConfig() {
  dockerNode {
    stage('Checkout source') {
      checkout scm
    }

    def img = docker.build('builder')
    img.inside {
      stage('Install dependencies') {
        sh 'npm ci'
      }

      stage('Generate dummy commits.csv') {
        sh './generate-commits.sh clean'
      }

      stage('Run normal tests') {
        sh 'npm test'
      }

      analyzeSonarCloudForJs([
        'sonar.organization': 'capraconsulting',
        'sonar.projectKey': 'capraconsulting_git-visualized-activity',
      ])

      stage('Build') {
        sh 'npm run build'
      }
    }

    def releaseUrl
    stage('Publish') {
      releaseUrl = publish(
        'arn:aws:iam::923402097046:role/git-visualized-activity-jenkins',
        'git-visualized-activity-build-releases'
      )
    }

    if (env.BRANCH_NAME == "master") {
      stage('Deploy to prod') {
        deployProd(
          releaseUrl,
          'arn:aws:iam::923402097046:role/git-visualized-activity-jenkins',
          'git-visualized-activity-prod-deploy'
        )
      }
    }
  }
}

def getShortCommit() {
  sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
}

def getFullCommit() {
  sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
}

// TODO: Move to library later.
def publish(roleArn, releaseBucket) {
  withAwsRole(roleArn) {
    insideToolImage('aws-cli') {
      def shortCommit = getShortCommit()
      def fullCommit = getFullCommit()
      def now = new Date()
      def releaseTime  = now.format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone("UTC"))

      sh """
        jq -n '{
          timestamp: "$releaseTime",
          gitCommit: "$fullCommit",
          gitBranch: "$BRANCH_NAME",
          buildNr: $BUILD_NUMBER
        }' >build.json
      """

      sh 'tar zcf build.tgz -C dist .'

      def nowFilename = now.format("yyyyMMdd-HHmmss", TimeZone.getTimeZone("UTC"))
      def safeBranchName = env.BRANCH_NAME.replaceAll(/[^a-zA-Z0-9\-_]/, '_')
      def base = "$nowFilename-$shortCommit-$safeBranchName-$BUILD_NUMBER"
      def yearMonth = now.format("yyyy-MM", TimeZone.getTimeZone("UTC"))

      sh "aws s3 cp build.tgz s3://$releaseBucket/$yearMonth/${base}.tgz"
      sh "aws s3 cp build.json s3://$releaseBucket/$yearMonth/${base}.meta.json"

      "s3://$releaseBucket/$yearMonth/${base}.tgz"
    }
  }
}

// TODO: Move to library later.
def deployProd(releaseUrl, roleArn, functionName) {
  withAwsRole(roleArn) {
    insideToolImage('aws-cli') {
      echo "See CloudWatch (https://eu-central-1.console.aws.amazon.com/cloudwatch/home?region=eu-central-1#logStream:group=/aws/lambda/git-visualized-activity-prod-deploy) for deploy output"
      sh """
        # Exits 0 even when lambda invocation fails.
        res=\$(
          aws lambda invoke \\
            --region eu-central-1 \\
            --function-name $functionName \\
            --payload '{
              "artifactS3Url": "$releaseUrl"
            }' \\
            --query FunctionError \\
            --output text \\
            /dev/null
        )

        if [ "\$res" != "None" ]; then
          echo "Deploy failed"
          echo "Error type: \$res"
          echo "See CloudWatch for details"
        fi
      """
    }
  }
}
