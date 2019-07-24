#!/bin/bash
set -eu -o pipefail

# Configuration start

# Use `update-version-sh` to update this to latest.
app_image_tag=20190723-1503-4
app_image=923402097046.dkr.ecr.eu-central-1.amazonaws.com/git-visualized-activity/worker:$app_image_tag

# See https://github.com/capraconsulting/webapp-deploy-lambda
deploy_code_s3_bucket=capra-webapp-deploy-lambda-releases
deploy_code_s3_key=release-0.1.0.zip

iam_role=arn:aws:iam::923402097046:role/CloudFormation
tags="project=git-visualized-activity stack=prod"
cluster_name=git-visualized-activity-prod

# Existing resources in our account.
vpc_id=vpc-93f214fa
subnet_id_list=subnet-29616151,subnet-95bd9ddf,subnet-b6c425df

# Certificate in us-east-1 region for CloudFront usage.
capra_tv_certificate_arn=arn:aws:acm:us-east-1:923402097046:certificate/8c02e2fe-9399-4c51-8801-3c1af58eba1b

# Configuration end
# -----

export AWS_DEFAULT_REGION=eu-central-1
source ../sync-stack-lib.sh

verify_account 923402097046
sync_stack_prepare git-visualized-activity-prod-cfn-s3

# Bucket for web-auth, see next comments.
AWS_DEFAULT_REGION=us-east-1 \
deploy_s3_for_cfn git-visualized-activity-prod-cfn-s3
s3_us_east_1=$(AWS_DEFAULT_REGION=us-east-1 get_output git-visualized-activity-prod-cfn-s3 BucketName)

# Nonce for code, used to publish new version. See template for details.
nonce=$(sha256sum auth/index.js | cut -c1-10)

# web-auth
# Must be deployed in us-east-1 due to lambda@edge.
# Also we need to publish code to us-east-1 as lambda@edge requires it.
AWS_DEFAULT_REGION=us-east-1 \
sync_stack_s3_bucket=$s3_us_east_1 \
deploy git-visualized-activity-prod-web-auth web-auth.yml \
  --parameter-overrides \
    "Env=prod" \
    "Nonce=$nonce" \
    "Region=eu-central-1"

credentials_function_version=$(AWS_DEFAULT_REGION=us-east-1 get_output git-visualized-activity-prod-web-auth CredentialsFunctionVersion)

# web-s3
deploy git-visualized-activity-prod-web-s3 web-s3.yml \
  --parameter-overrides \
    "Env=prod"

web_bucket_name=$(get_output git-visualized-activity-prod-web-s3 WebBucketName)

# web-cf
deploy git-visualized-activity-prod-web-cf web-cf.yml \
  --parameter-overrides \
    "AcmCertificateArn=$capra_tv_certificate_arn" \
    "CredentialsFunctionVersion=$credentials_function_version" \
    "DomainName=gva.capra.tv" \
    "Env=prod" \
    "HostedZoneName=capra.tv." \
    "WebBucketName=$web_bucket_name"

cf_distribution_id=$(get_output git-visualized-activity-prod-web-cf CloudFrontDistributionId)

# cluster
deploy git-visualized-activity-prod-cluster cluster.yml \
  --parameter-overrides \
    "ClusterName=$cluster_name"

# app
deploy git-visualized-activity-prod-app app.yml \
  --parameter-overrides \
    "AppImage=$app_image" \
    "ClusterName=$cluster_name" \
    "Env=prod" \
    "Subnets=$subnet_id_list" \
    "VpcId=$vpc_id" \
    "WebBucketName=$web_bucket_name"

jenkins_role_arn=$(get_output git-visualized-activity-build JenkinsRoleArn)
releases_bucket_name=$(get_output git-visualized-activity-build ReleasesBucketName)

# web-deploy
deploy git-visualized-activity-prod-web-deploy web-deploy.yml \
  --parameter-overrides \
    "AssumedJenkinsRoleArn=$jenkins_role_arn" \
    "CfDistributionId=$cf_distribution_id" \
    "DeployCodeS3Bucket=$deploy_code_s3_bucket" \
    "DeployCodeS3Key=$deploy_code_s3_key" \
    "FunctionName=git-visualized-activity-prod-deploy" \
    "ReleasesBucketName=$releases_bucket_name" \
    "TargetBucketName=$web_bucket_name"
