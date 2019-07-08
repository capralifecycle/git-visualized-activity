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

      analyzeSonarCloudForNodejs([
        'sonar.organization': 'capraconsulting',
        'sonar.projectKey': 'capraconsulting_git-visualized-activity',
      ])

      stage('Build') {
        sh 'npm run build'
      }
    }
  }
}
