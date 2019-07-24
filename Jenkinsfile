#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library('cals@sonarcloud') _ // TODO: Remove branch override

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

      analyzeSonarCloudForNodejs([
        'sonar.organization': 'capraconsulting',
        'sonar.projectKey': 'capraconsulting_git-visualized-activity',
      ])

      stage('Build') {
        sh 'npm run build'
      }
    }

    publish()
  }
}

def getShortCommit() {
  sh(
    script: 'git rev-parse --short HEAD',
    returnStdout: true
  ).trim()
}

def getFullCommit() {
  sh(
    script: 'git rev-parse HEAD',
    returnStdout: true
  ).trim()
}

def publish() {
  def releaseUrl

  stage('Publish') {
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

    withAwsRole('arn:aws:iam::923402097046:role/git-visualized-activity-jenkins') {
      sh "aws s3 cp build.tgz s3://git-visualized-activity-build-releases/$yearMonth/${base}.tgz"
      sh "aws s3 cp build.json s3://git-visualized-activity-build-releases/$yearMonth/${base}.meta.json"
    }

    releaseUrl = "s3://git-visualized-activity-build-releases/$yearMonth/${base}.tgz"
  }

  releaseUrl
}
