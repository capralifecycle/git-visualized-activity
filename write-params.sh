#!/bin/bash
set -eu -o pipefail

echo "Please be sure you are authed to the correct AWS account before continuing."
echo "Leave empty value to skip changing value."

store_value() {
  name=$1
  value=$2

  # TODO: Switch to Secrets Manager.

  aws ssm put-parameter \
    --name "$name" \
    --description "Value set by write-params.sh" \
    --type SecureString \
    --value "$value" \
    --overwrite

  echo "Stored $name"
}

set_tags() {
  name=$1

  aws ssm add-tags-to-resource \
    --resource-type Parameter \
    --resource-id "$name" \
    --tags \
      Key=Project,Value=git-visualized-activity \
      Key=SourceRepo,Value=github/capraconsulting/git-visualized-activity-infra \
      Key=StackName,Value=SCRIPTED

  echo "Tags set on $name"
}

handle_value() {
  name=$1
  title=$2

  printf "Enter %s (input hidden): " "$title"
  read -r -s value
  echo

  if [ -z "$value" ]; then
    echo "Skipping changing value"
  else
    store_value "$name" "$value"
  fi

  set_tags "$name"
}

handle_value /incub-gva-worker/github-token "GitHub-token"
handle_value /incub-gva-web/basicauth-username "Basic auth username"
handle_value /incub-gva-web/basicauth-password "Basic auth password"

echo "Completed"
