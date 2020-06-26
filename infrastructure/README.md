# infrastructure

This is the configuration for https://gva.incubator.liflig.dev/

## Deploying resources

[CDK](https://github.com/aws/aws-cdk) is used to perform deployments.

## Initial setup

This is a record of manual steps done during initial setup so
that it can be reproduced if needed.

```bash
npm run cdk -- bootstrap aws://001112238813/us-east-1
npm run cdk -- bootstrap aws://001112238813/eu-west-1
```

Parameters provisioned using `write-params.sh`.