#!/bin/bash
# Manually triggering Fargate container.
# See app.yml for details.
set -eu -o pipefail

task_def_arn=$(
  aws ecs list-task-definitions \
    --family-prefix git-visualized-activity-prod-worker \
    --sort DESC \
    --query "taskDefinitionArns[0]" \
    --output text
)

aws lambda invoke \
  --function-name git-visualized-activity-prod-worker-launcher \
  --log-type Tail \
  --payload '{
    "taskDefinition": "'$task_def_arn'"
  }' \
  /tmp/lambda.log
