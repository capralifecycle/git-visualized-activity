#!/usr/bin/env groovy

// See https://github.com/capralifecycle/jenkins-pipeline-library
@Library('cals') _

buildConfig() {
  dockerNode {
    stage('Checkout source') {
      checkout scm
    }

    def img = docker.image('923402097046.dkr.ecr.eu-central-1.amazonaws.com/buildtools/tool/node')
    img.pull()

    img.inside {
      stage('Install dependencies') {
        sh 'npm ci'
      }

      stage('Generate dummy commits.csv') {
        sh './generate-commits.sh clean'
      }

      stage('Build') {
        sh 'npm run build'
      }
    }
  }
}
