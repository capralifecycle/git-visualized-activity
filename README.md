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

There are two stacks. One that is for build artifacts and one
for the application itself.

```bash
aws-vault exec capra
./sync-stack-build.sh
./sync-stack.sh
```

## Troubleshooting

When deploying the `web.yml` stack, the command might time out and fail
due to the CloudFront distribution taking very long time. If this happens,
either wait and retry, or manually check the status of the stack.
