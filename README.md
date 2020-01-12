# git-visualized-activity

This is the configuration for https://gva.capra.tv/

See https://confluence.capraconsulting.no/x/HwtaBw for more details.

## Configuration

Replace `<replace-me>` with the actual values to push new configuration
or update previous.

```bash
export AWS_DEFAULT_REGION=eu-central-1
aws ssm put-parameter \
  --name /git-visualized-activity/prod/github-token \
  --value '<replace-me>' \
  --type SecureString \
  --overwrite
aws ssm put-parameter \
  --name /git-visualized-activity/prod/basicauth/username \
  --value '<replace-me>' \
  --type String \
  --overwrite
aws ssm put-parameter \
  --name /git-visualized-activity/prod/basicauth/password \
  --value '<replace-me>' \
  --type SecureString \
  --overwrite
```

## Deploying resources

[CDK](https://github.com/aws/aws-cdk) is used to perform deployments.

## Troubleshooting

(This is not updated for CDK.)

When deploying the `web.yml` stack, the command might time out and fail
due to the CloudFront distribution taking very long time. If this happens,
either wait and retry, or manually check the status of the stack.
