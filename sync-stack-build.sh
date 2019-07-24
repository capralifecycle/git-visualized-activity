#!/bin/bash
set -eu -o pipefail

# TODO: Store in parameter store or retrieve output from other stack.
jenkins_slave_role_arn=arn:aws:iam::923402097046:role/buildtools-jenkins-RoleJenkinsSlave-JQGYHR5WE6C5

iam_role=arn:aws:iam::923402097046:role/CloudFormation
tags="project=git-visualized-activity"

export AWS_DEFAULT_REGION=eu-central-1
source ../sync-stack-lib.sh

verify_account 923402097046
sync_stack_prepare git-visualized-activity-build-cfn-s3

# Misc requirements for build.
deploy git-visualized-activity-build build.yml \
  --parameter-overrides \
    "JenkinsSlaveRoleArn=$jenkins_slave_role_arn"
