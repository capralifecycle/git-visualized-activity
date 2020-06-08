# git-visualized-activity-infra

This is the configuration for https://gva.incubator.liflig.dev/

See https://confluence.capraconsulting.no/x/HwtaBw for more details.

## Configuration

See `write-params.sh`.

## Deploying resources

[CDK](https://github.com/aws/aws-cdk) is used to perform deployments.

## Troubleshooting

(This is not updated for CDK.)

When deploying the `web.yml` stack, the command might time out and fail
due to the CloudFront distribution taking very long time. If this happens,
either wait and retry, or manually check the status of the stack.
