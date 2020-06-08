#!/bin/bash
set -eu -o pipefail

echo "Please be sure you are authed to the correct AWS account before continuing."

printf "Enter GitHub token (input hidden): "
read -r -s token
echo

if [ -z "$token" ]; then
  echo "Aborting"
  exit
fi

# TODO: Switch to Secrets Manager.
# TODO: Tags.
aws ssm put-parameter \
  --name /incub-gva-worker/github-token \
  --description "Value set by write-params.sh" \
  --type SecureString \
  --value "$token" \
  --overwrite

aws ssm add-tags-to-resource \
  --resource-type Parameter \
  --resource-id /incub-gva-worker/github-token \
  --tags \
    Key=Project,Value=git-visualized-activity \
    Key=SourceRepo,Value=github/capraconsulting/git-visualized-activity-infra \
    Key=StackName,Value=SCRIPTED

echo "OK"
