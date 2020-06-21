# git-visualized-activity-infra

This is the configuration for https://gva.incubator.liflig.dev/

See https://confluence.capraconsulting.no/x/HwtaBw for more details.

## Deploying resources

[CDK](https://github.com/aws/aws-cdk) is used to perform deployments.

## Troubleshooting

(This is not updated for CDK.)

When deploying the `web.yml` stack, the command might time out and fail
due to the CloudFront distribution taking very long time. If this happens,
either wait and retry, or manually check the status of the stack.

## Initial setup

This is a record of manual steps done during initial setup so
that it can be reproduced if needed.

```bash
npm run cdk -- bootstrap aws://001112238813/us-east-1
npm run cdk -- bootstrap aws://001112238813/eu-west-1
```

Parameters provisioned using `write-params.sh`.
