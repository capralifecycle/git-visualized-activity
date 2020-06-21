#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library('cals') _

import no.capraconsulting.buildtools.cdk.Webapp
def webapp = new Webapp()

buildConfig([
  jobProperties: [
    parameters([
      booleanParam(
        defaultValue: false,
        description: 'Skip branch check - force deploy',
        name: 'overrideBranchCheck'
      ),
    ]),
  ],
]) {
  dockerNode {
    stage('Checkout source') {
      checkout scm
    }

    insideToolImage("node:12-alpine") {
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

    def s3Url
    stage("Upload to S3") {
      s3Url = webapp.publish {
        name = "gva"
        buildDir = "dist"
        roleArn = "arn:aws:iam::001112238813:role/incub-common-build-artifacts-ci"
        bucketName = "incub-common-build-artifacts-001112238813-eu-west-1"
      }
    }

    def allowDeploy = env.BRANCH_NAME == "master" || params.overrideBranchCheck
    if (allowDeploy) {
      stage("Deploy") {
        webapp.deploy {
          artifactS3Url = s3Url
          roleArn = "arn:aws:iam::001112238813:role/incub-gva-web-deploy"
          functionArn = "arn:aws:lambda:eu-west-1:001112238813:function:incub-gva-web-deploy"
        }
      }
    }
  }
}
